import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtWrapperService } from './jwt.service';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtWrapperService,
  ) {}

  async register(dto: RegisterDto) {
    const { email, password, confirmPassword } = dto;

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Check if user already exists with this email and CREDENTIALS provider
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email,
        provider: 'CREDENTIALS',
      },
    });

    if (existingUser) throw new BadRequestException('Email already in use');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        provider: 'CREDENTIALS',
      },
    });

    return this.generateTokens(user.id);
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.prisma.user.findFirst({
      where: { email, provider: 'CREDENTIALS' },
    });


    if (!user || !user.password)
      throw new UnauthorizedException('Invalid credentials');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('Invalid password');

    const accessToken = await this.jwt.generateAccessToken(user.id);
    const refreshToken = await this.jwt.generateRefreshToken(user.id);

    return { accessToken, refreshToken, user };
  }


  async validateGoogleUser(profile) {
    const { id, emails, name } = profile;

    // Look for existing Google user with this providerId
    const user = await this.prisma.user.findFirst({
      where: {
        providerId: id,
        provider: 'GOOGLE',
      },
    });

    if (user) return user;

    // Check if user exists with this email and Google provider
    const email = emails[0].value;
    const existingGoogleUser = await this.prisma.user.findFirst({
      where: {
        email,
        provider: 'GOOGLE'
      }
    })

    if(existingGoogleUser) {
      // Update existing Google User with this providerId
      return this.prisma.user.update({
        where: {id: existingGoogleUser.id},
        data: { providerId: id}
      })
    }

    // Create new Google user
    return this.prisma.user.create({
      data: {
        email,
        firstName: name.givenName,
        lastName: name.familyName,
        provider: 'GOOGLE',
        providerId: id,
      },
    });
  }

  async loginWithGoogle(
    user: any,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { id: providerId, email, name } = user;

    if (!email) {
      throw new UnauthorizedException('Google account has no email');
    }

    try {
      console.log('📍 Step 1: Searching for user by providerId...');
      // Check if Google account already exists
      let user = await this.prisma.user.findFirst({
        where: {
          providerId,
          provider: 'GOOGLE',
        },
      });

      if (!user) {
        console.log('📍 Step 2: No user with providerId. Checking by email...');
        // Check if there's already a Google account with this email
        user = await this.prisma.user.findFirst({
          where: {
            email,
            provider: 'GOOGLE',
          },
        });

        if (user) {
          console.log(
            '🔄 Step 3: Updating existing Google account with new providerId...',
          );
          // Update existing Google account with new providerId
          user = await this.prisma.user.update({
            where: { id: user.id }, // Use ID instead of email for more reliable updates
            data: {
              providerId,
            },
          });
        } else {
          console.log(
            '🔍 Step 4: Checking for accounts with same email but different providers...',
          );
          // Check if user has other accounts with different providers
          const existingUserWithDifferentProvider = await this.prisma.user.findFirst({
            where: {
              email,
              NOT: { provider: 'GOOGLE'}
            }
          })

          if(existingUserWithDifferentProvider){
            console.log(' step: 5: User has existing accounts. Creating linked Google account')
            // Create a new linked Google account
            user = await this.prisma.user.create({
              data: {
                provider: 'GOOGLE',
                providerId,
                email,
                firstName: existingUserWithDifferentProvider.firstName || name?.givenName || '',
                lastName: existingUserWithDifferentProvider.lastName || name?.familyName || ''
              }
            })
          } else {
            console.log(' Step 6: Creating brand new Google user...')
            // Create a completely new user
            user = await this.prisma.user.create({
              data: {
                provider: 'GOOGLE',
                providerId,
                email,
                firstName: name?.givenName || '',
                lastName: name?.familyName || ''
              }
            })
          }
        }
      }

      console.log('✅ Step 7: Generating tokens...');
      const accessToken = await this.jwt.generateAccessToken(user.id);
      const refreshToken = await this.jwt.generateRefreshToken(user.id);

      return { accessToken, refreshToken };
    } catch (err) {
      console.error('❌ Google login failed:', err);

    if (err.code === 'P2002') {
      throw new UnauthorizedException(
        'Account conflict. Please try again in a few moments.'
      );
    }
    throw new UnauthorizedException('Google login failed');
  }
}

  // IMPLEMENT PASSWORD RESET FUNCTIONALITY

  async forgotPassword(dto: ForgotPasswordDto) {
    const { email } = dto;

    // Find user with the specified email and CREDENTIALS provider
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        provider: 'CREDENTIALS',
      },
    });

    if (!user) {
      throw new NotFoundException('User not found with this email');
    }

    // Generate a random 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Create hash of the code for secure storage
    const hashedToken = await bcrypt.hash(code, 10);

    // Set expiration time (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Create or update password reset token
    await this.prisma.passwordReset.create({
      data: {
        token: hashedToken,
        userId: user.id,
        expiresAt,
      },
    });

    // In a real application, send an email with the code
    console.log(`Reset code for ${email}: ${code}`);

    return { 
      message: 'Password reset code sent to email',
      // This would be removed in production, but for demo purposes:
      code 
    };
  }

  async verifyResetCode(dto: VerifyCodeDto) {
    const { email, code } = dto;

    // Find user with the specified email
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        provider: 'CREDENTIALS',
      },
    });

    if (!user) {
      throw new NotFoundException('User not found with this email');
    }

    // Get the most recent valid reset token for this user
    const resetToken = await this.prisma.passwordReset.findFirst({
      where: {
        userId: user.id,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    // Verify the provided code against the stored hash
    const isCodeValid = await bcrypt.compare(code, resetToken.token);
    if (!isCodeValid) {
      throw new BadRequestException('Invalid reset code');
    }

    // Generate a temporary token for the reset password phase
    const tempToken = randomBytes(32).toString('hex');
    
    return { 
      message: 'Code verified successfully',
      tempToken
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { email, code, password, confirmPassword } = dto;

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Find user with the specified email
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        provider: 'CREDENTIALS',
      },
    });

    if (!user) {
      throw new NotFoundException('User not found with this email');
    }

    // Get the most recent valid reset token for this user
    const resetToken = await this.prisma.passwordReset.findFirst({
      where: {
        userId: user.id,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Verify the provided code against the stored hash
    const isCodeValid = await bcrypt.compare(code, resetToken.token);
    if (!isCodeValid) {
      throw new BadRequestException('Invalid reset code');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Mark the reset token as used
    await this.prisma.passwordReset.update({
      where: { id: resetToken.id },
      data: { isUsed: true },
    });

    return { message: 'Password reset successfully' };
  }

  private async generateTokens(userId: string) {
    return {
      accesstoken: await this.jwt.generateAccessToken(userId),
      refreshToken: await this.jwt.generateRefreshToken(userId),
    };
  }
}
