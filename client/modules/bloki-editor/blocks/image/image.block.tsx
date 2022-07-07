import './image.block.scss';
import { createComputed, createEffect, Match, on, Switch } from 'solid-js';
import { Dimension, ImageBlock as ImageBlockEntity } from '@/modules/bloki-editor/types/blocks';
import { useEditorContext } from '../../editor.store';
import { getImageOrFallback, getImgDimension, readAsDataUrl } from '../../helpers';
import { CommonContentProps } from '../base.block';

type ImageBlockProps = {} & CommonContentProps<ImageBlockEntity>;

export function ImageBlock(props: ImageBlockProps) {
   const [, { gridSize }] = useEditorContext();
   const [editorStore, { setEditorState: setEditorStore }] = useEditorContext();

   let imgRef: HTMLImageElement;

   function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter') {
         // e.preventDefault();
      }
   }

   const dimension: Dimension = {
      width: gridSize(props.block.width),
      height: gridSize(props.block.height)
   };
   const currRatio = () => dimension.width / dimension.height;

   const defaultRelDimension: Dimension = {
      width: editorStore.document.layoutOptions.mGridWidth,
      height: 16
   };

   function getContentDimension(transform: Dimension) {
      if (!props.block.value) {
         return {
            width: gridSize(defaultRelDimension.width),
            height: gridSize(defaultRelDimension.height)
         };
      }
      return {
         width: transform.width,
         height: Math.round(transform.height / currRatio())
      };
   }
   createComputed(() => {
      props.wrapGetContentDimension(getContentDimension);
   });

   createEffect(
      on(
         () => props.block.value,
         async () => {
            let value = props.block.value;
            try {
               await getImageOrFallback(props.block.value);
            } catch (e) {
               value = null;
            }
            if (!value) {
               setEditorStore('layout', editorStore.layout.indexOf(props.block), defaultRelDimension);
               if (value !== props.block.value) {
                  setEditorStore('layout', editorStore.layout.indexOf(props.block), 'value', null);
               }
               // send(WSMsgType.ChangeBlock, unwrap(block));
               dimension.width = gridSize(defaultRelDimension.width);
               dimension.height = gridSize(defaultRelDimension.height);
            } else if (!props.block.width || !props.block.height) {
               const { width, height } = await getImgDimension(props.block.value);
               const ratio = height / width;
               const relSize = {
                  width: editorStore.document.layoutOptions.mGridWidth,
                  height: Math.ceil(editorStore.document.layoutOptions.mGridWidth * ratio)
               };
               dimension.width = gridSize(relSize.width);
               dimension.height = gridSize(relSize.height);
               setEditorStore('layout', editorStore.layout.indexOf(props.block), relSize);
               // send(WSMsgType.ChangeBlock, unwrap(block));
            }
         }
      )
   );

   async function onFileChoose(e: Event & { currentTarget: HTMLInputElement }) {
      const file = e.currentTarget.files[0];
      const base64 = await readAsDataUrl(file);
      setEditorStore('layout', editorStore.layout.indexOf(props.block), {
         value: base64
      });
      // send(WSMsgType.ChangeBlock, unwrap(block));
   }

   async function tryToSetUrlImage(imgSrc: string) {
      if (!imgSrc) return;
      try {
         const imgPath = await getImageOrFallback(imgSrc);
         setEditorStore('layout', editorStore.layout.indexOf(props.block), {
            value: imgPath
         });
         // send(WSMsgType.ChangeBlock, unwrap(block));
      } catch (e) {
         alert('Wrong image url!');
      }
   }

   // TODO: throttle
   const onUrlInput = (e: InputEvent & { currentTarget: HTMLInputElement }) => {
      tryToSetUrlImage(e.currentTarget.value);
   };

   // const onPaste = throttle((e: ClipboardEvent) => {
   //    const text = e.clipboardData.getData('text/html');
   //    console.log(e.clipboardData.types);
   //    tryToSetUrlImage(text);
   // }, 1000);

   return (
      <div
         class="content img-block"
         classList={{
            changing: props.isMeResizing || props.isMeDragging,
            overflowing: props.isMeOverflowing
         }}
      >
         <Switch>
            <Match when={props.block.value}>
               <img
                  src={props.block.value}
                  onKeyDown={onKeyDown}
                  ref={imgRef}
                  // onPaste={onPaste}
               />
            </Match>
            <Match when={!props.block.value}>
               <div class="mock">
                  <div class="dnd">
                     <input
                        type="file"
                        class="hidden-input-file"
                        accept=".png, .jpg, .jpeg, .svg"
                        onChange={onFileChoose}
                        disabled={!!props.isMeEditingByRoommate}
                     />
                     <div class="pic" />
                     <div class="ask">{'blocks.attachments.image.mock.ask'}</div>
                     <div class="orDrop">{'blocks.attachments.image.mock.or-drag'}</div>
                  </div>
                  <div class="input-block">
                     <div class="name">{'blocks.attachments.image.mock.or-link'}</div>
                     <input
                        type="url"
                        class="link"
                        placeholder={'Image url'}
                        onInput={onUrlInput}
                        onPaste={(e) => {
                           e.stopImmediatePropagation();
                           e.stopPropagation();
                           tryToSetUrlImage(e.currentTarget.value);
                        }}
                     />
                  </div>
               </div>
            </Match>
         </Switch>
      </div>
   );
}
