import { Body, Controller, Get, Post, UseGuards, Req, Res, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { JwtWrapperService } from './jwt.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth') // Group your endpoints
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private jwt: JwtWrapperService) {}

  @Public() // Exempt from CSRF check
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public() // Exempt from CSRF check
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('auth-token'); // match this to your cookie name
    res.clearCookie('refresh-token')
    return { message: 'Logged out successfully' };
  }

  @Public() // Exempt from CSRF check
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google Auth flow
  }

  @Public() // Exempt from CSRF check
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    console.log('✅ Google callback hit');
    console.log('👤 req.user:', req.user);

    const jwt = await this.authService.loginWithGoogle(req.user);
    const { accessToken, refreshToken } = jwt;

    res.cookie('auth-token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('refresh-token', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect to a frontend route that can handle post-auth processing
    return res.redirect('http://localhost:3000/auth/callback?status=success');
  }

  @Public() // Exempt from CSRF check
  @Get('refresh')
  async refresh(@Req() req, @Res() res: Response) {
    const refreshToken = req.cookies['refresh-token']
    if(!refreshToken){
      throw new UnauthorizedException('refresh token not found');
    }

    const payload = await this.jwt.verifyRefreshToken(refreshToken)
    const newAccessToken = await this.jwt.generateAccessToken(payload.sub)

    res.cookie('auth-token', newAccessToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    })


    return res.send({message: 'Token refreshed'})


  }

  @Public() // Exempt from CSRF check
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true}) res: Response) {
    const {accessToken, refreshToken, user} = await this.authService.login(dto);

    res.cookie('auth-token', accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7 // 15 mins
    })

    res.cookie('refresh-token', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    return {message: 'Login successful', user}
  }

  @Public() // Exempt from CSRF check
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public() // Exempt from CSRF check
  @Post('verify-code')
  async verifyResetCode(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyResetCode(dto);
  }

  @Public() // Exempt from CSRF check
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@Req() req) {
    const user = req.user;
    delete user.password; // Remove sensitive info
    return user;
  }

  @Public() // Exempt from CSRF check
  @Get('csrf-token')
  getCsrfToken(@Req() req) {
    try {
      if (typeof req.csrfToken !== 'function') {
        return { 
          csrfToken: '',
          error: 'CSRF middleware not properly initialized' 
        };
      }
      
      const token = req.csrfToken();
      return { csrfToken: token };
    } catch (error) {
      console.error('Error generating CSRF token:', error);
      return { 
        csrfToken: '', 
        error: 'Failed to generate CSRF token'
      };
    }
  }
}
