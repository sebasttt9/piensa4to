import { Request } from 'express';
import type { UserDocument } from '../../users/schemas/user.schema';

export interface AuthenticatedRequest extends Request {
  user: UserDocument;
}
