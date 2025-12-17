import { Injectable } from '@nestjs/common';
import { RabbitmqConnectionService } from './rabbitmq-connection.service';

@Injectable()
export class RabbitmqConfigurerService {
  private readonly EXCHANGE_NAME = 'notification-exchange';
  private readonly RETRY_EXCHANGE_NAME = 'notification-retry-exchange';
  private readonly QUEUE_NAME = 'notification-queue';
  private readonly RETRY_QUEUE_NAME = 'notification-retry-queue';
  private readonly DLX_NAME = 'notification-dlx';
  private readonly DLQ_NAME = 'notification-dlq';
  private readonly RETRY_TTL = 5000; 

  constructor(private readonly connectionService: RabbitmqConnectionService) {}

  async setupTopology() {
    try {
      const channel = this.connectionService.getChannel();
      await channel.assertExchange(this.EXCHANGE_NAME, 'fanout', { durable: true });
      await channel.assertExchange(this.DLX_NAME, 'fanout', { durable: true });
      await channel.assertQueue(this.DLQ_NAME, { durable: true });
      await channel.bindQueue(this.DLQ_NAME, this.DLX_NAME, 'dead');

      await channel.assertQueue(this.QUEUE_NAME, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': this.DLX_NAME,
          'x-dead-letter-routing-key': 'dead',
        },
      });
      await channel.bindQueue(this.QUEUE_NAME, this.EXCHANGE_NAME);
      await channel.assertExchange(this.RETRY_EXCHANGE_NAME, 'direct', { durable: true });
      await channel.assertQueue(this.RETRY_QUEUE_NAME, {
        durable: true,
        arguments: {
          'x-message-ttl': this.RETRY_TTL,
          'x-dead-letter-exchange': this.EXCHANGE_NAME,
          'x-dead-letter-routing-key': '',
        },
      });
      await channel.bindQueue(this.RETRY_QUEUE_NAME, this.RETRY_EXCHANGE_NAME, 'retry');
    } catch (error) {
      console.error('Failed to configure RabbitMQ Topology:', error);
    }
  }
}
