import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { AuthService } from "../auth.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google'){
  constructor(private configService: ConfigService, private authService: AuthService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: 'http://localhost:3001/auth/google/callback',
      scope: ['email', 'profile'],
      // passReqToCallback: true
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, ){
    console.log('👤 Google profile:', profile);

    const user = await this.authService.validateGoogleUser(profile);
    return user
  }


 

}


//  async validate(
//   req: Request,
//   accessToken: string,
//   refreshToken: string,
//   profile: any,
//   done: VerifyCallback,
// ): Promise<any> {
//   // You can now use `req` if needed
//   const { name, emails, photos } = profile;

//   const user = {
//     email: emails[0].value,
//     firstName: name.givenName,
//     lastName: name.familyName,
//     picture: photos[0].value,
//     provider: 'google',
//   };

//   done(null, user);
// }