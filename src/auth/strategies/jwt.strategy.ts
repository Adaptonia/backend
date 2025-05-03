import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { validate } from "class-validator";
import { Request } from "express";
import {ExtractJwt, Strategy} from 'passport-jwt'
import { UserService } from "src/user/user.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private userService: UserService) {
      super({
        // jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // look for token in Authorization header
        jwtFromRequest: (req: Request) => {
          if(!req.cookies || !req.cookies['auth-token']) return null;
          return req.cookies['auth-token']
        },
        // ignoreExpiration: false,
        secretOrKey: process.env.JWT_SECRET, // use this secret to validate
      })
    }

      /**
       * Called automatically after successful token verification.
       * You can return anything that will be attached to req.user.
       */

      async validate(payload: {sub: string}) {
        const user = await this.userService.findById(payload.sub)
        // This 'payload' is from the decoded token
        // You can fetch user here if you want, or just return payload
        return user; // this becomes req.user
      }
    }
