import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the user object from the request (req.user)
 */
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // This comes from JwtStrategy.validate
  },
);
