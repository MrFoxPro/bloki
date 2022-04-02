import { ComponentProps, splitProps } from 'solid-js';
import { ImageBlock as ImageBlockEntity } from '@/components/bloki-editor/types';
import s from './image.block.module.scss';
import { useBlockStore } from '../block.store';

type ImageBlockProps = {
} & ComponentProps<'img'>;

export function ImageBlock(props: ImageBlockProps) {
   const [, { shadowed, block, isMeResizing, isMeDragging }] = useBlockStore<ImageBlockEntity>();
   const [local, other] = splitProps(props, []);

   let imgRef: HTMLImageElement;

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
         src={block.src}
         class={s.content}
         onKeyDown={onKeyDown}
         classList={{ [s.changing]: isMeResizing() || isMeDragging(), [s.shadowed]: shadowed }}
         ref={imgRef}
         // onPaste={onPaste}
         {...other}
      />
   );
}