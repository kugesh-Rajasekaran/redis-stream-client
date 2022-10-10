export const _1_sec = 1000;

export const standalonePrimitives = ['string', 'number', 'boolean'];

export type StreamHandler = (
  stream:
    | {
        streamKey: string;
        streams: { key: string; value: string | { [k: string]: string } }[];
      }[]
    | null
) => void;
