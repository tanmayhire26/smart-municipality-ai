import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { Ward } from './entities/ward.entity';
import { SeedService } from './services/seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: configService.get<number>('DB_PORT') || 5432,
        username: configService.get<string>('DB_USERNAME') || 'postgres',
        password: configService.get<string>('DB_PASSWORD') || 'postgres_password',
        database: configService.get<string>('DB_DATABASE') || 'municipality_db',
        entities: [User, Ward],
        synchronize: true, // Safe for local MVP demo to auto-generate tables
      }),
    }),
    TypeOrmModule.forFeature([User, Ward]),
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {}
