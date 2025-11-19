import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) { }

  async create(input: CreateUserDto): Promise<UserDocument> {
    const email = input.email.toLowerCase();
    const existing = await this.userModel.findOne({ email }).lean();
    if (existing) {
      throw new ConflictException('El correo ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);
    const created = new this.userModel({ ...input, email, password: hashedPassword });
    return created.save();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().sort({ createdAt: -1 }).select('-password').exec();
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async update(id: string, changes: UpdateUserDto): Promise<UserDocument> {
    if (changes.email) {
      const existing = await this.userModel.findOne({
        email: changes.email.toLowerCase(),
        _id: { $ne: id },
      });
      if (existing) {
        throw new ConflictException('El correo ya está registrado');
      }
    }

    const updatePayload = { ...changes } as UpdateUserDto & { password?: string };
    if (changes.email) {
      updatePayload.email = changes.email.toLowerCase();
    }

    if (changes.password) {
      updatePayload.password = await bcrypt.hash(changes.password, 12);
    }

    const updated = await this.userModel.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    })
      .select('-password')
      .exec();

    if (!updated) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Usuario no encontrado');
    }
  }
}
