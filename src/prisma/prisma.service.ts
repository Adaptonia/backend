import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  // This hook runs when the module is initialized by NestJS
  async onModuleInit() {
    await this.$connect(); // Connect to the database
  }

  // This allows Prisma to gracefully disconnect when the app shuts down
  // async enableShutdownHooks(app: INestApplication) {
  //   this.$on('beforeExit', async () => {
  //     await app.close(); // Triggers Nest's shutdown hooks
  //   });
  // }

  // Optional helper method to clean DB in testing or seed environments
  async cleanDatabase() {
    // Add delete order based on foreign key dependencies
    await this.user.deleteMany();
    // Add more cleanup logic for other models here if needed
  }
}
