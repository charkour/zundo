import createStore from 'zustand';
import undoMiddleware from './middleware';
import { Options } from './types';

export { undoMiddleware } from './middleware';
export { UndoState } from "./types";

// create a store with undo/redo functionality
export const create = <TState extends object>(
  config: any,
  options?: Options,
) => createStore<TState>()(undoMiddleware(config, options));

export default create;
