import { Command, CommandRunner } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { RabbitmqConnectionService } from '../infrastructure/rabbitmq/rabbitmq-connection.service';
import { RabbitmqConfigurerService } from '../infrastructure/rabbitmq/rabbitmq-configurer.service';
import { ConsumerService } from './consumer.service';

@Injectable()
@Command({
  name: 'handle:messages',
  description: 'Consume with Single Active Consumer + Sequence Barrier Pattern',
})
export class HandleMessagesCommand extends CommandRunner {
  
  constructor(
    private readonly connectionService: RabbitmqConnectionService,
    private readonly configurerService: RabbitmqConfigurerService,
    private readonly consumerService: ConsumerService,
  ) {
    super();
  }

  async run(): Promise<void> {
    console.log('Starting Consumer Application...');
    
    await this.connectionService.connect();

    await this.configurerService.setupTopology();

    await this.consumerService.startConsumer();

    // await new Promise(() => {}); 
  }
}