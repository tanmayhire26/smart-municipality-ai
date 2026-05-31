import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('complaint_histories')
export class ComplaintHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  complaintId: string;

  @Column({ nullable: true })
  fromStatus: string;

  @Column()
  toStatus: string;

  @Column({ nullable: true })
  actorId: string;

  @Column({ nullable: true })
  actorName: string;

  @Column({ nullable: true })
  actorRole: string;

  @Column('text', { nullable: true })
  comment: string; // Detail on action taken (e.g. Legal action description, worker notes)

  @CreateDateColumn()
  createdAt: Date;
}
