import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    async findById(id : string){
        return this.prisma.user.findUnique({ where: {id}});
    }

    async isAdmin(userId: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        
        return user?.role === 'ADMIN';
    }
    
    async promoteToAdmin(email: string) {
        // Find the user by email
        const user = await this.prisma.user.findFirst({
            where: { email }
        });
        
        if (!user) {
            throw new NotFoundException(`No user found with email: ${email}`);
        }
        
        // Update the user role to ADMIN
        const updatedUser = await this.prisma.user.update({
            where: { id: user.id },
            data: { role: 'ADMIN' },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true
            }
        });
        
        return {
            message: `User ${updatedUser.email} has been promoted to admin`,
            user: updatedUser
        };
    }
}
