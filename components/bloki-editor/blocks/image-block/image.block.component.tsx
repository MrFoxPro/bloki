import { ComponentProps, createMemo, splitProps } from 'solid-js';
import { ImageBlock as ImageBlockEntity } from '@/lib/entities';
import { useEditorStore } from '../../editor.store';
import s from './image.block.module.scss';
import { contentBlockProps, ContentBlockProps } from '../types';

type ImageBlockProps = ContentBlockProps<ImageBlockEntity> & {
} & ComponentProps<'img'>;

export function ImageBlock(props: ImageBlockProps) {
   const [editor, { setStore, getAbsoluteSize, gridSize, gridBoxSize }] = useEditorStore();
   const [local, other] = splitProps(props, contentBlockProps);

   let imgRef: HTMLImageElement;

   const isEditingContent = createMemo(() => editor.editingBlock === props.block && editor.editingType === 'content');

   function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter') {
         // e.preventDefault();
      }
   }

   // function onPaste(e: ClipboardEvent) {
   //    e.preventDefault();
   //    let data = e.clipboardData.getData('text');
   //    if (data) {

   //       props.block.value += data;
   //    }
   // }

   return (
      <img
         src={props.block.src}
         class={s.content}
         onKeyDown={onKeyDown}
         classList={{ [s.changing]: props.isMeResizing || props.isMeDragging }}
         ref={imgRef}
         // onPaste={onPaste}
         {...other}
      />
   );
}