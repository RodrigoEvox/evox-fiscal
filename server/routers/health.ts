import { publicProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';

export const healthRouter = router({
  check: publicProcedure.query(async () => {
    const checks = {
      timestamp: new Date().toISOString(),
      services: {
        database: { status: 'unknown' as const, latency: 0 },
        api: { status: 'ok' as const, latency: 0 },
      },
    };

    // Check database connection
    try {
      const startDb = Date.now();
      const db = await getDb();
      
      if (db) {
        // Try a simple query to verify connection
        const latencyDb = Date.now() - startDb;
        checks.services.database = { status: 'ok', latency: latencyDb };
      } else {
        checks.services.database = { status: 'error', latency: 0 };
      }
    } catch (error) {
      checks.services.database = { status: 'error', latency: 0 };
    }

    // Check API health
    try {
      const startApi = Date.now();
      // Check if we can reach external APIs (BrasilAPI for CNPJ lookup)
      const response = await fetch('https://brasilapi.com.br/api/status', {
        timeout: 5000,
      }).catch(() => null);
      
      const latencyApi = Date.now() - startApi;
      
      if (response?.ok) {
        checks.services.api = { status: 'ok', latency: latencyApi };
      } else {
        checks.services.api = { status: 'degraded', latency: latencyApi };
      }
    } catch (error) {
      checks.services.api = { status: 'error', latency: 0 };
    }

    // Overall status
    const overallStatus = Object.values(checks.services).every(s => s.status === 'ok')
      ? 'healthy'
      : Object.values(checks.services).some(s => s.status === 'error')
      ? 'unhealthy'
      : 'degraded';

    return {
      ...checks,
      status: overallStatus,
    };
  }),

  detailed: publicProcedure.query(async () => {
    const health = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        database: {
          status: 'unknown' as const,
          latency: 0,
          lastCheck: new Date().toISOString(),
        },
        brasilapi: {
          status: 'unknown' as const,
          latency: 0,
          lastCheck: new Date().toISOString(),
        },
        oauth: {
          status: 'unknown' as const,
          latency: 0,
          lastCheck: new Date().toISOString(),
        },
      },
    };

    // Check database
    try {
      const startDb = Date.now();
      const db = await getDb();
      const latencyDb = Date.now() - startDb;
      
      health.services.database = {
        status: db ? 'ok' : 'error',
        latency: latencyDb,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      health.services.database.status = 'error';
    }

    // Check BrasilAPI
    try {
      const startApi = Date.now();
      const response = await fetch('https://brasilapi.com.br/api/status', {
        timeout: 5000,
      }).catch(() => null);
      const latencyApi = Date.now() - startApi;
      
      health.services.brasilapi = {
        status: response?.ok ? 'ok' : 'degraded',
        latency: latencyApi,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      health.services.brasilapi.status = 'error';
    }

    // Check OAuth (Manus)
    try {
      const startOAuth = Date.now();
      const response = await fetch(process.env.OAUTH_SERVER_URL || '', {
        timeout: 5000,
        method: 'HEAD',
      }).catch(() => null);
      const latencyOAuth = Date.now() - startOAuth;
      
      health.services.oauth = {
        status: response?.ok ? 'ok' : 'degraded',
        latency: latencyOAuth,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      health.services.oauth.status = 'error';
    }

    return health;
  }),
});
