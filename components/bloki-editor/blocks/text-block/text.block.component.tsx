import { ComponentProps, createEffect, createMemo, on, onMount, splitProps, untrack } from 'solid-js';
import cc from 'classcat';
import { TextBlock as TextBlockEntity } from '@/lib/entities';
import { useEditorStore } from '../../editor.store';
import s from './text.block.module.scss';
import { Dimension } from '../../types';
import { contentBlockProps, ContentBlockProps } from '../types';
import { DOMTextMeasurer } from './measure-text-dom';

const textMeasurer = new DOMTextMeasurer();

type TextBlockProps = ContentBlockProps<TextBlockEntity> & {
} & ComponentProps<'div'>;

export function TextBlock(props: TextBlockProps) {
   const [editor, { setStore, gridSize, gridBoxSize }] = useEditorStore();
   const [local, other] = splitProps(props, contentBlockProps);

   if (props.shadowed) {
      return (
         <div
            class={cc([s.content, s.regular, s.shadow])}
            {...other}
         >{untrack(() => props.block.value)}</div>
      );
   }

   let contentRef: HTMLDivElement;
   let minTextWidth = 0;
   let textHeightAtMinWidth = 0;

   const isEditingContent = createMemo(() => editor.editingBlock === props.block && editor.editingType === 'content');

   createEffect(() => {
      if (isEditingContent()) {
         contentRef.focus();
         const { fontFamily, fontSize, fontWeight, lineHeight, wordBreak } = getComputedStyle(contentRef);
         textMeasurer.setOptions({ fontFamily, fontSize, fontWeight, lineHeight, wordBreak });
         textMeasurer.ruler.textContent = props.block.value;
      }
   });

   createEffect(on(
      () => props.block.value,
      () => {
         if (!contentRef) return;
         if (!contentRef.textContent.trimEnd() && contentRef.lastElementChild?.tagName === 'BR') {
            contentRef.lastElementChild.remove();
         }
         const minimals = textMeasurer.measureText(props.block.value, 'min-content');
         minTextWidth = minimals.width;
         textHeightAtMinWidth = minimals.height;
      }
   ));

   function getContentDimension(transform: Dimension) {
      if (transform.width < minTextWidth) {
         transform.width = minTextWidth;
         transform.height = textHeightAtMinWidth;
         return transform;
      }
      const widthPx = transform.width + 'px';
      const dimension = textMeasurer.measureText(props.block.value, widthPx);
      return dimension;
   }

   onMount(() => {
      props.setGetContentDimension && props.setGetContentDimension(getContentDimension);
   });

   function onTextInput(e: InputEvent & { currentTarget: HTMLDivElement; }) {
      const text = contentRef.textContent;
      let newWidth = props.block.width, newHeight = props.block.height;
      const { paddingLeft, paddingTop } = getComputedStyle(contentRef);
      const boxWidth = gridSize(props.block.width) - parseInt(paddingLeft);

      if (props.block.width < editor.document.layoutOptions.mGridWidth) {
         const textSize = textMeasurer.measureText(text, 'auto');
         const requiredAbsWidth = textSize.width;
         const Δ = (requiredAbsWidth - boxWidth) / gridBoxSize();
         // console.log('Current abs width', currAbsContentWidth, 'Required abs width', requiredAbsWidth, 'abs delta', requiredAbsWidth - currAbsContentWidth, 'delta blocks', Δ);
         newWidth += Math.floor(Δ);
      }

      const boxHeight = gridSize(props.block.height) - parseInt(paddingTop);

      const textSize = textMeasurer.measureText(text, boxWidth + 'px');
      const requiredAbsHeight = textSize.height - editor.document.layoutOptions.gap;
      if (requiredAbsHeight > 0) {
         const Δ = (requiredAbsHeight - boxHeight) / gridBoxSize();
         console.log('Height:', boxHeight, 'Required:', requiredAbsHeight, 'Delta:', requiredAbsHeight - boxHeight, 'Delta blocks:', Δ);
         newHeight += Math.ceil(Δ);
      }

      setStore('document', 'blocks', editor.document.blocks.indexOf(props.block), {
         width: newWidth,
         height: newHeight,
         value: text,
      });
   }

   function onPaste(e: ClipboardEvent) {
      e.stopPropagation();
      e.preventDefault();
      var text = e.clipboardData.getData('text/plain');
      document.execCommand("insertHTML", false, text);
      onTextInput(null);
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
         classList={{
            [s.content]: true,
            [s.regular]: true,
            [s.showPlaceholder]: !props.block.value && props.localTransform.width / gridSize(1) > 7,
            [s.overflowing]: props.isMeOverflowing
         }}
         data-placeholder={"Type '/' for commands"}
         contentEditable={isEditingContent()}
         ref={contentRef}
         onInput={onTextInput}
         onPaste={onPaste}
         {...other}
      >{untrack(() => props.block.value)}</div>
   );
}