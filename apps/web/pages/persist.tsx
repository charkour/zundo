import React, {useMemo} from 'react'
import create from "zustand";
import { temporal } from "zundo";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import dynamic from "next/dynamic";

interface Store {
  count: number
  inc: () => void
  dec: () => void
}

// interface Temporal {
//   foo: string
//   setFoo: () => void
// }
//
// const test = (f, bar) => (set, get, store) => {
//   return {
//     ...f(set, get, store),
//     foo: bar,
//     setFoo: () => set(state => ({ foo: `${state.foo}1` }))
//   }
// }

const useStore = create<Store>()(persist(temporal(immer(set => ({
  count: 0,
  inc: () => set((state) => { state.count++ }),
  dec: () => set((state) => { state.count-- }),
}))), {
  name: 'temporal-store'
}))

export const Persist = dynamic(Promise.resolve(() => {
  const state = useStore()

  const localStorageStateOnLoad = useMemo(() => localStorage.getItem('temporal-store') ?? '{}', [])

  return (
    <div>
      <h1>Count: {state.count}</h1>
      <button onClick={state.inc}>inc</button>
      <button onClick={state.dec}>dec</button>
      {/*<button onClick={state.setFoo}>setfoo</button>*/}

      <h2>Current state</h2>
      <pre>
        {JSON.stringify(state, null, 2)}
      </pre>

      <h2>Previous states</h2>
      <pre>

      </pre>

      <h2>Local storage state on load</h2>
      <pre>
        {JSON.stringify(JSON.parse(localStorageStateOnLoad), null, 2)}
      </pre>
    </div>
  )
}), { ssr: false })

export default Persist
