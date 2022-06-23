import './text.block.scss';
import { createComputed, createEffect, createMemo, on, onMount, untrack } from 'solid-js';
import { TextBlock as TextBlockEntity } from '../../types/blocks';
import { useEditorContext } from '../../editor.store';
import { Dimension } from '../../types/blocks';
import { TextBlockFontFamily, TextTypes } from './types';
import { getTextBlockSize, measurer } from './helpers';
import { CommonContentProps } from '../base.block';

type TextBlockProps = {
} & CommonContentProps<TextBlockEntity>;

export function TextBlock(props: TextBlockProps) {
   let contentRef: HTMLDivElement;
   let minTextWidth = 0;
   let textHeightAtMinWidth = 0;
   const [editor, { setEditorState: setEditorStore, gridSize, checkPlacement }] = useEditorContext();

   createComputed(() => {
      minTextWidth = gridSize(5);
   });

   createEffect(() => {
      if (props.isEditingContent) {
         contentRef.focus();
      }
   });

   createEffect(on(
      () => props.block.type,
      () => {
         if (props.block.type == null) return;
         const size = getTextBlockSize(props.block.type, props.block.fontFamily, props.block.value, editor.document.layoutOptions, props.block.width, 'break-word');
         setEditorStore('layout', editor.layout.indexOf(props.block), {
            height: size.height,
         });
      })
   );

   createEffect(on(
      () => props.block.value,
      () => {
         if (!contentRef) return;
         if (!contentRef.textContent.trimEnd() && contentRef.lastElementChild?.tagName === 'BR') {
            contentRef.lastElementChild.remove();
         }
         measurer.setOptions({
            overflowWrap: 'anywhere'
         });
         const minimals = measurer.measureText(props.block.value, 'min-content', 'min-content');
         minTextWidth = minimals.width;
         textHeightAtMinWidth = minimals.height;
      }
   ));
   const textSettings = createMemo(() => TextTypes[props.block.type]);
   function getContentDimension(transform: Dimension) {
      if (transform.width < minTextWidth) {
         transform.width = minTextWidth;
         transform.height = textHeightAtMinWidth;
         return transform;
      }
      const widthPx = transform.width + 'px';
      measurer.setOptions({
         fontFamily: props.block.fontFamily ?? TextBlockFontFamily.Inter,
         fontSize: textSettings().fontSize + 'px',
         lineHeight: textSettings().lineHeight + 'px',
         fontWeight: textSettings().fontWeight + 'px',
      });
      const dimension = measurer.measureText(props.block.value, widthPx);
      return dimension;
   }

   onMount(() => {
      // (props.ref as any).getContentDimension = getContentDimension;
      props.wrapGetContentDimension(getContentDimension);
   });

   createEffect(on(() => props.block.value,
      () => {
         if (!contentRef) return;
         if (contentRef.textContent !== props.block.value) {
            contentRef.textContent = props.block.value;
         }
      }));
   function onTextInput(e: Event, pasteContent: string = null) {
      const mGridWidth = editor.document.layoutOptions.mGridWidth;
      // check if key is affecting content?
      const text = contentRef.textContent + (pasteContent || '');

      if (text === '' && props.block.width >= mGridWidth) {
         const boundSize = getTextBlockSize(props.block.type, props.block.fontFamily, text, editor.document.layoutOptions);

         setEditorStore('layout', editor.layout.indexOf(props.block), {
            width: mGridWidth,
            height: boundSize.height,
            value: text,
         });
         // send(WSMsgType.ChangeBlock, unwrap(block));
         return;
      }

      let maxWidth = props.block.width;
      if (maxWidth < mGridWidth) maxWidth = mGridWidth;

      const boundSize = getTextBlockSize(props.block.type, props.block.fontFamily, text, editor.document.layoutOptions, maxWidth, 'break-word');

      let newWidth = boundSize.width;
      if (props.block.width === mGridWidth) {
         newWidth = mGridWidth;
      }
      let newHeight = boundSize.height;
      if (props.block.height > newHeight) newHeight = props.block.height;

      const { correct } = checkPlacement(props.block, props.block.x, props.block.y, newWidth, newHeight);
      if (!correct) {
         e.preventDefault();
         console.log('cant type more');
         contentRef.textContent = props.block.value;
         return;
      }
      if (pasteContent) {
         document.execCommand("insertHTML", false, pasteContent);
      }

      setEditorStore('layout', editor.layout.indexOf(props.block), {
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
            "font-family": props.block.fontFamily ?? TextBlockFontFamily.Inter,
            "font-size": textSettings().fontSize + 'px',
            "font-weight": textSettings().fontWeight,
            "line-height": textSettings().lineHeight + 'px',
         }}
         classList={{
            "show-placeholder": !props.block.value && props.transform.width / gridSize(1) > 7,
            "overflowing": props.isMeOverflowing
         }}
         data-placeholder={"blocks.text.placeholder"}
         contentEditable={props.isEditingContent}
         ref={contentRef}
         onInput={onTextInput}
         // onKeyDown={onKeyDown}
         onPaste={onPaste}
      >{untrack(() => props.block.value)}</div>
   );
}
