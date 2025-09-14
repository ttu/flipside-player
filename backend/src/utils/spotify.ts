import crypto from 'crypto';
import { SpotifyToken, SpotifyUser, SpotifyDevice, SpotifySearchResult } from '../types';

const SPOTIFY_BASE_URL = 'https://api.spotify.com/v1';
const SPOTIFY_ACCOUNTS_URL = 'https://accounts.spotify.com';

export class SpotifyAPI {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }

  generatePKCEChallenge(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = crypto.randomBytes(96).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

    return { codeVerifier, codeChallenge };
  }

  getAuthUrl(codeChallenge: string, state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope: 'streaming user-modify-playback-state user-read-private',
      redirect_uri: this.redirectUri,
      state,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
    });

    return `${SPOTIFY_ACCOUNTS_URL}/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, codeVerifier: string): Promise<SpotifyToken> {
    try {
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        code_verifier: codeVerifier,
      });

      const response = await fetch(`${SPOTIFY_ACCOUNTS_URL}/api/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        },
        body: body,
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Token exchange failed:', {
          status: response.status,
          statusText: response.statusText,
          error,
        });
        throw new Error(`Token exchange failed (${response.status}): ${error}`);
      }

      const result = await response.json();
      return result as SpotifyToken;
    } catch (error: any) {
      console.error('Token exchange error:', error.message);
      throw error;
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<SpotifyToken> {
    const response = await fetch(`${SPOTIFY_ACCOUNTS_URL}/api/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${error}`);
    }

    return response.json() as Promise<SpotifyToken>;
  }

  async getCurrentUser(accessToken: string): Promise<SpotifyUser> {
    const response = await fetch(`${SPOTIFY_BASE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user profile');
    }

    return response.json() as Promise<SpotifyUser>;
  }

  async search(
    accessToken: string,
    query: string,
    type = 'track',
    limit = 20
  ): Promise<SpotifySearchResult> {
    const params = new URLSearchParams({
      q: query,
      type,
      limit: limit.toString(),
    });

    const response = await fetch(`${SPOTIFY_BASE_URL}/search?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Search failed');
    }

    return response.json() as Promise<SpotifySearchResult>;
  }

  async getDevices(accessToken: string): Promise<{ devices: SpotifyDevice[] }> {
    const response = await fetch(`${SPOTIFY_BASE_URL}/me/player/devices`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get devices');
    }

    return response.json() as Promise<{ devices: SpotifyDevice[] }>;
  }

  async transferPlayback(accessToken: string, deviceId: string, play = true): Promise<void> {
    const response = await fetch(`${SPOTIFY_BASE_URL}/me/player`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_ids: [deviceId],
        play,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to transfer playback');
    }
  }

  async getAlbum(accessToken: string, albumId: string): Promise<any> {
    const response = await fetch(`${SPOTIFY_BASE_URL}/albums/${albumId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get album');
    }

    return response.json();
  }

  async startPlayback(accessToken: string, deviceId?: string, uris?: string[]): Promise<void> {
    const body: any = {};
    if (uris) body.uris = uris;
    if (deviceId) body.device_id = deviceId;

    const response = await fetch(`${SPOTIFY_BASE_URL}/me/player/play`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetails = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = `${errorDetails} - ${errorJson.error?.message || errorText}`;
      } catch {
        errorDetails = `${errorDetails} - ${errorText}`;
      }

      throw new Error(`Failed to start playback: ${errorDetails}`);
    }
  }
}
