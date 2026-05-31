import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';
import { CloudinaryStorageProvider } from './cloudinary-storage.provider';

export const STORAGE_PROVIDER_TOKEN = 'STORAGE_PROVIDER_TOKEN';

export const StorageProviderFactory: Provider = {
  provide: STORAGE_PROVIDER_TOKEN,
  useFactory: (
    configService: ConfigService,
    local: LocalStorageProvider,
    s3: S3StorageProvider,
    cloudinary: CloudinaryStorageProvider
  ) => {
    const provider = configService.get<string>('STORAGE_PROVIDER') || 'local';
    
    switch (provider.toLowerCase()) {
      case 's3':
        return s3;
      case 'cloudinary':
        return cloudinary;
      case 'local':
      default:
        return local;
    }
  },
  inject: [ConfigService, LocalStorageProvider, S3StorageProvider, CloudinaryStorageProvider],
};
