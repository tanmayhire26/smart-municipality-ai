import { Injectable, Logger } from '@nestjs/common';
import { StorageProvider } from './storage.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryStorageProvider implements StorageProvider {
  private readonly logger = new Logger(CloudinaryStorageProvider.name);

  constructor(private configService: ConfigService) {
    this.logger.log('Cloudinary Storage Provider initialized (Stub - ready for Cloudinary SDK integration)');
  }

  async uploadFile(file: Express.Multer.File): Promise<{ url: string; key: string }> {
    const cloudName = this.configService.get<string>('CLINUDINARY_CLOUD_NAME') || 'municipality-cloud';
    this.logger.log(`[Cloudinary Stub] Uploading file ${file.originalname} to Cloudinary`);
    
    // Simulate Cloudinary URL
    const key = `cloudinary-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const url = `https://res.cloudinary.com/${cloudName}/image/upload/${key}`;

    return { url, key };
  }

  async deleteFile(key: string): Promise<void> {
    this.logger.log(`[Cloudinary Stub] Deleting file ${key} from Cloudinary`);
  }
}
