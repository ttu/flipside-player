import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';
import { SpotifyAPI } from '../utils/spotify';
import { getRedisClient } from '../utils/redis';
import { SessionData } from '../types';

const callbackSchema = z.object({
  code: z.string().optional(),
  state: z.string(),
  error: z.string().optional(),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Use mock API if enabled
  const useMock = process.env.USE_MOCK_SPOTIFY === 'true';

  let spotify: SpotifyAPI | any;

  if (useMock) {
    const { MockSpotifyAPI } = await import('../mocks/spotifyAPI');
    spotify = new MockSpotifyAPI();
    fastify.log.info('🎭 Using Mock Spotify API');
  } else {
    spotify = new SpotifyAPI(
      process.env.SPOTIFY_CLIENT_ID!,
      process.env.SPOTIFY_CLIENT_SECRET!,
      process.env.SPOTIFY_REDIRECT_URI!
    );
  }

  // Start Spotify OAuth flow
  fastify.get('/auth/spotify/start', async (_request, reply) => {
    const state = crypto.randomBytes(16).toString('hex');
    const { codeVerifier, codeChallenge } = spotify.generatePKCEChallenge();

    const redis = getRedisClient();
    await redis.setEx(`pkce:${state}`, 300, codeVerifier); // 5 min expiry

    // In mock mode, redirect directly to callback with mock authorization code
    if (useMock) {
      fastify.log.info('🎭 Mock OAuth: Redirecting directly to callback');
      const frontendUrl = process.env.FRONTEND_URL || '/';
      const redirectUri =
        process.env.SPOTIFY_REDIRECT_URI || `${frontendUrl}/api/auth/spotify/callback`;
      const mockCode = 'mock-authorization-code-' + Math.random().toString(36).substr(2, 9);
      return reply.redirect(`${redirectUri}?code=${mockCode}&state=${state}`);
    }

    const authUrl = spotify.getAuthUrl(codeChallenge, state);
    return reply.redirect(authUrl);
  });

  // Handle Spotify OAuth callback
  fastify.get('/auth/spotify/callback', async (request, reply) => {
    try {
      fastify.log.info('OAuth callback received');

      const { code, state, error } = callbackSchema.parse(request.query);
      fastify.log.info('OAuth callback parsed successfully');

      if (error) {
        fastify.log.info(`Spotify auth error: ${error}`);
        // Redirect to frontend with error message instead of throwing
        const frontendUrl = process.env.FRONTEND_URL || '/';
        return reply.redirect(`${frontendUrl}?error=${encodeURIComponent(error)}`);
      }

      if (!code) {
        throw new Error('Missing authorization code');
      }

      fastify.log.info('Getting Redis client and code verifier...');
      const redis = getRedisClient();
      let codeVerifier = await redis.get(`pkce:${state}`);

      // In mock mode with mock code, use mock verifier if Redis doesn't have it
      if (!codeVerifier && useMock && code.startsWith('mock-authorization-code-')) {
        fastify.log.info('🎭 Mock OAuth: Creating mock code verifier');
        codeVerifier = 'mock-code-verifier';
        // Store it for consistency
        await redis.setEx(`pkce:${state}`, 300, codeVerifier);
      }

      if (!codeVerifier) {
        throw new Error('Invalid or expired state parameter');
      }

      fastify.log.info('Code verifier found, deleting from Redis...');
      await redis.del(`pkce:${state}`);

      fastify.log.info('Exchanging code for token...');
      const tokenData = await spotify.exchangeCodeForToken(code, codeVerifier);

      fastify.log.info('Getting user profile...');
      const user = await spotify.getCurrentUser(tokenData.access_token);

      const sessionData: SessionData = {
        userId: user.id,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpires: Date.now() + tokenData.expires_in * 1000,
      };

      fastify.log.info(`Authentication successful for user: ${user.id}`);
      if (useMock) {
        fastify.log.info(`🎭 Mock OAuth: Session data created ${JSON.stringify(sessionData)}`);
      }

      // Store session data
      (request.session as any).set('user', sessionData);

      // Verify session was stored
      const storedData = (request.session as any).get('user');
      if (!storedData || !storedData.userId) {
        fastify.log.error('❌ Session data not stored correctly!');
        throw new Error('Failed to store session data');
      }

      fastify.log.info(`Session data stored for user: ${storedData.userId}`);
      if (useMock) {
        fastify.log.info(`🎭 Mock OAuth: Session verified ${JSON.stringify(storedData)}`);
      }

      // Redirect to the frontend
      const frontendUrl = process.env.FRONTEND_URL || '/';
      fastify.log.info(`Redirecting to frontend: ${frontendUrl}`);
      return reply.redirect(frontendUrl);
    } catch (error: any) {
      fastify.log.error('Authentication failed with error:', error.message);

      // Return more specific error information in development
      const errorResponse =
        process.env.NODE_ENV === 'production'
          ? { error: 'Authentication failed' }
          : {
              error: 'Authentication failed',
              details: error.message,
              step: 'OAuth callback processing',
            };

      return reply.code(400).send(errorResponse);
    }
  });

  // Mock auto-login endpoint (only in mock mode)
  if (useMock) {
    fastify.post('/auth/mock-login', async (request, reply) => {
      try {
        fastify.log.info('🎭 Mock auto-login requested');

        // Generate mock tokens
        const tokenData = await spotify.exchangeCodeForToken('mock-code', 'mock-verifier');
        const user = await spotify.getCurrentUser(tokenData.access_token);

        const sessionData: SessionData = {
          userId: user.id,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpires: Date.now() + (tokenData.expires_in || 3600) * 1000,
        };

        (request.session as any).set('user', sessionData);

        // Verify session
        const stored = (request.session as any).get('user');
        if (!stored?.userId) {
          throw new Error('Failed to store session');
        }

        fastify.log.info(`🎭 Mock login successful for user: ${stored.userId}`);
        return reply.send({ success: true, user });
      } catch (error: any) {
        fastify.log.error('Mock login failed:', error);
        return reply.code(500).send({ error: 'Mock login failed', details: error.message });
      }
    });
  }

  // Logout
  fastify.post('/auth/logout', async (request, reply) => {
    request.session.delete();
    return reply.send({ success: true });
  });

  // Get current user
  fastify.get('/me', async (request, reply) => {
    try {
      const sessionData = (request.session as any).get('user') as SessionData;

      fastify.log.info(`/me endpoint called for user: ${sessionData?.userId}`);
      fastify.log.info(`Session data: ${JSON.stringify(sessionData)}`);
      fastify.log.info(`Request cookies: ${JSON.stringify(request.headers.cookie)}`);

      if (!sessionData?.userId) {
        return reply.code(401).send({ error: 'Not authenticated' });
      }

      let accessToken = sessionData.accessToken;

      // Check if token needs refresh
      if (sessionData.tokenExpires && Date.now() > sessionData.tokenExpires - 60000) {
        const tokenData = await spotify.refreshAccessToken(sessionData.refreshToken!);

        sessionData.accessToken = tokenData.access_token;
        sessionData.tokenExpires = Date.now() + tokenData.expires_in * 1000;

        if (tokenData.refresh_token) {
          sessionData.refreshToken = tokenData.refresh_token;
        }

        // Update session
        (request.session as any).set('user', sessionData);

        accessToken = tokenData.access_token;
      }

      const user = await spotify.getCurrentUser(accessToken!);
      return reply.send(user);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(401).send({ error: 'Authentication failed' });
    }
  });

  // Get Spotify token for SDK
  fastify.get('/spotify/token', async (request, reply) => {
    try {
      const sessionData = (request.session as any).get('user') as SessionData;

      if (!sessionData?.accessToken) {
        return reply.code(401).send({ error: 'Not authenticated' });
      }

      let accessToken = sessionData.accessToken;

      // Check if token needs refresh
      if (sessionData.tokenExpires && Date.now() > sessionData.tokenExpires - 60000) {
        const tokenData = await spotify.refreshAccessToken(sessionData.refreshToken!);

        sessionData.accessToken = tokenData.access_token;
        sessionData.tokenExpires = Date.now() + tokenData.expires_in * 1000;

        if (tokenData.refresh_token) {
          sessionData.refreshToken = tokenData.refresh_token;
        }

        // Update session
        (request.session as any).set('user', sessionData);

        accessToken = tokenData.access_token;
      }

      return reply.send(accessToken);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(401).send({ error: 'Authentication failed' });
    }
  });
}
