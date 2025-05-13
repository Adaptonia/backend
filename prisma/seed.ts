import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt();
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log('Starting seed process...');
  
  // Check if admin user already exists
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@adaptonia.com';
  const existingAdmin = await prisma.user.findFirst({
    where: {
      email: adminEmail,
    },
  });
  
  if (!existingAdmin) {
    console.log(`Creating initial admin user: ${adminEmail}`);
    
    // Create initial admin user
    await prisma.user.create({
      data: {
        email: adminEmail,
        firstName: 'Admin',
        lastName: 'User',
        password: await hashPassword(process.env.ADMIN_PASSWORD || 'Adaptonia123!'),
        provider: 'CREDENTIALS',
        role: 'ADMIN',
      },
    });
    
    console.log('Initial admin user created successfully');
  } else {
    console.log('Admin user already exists, skipping creation');
    
    // Make sure the existing user has admin role
    if (existingAdmin.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { role: 'ADMIN' },
      });
      console.log('Updated existing user to admin role');
    }
  }
  
  console.log('Seed process completed');
}

main()
  .catch((e) => {
    console.error('Error in seed process:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 