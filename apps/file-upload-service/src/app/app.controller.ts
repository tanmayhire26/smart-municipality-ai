import { Controller, Get, Post, UseInterceptors, UploadedFile, Inject, Param, Res, NotFoundException, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { STORAGE_PROVIDER_TOKEN } from './storage/storage.factory';
import { StorageProvider } from './storage/storage.interface';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(
    @Inject(STORAGE_PROVIDER_TOKEN) private storageProvider: StorageProvider,
    private configService: ConfigService
  ) {}

  @Get()
  getHealth() {
    return { status: 'OK', service: 'file-upload-service' };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    try {
      const result = await this.storageProvider.uploadFile(file);
      return {
        success: true,
        ...result,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      };
    } catch (error) {
      throw new BadRequestException(`File upload failed: ${(error as Error).message}`);
    }
  }

  @Get('uploads/:filename')
  async serveFile(@Param('filename') filename: string, @Res() res: Response) {
    const configuredDir = this.configService.get<string>('LOCAL_UPLOAD_DIR') || './uploads';
    const filePath = path.resolve(configuredDir, filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    res.sendFile(filePath);
  }
}
