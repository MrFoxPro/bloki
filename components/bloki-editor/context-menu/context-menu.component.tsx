import { createEffect, createMemo, onCleanup, onMount, Show } from "solid-js";
import cc from 'classcat';
import s from './context-menu.module.scss';

import DeleteIcon from './assets/delete.icon.svg';
import DuplicateIcon from './assets/duplicate.icon.svg';
import TransformIcon from './assets/transform.icon.svg';

import TitleIcon from './assets/title.icon.svg';
import RegularIcon from './assets/regular.icon.svg';
import Header1Icon from './assets/header1.icon.svg';
import Header2Icon from './assets/header2.icon.svg';
import Header3Icon from './assets/header3.icon.svg';
import DescriptionIcon from './assets/description.icon.svg';

import ImageIcon from './assets/image.icon.svg';

import { useI18n } from '@solid-primitives/i18n';
import { useEditorStore } from "../editor.store";
import { BlockType } from "../types";

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

   function onChangeBlockClick(e: MouseEvent, type: BlockType) {
      setStore('document', 'blocks', store.document.blocks.indexOf(store.editingBlock), 'type', type);
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

   const items = [
      [BlockType.Title, <TitleIcon />, 'blocks.ctx-menu.item.text.title'],
      [BlockType.Regular, <RegularIcon />, 'blocks.ctx-menu.item.text.regular'],
      [BlockType.H1, <Header1Icon />, 'blocks.ctx-menu.item.text.header1'],
      [BlockType.H2, <Header2Icon />, 'blocks.ctx-menu.item.text.header2'],
      [BlockType.H3, <Header3Icon />, 'blocks.ctx-menu.item.text.header3'],
      [BlockType.Description, <DescriptionIcon />, 'blocks.ctx-menu.item.text.description'],
      [BlockType.Image, <ImageIcon />, 'blocks.ctx-menu.item.attachment.image'],
   ] as const;

   return (
      <Show when={store.showContextMenu && store.editingBlock}>
         <div
            class={s.ctxMenu}
            style={{
               transform: `translate(calc(${pos().x}px - 100% - 30px), ${pos().y}px)`
            }}
         >
            <div class={s.items}>
               <div class={s.name}>{t('blocks.ctx-menu.header.types')}</div>
               {/*@once*/items.map(([type, icon, name]) => (
                  <div class={s.item} onClick={(e) => onChangeBlockClick(e, type)}>
                     {icon}
                     <span>{t(name)}</span>
                  </div>
               ))}
            </div>
            <div class={s.items}>
               <div class={s.name}>{t('blocks.ctx-menu.header.actions')}</div>
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