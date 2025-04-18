import { Injectable } from "@nestjs/common";
import { JwtService as NestJwtService} from '@nestjs/jwt'

@Injectable()
export class JwtWrapperService {
    constructor(private jwt: NestJwtService){}

    //  Generates an access token with a short lifespan (e.g., 15 minutes)

    async generateAccessToken(userId: string): Promise<string> {
        const payload = {sub: userId};
        return this.jwt.signAsync(payload, {
            secret: process.env.JWT_SECRET,
            expiresIn: '15m'
        })
    }

    // generates a refresh token with a longer lifespan

    async generateRefreshToken(userId: string): Promise<string> {
        const payload = {sub: userId}
        return this.jwt.signAsync(payload, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: '7d'
        })
    }

    // verifies an access token using the appropriate secret

    async verifyToken(token: string) : Promise<any> {
        return this.jwt.verifyAsync(token, {
            secret: process.env.JWT_REFRESH_SECRET,
        })
    }

    async verifyRefreshToken(token: string) {
        return this.jwt.verifyAsync(token, {
            secret: process.env.JWT_REFRESH_TOKEN
        })
    }
}