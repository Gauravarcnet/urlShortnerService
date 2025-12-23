import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne
} from 'typeorm';
import { User } from './User';

@Entity('urls')
@Index(['shortCode'], { unique: true })
@Index(['customCode'], { unique: true })
export class Url {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @Column({ unique: true, nullable: true })  //  Fix: nullable initially
  shortCode!: string;

  @Column('text', { nullable: false })
  longUrl!: string;

  @Column({ nullable: true, unique: true })
  customCode?: string;

  @Column('bigint', { default: 0 })
  clickCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @ManyToOne(() => User, user => user.urls, { nullable: true })
  user?: User;


  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
