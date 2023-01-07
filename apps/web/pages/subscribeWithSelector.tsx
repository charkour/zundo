import { useEffect } from "react";
import create from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { temporal } from "zundo";

interface ExampleData {
  key1: boolean;
  key2: number;
}

const store = create<ExampleData>()(
  subscribeWithSelector(
    temporal(() => ({
      // TODO: find a way to remove this type cast.
      key1: false as boolean,
      key2: 32
    }))
  )
);

const Subscribed = () => {
  return <></>
}

export default Subscribed
