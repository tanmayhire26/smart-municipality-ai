import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Ward } from '../entities/ward.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Ward)
    private readonly wardRepository: Repository<Ward>
  ) {}

  async onModuleInit() {
    this.logger.log('Starting Database Seeding...');
    await this.seedWards();
    await this.seedUsers();
    this.logger.log('Database Seeding Completed successfully!');
  }

  private async seedWards() {
    const count = await this.wardRepository.count();
    if (count > 0) {
      this.logger.log('Wards already seeded. Skipping ward seeding.');
      return;
    }

    const wardsData = [
      { id: 1, name: 'Shivaji Nagar', nagarsevakName: 'Sanjay Shinde', population: 4500, description: 'Dense residential zone near the central bus stand.' },
      { id: 2, name: 'Ganesh Peth', nagarsevakName: 'Sunita Deshmukh', population: 3800, description: 'Market area with major commercial establishments.' },
      { id: 3, name: 'Saraswati Nagar', nagarsevakName: 'Rajesh Patel', population: 5200, description: 'Newly developed residential area with schools.' },
      { id: 4, name: 'Ashwini Nagar', nagarsevakName: 'Amit Thoke', population: 4100, description: 'Residential ward bordering the highway area.' },
      { id: 5, name: 'Ves Gaothan', nagarsevakName: 'Kavita Pagare', population: 6000, description: 'Historical old town area with narrow lanes.' },
      { id: 6, name: 'Deopur Road', nagarsevakName: 'Vijay Salvi', population: 4900, description: 'Rapidly growing residential sector with parks.' },
      { id: 7, name: 'Malegaon Naka', nagarsevakName: 'Rahul Wagh', population: 5500, description: 'Entry point of Sinnar, high commercial traffic.' },
      { id: 8, name: 'Lonar Galli', nagarsevakName: 'Archana Kokate', population: 3200, description: 'Artisan and metalworking residential community.' },
      { id: 9, name: 'Mule Gaon Road', nagarsevakName: 'Ramesh Sanap', population: 3900, description: 'Semi-urban area with agricultural integration.' },
      { id: 10, name: 'Ghoti Road', nagarsevakName: 'Snehal Khairnar', population: 4800, description: 'Industrial access corridor, residential sub-units.' },
      { id: 11, name: 'Vazhar Naka', nagarsevakName: 'Prashant Avhad', population: 4600, description: 'Active marketplace and highway junction.' },
      { id: 12, name: 'Malkhed Ward', nagarsevakName: 'Nitin Kokate', population: 3700, description: 'Outskirts ward with upcoming housing societies.' },
      { id: 13, name: 'Mugguse Road', nagarsevakName: 'Jyoti Sanap', population: 4300, description: 'Quiet residential ward with water supply projects.' },
      { id: 14, name: 'Someshwar Temple Area', nagarsevakName: 'Kiran Shinde', population: 5100, description: 'Pilgrimage and tourist zone, temple surroundings.' },
      { id: 15, name: 'Bypass Road East', nagarsevakName: 'Amol Londhe', population: 5300, description: 'Mixed residential-commercial zone near bypass.' },
      { id: 16, name: 'Bypass Road West', nagarsevakName: 'Swati Gite', population: 4800, description: 'Active warehousing and cargo handling hub.' },
      { id: 17, name: 'Panchavati Sinnar', nagarsevakName: 'Deepak Kakad', population: 4200, description: 'High green-cover residential area.' },
      { id: 18, name: 'Saraswati River Front', nagarsevakName: 'Nisha Sonawane', population: 3600, description: 'Ecology-sensitive river border residential belt.' },
      { id: 19, name: 'MIDC Residential Colony', nagarsevakName: 'Sachin Waje', population: 5700, description: 'Housing colony for local industrial workforce.' },
      { id: 20, name: 'Audumbar Nagar', nagarsevakName: 'Priyanka Shelar', population: 3900, description: 'Residential ward with key civic amenities.' },
      { id: 21, name: 'Durgavati Nagar', nagarsevakName: 'Vikas Sangale', population: 4100, description: 'Dense colony of cooperative housing societies.' },
      { id: 22, name: 'Rang Mahal Area', nagarsevakName: 'Meena Bodke', population: 3500, description: 'Old historical ward with ancient architecture.' },
      { id: 23, name: 'Karanja Chowk', nagarsevakName: 'Sunil Katore', population: 4400, description: 'Bustling central junction and commercial node.' },
      { id: 24, name: 'Dattatreya Temple Road', nagarsevakName: 'Anil Varpe', population: 4900, description: 'Traditional neighborhood with mixed income housing.' },
      { id: 25, name: 'Krishi Utpanna Bazar', nagarsevakName: 'Shaila Deshmukh', population: 5200, description: 'Agricultural market yard and grain warehouses.' },
      { id: 26, name: 'Station Road', nagarsevakName: 'Harish Chinchole', population: 4600, description: 'Key transit link road, hotels and shops.' },
      { id: 27, name: 'Pimpalgaon Road', nagarsevakName: 'Mangal Shinde', population: 4300, description: 'Semi-rural ward with residential expansions.' },
      { id: 28, name: 'Industrial Zone Border', nagarsevakName: 'Rajendra Gite', population: 5000, description: 'Transition zone between MIDC and municipal limits.' }
    ];

    for (const w of wardsData) {
      const ward = this.wardRepository.create(w);
      await this.wardRepository.save(ward);
    }
    this.logger.log(`Successfully seeded ${wardsData.length} Sinnar wards.`);
  }

  private async seedUsers() {
    const count = await this.userRepository.count();
    if (count > 0) {
      this.logger.log('Users already seeded. Skipping user seeding.');
      return;
    }

    const testUsers = [
      {
        email: 'citizen@sinnar.in',
        name: 'Tanmay Hire (Citizen)',
        password: 'password',
        role: UserRole.CITIZEN,
        phone: '9876543210',
        wardNumber: 3,
        unitNumber: 2,
        address: 'Flat 102, Shrivardhan Complex, Saraswati Nagar, Sinnar'
      },
      {
        email: 'co@sinnar.in',
        name: 'Dr. Abhay Patil (Chief Officer)',
        password: 'password',
        role: UserRole.CHIEF_OFFICER,
        phone: '9999999999',
        wardNumber: null,
        unitNumber: null,
        address: 'Chief Officer Quarters, Sinnar Municipal Council'
      },
      {
        email: 'nagarsevak3@sinnar.in',
        name: 'Rajesh Patel (Nagarsevak - Ward 3)',
        password: 'password',
        role: UserRole.NAGARSEVAK,
        phone: '9822003344',
        wardNumber: 3,
        unitNumber: null,
        address: 'Patel Bungalow, Ward 3, Sinnar',
        rating: 4.8
      },
      {
        email: 'worker@sinnar.in',
        name: 'Ramesh Sawant (Sanitation Inspector / Worker)',
        password: 'password',
        role: UserRole.WORKER,
        phone: '9422001122',
        wardNumber: null,
        unitNumber: null,
        address: 'Municipal Staff Colony, Sinnar'
      },
      {
        email: 'collector@sinnar.in',
        name: 'Smt. Shital Devgire (District Collector)',
        password: 'password',
        role: UserRole.COLLECTOR,
        phone: '9000000001',
        wardNumber: null,
        unitNumber: null,
        address: 'Collectorate Office, Nashik District'
      }
    ];

    for (const u of testUsers) {
      const user = this.userRepository.create(u);
      await this.userRepository.save(user);
    }
    
    // Seed other Nagarsevaks dynamically for the remaining 27 wards
    // We already have Ward 3 covered by Rajesh Patel.
    const wards = await this.wardRepository.find();
    for (const ward of wards) {
      if (ward.id === 3) continue; // Skip since Rajesh is already there
      const email = `nagarsevak${ward.id}@sinnar.in`;
      const nagarsevak = this.userRepository.create({
        email,
        name: `${ward.nagarsevakName} (Nagarsevak - Ward ${ward.id})`,
        password: 'password',
        role: UserRole.NAGARSEVAK,
        phone: `98220000${ward.id.toString().padStart(2, '0')}`,
        wardNumber: ward.id,
        address: `${ward.nagarsevakName} Office, Ward ${ward.id}, Sinnar`,
        rating: +(4.0 + Math.random() * 1.0).toFixed(1)
      });
      await this.userRepository.save(nagarsevak);
    }

    this.logger.log(`Successfully seeded ${testUsers.length + 27} users and Nagarsevaks.`);
  }
}
