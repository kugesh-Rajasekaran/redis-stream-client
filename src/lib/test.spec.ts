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
    const res = await redis.write('key1', { name: 'REDIS_CLIENT' });
    console.log('Key returned for the stored value:', res);
    expect(res).toBeTruthy();
  });

  test('Read check:', async () => {
    const res = await redis.read('key1');
    console.log('Stream returned for the given key:', JSON.stringify(res));
    expect(res).toBeTruthy();
  });

  test('Subscription check:', async () => {
    const res = redis.subscribe('key1', (v: Parameters<StreamHandler>[0]) =>
      console.log('SUBSCRIPTION_RESPONSE', v)
    );
    console.log('Stream returned for the given key:', JSON.stringify(res));
    expect(res).toBeTruthy();
  });
});
