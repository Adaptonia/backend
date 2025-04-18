import { INestApplication, Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    // This hook run when the module is initialized b NestJs
    async onModuleInit() {
        await this.$connect(); // Connect to the database
    }


// This allows Prisma to gracefully disconnect when the app shut down
// async enableShutdownHooks(app: INestApplication) {
//     this.$on('beforeExit', async () => {
//         await app.close(); // Triggers Nest's shutdown hooks
//     });

// }

}