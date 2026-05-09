// ============================================
// Custom Types
// ============================================
import { Request } from 'express';
import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface JwtPayload {
  id: string;
  role: Role;
}
