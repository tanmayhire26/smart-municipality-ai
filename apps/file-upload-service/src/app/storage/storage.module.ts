import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';
import { CloudinaryStorageProvider } from './cloudinary-storage.provider';
import { StorageProviderFactory } from './storage.factory';

@Module({
  imports: [ConfigModule],
  providers: [
    LocalStorageProvider,
    S3StorageProvider,
    CloudinaryStorageProvider,
    StorageProviderFactory,
  ],
  exports: [StorageProviderFactory],
})
export class StorageModule {}
