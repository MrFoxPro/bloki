import { Show, useContext, createContext, JSX, createMemo, Accessor } from "solid-js";
import { createStore } from "solid-js/store";
import s from './modal.module.scss';

const ModalContext = createContext<(el: any, useBlur: any) => readonly [Accessor<boolean>, (visible: boolean, blur?: any) => void]>();

export const useModalStore = () => useContext(ModalContext);

export const ModalStoreProvider = (props) => {
   const [store, setStore] = createStore({
      modal: null,
      blur: false
   });

   const createModal = (el: () => JSX.Element, useBlur = true) => {
      const isVisible = createMemo(() => !!store.modal);

      const setVisible = (visible: boolean, blur = useBlur) => {
         if (visible) setStore({ blur, modal: el });
         else setStore({ blur: false, modal: null });
      };
      return [isVisible, setVisible] as const;
   };


   return (
      <ModalContext.Provider value={createModal}>
         {props.children}
         <Show when={store.blur && store.modal}>
            <div class={s.blur} onClick={() => setStore({ modal: null, blur: false })} />
         </Show>
         <Show when={store.modal}>
            <div class={s.modal}>
               {store.modal}
            </div>
         </Show>
      </ModalContext.Provider>
   );
};