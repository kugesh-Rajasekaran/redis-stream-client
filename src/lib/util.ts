export const _1_sec = 1000;

export const standalonePrimitives = ['string', 'number', 'boolean'];

export type StreamHandler<T> = (
  stream:
    | {
        streamKey: string;
        streams: { key: string; value: T }[];
      }[]
    | null
) => void | Promise<void>;

export type AddType = [null, string];

export type ReadType = [null, [[string, [[string, string[]]]]]];

const xaddJsonOutputFramer = <T extends { [k: string]: string }>(
  outputArr: AddType
) => ({
  key: outputArr?.[1],
});

const xreadJsonOutputFramer = <T extends { [k: string]: string }>(
  outputArr: ReadType
): StreamType<T | string> | string | undefined => {
  if (!outputArr) return undefined;
  return {
    streamKey: outputArr[1]?.[0]?.[0],
    streams: outputArr[1]?.[0]?.[1].map((individualStream) => ({
      key: individualStream[0],
      value:
        individualStream[1].length === 1
          ? individualStream[1][0]
          : frameStreamValue<T>(individualStream[1] as string[]),
    })),
  };
};

const frameStreamValue = <T extends { [key: string]: string }>(
  value: string[]
): T => {
  const framedValue: { [k: string]: string } = {};
  for (let itr = 0; itr < value.length; itr += 2) {
    framedValue[value[itr]] = value[itr + 1];
  }
  return framedValue as T;
};

const hmgetJsonOutputFramer = <T extends { [key: string]: string }>(
  value: ReadType
): T => {
  return value[1] as unknown as T;
};

export const streamOutputToJsonFramer = {
  xadd: xaddJsonOutputFramer,
  xread: xreadJsonOutputFramer,
  hmget: hmgetJsonOutputFramer,
} as const;

export type StreamMethods = keyof typeof streamOutputToJsonFramer;

export type StreamType<T extends string | { [k: string]: string }> = {
  streamKey: string;
  streams: {
    key: string;
    value: T;
  }[];
};
