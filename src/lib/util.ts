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

const xaddJsonOutputFramer = (outputArr: AddType) => ({ key: outputArr?.[1] });

const xreadJsonOutputFramer = (outputArr: ReadType) => {
  if (!outputArr) return undefined;
  return {
    streamKey: outputArr[1]?.[0]?.[0],
    streams: outputArr[1]?.[0]?.[1].map((individualStream) => ({
      key: individualStream[0],
      value:
        individualStream[1].length === 1
          ? individualStream[1][0]
          : frameStreamValue(individualStream[1] as string[]),
    })),
  };
};

const frameStreamValue = (value: string[]) => {
  const framedValue: { [k: string]: string } = {};
  for (let itr = 0; itr < value.length; itr += 2) {
    framedValue[value[itr]] = value[itr + 1];
  }
  return framedValue;
};

export const streamOutputToJsonFramer = {
  xadd: xaddJsonOutputFramer,
  xread: xreadJsonOutputFramer,
} as const;

export type StreamMethods = keyof typeof streamOutputToJsonFramer;
