import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Url } from './Url';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;  // bcrypt hash

  @Column({ default: true })
  isActive: boolean = true;

  @Column({ default: 100 })  // Per-user limit
  shortenLimit: number = 100;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Url, url => url.user)
  urls!: Url[];
}
