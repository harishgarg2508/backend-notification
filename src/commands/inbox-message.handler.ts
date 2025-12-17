import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inbox } from '../infrastructure/database/entities/inbox.entity';
import { Notification, UserStatus } from '../infrastructure/database/entities/notification.entity';

@Injectable()
export class InboxMessageHandler {
  constructor(
    @InjectRepository(Inbox)
    private readonly inboxRepository: Repository<Inbox>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async handle(message: any): Promise<void> {
    const { messageId, type, body } = message;

    if (!messageId) {
      console.warn('Message missing messageId, skipping.');
      return;
    }

    const existing = await this.inboxRepository.findOne({
      where: { messageId: messageId },
    });

    if (existing) {
      console.log(`Idempotency: Msg ${messageId} already processed.`);
      return;
    }

    if (type === 'UserCreated') {
      const user = this.notificationRepo.create({
        userId: body.id,
        status: UserStatus.ACTIVATE,
      });
      await this.notificationRepo.save(user);

    } else {
      const user = await this.notificationRepo.findOne({
        where: { userId: body.id },
      });

      if (user) {
        if (
          (body.status === UserStatus.ACTIVATE &&
            user.status !== UserStatus.PROCESS &&
            user.status !== UserStatus.DEACTIVATE) ||
          (body.status === UserStatus.PROCESS &&
            user.status !== UserStatus.DEACTIVATE)
        ) {
          user.status =
            body.status === UserStatus.PROCESS
              ? UserStatus.DEACTIVATE
              : UserStatus.ACTIVATE;
        } else if (body.status === UserStatus.DEACTIVATE) {
          user.status = UserStatus.DEACTIVATE;
        }
        await this.notificationRepo.save(user);
      }
    }

    console.log(`Processing Msg ${messageId} (${type})...`);

    await this.notificationRepo.manager.transaction(async (manager) => {
      const notification = manager.create(Notification, {
        userId: body.id,
        message: `Event ${type} processed. MsgID ${messageId}`,
      } as any);
      await manager.save(notification);

      await manager.save(Inbox, {
        messageId: messageId,
        type: type,
        body: body,
        headers: message.headers,
        properties: message.properties,
        processedAt: new Date(),
      });
    });

    console.log(`Processed Msg ${messageId}`);
  }
}
