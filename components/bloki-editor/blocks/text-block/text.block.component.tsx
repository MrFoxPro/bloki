import { ComponentProps, createComputed, createEffect, createMemo, on, splitProps, untrack } from 'solid-js';
import measure from 'calculate-size';
import { TextBlock as TextBlockEntity } from '@/lib/entities';
import { useEditorStore } from '../../editor.store';
import s from './text.block.module.scss';
import { BlockTransform, Dimension } from '../../types';

type TextBlockProps = {
   block: TextBlockEntity;
} & ComponentProps<'div'>;

export function TextBlock(props: TextBlockProps) {
   const [editor, { setStore, getAbsoluteSize }] = useEditorStore();
   const [local, other] = splitProps(props, ['block']);
   let contentRef: HTMLDivElement;
   let blockAbsSize: Dimension;

   const isEditingContent = createMemo(() => editor.editingBlock === props.block && editor.editingType === 'content');

   createComputed(() => {
      blockAbsSize = getAbsoluteSize(props.block.width, props.block.height);
   });

   createEffect(() => {
      if (isEditingContent()) {
         contentRef.focus();
      }
   });

   createEffect(on(
      () => props.block.value,
      () => {
         if (!contentRef) return;
         if (!contentRef.textContent.trimEnd() && contentRef.lastElementChild?.tagName === 'BR') {
            contentRef.lastElementChild.remove();
         }
      }
   ));

   function onTextInput(e: InputEvent & { currentTarget: HTMLDivElement; }) {
      const text = e.currentTarget.textContent;
      const { font, fontSize, fontWeight } = e.currentTarget.style;
      const textSize = measure(text, {
         font, fontSize, fontWeight
      });
      if (textSize.width > blockAbsSize.width || textSize.height > blockAbsSize.height) {
         console.log('shiet', textSize.width, blockAbsSize.width, textSize.height, blockAbsSize.height);
      }
      setStore('document', 'blocks', editor.document.blocks.indexOf(props.block), 'value', text);
   }

   return (
      <div
         style={{
            // 'word-break': 'break-word',
            // 'white-space': 'normal',
         }}
         classList={{ [s.content]: true, [s.regular]: true }}
         data-placeholder={!props.block.value ? "Type '/' for commands" : null}
         contentEditable={isEditingContent()}
         ref={contentRef}
         onInput={onTextInput}
         {...other}
      >
         {untrack(() => props.block.value)}
      </div >
   );
}