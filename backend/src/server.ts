import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import secureSession from '@fastify/secure-session';
import { config } from 'dotenv';
import path from 'path';
import { initRedis } from './utils/redis';
import { authRoutes } from './routes/auth';
import { spotifyRoutes } from './routes/spotify';
import { favoritesRoutes } from './routes/favorites';

// Load environment variables
config();

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

async function start() {
  try {
    // Validate required environment variables
    const requiredEnvVars = ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REDIRECT_URI'];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:');
      missingVars.forEach(varName => {
        console.error(`   - ${varName}`);
      });
      console.error(
        '\n💡 Please check your backend/.env file and ensure all Spotify credentials are set.'
      );
      process.exit(1);
    }

    console.log('✅ Environment variables loaded successfully');

    // Initialize Redis
    const redis = await initRedis(process.env.REDIS_URL);

    // Test Redis connection
    try {
      await redis.ping();
      console.log('✅ Redis connection successful');
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      throw error;
    }

    // Register static file serving for frontend
    const frontendDistPath = path.join(__dirname, '../../frontend/dist');

    await fastify.register(fastifyStatic, {
      root: frontendDistPath,
      prefix: '/',
    });

    // Generate a secure session secret if none provided
    const sessionSecret =
      process.env.SESSION_SECRET ||
      'fallback_session_secret_key_for_development_only_not_for_production_use_generate_your_own';

    if (sessionSecret.length < 32) {
      throw new Error('SESSION_SECRET must be at least 32 characters long for security');
    }

    await fastify.register(secureSession, {
      key: Buffer.from(sessionSecret.slice(0, 32)), // Use first 32 chars as key
      cookieName: 'sessionId',
      cookie: {
        secure: false, // False for localhost development
        httpOnly: false, // Allow JavaScript access for debugging
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax', // Less restrictive than strict
        path: '/',
      },
    });

    // Register API routes with /api prefix
    await fastify.register(authRoutes, { prefix: '/api' });
    await fastify.register(spotifyRoutes, { prefix: '/api' });
    await fastify.register(favoritesRoutes, { prefix: '/api' });

    // Health check
    fastify.get('/api/health', async (_, reply) => {
      return reply.send({ status: 'ok', timestamp: new Date().toISOString() });
    });

    const isDevelopment = process.env.NODE_ENV !== 'production';
    const defaultPort = isDevelopment ? '5174' : '3001';
    const port = parseInt(process.env.PORT || defaultPort, 10);
    const host = process.env.HOST || '0.0.0.0'; // Listen on all interfaces

    await fastify.listen({ port, host });

    console.log(`Server listening on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  await fastify.close();
});

process.on('SIGINT', async () => {
  await fastify.close();
});

start();
