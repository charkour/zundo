import { Options } from './types';

// TODO: make this a better type
export const filterState = (state: any, options?: Options) => {
  const excluded: string[] | undefined = options?.exclude || options?.omit;
  const included: string[] | undefined = options?.include;

  const filteredState: any = {};

  Object.keys(state).forEach((key: string) => {
    if (
      !(excluded && excluded.includes(key)) &&
      (!included || included.includes(key))
    ) {
      filteredState[key] = state[key];
    }
  });
  return filteredState;
};
