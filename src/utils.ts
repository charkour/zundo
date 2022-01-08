import { State } from 'zustand/vanilla';
import { Options } from './types';

const keys = Object.keys as <T extends object>(
  obj: T,
) => Array<Extract<keyof T, string>>;

export const filterState = <UserStateWithUndo extends State>(
  state: UserStateWithUndo,
  { include, exclude }: Options,
): UserStateWithUndo => {
  const filteredState: UserStateWithUndo = {} as UserStateWithUndo;

  keys(state).forEach((key) => {
    if (
      !(exclude && exclude.includes(key)) &&
      (!include || include.includes(key))
    ) {
      filteredState[key] = state[key];
    }
  });
  return filteredState;
};
