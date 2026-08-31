import { Role } from '../prisma/prisma-enums';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}
