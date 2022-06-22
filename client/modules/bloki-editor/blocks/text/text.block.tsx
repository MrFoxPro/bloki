import './text.block.scss';
import { ComponentProps, createComputed, createEffect, createMemo, on, onMount, splitProps, untrack } from 'solid-js';
import { TextBlock as TextBlockEntity } from '../../types/blocks';
import { useEditorStore } from '../../editor.store';
import { Dimension } from '../../types/blocks';
import { TextBlockFontFamily, TextTypes } from './types';
import { getTextBlockSize, measurer } from './helpers';
import { CommonContentProps, useBlockContext } from '../base.block';

type TextBlockProps = {
} & CommonContentProps;

export function TextBlock(props: TextBlockProps) {
   const [editor, { setEditorStore, gridSize, checkPlacement }] = useEditorStore();
   const [blockState, { isMeOverflowing, block, isEditingContent }] = useBlockContext<TextBlockEntity>();

   let contentRef: HTMLDivElement;
   let minTextWidth = 0;
   let textHeightAtMinWidth = 0;

   createComputed(() => {
      minTextWidth = gridSize(5);
   });

   createEffect(() => {
      if (isEditingContent()) {
         contentRef.focus();
      }
   });

   createEffect(on(
      () => block.type,
      () => {
         if (block.type == null) return;
         const size = getTextBlockSize(block.type, block.fontFamily, block.value, editor.document.layoutOptions, block.width, 'break-word');
         setEditorStore('layout', editor.layout.indexOf(block), {
            height: size.height,
         });
      })
   );

   createEffect(on(
      () => block.value,
      () => {
         if (!contentRef) return;
         if (!contentRef.textContent.trimEnd() && contentRef.lastElementChild?.tagName === 'BR') {
            contentRef.lastElementChild.remove();
         }
         measurer.setOptions({
            overflowWrap: 'anywhere'
         });
         const minimals = measurer.measureText(block.value, 'min-content', 'min-content');
         minTextWidth = minimals.width;
         textHeightAtMinWidth = minimals.height;
      }
   ));
   const textSettings = createMemo(() => TextTypes[block.type]);
   function getContentDimension(transform: Dimension) {
      if (transform.width < minTextWidth) {
         transform.width = minTextWidth;
         transform.height = textHeightAtMinWidth;
         return transform;
      }
      const widthPx = transform.width + 'px';
      measurer.setOptions({
         fontFamily: block.fontFamily ?? TextBlockFontFamily.Inter,
         fontSize: textSettings().fontSize + 'px',
         lineHeight: textSettings().lineHeight + 'px',
         fontWeight: textSettings().fontWeight + 'px',
      });
      const dimension = measurer.measureText(block.value, widthPx);
      return dimension;
   }

   onMount(() => {
      // (props.ref as any).getContentDimension = getContentDimension;
      props.wrapGetContentDimension(getContentDimension);
   });

   createEffect(on(() => block.value,
      () => {
         if (!contentRef) return;
         if (contentRef.textContent !== block.value) {
            contentRef.textContent = block.value;
         }
      }));
   function onTextInput(e: Event, pasteContent: string = null) {
      const mGridWidth = editor.document.layoutOptions.mGridWidth;
      // check if key is affecting content?
      const text = contentRef.textContent + (pasteContent || '');

      if (text === '' && block.width >= mGridWidth) {
         const boundSize = getTextBlockSize(block.type, block.fontFamily, text, editor.document.layoutOptions);

         setEditorStore('layout', editor.layout.indexOf(block), {
            width: mGridWidth,
            height: boundSize.height,
            value: text,
         });
         // send(WSMsgType.ChangeBlock, unwrap(block));
         return;
      }

      let maxWidth = block.width;
      if (maxWidth < mGridWidth) maxWidth = mGridWidth;

      const boundSize = getTextBlockSize(block.type, block.fontFamily, text, editor.document.layoutOptions, maxWidth, 'break-word');

      let newWidth = boundSize.width;
      if (block.width === mGridWidth) {
         newWidth = mGridWidth;
      }
      let newHeight = boundSize.height;
      if (block.height > newHeight) newHeight = block.height;

      const { correct } = checkPlacement(block, block.x, block.y, newWidth, newHeight);
      if (!correct) {
         e.preventDefault();
         console.log('cant type more');
         contentRef.textContent = block.value;
         return;
      }
      if (pasteContent) {
         document.execCommand("insertHTML", false, pasteContent);
      }

      setEditorStore('layout', editor.layout.indexOf(block), {
         width: newWidth,
         height: newHeight,
         value: text,
      });
      // send(WSMsgType.ChangeBlock, unwrap(block));
   }

   function onPaste(e: ClipboardEvent) {
      e.stopPropagation();
      e.preventDefault();
      var text = e.clipboardData.getData('text/plain');
      onTextInput(e, text);
      return false;
   }

   return (
      <div
         class="content"
         style={{
            "font-family": block.fontFamily ?? TextBlockFontFamily.Inter,
            "font-size": textSettings().fontSize + 'px',
            "font-weight": textSettings().fontWeight,
            "line-height": textSettings().lineHeight + 'px',
         }}
         classList={{
            "show-placeholder": !block.value && blockState.transform.width / gridSize(1) > 7,
            "overflowing": isMeOverflowing()
         }}
         data-placeholder={"blocks.text.placeholder"}
         contentEditable={isEditingContent()}
         ref={contentRef}
         onInput={onTextInput}
         // onKeyDown={onKeyDown}
         onPaste={onPaste}
      >{untrack(() => block.value)}</div>
   );
}
