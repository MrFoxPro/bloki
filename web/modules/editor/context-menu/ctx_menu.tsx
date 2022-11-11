// import './ctx_menu.css'

import { createEffect, createMemo, Show } from 'solid-js'
import DeleteIcon from './assets/delete.svg'
import DuplicateIcon from './assets/duplicate.svg'

import TitleIcon from './assets/title.svg'
import RegularIcon from './assets/regular.svg'
import Header1Icon from './assets/header1.svg'
import Header2Icon from './assets/header2.svg'
import Header3Icon from './assets/header3.svg'
import DescriptionIcon from './assets/description.svg'
import ImageIcon from './assets/image.svg'
import CodeIcon from './assets/code.svg'

import { BlockType } from '../misc'
import { useEditorContext } from '../toolbox/editor.store'

type BlockContextMenuProps = {}

export function BlockContextMenu(props: BlockContextMenuProps) {
   const { editor, getAbsPos, deleteBlock, setEditorStore } = useEditorContext()
   const pos = createMemo(() => getAbsPos(editor.editingBlock?.x ?? 0, editor.editingBlock?.y ?? 0))

   function hideMe() {
      setEditorStore({
         showContextMenu: false,
      })
   }

   function onChangeBlockClick(e: MouseEvent, type: BlockType) {
      setEditorStore('layout', editor.layout.indexOf(editor.editingBlock), 'type', type)
      // send(WSMsgType.ChangeBlock, editor.editingBlock);
   }

   createEffect(() => {
      if (editor.editingType != null) {
         hideMe()
      }
   })

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
   ] as const
   return (
      <Show when={editor.showContextMenu && editor.editingBlock}>
         <div
            class="ctx-menu"
            style={{
               transform: `translate(calc(${pos().x}px - 100% - 30px), ${pos().y}px)`,
            }}
         >
            <div class="items-block">
               <div class="name">{'blocks.ctx-menu.header.types'}</div>
               <div class="items">
                  {
                     /*@once*/ items.map(([type, icon, name]) => (
                        <div
                           class="item"
                           classList={{ highlighted: editor.editingBlock.type === type }}
                           onClick={(e) => onChangeBlockClick(e, type)}
                        >
                           {icon}
                           <span class="text">{name}</span>
                        </div>
                     ))
                  }
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
                        deleteBlock(editor.editingBlock)
                     }}
                  >
                     <DeleteIcon />
                     <span class="text">{'blocks.ctx-menu.item.delete'}</span>
                  </div>
               </div>
            </div>
         </div>
      </Show>
   )
}
