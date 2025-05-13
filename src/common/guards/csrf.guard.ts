import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Guard to handle CSRF verification for state-changing operations.
 * Uses 'isPublic' metadata to bypass CSRF verification for public routes.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      // Check if CSRF is enabled from environment variables
      const isCsrfEnabled = process.env.CSRF_ENABLED === 'true';
      const isDevelopment = process.env.NODE_ENV !== 'production';
      
      // Skip CSRF check if it's disabled or in development mode
      if (!isCsrfEnabled || isDevelopment) {
        return true;
      }
      
      // Skip CSRF check for routes marked as public
      const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
        context.getHandler(),
        context.getClass(),
      ]);
      const request = context.switchToHttp().getRequest();
      console.log(`[CsrfGuard] Path: ${request.path}, isPublic:`, isPublic);
      if (isPublic) {
        return true;
      }

      const method = request.method;

      // Skip CSRF check for safe methods
      if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        return true;
      }

      // For state-changing methods, verify CSRF token
      const csrfHeader = request.headers['x-xsrf-token'];
      const csrfCookie = request.cookies?.['XSRF-TOKEN']; // Use optional chaining

      // If we're checking CSRF but the token function isn't available, it's likely
      // that csurf middleware wasn't properly initialized
      if (typeof request.csrfToken !== 'function') {
        console.warn('CSRF token function not available on request object. CSRF middleware may not be properly configured.');
        // During development, you might want to bypass this check
        if (isDevelopment) {
          return true;
        }
      }

      // Check if CSRF token was provided in the header and it matches the cookie
      if (!csrfHeader || !csrfCookie) {
        console.error('CSRF token missing', {
          headerToken: csrfHeader ? 'present' : 'missing',
          cookieToken: csrfCookie ? 'present' : 'missing',
          path: request.path,
          method: request.method,
        });
        throw new UnauthorizedException('CSRF token missing');
      }

      if (csrfHeader !== csrfCookie) {
        console.error('CSRF token mismatch', {
          path: request.path,
          method: request.method,
        });
        throw new UnauthorizedException('CSRF token validation failed');
      }

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Unexpected error in CSRF guard:', error);
      throw new UnauthorizedException('CSRF validation error');
    }
  }
} 