import { Module } from '@nestjs/common';
import { StorageService } from './services/storage.service';
import { EmailService } from './services/email.service';
import { CacheService } from './services/cache.service';
import { OpenAiService } from './services/openai.service';

@Module({
    providers: [StorageService, EmailService, CacheService, OpenAiService],
    exports: [StorageService, EmailService, CacheService, OpenAiService],
})
export class SharedModule { }
