import './layers.css';
import { Component, createContext, createSignal, For, onMount, ParentProps, Suspense, useContext } from 'solid-js';
import { createMutable } from 'solid-js/store';
import { Dynamic } from 'solid-js/web';

type LayersContext<T extends string[] = string[]> = {
   push(path: T[number]): void;
   toggle(path: T[number]): void;
   back(): void;
   includes: T['includes'];
};
const WindowsContext = createContext<LayersContext>();
export const useLayersContext = () => useContext(WindowsContext);

export type TransitionGraph<T extends string[] = string[]> = Record<T[number], T[number][]>;

type WindowsContextProviderProps<T extends string[]> = ParentProps<{
   graph: TransitionGraph<T>;
   views: { [view in T[number]]: Component };
}>;
export function WindowsContextProvider<T extends string[]>(props: WindowsContextProviderProps<T>) {
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
         ref.addEventListener('cancel', (e) => {
            e.preventDefault();
            setClosing(true);
         });
         ref.onclose = () => {
            context.toggle(props.viewName);
         };
      });
      return (
         <div
            class="modal-backdrop"
            classList={{
               closing: closing()
            }}
         >
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
               <Suspense fallback={'Loading'}>
                  <Dynamic component={views[props.viewName]} />
               </Suspense>
            </dialog>
         </div>
      );
   }
   return (
      <WindowsContext.Provider value={context}>
         {props.children}
         <For each={stack}>{(viewName) => <DialogWrapper viewName={viewName} />}</For>
      </WindowsContext.Provider>
   );
}
