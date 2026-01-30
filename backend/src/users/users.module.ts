import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RolesGuard } from '../common/guards/roles.guard';
import { UsersInitializer } from './users.initializer';
import { SupabaseModule } from '../database/supabase.module';
import { UserSyncService } from './user-sync.service';

@Module({
  imports: [SupabaseModule],
  controllers: [UsersController],
  providers: [UsersService, RolesGuard, UsersInitializer, UserSyncService],
  exports: [UsersService, UserSyncService],
})
export class UsersModule { }
