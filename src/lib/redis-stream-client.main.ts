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
    this._redis = new Redis(this._path, { port: this._port }) as Redis;

    return this;
  }

  async write<T extends string | number | { [key: string]: string | number }>(
    streamKey: string,
    entry: T,
    entryId: string | number = '*'
  ): Promise<string | null> {
    return (this._redis as Redis).xadd(
      streamKey,
      entryId,
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
      .then(this.frameResponseStream);
  }

  subscribe(
    streamKey: string,
    streamHandler: StreamHandler,
    streamIdToStartFrom: string = '$',
    secToEnd: number = 1000
  ) {
    // eslint-disable-next-line prefer-rest-params
    this._actionForSubscription([...arguments] as SubscriptionArgs);
    return this;
  }

  private async _actionForSubscription([
    streamKey,
    streamHandler,
    streamIdToStartFrom,
    secToEnd,
  ]: SubscriptionArgs) {
    const startedTime = new Date().getTime();
    const timeLimit = new Date(startedTime + secToEnd * _1_sec).getTime();
    while (startedTime < timeLimit) {
      await (this._redis as Redis)
        .xread('BLOCK', 0, 'STREAMS', streamKey, streamIdToStartFrom)
        .then((streams) => streamHandler(this.frameResponseStream(streams)));
    }
  }

  frameResponseStream(
    stream: [key: string, items: [id: string, fields: string[]][]][] | null
  ) {
    if (!stream) return stream;
    return [
      {
        streamKey: stream[0][0],
        streams: stream[0][1].map((individualStream) => ({
          key: individualStream[0],
          value:
            individualStream[1].length === 1
              ? individualStream[1][0]
              : this.frameStreamValue(individualStream[1]),
        })),
      },
    ];
  }

  frameStreamValue(value: string[]) {
    const framedValue: { [k: string]: string } = {};
    for (let itr = 0; itr < value.length; itr += 2) {
      framedValue[value[itr]] = value[itr + 1];
    }
    return framedValue;
  }

  disconnect() {
    (this._redis as Redis).disconnect();
  }
}

type StreamHandler = (
  stream:
    | {
        streamKey: string;
        streams: { key: string; value: string | { [k: string]: string } }[];
      }[]
    | null
) => void;

type SubscriptionArgs = [string, StreamHandler, string, number];

const _1_sec = 1000;

const standalonePrimitives = ['string', 'number', 'boolean'];

// 1. Getting a callback and execute periodically
// 2. Use event emitter
// 3. Use infinite loop
