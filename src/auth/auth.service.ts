import { BadRequestException, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt'
import { JwtWrapperService } from './jwt.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtWrapperService
    ) {}

    async register(dto: RegisterDto) {
        const { email, password, confirmPassword } = dto;

        if(password !== confirmPassword) {
            throw new BadRequestException('Passwords do not match')
        }

        const existingUser = await this.prisma.user.findUnique({where: {email}})
        if(existingUser) throw new BadRequestException('Email already in use');

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                provider: 'CREDENTIALS'
            }
        })

        return this.generateTokens(user.id)
    }

    async login(dto: LoginDto){
        const {email, password}  = dto;

        const existingUser = await this.prisma.user.findUnique({ where: { email}})
        if(!existingUser || !existingUser.password ) throw new UnauthorizedException('Invalid credentials');
        
            const isValid = await bcrypt.compare(password, existingUser.password);
            if(!isValid) throw new UnauthorizedException('invalid Password')

        return this.generateTokens(existingUser.id)
    }


    private async generateTokens(userId: string){
        const payload = { sub: userId}


        return {
            accesstoken: await this.jwt.generateAccessToken(userId),
            refreshToken: await this.jwt.generateRefreshToken(userId)
        }
    }
}
