import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { NotificationService } from './notification.service';
import { CreateUserDto } from './notification.dto';
@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern('user_created_queue')
  handleUserCreated(data: CreateUserDto) {
    this.notificationService.handleUserCreated(data);
  }
}