import { batch, ComponentProps, createComputed, createEffect, createMemo, on, splitProps, untrack } from 'solid-js';
import measure from 'calculate-size';
import { TextBlock as TextBlockEntity } from '@/lib/entities';
import { useEditorStore } from '../../editor.store';
import s, { content } from './text.block.module.scss';
import { BlockTransform, Dimension } from '../../types';

type TextBlockProps = {
   block: TextBlockEntity;
} & ComponentProps<'div'>;

export function TextBlock(props: TextBlockProps) {
   const [editor, { setStore, getAbsoluteSize, getRelativeSize, gridBoxSize }] = useEditorStore();
   const [local, other] = splitProps(props, ['block']);
   let contentRef: HTMLDivElement;
   let blockAbsSize: Dimension;

   const isEditingContent = createMemo(() => editor.editingBlock === props.block && editor.editingType === 'content');

   createEffect(() => {
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
         if (!contentRef?.textContent.trimEnd() && contentRef?.lastElementChild?.tagName === 'BR') {
            contentRef.lastElementChild.remove();
         }
      }
   ));

   function onTextInput(e: InputEvent & { currentTarget: HTMLDivElement; }) {
      const text = contentRef.textContent;
      const { font, fontSize, fontWeight } = getComputedStyle(contentRef);
      const textSize = measure(text, {
         font: font, fontSize, fontWeight
      });
      // console.log(font, fontSize, fontWeight);
      // console.log('fake', textSize);
      batch(() => {
         const blockIndex = editor.document.blocks.indexOf(props.block);
         let newWidth = props.block.width;
         const dx = (blockAbsSize.width - textSize.width) / gridBoxSize();
         if (dx < 0.1) {
            newWidth += 1;
         }
         // if (textSize.width < blockAbsSize.width) {
         //    newWidth -= 1;
         // }
         // else {
         //    newWidth += 1;

         // }
         setStore('document', 'blocks', blockIndex, {
            width: newWidth,
            value: text,
         });
      });

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