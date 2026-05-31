import { Express } from 'express';

export interface StorageProvider {
  uploadFile(file: Express.Multer.File): Promise<{ url: string; key: string }>;
  deleteFile(key: string): Promise<void>;
}
