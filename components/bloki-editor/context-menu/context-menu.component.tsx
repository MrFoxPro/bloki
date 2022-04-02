import { createMemo, Show } from "solid-js";
import cc from 'classcat';
import s from './context-menu.module.scss';

import DeleteIcon from './assets/delete.icon.svg';
import DuplicateIcon from './assets/duplicate.icon.svg';
import TransformIcon from './assets/transform.icon.svg';

import { useI18n } from '@solid-primitives/i18n';
import { AnyBlock } from "../types";
import { useEditorStore } from "../editor.store";

type BlockContextMenuProps = {
   blockToShow?: AnyBlock;
};

export function BlockContextMenu(props: BlockContextMenuProps) {
   const [t] = useI18n();
   const [store, { getAbsolutePosition }] = useEditorStore();

   const pos = createMemo(() => props.blockToShow && getAbsolutePosition(props.blockToShow.x, props.blockToShow.y));
   return (
      <Show when={props.blockToShow}>
         <div
            class={s.ctxMenu}
            style={{
               transform: `translate(calc(${pos().x}px - 100% - 30px), ${pos().y}px)`
            }}
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
                  onClick={() => { }}
                  class={cc([s.item, s.delete])}
               >
                  <DeleteIcon />
                  <span>{t('blocks.ctx-menu.item.delete')}</span>
               </div>
            </div>
         </div>
      </Show>
   );
}