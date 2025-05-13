import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Fetch the user from the database to check their role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    // Check if user exists and has the ADMIN role
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can perform this action');
    }

    return true;
  }
} 