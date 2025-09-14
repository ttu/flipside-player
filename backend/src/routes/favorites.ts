import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getRedisClient } from '../utils/redis';
import { SessionData } from '../types';

const favoriteAlbumSchema = z.object({
  id: z.string(),
  album: z.object({
    id: z.string(),
    name: z.string(),
    artists: z.array(
      z.object({
        name: z.string(),
      })
    ),
    images: z.array(
      z.object({
        url: z.string(),
      })
    ),
    release_date: z.string(),
    total_tracks: z.number().optional(),
  }),
  dateAdded: z.string(),
});

type FavoriteAlbum = z.infer<typeof favoriteAlbumSchema>;

export async function favoritesRoutes(fastify: FastifyInstance) {
  function getUserId(request: any): string {
    const sessionData = (request.session as any).get('user') as SessionData;
    if (!sessionData?.userId) {
      throw new Error('Not authenticated');
    }
    return sessionData.userId;
  }

  // Get user's favorites from Redis
  fastify.get('/favorites', async (request, reply) => {
    try {
      const userId = getUserId(request);
      const redis = getRedisClient();
      const favoritesKey = `user:${userId}:favorites`;

      const favorites = await redis.hGetAll(favoritesKey);
      const favoritesList: FavoriteAlbum[] = Object.values(favorites)
        .map(fav => JSON.parse(fav))
        .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());

      return reply.send(favoritesList);
    } catch (error: any) {
      fastify.log.error(error);

      if (error.message === 'Not authenticated') {
        return reply.code(401).send({ error: 'Not authenticated' });
      }

      return reply.code(500).send({ error: 'Failed to get favorites' });
    }
  });

  // Add album to favorites
  fastify.post('/favorites', async (request, reply) => {
    try {
      const userId = getUserId(request);
      const favorite = favoriteAlbumSchema.parse(request.body);

      const redis = getRedisClient();
      const favoritesKey = `user:${userId}:favorites`;

      await redis.hSet(favoritesKey, favorite.id, JSON.stringify(favorite));

      return reply.send({ success: true });
    } catch (error: any) {
      fastify.log.error(error);

      if (error.message === 'Not authenticated') {
        return reply.code(401).send({ error: 'Not authenticated' });
      }

      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid favorite data', details: error.errors });
      }

      return reply.code(500).send({ error: 'Failed to add favorite' });
    }
  });

  // Remove album from favorites
  fastify.delete('/favorites/:albumId', async (request, reply) => {
    try {
      const userId = getUserId(request);
      const { albumId } = request.params as { albumId: string };

      const redis = getRedisClient();
      const favoritesKey = `user:${userId}:favorites`;

      await redis.hDel(favoritesKey, albumId);

      return reply.send({ success: true });
    } catch (error: any) {
      fastify.log.error(error);

      if (error.message === 'Not authenticated') {
        return reply.code(401).send({ error: 'Not authenticated' });
      }

      return reply.code(500).send({ error: 'Failed to remove favorite' });
    }
  });

  // Check if album is favorite
  fastify.get('/favorites/:albumId', async (request, reply) => {
    try {
      const userId = getUserId(request);
      const { albumId } = request.params as { albumId: string };

      const redis = getRedisClient();
      const favoritesKey = `user:${userId}:favorites`;

      const favorite = await redis.hGet(favoritesKey, albumId);

      return reply.send({ isFavorite: !!favorite });
    } catch (error: any) {
      fastify.log.error(error);

      if (error.message === 'Not authenticated') {
        return reply.code(401).send({ error: 'Not authenticated' });
      }

      return reply.code(500).send({ error: 'Failed to check favorite status' });
    }
  });
}
