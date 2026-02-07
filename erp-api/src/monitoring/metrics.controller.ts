import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { register } from './metrics';

@Controller('metrics')
export class MetricsController {
  /**
   * GET /metrics
   * Returns Prometheus-formatted metrics
   */
  @Get()
  async getMetrics(@Res() res: Response): Promise<void> {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  }

  /**
   * GET /metrics/health
   * Health check endpoint for monitoring system itself
   */
  @Get('health')
  getHealth() {
    return {
      status: 'up',
      timestamp: new Date().toISOString(),
      metrics_collected: true,
    };
  }
}
