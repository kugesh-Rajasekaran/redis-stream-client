import Redis, { ChainableCommander, RedisValue } from 'ioredis';
import {
  _1_sec,
  standalonePrimitives,
  StreamHandler,
  streamOutputToJsonFramer,
  StreamMethods,
  AddType,
  ReadType,
} from './util';

export class RedisStream {
  private static _instance: RedisStream | undefined;
  private _redis: Redis | undefined;
  private _pipeline: ChainableCommander | undefined;

  static getInstance(path?: string, port?: number) {
    return (
      RedisStream._instance ??
      (RedisStream._instance = new RedisStream(path, port))
    );
  }

  get redisIO() {
    return this._redis;
  }

  private constructor(private _path = 'localhost', private _port = 6379) {
    this.connect();
  }

  connect(): this {
    this._redis = new Redis(this._path, { port: this._port });
    this._pipeline = this._redis.pipeline();
    return this;
  }

  /**
   * @param streamKey Name of the stream
   * @param entry Entry you want to save. Can be string or object
   * @param entryId Optional
   * @returns
   */
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

  /**
   * Synchronous read
   * @param streamKey Name of the stream
   * @param streamIdToStartFrom Id from which we want to start the reading
   * @returns
   */
  async read(
    streamKey: string,
    streamIdToStartFrom: string = '0' /* returns all the stream */
  ) {
    return (this._redis as Redis)
      .xread('STREAMS', streamKey, streamIdToStartFrom)
      .then(this.frameResponseStream.bind(this));
  }

  pRead(
    streamKey: string,
    streamIdToStartFrom: string = '0' /* returns all the stream */
  ) {
    (this._pipeline as ChainableCommander).xread(
      'STREAMS',
      streamKey,
      streamIdToStartFrom
    );
    return this;
  }

  pGetAll(streamKey: string) {
    (this._pipeline as ChainableCommander).hgetall(streamKey);
    return this;
  }

  async executePipeline<ValueType extends { [key: string]: string }>() {
    return (this._pipeline as ChainableCommander).exec().then((response) => {
      return (
        this._pipeline as unknown as { _queue: { name: string }[] }
      )._queue.map((command, ind: number) =>
        streamOutputToJsonFramer[command.name as StreamMethods]?.<ValueType>(
          response?.[ind] as AddType & ReadType
        )
      );
    });
  }

  clearPipeline() {
    (this._pipeline as unknown as { _queue: any[] })._queue = [];
    return this;
  }

  /**
   * @param streamKey Name of the stream
   * @param streamHandler
   * @param streamIdToStartFrom Id from which we want to start the reading
   * @param secToEnd Time limit till you want to listen
   * @returns
   */
  subscribe<T>(
    streamKey: string,
    streamHandler: StreamHandler<T> /* callback function to execute when a new stream delivered */,
    streamIdToStartFrom: string = '$',
    secToEnd: number = 100000
  ) {
    this._actionForSubscription<T>(
      streamKey,
      streamHandler,
      streamIdToStartFrom,
      secToEnd
    );
    return this;
  }

  deleteByKey(streamKey: string, idsToDelete: string[]): Promise<number> {
    return (this._redis as Redis).xdel(streamKey, ...idsToDelete);
  }

  private async _actionForSubscription<T>(
    streamKey: string,
    streamHandler: StreamHandler<T>,
    streamIdToStartFrom: string,
    secToEnd: number
  ) {
    let startedTime = new Date().getTime();
    const timeLimit = new Date(startedTime + secToEnd * _1_sec).getTime();
    while (startedTime < timeLimit) {
      await (this._redis as Redis)
        .xread('BLOCK', 0, 'STREAMS', streamKey, streamIdToStartFrom)
        .then((v) => this.frameResponseStream(v))
        .then(streamHandler as any);
      startedTime = new Date().getTime();
    }
  }

  private frameResponseStream(
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

  private frameStreamValue(value: string[]) {
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
