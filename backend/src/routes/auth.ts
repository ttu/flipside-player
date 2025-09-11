import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';
import { SpotifyAPI } from '../utils/spotify';
import { getRedisClient } from '../utils/redis';
import { SessionData } from '../types';

const callbackSchema = z.object({
  code: z.string(),
  state: z.string(),
  error: z.string().optional(),
});

export async function authRoutes(fastify: FastifyInstance) {
  const spotify = new SpotifyAPI(
    process.env.SPOTIFY_CLIENT_ID!,
    process.env.SPOTIFY_CLIENT_SECRET!,
    process.env.SPOTIFY_REDIRECT_URI!
  );

  // Start Spotify OAuth flow
  fastify.get('/auth/spotify/start', async (request, reply) => {
    const state = crypto.randomBytes(16).toString('hex');
    const { codeVerifier, codeChallenge } = spotify.generatePKCEChallenge();

    const redis = getRedisClient();
    await redis.setEx(`pkce:${state}`, 300, codeVerifier); // 5 min expiry

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
        throw new Error(`Spotify auth error: ${error}`);
      }

      fastify.log.info('Getting Redis client and code verifier...');
      const redis = getRedisClient();
      const codeVerifier = await redis.get(`pkce:${state}`);

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

      // Store session data
      (request.session as any).set('user', sessionData);

      // Redirect to the frontend served from the same origin
      return reply.redirect('/');
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
