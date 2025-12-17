import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserStatus {
  ACTIVATE = 'ACTIVATE',
  PROCESS = 'PROCESS',
  DEACTIVATE = 'DEACTIVATE',
}

@Entity('notifications') 
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true, enum:UserStatus })
  status: UserStatus;

  @Column({ nullable: true })
  message: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
