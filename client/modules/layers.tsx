import './layers.scss';
import { Component, createContext, For, onCleanup, onMount, ParentProps, useContext } from 'solid-js';
import { createMutable } from 'solid-js/store';

type LayersContext<T extends string[] = string[]> = {
   push(path: T[number]): void;
   toggle(path: T[number]): void;
   back(): void;
   includes: T['includes'];
};
const LayersContext = createContext<LayersContext>();
export const useLayersContext = () => useContext(LayersContext);

export type TransitionGraph<T extends string[] = string[]> = Record<T[number], T[number][]>;

type LayersContextProviderProps<T extends string[]> = ParentProps<{
   graph: TransitionGraph<T>;
   views: { [view in T[number]]: Component };
}>;
export function LayersContextProvider<T extends string[]>(props: LayersContextProviderProps<T>) {
   const { graph, views } = props;
   const stack = createMutable([]);
   const context: LayersContext = {
      toggle(path: T[number]) {
         const entry = stack.lastIndexOf(path);
         if (entry > -1) {
            stack.splice(entry);
         } else {
            stack.push(path);
         }
      },
      push(path: T[number]) {
         const current = stack[stack.length - 1];
         if (!current || graph[current].includes(path)) stack.push(path);
      },
      back() {
         if (stack.length) stack.pop();
      },
      includes: stack.includes
   };
   return (
      <LayersContext.Provider value={context}>
         {props.children}
         <For each={stack}>
            {(viewName) => (
               <dialog
                  class={`modal ${viewName}`}
                  ref={(ref: HTMLDialogElement) => {
                     onMount(() => ref.showModal());
                     onCleanup(() => ref.close());
                  }}
                  onClose={() => context.toggle(viewName)}
               >
                  <svg
                     viewBox="0 0 14 14"
                     fill="none"
                     xmlns="http://www.w3.org/2000/svg"
                     class="close"
                     onClick={(e) => e.currentTarget.parentElement.close()}
                  >
                     <path d="M13 1L1 13" stroke="#9CA5AB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                     <path d="M1 1L13 13" stroke="#9CA5AB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  {views[viewName]}
               </dialog>
            )}
         </For>
      </LayersContext.Provider>
   );
}
