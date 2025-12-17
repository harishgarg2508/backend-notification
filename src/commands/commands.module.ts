import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HandleMessagesCommand } from './handle-messages.command';
import { Notification } from '../infrastructure/database/entities/notification.entity';
import { Inbox } from '../infrastructure/database/entities/inbox.entity';
import { RabbitmqModule } from '../infrastructure/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Inbox]),
    RabbitmqModule,
  ],
  providers: [HandleMessagesCommand],
})
export class CommandsModule {}
