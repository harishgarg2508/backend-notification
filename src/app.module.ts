import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationModule } from './feature/notification.module';
import { dataSourceOptions } from './infrastructure/database/config/type-orm.config';
import { CommandsModule } from './commands/commands.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    NotificationModule,
    CommandsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
