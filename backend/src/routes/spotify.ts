import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { SpotifyAPI } from '../utils/spotify';
import { getRedisClient } from '../utils/redis';
import { SessionData } from '../types';

const searchSchema = z.object({
  q: z.string().min(1),
  type: z.string().default('track'),
  limit: z.coerce.number().min(1).max(50).default(20),
});

const transferSchema = z.object({
  deviceId: z.string(),
  play: z.boolean().default(true),
});

const playSchema = z.object({
  deviceId: z.string().optional(),
  uris: z.array(z.string()).optional(),
  offset: z
    .object({
      position: z.number().int().min(0),
    })
    .optional(),
  // Use Spotify's field name so we can pass it through directly
  position_ms: z.number().int().min(0).optional(),
});

const pauseSchema = z.object({
  deviceId: z.string().optional(),
});

const volumeSchema = z.object({
  deviceId: z.string().optional(),
  volume: z.number().min(0).max(100),
});

export async function spotifyRoutes(fastify: FastifyInstance) {
  const spotify = new SpotifyAPI(
    process.env.SPOTIFY_CLIENT_ID!,
    process.env.SPOTIFY_CLIENT_SECRET!,
    process.env.SPOTIFY_REDIRECT_URI!
  );

  async function getValidAccessToken(request: any): Promise<string> {
    const sessionData = (request.session as any).get('user') as SessionData;

    if (!sessionData?.accessToken) {
      throw new Error('Not authenticated');
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

      (request.session as any).set('user', sessionData);
      accessToken = tokenData.access_token;
    }

    return accessToken;
  }

  // Search tracks
  fastify.get('/spotify/search', async (request, reply) => {
    try {
      const { q, type, limit } = searchSchema.parse(request.query);
      const accessToken = await getValidAccessToken(request);

      // Check cache first
      const redis = getRedisClient();
      const cacheKey = `search:${q}:${type}:${limit}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        return reply.send(JSON.parse(cached));
      }

      const results = await spotify.search(accessToken, q, type, limit);

      // Cache for 2 minutes
      await redis.setEx(cacheKey, 120, JSON.stringify(results));

      return reply.send(results);
    } catch (error: any) {
      fastify.log.error(error);

      if (error.message === 'Not authenticated') {
        return reply.code(401).send({ error: 'Not authenticated' });
      }

      return reply.code(500).send({ error: 'Search failed' });
    }
  });

  // Get available devices
  fastify.get('/spotify/devices', async (request, reply) => {
    try {
      const accessToken = await getValidAccessToken(request);
      const devices = await spotify.getDevices(accessToken);

      return reply.send(devices);
    } catch (error: any) {
      fastify.log.error(error);

      if (error.message === 'Not authenticated') {
        return reply.code(401).send({ error: 'Not authenticated' });
      }

      return reply.code(500).send({ error: 'Failed to get devices' });
    }
  });

  // Transfer playback to device
  fastify.put('/spotify/transfer-playback', async (request, reply) => {
    try {
      const { deviceId, play } = transferSchema.parse(request.body);
      const accessToken = await getValidAccessToken(request);

      await spotify.transferPlayback(accessToken, deviceId, play);

      return reply.send({ success: true });
    } catch (error: any) {
      fastify.log.error(error);

      if (error.message === 'Not authenticated') {
        return reply.code(401).send({ error: 'Not authenticated' });
      }

      return reply.code(500).send({ error: 'Failed to transfer playback' });
    }
  });

  // Get album by ID
  fastify.get('/spotify/albums/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const accessToken = await getValidAccessToken(request);

      // Check cache first
      const redis = getRedisClient();
      const cacheKey = `album:${id}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        return reply.send(JSON.parse(cached));
      }

      const album = await spotify.getAlbum(accessToken, id);

      // Cache for 5 minutes
      await redis.setEx(cacheKey, 300, JSON.stringify(album));

      return reply.send(album);
    } catch (error: any) {
      fastify.log.error(error);

      if (error.message === 'Not authenticated') {
        return reply.code(401).send({ error: 'Not authenticated' });
      }

      return reply.code(500).send({ error: 'Failed to get album' });
    }
  });

  // Start playback
  fastify.put('/spotify/play', async (request, reply) => {
    try {
      const { deviceId, uris, offset, position_ms } = playSchema.parse(request.body);
      const accessToken = await getValidAccessToken(request);

      await spotify.startPlayback(accessToken, { deviceId, uris, offset, position_ms });

      return reply.send({ success: true });
    } catch (error: any) {
      fastify.log.error(error);

      if (error.message === 'Not authenticated') {
        return reply.code(401).send({ error: 'Not authenticated' });
      }

      // Check for specific Spotify API errors
      if (error.message.includes('404')) {
        return reply.code(404).send({
          error: 'No active device found. Please open Spotify on a device first.',
        });
      }

      if (error.message.includes('403')) {
        return reply.code(403).send({
          error: 'Premium account required for playback control.',
        });
      }

      return reply.code(500).send({
        error: 'Failed to start playback',
        details: error.message.includes('HTTP') ? error.message : undefined,
      });
    }
  });

  // Pause playback
  fastify.put('/spotify/pause', async (request, reply) => {
    try {
      const { deviceId } = pauseSchema.parse(request.body || {});
      const accessToken = await getValidAccessToken(request);

      await spotify.pausePlayback(accessToken, deviceId);

      return reply.send({ success: true });
    } catch (error: any) {
      fastify.log.error(error);

      if (error.message === 'Not authenticated') {
        return reply.code(401).send({ error: 'Not authenticated' });
      }

      return reply.code(500).send({ error: 'Failed to pause playback' });
    }
  });

  // Playback state
  fastify.get('/spotify/state', async (request, reply) => {
    try {
      const accessToken = await getValidAccessToken(request);
      const state = await spotify.getPlaybackState(accessToken);
      return reply.send(state);
    } catch (error: any) {
      fastify.log.error(error);
      if (error.message === 'Not authenticated') {
        return reply.code(401).send({ error: 'Not authenticated' });
      }
      return reply.code(500).send({ error: 'Failed to get playback state' });
    }
  });

  // Next/Previous controls
  fastify.post('/spotify/next', async (request, reply) => {
    try {
      const accessToken = await getValidAccessToken(request);
      await spotify.nextTrack(accessToken);
      return reply.send({ success: true });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to skip to next' });
    }
  });

  fastify.post('/spotify/previous', async (request, reply) => {
    try {
      const accessToken = await getValidAccessToken(request);
      await spotify.previousTrack(accessToken);
      return reply.send({ success: true });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to skip to previous' });
    }
  });

  // Volume control
  fastify.put('/spotify/volume', async (request, reply) => {
    try {
      const { deviceId, volume } = volumeSchema.parse(request.body);
      const accessToken = await getValidAccessToken(request);
      await spotify.setVolume(accessToken, volume, deviceId);
      return reply.send({ success: true });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to set volume' });
    }
  });
}
