import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../infrastructure/database/entities/notification.entity';
import { CreateUserDto } from './notification.dto';
import * as amqp from 'amqplib';

@Injectable()
export class NotificationService {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {
    this.startRabbitMQ();
  }

  private async startRabbitMQ() {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL as string);
      this.channel = await this.connection.createChannel();

      const queueName = 'user_created_queue';

      await this.channel.assertQueue(queueName, { durable: true });

      await this.channel.consume(
        queueName,
        (msg) => this.handleMessage(msg),
        { noAck: false }
      );

      console.log('NotificationService listening on:', queueName);
    } catch (error) {
      console.error('RabbitMQ consumer error:', error);
    }
  }
//
  private async handleMessage(msg) {
    if (!msg) return;

    try {
      const data: CreateUserDto = JSON.parse(msg.content.toString());
      await this.handleUserCreated(data);

      this.channel.ack(msg);
    } catch (err) {
      console.error('Error processing message:', err);

      this.channel.nack(msg, false, true);
    }
  }

  async handleUserCreated(data: CreateUserDto) {
    console.log('created notification');

    const notification = this.notificationRepository.create({
      name: data.name,
      password: data.password,
      message: `User created successfully with name: ${data.name} and password: ${data.password}`,
    });

    await this.notificationRepository.save(notification);
  }
}
