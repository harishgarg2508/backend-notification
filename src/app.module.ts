import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationModule } from './feature/notification/notification.module';
import { dataSourceOptions } from './infrastructure/database/config/type-orm.config';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
