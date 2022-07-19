import './layers.scss';
import { Component, createContext, createRenderEffect, createSignal, For, onCleanup, onMount, ParentProps, useContext } from 'solid-js';
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
   const stack = createMutable<string[]>([]);
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
   function DialogWrapper(props) {
      let ref: HTMLDialogElement;
      const [closing, setClosing] = createSignal(false);
      onMount(() => {
         ref.showModal();
      });
      return (
         <dialog
            class="modal"
            classList={{
               [props.viewName]: true,
               closing: closing()
            }}
            onAnimationEnd={() => {
               if (closing()) {
                  ref.close();
               }
            }}
            onClose={() => context.toggle(props.viewName)}
            ref={ref}
         >
            <svg
               viewBox="0 0 14 14"
               class="close"
               onClick={() => {
                  setClosing(true);
               }}
            >
               <path d="M13 1L1 13" />
               <path d="M1 1L13 13" />
            </svg>
            {views[props.viewName]}
         </dialog>
      );
   }
   return (
      <LayersContext.Provider value={context}>
         {props.children}
         <For each={stack}>{(viewName) => <DialogWrapper viewName={viewName} />}</For>
      </LayersContext.Provider>
   );
}
