import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RolesGuard } from '../common/guards/roles.guard';
import { UsersInitializer } from './users.initializer';
import { SupabaseModule } from '../database/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [UsersController],
  providers: [UsersService, RolesGuard, UsersInitializer],
  exports: [UsersService],
})
export class UsersModule { }
