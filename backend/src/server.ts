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
    // Skip in Docker (both dev and prod) since frontend is served separately
    if (!process.env.DOCKER_DEV && process.env.NODE_ENV !== 'production') {
      const frontendDistPath = path.join(__dirname, '../../frontend/dist');

      await fastify.register(fastifyStatic, {
        root: frontendDistPath,
        prefix: '/',
      });
    }

    // Generate a secure session secret if none provided
    const sessionSecret =
      process.env.SESSION_SECRET ||
      'fallback_session_secret_key_for_development_only_not_for_production_use_generate_your_own';

    if (sessionSecret.length < 32) {
      throw new Error('SESSION_SECRET must be at least 32 characters long for security');
    }

    // Add security headers and CORS
    fastify.addHook('onSend', async (request, reply) => {
      reply.header('X-Content-Type-Options', 'nosniff');
      reply.header('X-Frame-Options', 'DENY');
      reply.header('X-XSS-Protection', '1; mode=block');
      reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');

      // CORS headers for cross-domain requests
      const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
      reply.header('Access-Control-Allow-Origin', frontendOrigin);
      reply.header('Vary', 'Origin'); // important for caches/CDNs
      reply.header('Access-Control-Allow-Credentials', 'true');
      reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      reply.header('Access-Control-Max-Age', '600'); // cache preflight 10 min

      // Only add HSTS in production with HTTPS
      if (process.env.NODE_ENV === 'production') {
        reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      }
    });

    // Handle preflight requests
    fastify.options('*', async (_request, reply) => {
      return reply.send();
    });

    const isProduction = process.env.NODE_ENV === 'production';

    await fastify.register(secureSession, {
      key: Buffer.from(sessionSecret, 'utf8').subarray(0, 32), // Proper Buffer conversion
      cookieName: 'sessionId',
      cookie: {
        secure: isProduction, // Use secure cookies in production
        httpOnly: true, // Use httpOnly for better security
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        sameSite: isProduction ? 'none' : 'lax', // Use 'none' for production cross-domain, 'lax' for dev
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

    const port = parseInt(process.env.PORT || '3001', 10);
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
