import { Show, useContext, createContext, JSX, createMemo, Accessor, createEffect } from "solid-js";
import { createStore } from "solid-js/store";
import s from './modal.module.scss';

const ModalContext = createContext<(el: any, useBlur: any) => readonly [Accessor<boolean>, (visible: boolean, blur?: any) => void]>();

export const useModalStore = () => useContext(ModalContext);

export const ModalStoreProvider = (props) => {
   const [store, setStore] = createStore({
      modal: null,
      useBlur: false,
      canHide: false,
   });


   function createModal(modal: () => JSX.Element, opt) {
      const isVisible = createMemo(() => store.modal === modal);

      function setVisible(visible) {
         if (!visible && store.modal !== modal) return;
         if (visible) setStore({ modal, ...opt });
         else setStore({ modal: null, useBlur: null, canHide: false });
      };
      return [isVisible, setVisible] as const;
   };


   return (
      <ModalContext.Provider value={createModal}>
         {props.children}
         <Show when={store.modal && store.useBlur}>
            <div class={s.blur} onClick={() => store.canHide ? setStore({ modal: null, useBlur: false }) : null} />
         </Show>
         <div class={s.modal}>
            {store.modal}
         </div>
      </ModalContext.Provider>
   );
};