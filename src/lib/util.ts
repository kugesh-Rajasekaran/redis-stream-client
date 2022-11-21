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
