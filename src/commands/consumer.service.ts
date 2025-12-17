import { Injectable } from '@nestjs/common';
import { RabbitmqConnectionService } from '../infrastructure/rabbitmq/rabbitmq-connection.service';
import { InboxMessageHandler } from './inbox-message.handler';

@Injectable()
export class ConsumerService {
  private readonly QUEUE_NAME = 'notification-queue';
  private readonly MAX_SHORT_RETRIES = 10;
  private readonly MAX_LONG_RETRIES = 3;
  private readonly HEADER_SHORT_RETRY = 'x-short-retry-count';
  private readonly HEADER_LONG_RETRY = 'x-long-retry-count';

  constructor(
    private readonly connectionService: RabbitmqConnectionService,
    private readonly inboxHandler: InboxMessageHandler,
  ) {}

  async startConsumer() {
    try {
      const channel = this.connectionService.getChannel();
      await channel.prefetch(10);

      console.log(`ConsumerService listening on ${this.QUEUE_NAME}...`);

      await channel.consume(this.QUEUE_NAME, async (msg) => {
        if (!msg) return;
        try {
          const content = JSON.parse(msg.content.toString());
          await this.inboxHandler.handle(content);
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);

          const headers = msg.properties.headers || {};
          const shortRetryCount = headers[this.HEADER_SHORT_RETRY] || 0;
          const longRetryCount = headers[this.HEADER_LONG_RETRY] || 0;

          if (shortRetryCount < this.MAX_SHORT_RETRIES) {
            console.log(
              `Short Retry (Attempt ${shortRetryCount + 1}/${this.MAX_SHORT_RETRIES})...`,
            );
            channel.publish('notification-exchange', 'retry', msg.content, {
              headers: {
                ...headers,
                [this.HEADER_SHORT_RETRY]: shortRetryCount + 1,
              },
              persistent: true,
            });
            channel.ack(msg);
          } else if (longRetryCount < this.MAX_LONG_RETRIES) {
            console.log(
              `Long Retry (Attempt ${longRetryCount + 1}/${this.MAX_LONG_RETRIES})...`,
            );
            channel.publish(
              'notification-retry-exchange',
              'retry',
              msg.content,
              {
                headers: {
                  ...headers,
                  [this.HEADER_SHORT_RETRY]: 0,
                  [this.HEADER_LONG_RETRY]: longRetryCount + 1,
                },
                persistent: true,
              },
            );
            channel.ack(msg);
          } else {
            console.error('Message failed all retries. Sending to DLQ.');
            channel.nack(msg, false, false);
          }
        }
      });
    } catch (error) {
      console.error('ConsumerService failed to start:', error);
    }
  }
}
