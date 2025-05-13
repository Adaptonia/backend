import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // Check if the endpoint is public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    console.log(`[JwtAuthGuard] Path: ${request.path}, isPublic:`, isPublic);
    if (isPublic) {
      return true;
    }

    // Check if JWT is valid using default JWT strategy
    try {
      const canActivate = await super.canActivate(context);
      
      if (typeof canActivate === 'boolean') {
        return canActivate;
      }
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token or expired session');
    }
  }
}

// Re-export the JwtAuthGuard from jwt.guard.ts to maintain backward compatibility
// export { JwtAuthGuard } from './jwt.guard'; 