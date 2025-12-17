import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RabbitmqConnectionService } from './rabbitmq-connection.service';
import { RabbitmqConfigurerService } from './rabbitmq-configurer.service';
import { ConsumerService } from '../../commands/consumer.service';
import { InboxMessageHandler } from '../../commands/inbox-message.handler';
import { Inbox } from '../database/entities/inbox.entity';
import { Notification } from '../database/entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Inbox, Notification])],
  providers: [
    RabbitmqConnectionService,
    RabbitmqConfigurerService,
    ConsumerService,
    InboxMessageHandler,
  ],
  exports: [
    RabbitmqConnectionService,
    RabbitmqConfigurerService,
    ConsumerService,
    InboxMessageHandler,
  ],
})
export class RabbitmqModule {}
