import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ComplaintStatus {
  REGISTERED = 'REGISTERED',
  AI_VERIFYING = 'AI_VERIFYING',
  AI_VERIFIED = 'AI_VERIFIED',
  AI_REJECTED = 'AI_REJECTED',
  ASSIGNED = 'ASSIGNED',
  INVESTIGATED = 'INVESTIGATED',
  ACTION_TAKEN = 'ACTION_TAKEN',
  RESOLVED = 'RESOLVED',
  ESCALATED_TO_COLLECTOR = 'ESCALATED_TO_COLLECTOR',
}

export interface ComplaintDocument {
  type: 'signed_letter' | 'rebuttal' | 'land_record' | 'sale_deed' | 'investigation_photo' | 'other';
  url: string;
  name: string;
}

@Entity('complaints')
export class Complaint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column()
  category: string; // e.g. Road, Sewerage, Water Supply, Electricity, etc.

  @Column('float', { nullable: true })
  latitude: number;

  @Column('float', { nullable: true })
  longitude: number;

  @Column({
    type: 'varchar',
    default: ComplaintStatus.REGISTERED,
  })
  status: ComplaintStatus;

  // Citizen who raised the complaint
  @Column()
  citizenId: string;

  @Column()
  citizenName: string;

  @Column({ type: 'int' })
  wardNumber: number;

  @Column({ type: 'int', nullable: true })
  unitNumber: number;

  // Nagarsevak who owns the ward
  @Column({ nullable: true })
  nagarsevakId: string;

  @Column({ nullable: true })
  nagarsevakName: string;

  // Assigned Subordinate / Worker
  @Column({ nullable: true })
  assignedWorkerId: string;

  @Column({ nullable: true })
  assignedWorkerName: string;

  // Photos/Videos uploaded by citizen
  @Column('json', { nullable: true })
  photos: string[]; // Array of URLs

  @Column('json', { nullable: true })
  videos: string[]; // Array of URLs

  // Document Management System (Signed Letter, Land records, sale deeds, rebuttals)
  @Column('json', { nullable: true })
  documents: ComplaintDocument[];

  // AI Verification details
  @Column('float', { nullable: true })
  aiConfidence: number;

  @Column('text', { nullable: true })
  aiSummary: string;

  @Column('text', { nullable: true })
  aiSuggestedAction: string;

  @Column('text', { nullable: true })
  aiSeverity: string;

  // Dates
  @Column({ nullable: true, type: 'timestamp' })
  eta: Date;

  @Column({ nullable: true, type: 'timestamp' })
  escalatedAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  resolvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
