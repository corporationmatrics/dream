import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsController } from './metrics.controller';
import { MetricsInterceptor } from './metrics.interceptor';

/**
 * Monitoring Module
 * 
 * Provides Prometheus metrics collection and exposure via HTTP
 * 
 * Features:
 * - Automatic HTTP request tracking (duration, count, status)
 * - Business metrics for credit, payments, orders, logistics
 * - Database and cache metrics
 * - System health metrics
 * 
 * Endpoints:
 * - GET /metrics - Prometheus-formatted metrics
 * - GET /metrics/health - Health check
 */
@Module({
  controllers: [MetricsController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
export class MonitoringModule {}
