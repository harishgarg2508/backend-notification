import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('inbox')
export class Inbox {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'message_id', type: 'uuid', unique: true })
  messageId: string;

  @Column({ type: 'varchar', length: 100 })
  type: string;

  @Column({ type: 'varchar', length: 100,nullable:true })
  handlerName: string;

  @Column({ type: 'jsonb', nullable: true })
  headers: object;

  @Column({ type: 'jsonb', nullable: true })
  body: object;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
