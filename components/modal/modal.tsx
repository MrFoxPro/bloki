import { createSignal, Show, useContext, createContext, createEffect, JSX } from "solid-js";
import { createStore } from "solid-js/store";
import s from './modal.module.scss';

const ModalContext = createContext([
   {
      modalComponent: null as () => JSX.Element,
      blur: false as boolean,
   },
   (com: () => JSX.Element, b?: boolean) => void 0
] as const);

const useModalStore = () => useContext(ModalContext);

export const ModalStoreProvider = (props) => {
   const [store, setStore] = createStore({
      modalComponent: null,
      blur: false
   });
   const setModal = (modalComponent, blur) => setStore({ modalComponent, blur });
   const context = [store.modalComponent, setModal] as const;
   return (
      <ModalContext.Provider value={context}>
         {props.children}
         <Show when={store.blur && store.modalComponent}>
            <div class={s.blur} />
         </Show>
         <Show when={store.modalComponent}>
            {store.modalComponent}
         </Show>
      </ModalContext.Provider>
   );
};

export const useModal = (el, blur = false) => {
   const [show, setShow] = createSignal(false);
   const [, setModal] = useModalStore();

   const component = () => (
      <div class={s.modal}>{el()}</div>
   );

   createEffect(() => {
      if (show()) setModal(component, blur);
      else setModal(null, blur);
   });
   return [
      component,
      setShow
   ] as const;
};

