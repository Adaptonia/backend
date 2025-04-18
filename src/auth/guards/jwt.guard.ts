import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * This guard uses the 'jwt' strategy defined in JwtStrategy.
 * Apply it to any route you want protected.
 */

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}