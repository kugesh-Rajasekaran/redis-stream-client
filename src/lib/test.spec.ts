import { RedisStream } from './main';
import { StreamHandler } from './util';

describe('Test for RedisStream', () => {
  const redis = RedisStream.getInstance();

  afterAll(() => {
    redis.disconnect();
  });

  test('Instance check:', () => {
    expect(redis).toBeInstanceOf(RedisStream);
  });

  test('Write check:', async () => {
    const res = await redis.write('key:3', { name: 'REDIS_CLIENT', age: 12 });
    console.log('Key returned for the stored value:', res);
    expect(res).toBeTruthy();
  });

  test('Read check:', async () => {
    const res = await redis.read('key:3');
    console.log('Stream returned for the given key:', JSON.stringify(res));
    expect(res).toBeTruthy();
  });

  test('Subscription check:', async () => {
    const res = redis.subscribe(
      'key1',
      (v: Parameters<StreamHandler<any>>[0]) =>
        console.log('SUBSCRIPTION_RESPONSE', v)
    );
    console.log('Stream returned for the given key:', JSON.stringify(res));
    expect(res).toBeTruthy();
  });

  test('Pipeline check:', async () => {
    await redis.redisIO
      ?.pipeline()
      ?.xadd('key_1', '*', 'randomKey1', 'randomValue1')
      ?.xadd('key_2', '*', 'randomKey2', 'randomValue2')
      ?.xadd('key_3', '*', 'randomKey3', 'randomValue3');
    const pipeline = await redis
      .pRead('key_1')
      .pRead('key_2')
      .executePipeline()
      .then((v) => v);
    console.log(
      'Stream returned for the given key:',
      JSON.stringify(await pipeline)
    );
    expect(!!pipeline).toBeTruthy();
  });

  // test('Pipeline check:', async () => {
  //   const pipeline = redis.redisIO?.pipeline();
  //   // pipeline?.xadd('key_1', '*', 'randomKey1', 'randomValue1');
  //   // pipeline?.xadd('key_2', '*', 'randomKey2', 'randomValue2');
  //   // pipeline?.xadd('key_3', '*', 'randomKey3', 'randomValue3');
  //   pipeline?.xread('STREAMS', 'key_10', '0');
  //   pipeline?.xread('STREAMS', 'key_21', '0');
  //   pipeline?.xread('STREAMS', 'key_32', '0');
  //   console.log(
  //     'Stream returned for the given key:'
  //     // (pipeline as any)?._queue.map((v: any) => v.name)
  //     // JSON.stringify(await pipeline?.exec((err, res) => console.log(res)))
  //   );
  //   // expect(res).toBeTruthy();
  // });
});
