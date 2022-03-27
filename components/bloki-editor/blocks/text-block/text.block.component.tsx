import { ComponentProps, createEffect, createMemo, on, splitProps, untrack } from 'solid-js';
import { measureText } from './measure-text';
import { TextBlock as TextBlockEntity } from '@/lib/entities';
import { useEditorStore } from '../../editor.store';
import s from './text.block.module.scss';
import { Dimension } from '../../types';

type TextBlockProps = {
   block: TextBlockEntity;
} & ComponentProps<'div'>;

export function TextBlock(props: TextBlockProps) {
   const [editor, { setStore, getAbsoluteSize, getRelativeSize, gridSize, gridBoxSize }] = useEditorStore();
   const [local, other] = splitProps(props, ['block']);

   let contentRef: HTMLDivElement;
   let blockAbsSize: Dimension;
   const CONTENT_PADDING_LEFT = 2;

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

      const { fontFamily, fontSize, fontWeight } = getComputedStyle(contentRef);
      const textSize = measureText(text, { fontFamily, fontSize, fontWeight });

      const currAbsContentWidth = gridSize(props.block.width) - CONTENT_PADDING_LEFT;
      const requiredAbsWidth = textSize.width;
      let newWidth = props.block.width;

      const Δ = (requiredAbsWidth - currAbsContentWidth) / gridBoxSize();
      // console.log('Current abs width', currAbsContentWidth, 'Required abs width', requiredAbsWidth, 'abs delta', requiredAbsWidth - currAbsContentWidth, 'delta blocks', Δ);
      newWidth += Math.ceil(Δ);

      setStore('document', 'blocks', editor.document.blocks.indexOf(props.block), {
         width: newWidth,
         value: text,
      });
   }

   return (
      <div
         style={{
            // 'word-break': 'break-word',
            // 'white-space': 'normal',
            "padding-left": CONTENT_PADDING_LEFT + 'px',
            "padding-top": '2px'
         }}
         classList={{ [s.content]: true, [s.regular]: true }}
         data-placeholder={!props.block.value ? "Type '/' for commands" : null}
         contentEditable={isEditingContent()}
         ref={contentRef}
         onInput={onTextInput}
         {...other}
      >{untrack(() => props.block.value)}</div>
   );
}