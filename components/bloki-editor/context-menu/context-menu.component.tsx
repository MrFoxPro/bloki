import { createEffect, createMemo, onCleanup, onMount, Show } from "solid-js";
import cc from 'classcat';
import s from './context-menu.module.scss';

import DeleteIcon from './assets/delete.icon.svg';
import DuplicateIcon from './assets/duplicate.icon.svg';

import TitleIcon from './assets/title.icon.svg';
import RegularIcon from './assets/regular.icon.svg';
import Header1Icon from './assets/header1.icon.svg';
import Header2Icon from './assets/header2.icon.svg';
import Header3Icon from './assets/header3.icon.svg';
import DescriptionIcon from './assets/description.icon.svg';
import ImageIcon from './assets/image.icon.svg';
import CodeIcon from './assets/code.icon.svg';

import { useI18n } from '@solid-primitives/i18n';
import { useEditorStore } from "../editor.store";
import { BlockType } from "../types/blocks";
import { WSMsgType } from "@/lib/network.types";

type BlockContextMenuProps = {
};

export function BlockContextMenu(props: BlockContextMenuProps) {
   const [t] = useI18n();
   const [store, { setEditorStore, getAbsolutePosition, deleteBlock, send }] = useEditorStore();
   const pos = createMemo(() => getAbsolutePosition(store.editingBlock?.x ?? 0, store.editingBlock?.y ?? 0));

   function hideMe() {
      setEditorStore({
         showContextMenu: false
      });
   }

   function onChangeBlockClick(e: MouseEvent, type: BlockType) {
      setEditorStore('layout', store.layout.indexOf(store.editingBlock), 'type', type);
      send(WSMsgType.ChangeBlock, store.editingBlock);
   }

   createEffect(() => {
      if (store.editingType != null) {
         hideMe();
      }
   });

   // onMount(() => {
   //    document.addEventListener('click', hideMe);
   //    onCleanup(() => {
   //       document.removeEventListener('click', hideMe);
   //    });
   // });

   const items = [
      [BlockType.Title, <TitleIcon />, 'blocks.ctx-menu.item.text.title'],
      [BlockType.Regular, <RegularIcon />, 'blocks.ctx-menu.item.text.regular'],
      [BlockType.H1, <Header1Icon />, 'blocks.ctx-menu.item.text.header1'],
      [BlockType.H2, <Header2Icon />, 'blocks.ctx-menu.item.text.header2'],
      [BlockType.H3, <Header3Icon />, 'blocks.ctx-menu.item.text.header3'],
      [BlockType.Description, <DescriptionIcon />, 'blocks.ctx-menu.item.text.description'],
      [BlockType.Image, <ImageIcon />, 'blocks.ctx-menu.item.attachment.image'],
      [BlockType.Code, <CodeIcon />, 'blocks.ctx-menu.item.code'],
   ] as const;
   return (
      <Show when={store.showContextMenu && store.editingBlock}>
         <div
            class={s.ctxMenu}
            style={{
               transform: `translate(calc(${pos().x}px - 100% - 30px), ${pos().y}px)`
            }}
         >
            <div class={s.block}>
               <div class={s.name}>{t('blocks.ctx-menu.header.types')}</div>
               <div class={s.items}>

                  {/*@once*/items.map(([type, icon, name]) => (
                     <div
                        class={s.item}
                        classList={{ [s.highlighted]: store.editingBlock.type === type }}
                        onClick={(e) => onChangeBlockClick(e, type)}>
                        {icon}
                        <span class={s.text}>{t(name)}</span>
                     </div>
                  ))}
               </div>
            </div>
            <div class={s.block}>
               <div class={s.name}>{t('blocks.ctx-menu.header.actions')}</div>
               <div class={s.items}>
                  <div class={s.item}>
                     <DuplicateIcon />
                     <span class={s.text}>{t('blocks.ctx-menu.item.duplicate')}</span>
                  </div>
                  <div
                     class={cc([s.item, s.delete])}
                     onClick={() => {
                        deleteBlock(store.editingBlock);
                     }}
                  >
                     <DeleteIcon />
                     <span class={s.text}>{t('blocks.ctx-menu.item.delete')}</span>
                  </div>
               </div>
            </div>
         </div>
      </Show>
   );
}