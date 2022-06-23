import './context-menu.scss';

import { createEffect, createMemo, Show } from "solid-js";
import DeleteIcon from './assets/delete.svg';
import DuplicateIcon from './assets/duplicate.svg';

import TitleIcon from './assets/title.svg';
import RegularIcon from './assets/regular.svg';
import Header1Icon from './assets/header1.svg';
import Header2Icon from './assets/header2.svg';
import Header3Icon from './assets/header3.svg';
import DescriptionIcon from './assets/description.svg';
import ImageIcon from './assets/image.svg';
import CodeIcon from './assets/code.svg';

import { useEditorStore } from "../editor.store";
import { BlockType } from "../types/blocks";

type BlockContextMenuProps = {
};

export function BlockContextMenu(props: BlockContextMenuProps) {
   const [store, { setEditorStore, getAbsolutePosition, deleteBlock }] = useEditorStore();
   const pos = createMemo(() => getAbsolutePosition(store.editingBlock?.x ?? 0, store.editingBlock?.y ?? 0));

   function hideMe() {
      setEditorStore({
         showContextMenu: false
      });
   }

   function onChangeBlockClick(e: MouseEvent, type: BlockType) {
      setEditorStore('layout', store.layout.indexOf(store.editingBlock), 'type', type);
      // send(WSMsgType.ChangeBlock, store.editingBlock);
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
            class="ctx-menu"
            style={{
               transform: `translate(calc(${pos().x}px - 100% - 30px), ${pos().y}px)`
            }}
         >
            <div class="items-block">
               <div class="name">{'blocks.ctx-menu.header.types'}</div>
               <div class="items">

                  {/*@once*/items.map(([type, icon, name]) => (
                     <div
                        class="item"
                        classList={{ "highlighted": store.editingBlock.type === type }}
                        onClick={(e) => onChangeBlockClick(e, type)}>
                        {icon}
                        <span class="text">{name}</span>
                     </div>
                  ))}
               </div>
            </div>
            <div class="items-block">
               <div class="name">{'blocks.ctx-menu.header.actions'}</div>
               <div class="items">
                  <div class="item">
                     <DuplicateIcon />
                     <span class="text">{'blocks.ctx-menu.item.duplicate'}</span>
                  </div>
                  <div
                     class="item delete"
                     onClick={() => {
                        deleteBlock(store.editingBlock);
                     }}
                  >
                     <DeleteIcon />
                     <span class="text">{'blocks.ctx-menu.item.delete'}</span>
                  </div>
               </div>
            </div>
         </div>
      </Show>
   );
}
