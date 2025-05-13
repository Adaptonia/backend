import { SetMetadata } from '@nestjs/common';

/**
 * Mark a route as public to bypass CSRF and JWT authentication
 */
export const Public = () => SetMetadata('isPublic', true); 