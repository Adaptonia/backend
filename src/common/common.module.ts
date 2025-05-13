import { Module } from '@nestjs/common';
import { CsrfGuard } from './guards/csrf.guard';

@Module({
  providers: [CsrfGuard],
  exports: [CsrfGuard],
})
export class CommonModule {} 