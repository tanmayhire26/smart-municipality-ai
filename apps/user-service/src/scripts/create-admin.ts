import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app/app.module';
import { User, UserRole } from '../app/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

async function bootstrap() {
  console.log('\n==================================================');
  console.log('  Day 0 Activity: Seeding Sinnar Admin Account    ');
  console.log('==================================================\n');

  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const userRepository = app.get<Repository<User>>(getRepositoryToken(User));

    const adminEmail = 'admin@sinnar.in';
    const existingAdmin = await userRepository.findOne({ where: { email: adminEmail } });

    if (existingAdmin) {
      console.log(`[info] Admin user "${adminEmail}" already exists. Skipping.`);
    } else {
      const admin = userRepository.create({
        email: adminEmail,
        password: 'admin_password', // Mock auth uses plain text for simplicity in local demo
        name: 'Sinnar Admin (Administrator)',
        role: UserRole.ADMIN,
        phone: '9999911111',
        address: 'Sinnar Municipal Head Office, Sinnar, Nashik, Maharashtra',
      });

      await userRepository.save(admin);
      console.log(`[success] Successfully seeded Admin user with email "${adminEmail}"!`);
    }

    await app.close();
  } catch (error) {
    console.error('[error] Database seeding failed:', error);
  }

  console.log('\n==================================================\n');
}

bootstrap();
