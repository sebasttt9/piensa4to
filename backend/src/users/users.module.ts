import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';
import { RolesGuard } from '../common/guards/roles.guard';
import { UsersInitializer } from './users.initializer';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [UsersController],
  providers: [UsersService, RolesGuard, UsersInitializer],
  exports: [UsersService, MongooseModule],
})
export class UsersModule { }
