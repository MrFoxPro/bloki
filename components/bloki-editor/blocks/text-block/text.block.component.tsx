import { ComponentProps, createEffect, createMemo, on, splitProps, untrack } from 'solid-js';
import { measureText } from './measure-text-dom';
import { TextBlock as TextBlockEntity } from '@/lib/entities';
import { useEditorStore } from '../../editor.store';
import s from './text.block.module.scss';
import { Dimension } from '../../types';

type TextBlockProps = {
   block: TextBlockEntity;
   onContentDimensionChange?(size: Dimension): void;
} & ComponentProps<'div'>;

export function TextBlock(props: TextBlockProps) {
   const [editor, { setStore, getAbsoluteSize, gridSize, gridBoxSize }] = useEditorStore();
   const [local, other] = splitProps(props, ['block']);

   let contentRef: HTMLDivElement;
   let blockAbsSize: Dimension;
   // const CONTENT_PADDING_LEFT = 0;
   // const CONTENT_PADDING_TOP = 0;
   // const LINE_HEIGHT = 20;
   // const FONT_SIZE = 16;

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

      let newWidth = props.block.width, newHeight = props.block.height;
      const { fontFamily, fontSize, fontWeight, lineHeight, wordBreak, paddingLeft, paddingTop } = getComputedStyle(contentRef);
      const boxWidth = gridSize(props.block.width) - parseInt(paddingLeft);

      if (props.block.width < editor.document.layoutOptions.mGridWidth) {
         const textSize = measureText(text, { fontFamily, fontSize, fontWeight });
         const requiredAbsWidth = textSize.width;
         const Δ = (requiredAbsWidth - boxWidth) / gridBoxSize();
         // console.log('Current abs width', currAbsContentWidth, 'Required abs width', requiredAbsWidth, 'abs delta', requiredAbsWidth - currAbsContentWidth, 'delta blocks', Δ);
         newWidth += Math.ceil(Δ);
      }

      const boxHeight = gridSize(props.block.height) - parseInt(paddingTop);
      const textSize = measureText(text, {
         fontFamily,
         fontSize,
         fontWeight,
         width: (boxWidth - parseInt(paddingLeft)) + 'px',
         lineHeight,
         wordBreak
      });
      const requiredAbsHeight = textSize.height - editor.document.layoutOptions.gap;
      if (requiredAbsHeight > 0) {
         const Δ = (requiredAbsHeight - boxHeight) / gridBoxSize();
         console.log('Height:', boxHeight, 'Required:', requiredAbsHeight, 'Delta:', requiredAbsHeight - boxHeight, 'Delta blocks:', Δ);
         newHeight += Math.ceil(Δ);
      }
      props.onContentDimensionChange && props.onContentDimensionChange({ width: newWidth, height: newHeight });

      setStore('document', 'blocks', editor.document.blocks.indexOf(props.block), {
         width: newWidth,
         height: newHeight,
         value: text,
      });
   }

   function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter') {
         // e.preventDefault();
      }
   }
   return (
      <div
         style={{
            // 'word-break': 'break-word',
            // 'white-space': 'normal',

            // "padding-left": CONTENT_PADDING_LEFT + 'px',
            // "padding-top": CONTENT_PADDING_TOP + 'px',
            // "line-height": LINE_HEIGHT + 'px',
            // "font-size": FONT_SIZE + 'px',
            // "user-select": props.isMeResizing ? 'none' : 'initial'
         }}
         onKeyDown={onKeyDown}
         classList={{ [s.content]: true, [s.regular]: true }}
         data-placeholder={!props.block.value ? "Type '/' for commands" : null}
         contentEditable={isEditingContent()}
         ref={contentRef}
         onInput={onTextInput}
         {...other}
      >{untrack(() => props.block.value)}</div>
   );
}