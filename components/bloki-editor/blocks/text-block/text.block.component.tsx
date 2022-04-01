import { ComponentProps, createComputed, createEffect, createMemo, on, onMount, splitProps, untrack } from 'solid-js';
import cc from 'classcat';
import { TextBlock as TextBlockEntity } from '@/lib/entities';
import { useEditorStore } from '../../editor.store';
import s from './text.block.module.scss';
import { Dimension } from '../../types';
import { contentBlockProps, ContentBlockProps } from '../types';
import { TextBlockFontFamily, TextTypes } from './types';
import { getTextBlockSize, measurer } from './helpers';
import { useI18n } from '@solid-primitives/i18n';


type TextBlockProps = ContentBlockProps<TextBlockEntity> & {
} & ComponentProps<'div'>;

export function TextBlock(props: TextBlockProps) {
   const [editor, { setStore, gridSize, checkPlacement }] = useEditorStore();
   const [local, other] = splitProps(props, contentBlockProps);

   if (props.shadowed) {
      const textSettings = TextTypes[props.block.textType];
      return (
         <div
            class={cc([s.content, s.shadow])}
            style={{
               "font-family": props.block.fontFamily ?? TextBlockFontFamily.Inter,
               "font-size": textSettings.fontSize + 'px',
               "font-weight": textSettings.fontWeight,
               "line-height": textSettings.lineHeight + 'px',
            }}
            {...other}
         >
            {untrack(() => props.block.value)}
         </div>
      );
   }

   const [t] = useI18n();

   let contentRef: HTMLDivElement;
   let minTextWidth = 0;
   let textHeightAtMinWidth = 0;

   createComputed(() => {
      minTextWidth = gridSize(5);
   });
   const isEditingContent = createMemo(() => editor.editingBlock === props.block && editor.editingType === 'content');

   createEffect(() => {
      if (isEditingContent()) {
         contentRef.focus();
         // const { fontFamily, fontSize, fontWeight, lineHeight, wordBreak } = getComputedStyle(contentRef);
         // textMeasurer.setOptions({ fontFamily, fontSize, fontWeight, lineHeight, wordBreak });
         // textMeasurer.ruler.textContent = props.block.value;
      }
   });

   createEffect(on(
      () => props.block.value,
      () => {
         if (!contentRef) return;
         if (!contentRef.textContent.trimEnd() && contentRef.lastElementChild?.tagName === 'BR') {
            contentRef.lastElementChild.remove();
         }
         const minimals = measurer.measureText(props.block.value, 'min-content', 'min-content');
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
      const dimension = measurer.measureText(props.block.value, widthPx);
      return dimension;
   }

   onMount(() => {
      props.setGetContentDimension && props.setGetContentDimension(getContentDimension);
   });

   let alignToMainGrid = true;
   function onTextInput(e: Event, pasteContent: string = null) {
      console.log('on input');
      // check if key is affecting content?
      const text = contentRef.textContent + (pasteContent || '');

      if (text === '' && props.block.width >= editor.document.layoutOptions.mGridWidth) {
         setStore('document', 'blocks', editor.document.blocks.indexOf(props.block), {
            width: editor.document.layoutOptions.mGridWidth,
            height: 1,
            value: text,
         });
         alignToMainGrid = true;
         return;
      }

      let maxWidth = props.block.width;

      const boundSize = getTextBlockSize(props.block, text, editor.document.layoutOptions, maxWidth);

      let newWidth = boundSize.width;
      if (props.block.width === editor.document.layoutOptions.mGridWidth) {
         newWidth = editor.document.layoutOptions.mGridWidth;
      }
      let newHeight = boundSize.height;

      const { correct } = checkPlacement(props.block, props.block.x, props.block.y, newWidth, newHeight);
      if (!correct) {
         e.preventDefault();
         console.log('cant type more');
         return;
      }
      if (pasteContent) {
         document.execCommand("insertHTML", false, pasteContent);
      }
      setStore('document', 'blocks', editor.document.blocks.indexOf(props.block), {
         width: newWidth,
         height: newHeight,
         value: text,
      });
   }
   function onKeyDown(e: KeyboardEvent) {
      const text = contentRef.textContent;
      let maxWidth = props.block.width;

      const boundSize = getTextBlockSize(props.block, text, editor.document.layoutOptions, maxWidth);

      let newWidth = boundSize.width;
      if (props.block.width === editor.document.layoutOptions.mGridWidth) {
         newWidth = editor.document.layoutOptions.mGridWidth;
      }
      let newHeight = boundSize.height;

      const { correct } = checkPlacement(props.block, props.block.x, props.block.y, newWidth, newHeight);
      if (!correct) {
         e.preventDefault();
         console.log('cant type more');
         return false;
      }

      setStore('document', 'blocks', editor.document.blocks.indexOf(props.block), {
         width: newWidth,
         height: newHeight,
         value: text,
      });
   }

   // createEffect(on(
   //    () => props.block.width,
   //    (prev, curr) => {
   //       if (prev === editor.document.layoutOptions.mGridWidth && curr !== editor.document.layoutOptions.mGridWidth) {
   //          alignToMainGrid = false;
   //       }
   //       else alignToMainGrid = true;
   //    })
   // );

   function onPaste(e: ClipboardEvent) {
      e.stopPropagation();
      e.preventDefault();
      var text = e.clipboardData.getData('text/plain');
      onTextInput(e, text);
      return false;
   }
   const textSettings = createMemo(() => TextTypes[props.block.textType]);

   return (
      <div
         class={s.content}
         style={{
            // 'word-break': 'break-word',
            // 'white-space': 'normal',
            "font-family": props.block.fontFamily ?? TextBlockFontFamily.Inter,
            "font-size": textSettings().fontSize + 'px',
            "font-weight": textSettings().fontWeight,
            "line-height": textSettings().lineHeight + 'px',
            "color": textSettings().color ?? 'initial',
         }}
         classList={{
            [s.showPlaceholder]: !props.block.value && props.localTransform.width / gridSize(1) > 7,
            [s.overflowing]: props.isMeOverflowing
         }}
         data-placeholder={t("blocks.text.placeholder")}
         contentEditable={isEditingContent()}
         ref={contentRef}
         onInput={onTextInput}
         // onKeyDown={onKeyDown}
         onPaste={onPaste}
         {...other}
      >{untrack(() => props.block.value)}</div>
   );
}