import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { validate } from "class-validator";
import {ExtractJwt, Strategy} from 'passport-jwt'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
      super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // look for token in Authorization header
        ignoreExpiration: false,
        secretOrKey: process.env.JWT_SECRET, // use this secret to validate
      });
    }

      /**
       * Called automatically after successful token verification.
       * You can return anything that will be attached to req.user.
       */

      async validate(payload: {sub: string}) {
        // This 'payload' is from the decoded token
        // You can fetch user here if you want, or just return payload
        return { userId: payload.sub }; // this becomes req.user
      }
    }
