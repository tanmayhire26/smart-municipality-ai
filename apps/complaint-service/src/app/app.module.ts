import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Complaint } from './entities/complaint.entity';
import { ComplaintHistory } from './entities/history.entity';

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
        entities: [Complaint, ComplaintHistory],
        synchronize: true, // Safe auto-table generation for local MVP demo
      }),
    }),
    TypeOrmModule.forFeature([Complaint, ComplaintHistory]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
