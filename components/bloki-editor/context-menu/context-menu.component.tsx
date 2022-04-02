import { createEffect, createMemo, onCleanup, onMount, Show } from "solid-js";
import cc from 'classcat';
import s from './context-menu.module.scss';

import DeleteIcon from './assets/delete.icon.svg';
import DuplicateIcon from './assets/duplicate.icon.svg';
import TransformIcon from './assets/transform.icon.svg';

import { useI18n } from '@solid-primitives/i18n';
import { useEditorStore } from "../editor.store";

type BlockContextMenuProps = {
};

export function BlockContextMenu(props: BlockContextMenuProps) {
   const [t] = useI18n();
   const [store, { setStore, getAbsolutePosition, deleteBlock }] = useEditorStore();
   const pos = createMemo(() => getAbsolutePosition(store.editingBlock?.x ?? 0, store.editingBlock?.y ?? 0));

   function hideMe() {
      setStore({
         showContextMenu: false
      });
   }

   createEffect(() => {
      if (store.editingType != null) {
         hideMe();
      }
   });

   onMount(() => {
      document.addEventListener('click', hideMe);
      onCleanup(() => document.removeEventListener('click', hideMe));
   });

   return (
      <Show when={store.showContextMenu && store.editingBlock}>
         <div
            class={s.ctxMenu}
            style={{
               transform: `translate(calc(${pos().x}px - 100% - 30px), ${pos().y}px)`
            }}
            onFocusOut={() => console.log('ctx menu blur')}
         >
            <div class={s.items}>
               <div class={s.item}>
                  <TransformIcon />
                  <span>{t('blocks.ctx-menu.item.transform')}</span>
               </div>
               <div class={s.item}>
                  <DuplicateIcon />
                  <span>{t('blocks.ctx-menu.item.duplicate')}</span>
               </div>
               <div
                  class={cc([s.item, s.delete])}
                  onClick={() => {
                     deleteBlock(store.editingBlock);
                  }}
               >
                  <DeleteIcon />
                  <span>{t('blocks.ctx-menu.item.delete')}</span>
               </div>
            </div>
         </div>
      </Show>
   );
}