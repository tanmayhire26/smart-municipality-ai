import { Injectable, Logger } from '@nestjs/common';
import { StorageProvider } from './storage.interface';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly uploadDir: string;
  private readonly serverUrl: string;

  constructor(private configService: ConfigService) {
    // Resolve upload dir relative to workspace root or use absolute path
    const configuredDir = this.configService.get<string>('LOCAL_UPLOAD_DIR') || './uploads';
    this.uploadDir = path.resolve(configuredDir);
    
    // Create upload directory if it doesn't exist
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Created local upload directory at: ${this.uploadDir}`);
    }

    const port = this.configService.get<string>('FILE_UPLOAD_SERVICE_PORT') || '3003';
    this.serverUrl = this.configService.get<string>('FILE_UPLOAD_SERVICE_URL') || `http://localhost:${port}`;
  }

  async uploadFile(file: Express.Multer.File): Promise<{ url: string; key: string }> {
    const fileExt = path.extname(file.originalname);
    const randomName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
    const filePath = path.join(this.uploadDir, randomName);

    await fs.promises.writeFile(filePath, file.buffer);
    
    // Key will be the unique filename
    const key = randomName;
    const url = `${this.serverUrl}/uploads/${key}`;

    this.logger.log(`Uploaded file locally: ${key}`);
    return { url, key };
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      this.logger.log(`Deleted local file: ${key}`);
    } else {
      this.logger.warn(`File to delete not found: ${key}`);
    }
  }
}
