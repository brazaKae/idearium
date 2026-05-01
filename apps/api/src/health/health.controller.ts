import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { AppEnv } from '../config/env.validation';

type HealthStatus = 'ok' | 'degraded';

type HealthResponse = {
  status: HealthStatus;
  uptime: number;
  version: string;
  environment: AppEnv['NODE_ENV'];
  checks: {
    database: 'ok' | 'down';
  };
};

@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();

  constructor(
    private readonly config: ConfigService<AppEnv, true>,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getHealth(): Promise<HealthResponse> {
    const dbCheck = await this.checkDatabase();
    const status: HealthStatus = dbCheck === 'ok' ? 'ok' : 'degraded';

    return {
      status,
      uptime: Math.floor((Date.now() - this.startedAt) / 1000),
      version: this.config.get('APP_VERSION', { infer: true }),
      environment: this.config.get('NODE_ENV', { infer: true }),
      checks: {
        database: dbCheck,
      },
    };
  }

  private async checkDatabase(): Promise<'ok' | 'down'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'ok';
    } catch {
      return 'down';
    }
  }
}
