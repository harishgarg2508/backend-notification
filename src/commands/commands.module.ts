import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HandleMessagesCommand } from './handle-messages.command';
import { Notification } from '../infrastructure/database/entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
  ],
  providers: [HandleMessagesCommand],
})
export class CommandsModule {}
