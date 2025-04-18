import { Body, Controller, Post } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Auth') // Group your endpoints
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('register')
    register(@Body() dto: RegisterDto){
        return this.authService.register(dto)
    }

    @Post('login')
    login(@Body() dto: LoginDto){
        return this.authService.login(dto)
    }
     
}
