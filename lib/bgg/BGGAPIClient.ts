/**
 * BGG API Client
 * Handles direct communication with BoardGameGeek API
 */

import https from 'https';
import { BGGError } from '@/types/bgg.types';
import { BGGConfig } from '@/types/bgg.types';

export class BGGAPIClient {
  private config: BGGConfig;
  private rateLimit: {
    requestsPerSecond: number;
    lastRequestTime: number;
    requestQueue: Array<() => Promise<any>>;
  };

  constructor(config: BGGConfig) {
    this.config = config;
    this.rateLimit = {
      requestsPerSecond: config.rateLimit.requestsPerSecond,
      lastRequestTime: 0,
      requestQueue: [],
    };
  }

  /**
   * Make rate-limited HTTP request to BGG API
   */
  async makeRequest(endpoint: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const makeRequest = async () => {
        try {
          await this.enforceRateLimit();
          const url = `${this.config.baseUrl}${endpoint}`;

          if (this.config.debug.logRequests) {
            console.log('Making BGG request to:', url);
          }

          const options = {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          };

          const req = https.get(url, options, (res) => {
            let data = '';
            
            // Check for redirects (BGG often returns 302 redirects when rate limited)
            if (res.statusCode === 302 || res.statusCode === 301) {
              const location = res.headers.location;
              if (this.config.debug.enabled) {
                console.log(`BGG redirect detected: ${res.statusCode} to ${location}`);
              }
              reject(new BGGError(
                'RATE_LIMIT',
                'BGG API redirected - likely rate limited',
                { statusCode: res.statusCode, location },
                30, // retry after 30 seconds
                'BGG is rate limiting requests. Please wait a moment and try again.'
              ));
              return;
            }

            // Check for empty responses (BGG rate limiting)
            if (res.headers['content-length'] === '0' || res.statusCode !== 200) {
              if (this.config.debug.enabled) {
                console.log(`BGG empty response: status ${res.statusCode}, content-length: ${res.headers['content-length']}`);
              }
              reject(new BGGError(
                'RATE_LIMIT',
                'BGG API returned empty response - likely rate limited',
                { statusCode: res.statusCode, contentLength: res.headers['content-length'] },
                30, // retry after 30 seconds
                'BGG is rate limiting requests. Please wait a moment and try again.'
              ));
              return;
            }
            
            // Handle gzipped content
            if (res.headers['content-encoding'] === 'gzip') {
              const zlib = require('zlib');
              const gunzip = zlib.createGunzip();
              res.pipe(gunzip);
              gunzip.on('data', (chunk: Buffer) => {
                data += chunk.toString();
              });
              gunzip.on('end', () => {
                if (this.config.debug.logResponses) {
                  console.log('BGG response received, length:', data.length);
                  console.log('Response headers:', res.headers);
                  console.log('First 200 chars:', data.substring(0, 200));
                  console.log('Contains <items>:', data.includes('<items'));
                  console.log('Contains <item>:', data.includes('<item'));
                }
                
                // Check if response is empty after decompression
                if (data.length === 0) {
                  reject(new BGGError(
                    'RATE_LIMIT',
                    'BGG API returned empty response after decompression',
                    { statusCode: res.statusCode, headers: res.headers },
                    30,
                    'BGG is rate limiting requests. Please wait a moment and try again.'
                  ));
                  return;
                }
                
                resolve(data);
              });
              gunzip.on('error', (error: Error) => {
                reject(new BGGError(
                  'PARSE_ERROR',
                  'Failed to decompress BGG response',
                  error,
                  undefined,
                  'Failed to process BGG response. Please try again.'
                ));
              });
            } else {
              res.on('data', (chunk: Buffer) => {
                data += chunk.toString();
              });
              res.on('end', () => {
                if (this.config.debug.logResponses) {
                  console.log('BGG response received, length:', data.length);
                  console.log('Response headers:', res.headers);
                  console.log('First 200 chars:', data.substring(0, 200));
                  console.log('Contains <items>:', data.includes('<items'));
                  console.log('Contains <item>:', data.includes('<item'));
                }
                
                // Check if response is empty
                if (data.length === 0) {
                  reject(new BGGError(
                    'RATE_LIMIT',
                    'BGG API returned empty response',
                    { statusCode: res.statusCode, headers: res.headers },
                    30,
                    'BGG is rate limiting requests. Please wait a moment and try again.'
                  ));
                  return;
                }
                
                resolve(data);
              });
            }
          });

          req.on('error', (error: Error) => {
            if (this.config.debug.enabled) {
              console.error('BGG request failed:', error);
            }
            reject(error);
          });

          req.setTimeout(this.config.search.timeout, () => {
            req.destroy();
            reject(new Error('Request timeout'));
          });
        } catch (error) {
          if (this.config.debug.enabled) {
            console.error('BGG request failed:', error);
          }
          reject(error);
        }
      };

      this.rateLimit.requestQueue.push(makeRequest);
      this.processQueue();
    });
  }

  /**
   * Enforce rate limiting - BGG recommends max 1 request per second
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.rateLimit.lastRequestTime;
    // Use config-based rate limiting
    const minInterval = 1000 / this.config.rateLimit.requestsPerSecond;

    if (timeSinceLastRequest < minInterval) {
      const delay = minInterval - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${Math.round(delay)}ms before next BGG request (${this.config.rateLimit.requestsPerSecond} req/s)`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.rateLimit.lastRequestTime = Date.now();
  }

  /**
   * Process request queue
   */
  private async processQueue(): Promise<void> {
    if (this.rateLimit.requestQueue.length === 0) {
      return;
    }

    const request = this.rateLimit.requestQueue.shift();
    if (request) {
      try {
        await request();
      } catch (error) {
        // Error handling is done in the request itself
      }
    }

    // Process next request after delay
    if (this.rateLimit.requestQueue.length > 0) {
      setTimeout(
        () => this.processQueue(),
        1000 / this.rateLimit.requestsPerSecond
      );
    }
  }

  /**
   * Search for games
   */
  async searchGames(
    query: string,
    exact: boolean = false,
    gameType: string = 'all'
  ): Promise<string> {
    const params = new URLSearchParams({
      query,
      ...(exact && { exact: '1' }),
    });

    // Add type filter based on gameType parameter
    if (gameType === 'base-game') {
      params.append('type', 'boardgame');
    } else if (gameType === 'expansion') {
      params.append('type', 'boardgameexpansion');
    } else if (gameType === 'accessory') {
      params.append('type', 'boardgameaccessory');
    } else if (gameType === 'all') {
      // For 'all', we need to do separate searches for each type
      // This will be handled by the BGGService layer
      // Don't add type filter here - let BGGService handle the multiple calls
    }

    return this.makeRequest(`/search?${params}`);
  }

  /**
   * Search games with specific type filter
   */
  async searchGamesByType(
    query: string,
    type: string,
    exact: boolean = false
  ): Promise<string> {
    const params = new URLSearchParams({
      query,
      type,
      ...(exact && { exact: '1' }),
    });

    return this.makeRequest(`/search?${params}`);
  }

  /**
   * Get game details
   */
  async getGameDetails(gameId: string): Promise<string> {
    return this.makeRequest(`/thing?id=${gameId}&stats=1`);
  }

  /**
   * Get user collection
   */
  async getUserCollection(username: string): Promise<string> {
    return this.makeRequest(`/collection?username=${username}&stats=1`);
  }
}
