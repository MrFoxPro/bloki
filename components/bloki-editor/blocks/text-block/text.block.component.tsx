import { TextBlock as TextBlockEntity } from '@/lib/entities';
import { ComponentProps, createEffect, createSignal, on, onMount, splitProps, untrack } from 'solid-js';
import { useEditorStore } from '../../editor.store';
import s from './text.block.module.scss';

type TextBlockProps = {
   block: TextBlockEntity;
} & ComponentProps<'div'>;

export function TextBlock(props: TextBlockProps) {
   const [editor, { onTextBlockClick, setStore }] = useEditorStore();
   const [local, other] = splitProps(props, ['block']);
   let contentRef: HTMLDivElement;

   createEffect(() => {
      if (editor.draggingBlock === props.block) {
         contentRef.blur();
      }
   });
   createEffect(on(() => props.block.value, () => {
      // if (!contentRef) return;
      // if (contentRef.lastElementChild?.tagName === 'BR') {
      //    console.log('removing');
      //    contentRef.lastElementChild.remove();
      // }
   }));
   return (
      <div
         classList={{ [s.content]: true, [s.regular]: true }}
         onClick={(e) => {
            onTextBlockClick(props.block);
         }}
         placeholder={!props.block.value ? "Type '/' for commands" : null}
         contentEditable={true}
         ref={contentRef}
         onInput={(e) => {
            setStore('document', 'blocks', editor.document.blocks.indexOf(props.block), 'value', e.currentTarget.textContent);
         }}
         {...other}
      >
         {untrack(() => props.block.value)}
      </div>
   );
}