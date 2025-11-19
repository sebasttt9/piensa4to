import { Module } from '@nestjs/common';
import { StorageService } from './services/storage.service';
import { EmailService } from './services/email.service';
import { CacheService } from './services/cache.service';

@Module({
    providers: [StorageService, EmailService, CacheService],
    exports: [StorageService, EmailService, CacheService],
})
export class SharedModule { }
