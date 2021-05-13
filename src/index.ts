export { UndoState, undoMiddleware } from './middleware';
export { UseStore } from "zustand";

import createStore, { State, StateCreator } from 'zustand';
import undoMiddleware from './middleware';

export const create = <TState extends State>(
  config: StateCreator<TState>
) => createStore<TState>(undoMiddleware(config));

export default create;
