import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToMany
} from 'typeorm';
import { Group } from './group';
import { User } from './user';

@Entity()
export class Trekking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  minPeople: number;

  @Column()
  maxPeople: number;

  @Column()
  daysFormGroup: number;

  @Column()
  daysCompletePayment: number;

  @OneToMany(() => Group, (group) => group.trekking)
  groups: Group[];

  @ManyToMany(() => User)
  @JoinTable()
  touristGuides: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ select: false })
  deletedAt?: Date;
}
