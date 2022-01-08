import createStore, { State, StateCreator } from 'zustand';
import undoMiddleware from './middleware';
import { Options } from './types';

export { UndoState, undoMiddleware } from './middleware';
export { UseBoundStore } from 'zustand';

// create a store with undo/redo functionality
export const create = <UserState extends State>(
  config: StateCreator<UserState>,
  options?: Options,
) => createStore(undoMiddleware<UserState>(config, options));

export default create;
