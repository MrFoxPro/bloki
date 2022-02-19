import { createStore, SetStoreFunction } from "solid-js/store";

export function createState<T>(initial: T, options?) {
   const [store, setStore] = createStore({
      value: initial,
   }, options);

   // const state = createMemo(() => store.value);

   const setState: SetStoreFunction<T> = (...args) => {
      (setStore as any)('value', ...args);
   };
   return [store.value, setState] as const;
};