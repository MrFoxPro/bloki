import { ComponentProps, createMemo, splitProps } from 'solid-js';
import { ImageBlock as ImageBlockEntity } from '@/lib/entities';
import { useEditorStore } from '../../editor.store';
import s from './image.block.module.scss';
import { Dimension } from '../../types';

type ImageBlockProps = {
   block: ImageBlockEntity;
   onContentDimensionChange?(size: Dimension): void;
} & ComponentProps<'div'>;

export function ImageBlock(props: ImageBlockProps) {
   const [editor, { setStore, getAbsoluteSize, gridSize, gridBoxSize }] = useEditorStore();
   const [local, other] = splitProps(props, ['block', 'onContentDimensionChange']);

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
         // classList={{ [s.content]: true, [s.regular]: true }}
         ref={imgRef}
         // onPaste={onPaste}
         {...other}
      />
   );
}