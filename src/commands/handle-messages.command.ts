import { Command, CommandRunner } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../infrastructure/database/entities/notification.entity';
import * as amqp from 'amqplib';
import { Inbox, InboxEventStatus } from 'src/infrastructure/database/entities/inbox.entity';

@Injectable()
@Command({
  name: 'handle:messages',
  description: 'Consume and handle messages from RabbitMQ queue',
})
export class HandleMessagesCommand extends CommandRunner {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(Inbox)
    private readonly inboxRepository: Repository<Inbox>
  ) {
    super();
  }

  async run(): Promise<void> {
    console.log('Starting message handler...');

    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL as string);
      this.channel = await this.connection.createChannel();
      console.log(' Connected to RabbitMQ');

      const queueName = 'user_created_queue';
      await this.channel.assertQueue(queueName, { durable: true });
      
      console.log(` Waiting for messages in queue: ${queueName}...`);
      console.log('Press Ctrl+C to exit');

      await this.channel.consume(
        queueName,
        async (msg) => {
          if (msg) {
            try {
              const data = JSON.parse(msg.content.toString());
              await this.handleUserCreated(data);
              this.channel.ack(msg);
            } catch (error) {
              console.error(' Error processing message:', error);
              this.channel.nack(msg, false, true);
            }
          }
        },
        { noAck: false }
      );

    } catch (error) {
      console.error(' Handler error:', error);
      await this.cleanup();
      process.exit(1);
    }
  }

  private async handleUserCreated(data: any): Promise<void> {
    const { id, name, password, createdAt } = data;

    const processedMessages = await this.inboxRepository.findOne({ where: { id } });
    if (processedMessages) {
      console.log(`Message with event ID ${id} already consumed. Skipping...`);
      this.channel.ack(data);
      return;
    }

    const notification = this.notificationRepository.create({
      name,
      password,
      message: `User ${id} created successfully with name: ${name} and password: ${password} at time ${createdAt}`,
    });
    await this.notificationRepository.save(notification);
    console.log('Notification saved to database');

    await this.inboxRepository.save({
      id,
      eventType: 'UserCreated',
      payload: data,
      processed: InboxEventStatus.PROCESSED,
      receivedAt: new Date(),
    });
    console.log('Notification saved to inbox');


  }

  private async cleanup(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
      console.log(' RabbitMQ connection closed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}
