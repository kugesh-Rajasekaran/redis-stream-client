/* eslint-disable @typescript-eslint/ban-types */
import Redis, { RedisKey, RedisValue } from 'ioredis';
export class RedisStream {
  private static _instance: RedisStream | undefined;
  private _redis: Redis | undefined;

  private constructor(private _path = 'localhost', private _port = 6379) {
    this.connect();
  }

  static getInstance(path?: string, port?: number) {
    return (
      RedisStream._instance ??
      (RedisStream._instance = new RedisStream(path, port))
    );
  }

  connect(): this {
    this._redis = new Redis(this._path, { port: this._port });
    return this;
  }

  async write<T extends string | number | { [key: string]: string | number }>(
    streamKey: string,
    entry: T
  ): Promise<string | null> {
    return (this._redis as Redis).xadd(
      streamKey,
      '*',
      ...((standalonePrimitives.includes(typeof entry)
        ? [entry]
        : Object.entries(entry).flat()) as RedisValue[])
    );
  }

  async read(
    streamKey: string,
    lastId: string = '0' /* returns all the stream */
  ) {
    return (this._redis as Redis)
      .xread('STREAMS', streamKey, lastId)
      .then((response) => {
        if (!response) return response;
        return {
          streamKey: response[0][0],
          streams: response[0][1].map((stream) => ({
            key: stream[0],
            value: stream[1],
          })),
        };
      });
  }

  disconnect() {
    this._redis?.disconnect();
  }
}

const standalonePrimitives = ['string', 'number', 'boolean'];
