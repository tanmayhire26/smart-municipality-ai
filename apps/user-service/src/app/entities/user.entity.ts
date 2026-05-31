import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  ADMIN = 'ADMIN',
  CITIZEN = 'CITIZEN',
  NAGARSEVAK = 'NAGARSEVAK',
  CHIEF_OFFICER = 'CHIEF_OFFICER',
  WORKER = 'WORKER',
  COLLECTOR = 'COLLECTOR',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password?: string;

  @Column()
  name: string;

  @Column({
    type: 'varchar',
    default: UserRole.CITIZEN,
  })
  role: UserRole;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true, type: 'int' })
  wardNumber: number;

  @Column({ nullable: true, type: 'int' })
  unitNumber: number;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'float', default: 5.0, nullable: true })
  rating: number; // Ratings for Nagarsevaks

  @Column({ nullable: true })
  voterId?: string;

  @Column({ nullable: true })
  photo?: string; // profile picture URL

  @Column({ type: 'float', nullable: true })
  latitude?: number;

  @Column({ type: 'float', nullable: true })
  longitude?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
