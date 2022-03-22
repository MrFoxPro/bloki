import { TextBlock as TextBlockEntity } from '@/lib/entities';
import { ComponentProps, createEffect, createMemo, on, splitProps, untrack } from 'solid-js';
import { useEditorStore } from '../../editor.store';
import s from './text.block.module.scss';

type TextBlockProps = {
   block: TextBlockEntity;
} & ComponentProps<'div'>;

export function TextBlock(props: TextBlockProps) {
   const [editor, { setStore }] = useEditorStore();
   const [local, other] = splitProps(props, ['block']);
   let contentRef: HTMLDivElement;

   const isEditingContent = createMemo(() => editor.editingBlock === props.block && editor.editingType === 'content');
   createEffect(() => {
      if (isEditingContent()) {
         contentRef.focus();
      }
   });

   createEffect(on(
      () => props.block.value,
      () => {
         if (!contentRef) return;
         if (contentRef.lastElementChild?.tagName === 'BR') {
            contentRef.lastElementChild.remove();
         }
      }
   ));
   return (
      <div
         classList={{ [s.content]: true, [s.regular]: true }}
         placeholder={!props.block.value ? "Type '/' for commands" : null}
         contentEditable={isEditingContent()}
         ref={contentRef}
         onInput={(e) => {
            setStore('document', 'blocks', editor.document.blocks.indexOf(props.block), 'value', e.currentTarget.textContent);
         }}
         {...other}
      >
         {untrack(() => props.block.value)}
      </div >
   );
}