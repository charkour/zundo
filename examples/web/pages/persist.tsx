import { useMemo } from 'react';
import { create, useStore } from 'zustand';
import { temporal } from 'zundo';
import { persist, type PersistOptions } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import dynamic from 'next/dynamic';
import merge from 'lodash.merge';

interface Store {
  count: number;
  inc: () => void;
  dec: () => void;
}

const persistOptions: PersistOptions<Store> = {
  name: 'some-store',
};

const useMyStore = create<Store>()(
  persist(
    temporal(
      immer((set) => ({
        count: 0,
        inc: () =>
          set((state) => {
            state.count++;
          }),
        dec: () =>
          set((state) => {
            state.count--;
          }),
      })),
      {
        limit: 5,
        wrapTemporal: (store) =>
          persist(store, {
            name: 'some-store-temporal',
            merge: (persistedState, currentState) =>
              merge(currentState, persistedState),
          }),
      },
    ),
    persistOptions,
  ),
);

const useTemporalStore = () => useStore(useMyStore.temporal);

export const Persist = dynamic(
  Promise.resolve(() => {
    const state = useMyStore();
    const temporalState = useTemporalStore();

    const localStorageStateOnLoad = useMemo(
      () => localStorage.getItem('some-store') ?? '{}',
      [],
    );
    const localStorageTemporalStateOnLoad = useMemo(
      () => localStorage.getItem('some-store-temporal') ?? '{}',
      [],
    );

    return (
      <div>
        <h1>Count: {state.count}</h1>
        <button onClick={state.inc}>inc</button>
        <button onClick={state.dec}>dec</button>

        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1 }}>
            <h2>Current state</h2>
            <pre>{JSON.stringify(state, null, 2)}</pre>
          </div>

          <div style={{ flex: 1 }}>
            <h2>Previous states</h2>
            <pre>{JSON.stringify(temporalState, null, 2)}</pre>
          </div>
        </div>

        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1 }}>
            <h2>Local storage state on load</h2>
            <pre>
              {JSON.stringify(JSON.parse(localStorageStateOnLoad), null, 2)}
            </pre>
          </div>

          <div style={{ flex: 1 }}>
            <h2>Local storage temporal state on load</h2>
            <pre>
              {JSON.stringify(
                JSON.parse(localStorageTemporalStateOnLoad),
                null,
                2,
              )}
            </pre>
          </div>
        </div>
      </div>
    );
  }),
  { ssr: false },
);

export default Persist;
