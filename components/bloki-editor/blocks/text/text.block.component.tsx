import { ComponentProps, createComputed, createEffect, createMemo, on, onMount, splitProps, untrack } from 'solid-js';
import cc from 'classcat';
import { TextBlock as TextBlockEntity } from '../../types/blocks';
import { useEditorStore } from '../../editor.store';
import s from './text.block.module.scss';
import { Dimension } from '../../types/blocks';
import { TextBlockFontFamily, TextTypes } from './types';
import { getTextBlockSize, measurer } from './helpers';
import { useI18n } from '@solid-primitives/i18n';
import { useBlockStore } from '../block.store';


type TextBlockProps = {
} & ComponentProps<'div'>;

export function TextBlock(props: TextBlockProps) {
   const [editor, { setEditorStore, gridSize, checkPlacement }] = useEditorStore();
   const [blockStore, { isMeOverflowing, shadowed, block, blockData }] = useBlockStore<TextBlockEntity>();

   const [local, other] = splitProps(props, []);

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
            {...other}
         >
            {untrack(() => block.value)}
         </div>
      );
   }

   const [t] = useI18n();

   let contentRef: HTMLDivElement;
   let minTextWidth = 0;
   let textHeightAtMinWidth = 0;

   const isEditingContent = createMemo(() => editor.editingBlock === block && editor.editingType === 'content');

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
         console.log(block.type, 'type changed');
         const size = getTextBlockSize(block.type, block.fontFamily, block.value, editor.document.layoutOptions, block.width, 'break-word');
         setEditorStore('document', 'blocks', editor.document.blocks.indexOf(block), {
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
            overflowWrap: 'break-all'
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
      blockData.getContentDimension = getContentDimension;
   });

   function onTextInput(e: Event, pasteContent: string = null) {
      const mGridWidth = editor.document.layoutOptions.mGridWidth;
      // check if key is affecting content?
      const text = contentRef.textContent + (pasteContent || '');

      if (text === '' && block.width >= mGridWidth) {
         const boundSize = getTextBlockSize(block.type, block.fontFamily, text, editor.document.layoutOptions);

         setEditorStore('document', 'blocks', editor.document.blocks.indexOf(block), {
            width: mGridWidth,
            height: boundSize.height,
            value: text,
         });
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
         return;
      }
      if (pasteContent) {
         document.execCommand("insertHTML", false, pasteContent);
      }
      setEditorStore('document', 'blocks', editor.document.blocks.indexOf(block), {
         width: newWidth,
         height: newHeight,
         value: text,
      });
   }

   function onKeyDown(e: KeyboardEvent) {
      const text = contentRef.textContent;
      let maxWidth = block.width;

      const boundSize = getTextBlockSize(block.type, block.fontFamily, text, editor.document.layoutOptions, maxWidth);

      let newWidth = boundSize.width;
      if (block.width === editor.document.layoutOptions.mGridWidth) {
         newWidth = editor.document.layoutOptions.mGridWidth;
      }
      let newHeight = boundSize.height;

      const { correct } = checkPlacement(block, block.x, block.y, newWidth, newHeight);
      if (!correct) {
         e.preventDefault();
         console.log('cant type more');
         return false;
      }

      setEditorStore('document', 'blocks', editor.document.blocks.indexOf(block), {
         width: newWidth,
         height: newHeight,
         value: text,
      });
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
         class={s.content}
         style={{
            // 'word-break': 'break-word',
            // 'white-space': 'normal',
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
         {...other}
      >{untrack(() => block.value)}</div>
   );
}