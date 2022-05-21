import { ComponentProps, createComputed, createEffect, createMemo, on, onCleanup, onMount, untrack } from 'solid-js';
import cc from 'classcat';
import { Dimension, TextBlock as TextBlockEntity } from '../../types/blocks';
import { useEditorStore } from '../../editor.store';
import s from './text.block.module.scss';
import { TextBlockFontFamily, TextTypes } from './types';
import { useI18n } from '@solid-primitives/i18n';
import { useBlockStore } from '../block.store';
import { WSMsgType } from '@/lib/network.types';
import { unwrap } from 'solid-js/store';
import { createTextBlockResizeHelper, getCurrentCursorPosition, getTextOneLineHeight, HeightMargins, setCurrentCursorPosition } from './helpers';

type TextBlockProps = {
} & ComponentProps<'div'>;

export function TextBlock(props: TextBlockProps) {
   const [editor, { setEditorStore, gridSize, checkPlacement, send, staticEditorData }] = useEditorStore();
   const [blockStore, { isMeOverflowing, shadowed, block, blockData, isEditingContent }] = useBlockStore<TextBlockEntity>();

   if (shadowed) {
      const textSettings = TextTypes[block.type];
      return (
         <div
            class={cc([s.content, s.shadow])}
            style={{
               "font-family": block.fontFamily ?? TextBlockFontFamily.Inter,
               "font-size": textSettings.fontSize + 'px',
               "font-weight": textSettings.fontWeight,
               "line-height": textSettings.lineHeight + 'px',
            }}
            innerHTML={untrack(() => block.value)}
            {...props}
         />
      );
   }

   const [t] = useI18n();

   let contentRef: HTMLDivElement;
   let minTextWidth = 0;
   let textHeightAtMinWidth = 0;
   let widthWasChanged = false;
   let lastCaretPos = 0;

   const textSettings = createMemo(() => TextTypes[block.type]);
   const getTextBlockSize = createTextBlockResizeHelper(editor.document.layoutOptions);

   blockData.getContentDimension = function getContentDimension(transform: Dimension) {
      const dimension = getTextBlockSize(block, block.value, {
         maxWidth: transform.width + 'px',
         minWidth: gridSize(5) + 'px'
      });
      return { width: gridSize(dimension.width), height: gridSize(dimension.height) };
   };

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
         const maxWidth = gridSize(block.width);
         const size = getTextBlockSize(block, block.value, {
            maxWidth: maxWidth + 'px',
            height: 'auto',
         });
         size.height += HeightMargins[block.type] ?? 0;
         setEditorStore('layout', editor.layout.indexOf(block), {
            height: size.height,
         });
      })
   );

   createEffect(on(
      () => blockStore.transform.width,
      () => {
         widthWasChanged = true;
         console.log('Width was changed');
      },
      { defer: true })
   );
   createEffect(on(
      () => block.value,
      () => {
         if (!contentRef) return;
         if (contentRef.innerHTML !== block.value) {
            contentRef.innerHTML = block.value;
            trimContent(contentRef);
         }
         const { mGridWidth } = editor.document.layoutOptions;

         let maxWidth = gridSize(Math.min(block.width, mGridWidth));

         const minimals = getTextBlockSize(block, block.value.trim(), {
            maxWidth: gridSize(maxWidth) + 'px',
         });
         minTextWidth = minimals.width;
         textHeightAtMinWidth = minimals.height;
      })
   );


   function trimContent(node: HTMLElement) {
      if (node.lastElementChild?.tagName === 'BR') {
         node.lastElementChild.remove();
      }
   }

   function onClick() {
      lastCaretPos = getCurrentCursorPosition(contentRef);
   }
   function onTextInput(e: Event, pasteContent = null) {
      const { mGridWidth } = editor.document.layoutOptions;
      // check if key is affecting content?
      if (pasteContent) {
         document.execCommand("insertHTML", false, pasteContent);
      }
      trimContent(contentRef);
      const text = contentRef.textContent.trim();

      const html = contentRef.innerHTML.trim();

      let newWidth: number;
      let newHeight: number;
      if (text === '') {
         newWidth = mGridWidth;
         newHeight = getTextOneLineHeight(block.type, editor.document.layoutOptions.size) + HeightMargins[block.type] ?? 0;
      }
      else {
         let maxWidth = !widthWasChanged ? gridSize(Math.min(block.width, mGridWidth)) : gridSize(Math.max(block.width, 5));

         const boundSize = getTextBlockSize(block, html, {
            maxWidth: maxWidth + 'px',
            height: 'auto',
         });

         newWidth = text === '' ? mGridWidth : boundSize.width;
         if (newWidth !== mGridWidth && block.width === mGridWidth) {
            newWidth = mGridWidth;
         }
         newHeight = boundSize.height;
      }
      // if (block.height > newHeight) newHeight = block.height;

      const placement = checkPlacement(block, block.x, block.y, newWidth, newHeight);
      if (!placement.correct) {
         e.preventDefault();
         staticEditorData.emit('customhighlight', block, placement);
         console.warn('No more space');
         contentRef.innerHTML = block.value;
         setCurrentCursorPosition(lastCaretPos, contentRef);
         return;
      }

      lastCaretPos = getCurrentCursorPosition(contentRef);
      setEditorStore('layout', editor.layout.indexOf(block), {
         width: newWidth,
         height: newHeight,
         value: html,
      });
      send(WSMsgType.ChangeBlock, unwrap(block));
   }

   // function onKeyDown(e: KeyboardEvent){
   //    if(e.key.includes('Key')) {

   //       return;
   //    }
   //    else
   // }
   function onPaste(e: ClipboardEvent) {
      e.stopPropagation();
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      onTextInput(e, text);
      return false;
   }


   return (
      <div
         class={s.content}
         style={{
            "font-family": block.fontFamily ?? TextBlockFontFamily.Inter,
            "font-size": textSettings().fontSize + 'px',
            "font-weight": textSettings().fontWeight,
            "line-height": textSettings().lineHeight + 'px',
            "color": block.color ?? textSettings().color ?? 'initial',
         }}
         classList={{
            [s.showPlaceholder]: !block.value && blockStore.transform.width / gridSize(1) > 7,
            [s.overflowing]: isMeOverflowing()
         }}
         data-placeholder={t("blocks.text.placeholder")}
         contentEditable={isEditingContent()}
         ref={contentRef}
         onInput={onTextInput}
         // onKeyDown={onKeyDown}
         onPaste={onPaste}
         onClick={onClick}
         // innerHTML={untrack(()=>block.value)}
         {...props}
      />
   );
}

