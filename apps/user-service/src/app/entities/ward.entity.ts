import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('wards')
export class Ward {
  @PrimaryColumn()
  id: number; // Ward Number (1 to 28)

  @Column()
  name: string; // Ward Name (e.g. Ganesh Peth, Sinnar Gaothan, etc.)

  @Column({ nullable: true })
  nagarsevakName: string;

  @Column({ nullable: true, type: 'int' })
  population: number;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
