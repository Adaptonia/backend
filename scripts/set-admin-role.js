/**
 * Script to set a user as an admin
 * 
 * Usage: node scripts/set-admin-role.js user@example.com
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setAdminRole() {
  try {
    const email = process.argv[2];
    
    if (!email) {
      console.error('Please provide an email address');
      console.error('Usage: node scripts/set-admin-role.js user@example.com');
      process.exit(1);
    }
    
    // Find the user
    const user = await prisma.user.findFirst({
      where: {
        email,
      },
    });
    
    if (!user) {
      console.error(`No user found with email: ${email}`);
      process.exit(1);
    }
    
    // Update the user to have admin role
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        role: 'ADMIN',
      },
    });
    
    console.log(`User ${updatedUser.email} is now an admin!`);
  } catch (error) {
    console.error('Error setting admin role:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setAdminRole(); 