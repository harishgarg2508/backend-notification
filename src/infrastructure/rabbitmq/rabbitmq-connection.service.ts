import { Injectable } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitmqConnectionService {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private isConnected = false;

  async connect() {
    try {
      console.log('Connecting to RabbitMQ...');
      this.connection = await amqp.connect(process.env.RABBITMQ_URL as string);
      this.channel = await this.connection.createChannel();
      this.isConnected = true;
      
      this.connection.on('close', () => {
        console.warn('RabbitMQ Connection Closed. Reconnecting...');
        this.isConnected = false;
        setTimeout(() => this.connect(), 5000);
      });

      this.connection.on('error', (err) => {
        console.error('RabbitMQ Connection Error:', err);
      });

      console.log('Connected to RabbitMQ');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  getChannel(): amqp.Channel {
    if (!this.isConnected || !this.channel) {
      throw new Error('RabbitMQ channel is not available');
    }
    return this.channel;
  }

  async close() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error);
    }
  }
}
