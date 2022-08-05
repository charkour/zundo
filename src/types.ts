import { StateCreator, StoreMutatorIdentifier } from 'zustand/vanilla';

export interface UndoStoreState {
  undo: () => void;
  redo: () => void;
  clear: () => void;
  setIsUndoHistoryEnabled: (isEnabled: boolean) => void;
  prevStates: any[];
  futureStates: any[];
  isUndoHistoryEnabled: boolean;
  // handle on the parent store's setter
  setStore: Function;
  // handle on the parent store's getter
  getStore: Function;
  options?: Options;
  coolOffTimer?: number;
  isCoolingOff?: boolean;
}

export type UndoState = Pick<
  UndoStoreState,
  'undo' | 'redo' | 'clear' | 'setIsUndoHistoryEnabled'
> & {
  getState: () => UndoStoreState;
};

type StoreUndo = {
  temporal: UndoState;
};

export type UndoMiddleware = <
  T extends object,
  A,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initializer: StateCreator<T, [...Mps, ['temporal', never]], Mcs>,
  options?: A,
) => StateCreator<T, Mps, [['temporal', never], ...Mcs]>;

type WithUndo<S> = Write<Cast<S, object>, StoreUndo>;

declare module 'zustand/vanilla' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface StoreMutators<S, A> {
    temporal: WithUndo<S>;
  }
}

export type UndoMiddlewareImpl = <T extends object>(
  f: PopArgument<StateCreator<T, [], []>>,
  options?: Options,
) => PopArgument<StateCreator<T, [], []>>;

export interface Options {
  include?: string[];
  exclude?: string[];
  allowUnchanged?: boolean;
  historyDepthLimit?: number;
  coolOffDurationMs?: number;
  /**
   * @deprecated Use exclude instead.
   */
  omit?: string[];
}

type PopArgument<T extends (...a: never[]) => unknown> = T extends (
  ...a: [...infer A, infer _]
) => infer R
  ? (...a: A) => R
  : never;

type Write<T extends object, U extends object> = Omit<T, keyof U> & U;
type Cast<T, U> = T extends U ? T : U;
