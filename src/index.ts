import createStore, { State, StateCreator } from 'zustand';
import undoMiddleware from './middleware';
import { Options } from './types';

export { UndoState, undoMiddleware } from './middleware';
export { UseStore } from 'zustand';

// create a store with undo/redo functionality
export const create = <TState extends State>(
  config: StateCreator<TState>,
  options?: Options,
) => createStore<TState>(undoMiddleware(config, options));

export default create;
