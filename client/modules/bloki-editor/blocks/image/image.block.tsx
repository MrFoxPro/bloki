import './image.block.scss';

import { ComponentProps, createComputed, createEffect, Match, on, splitProps, Switch } from 'solid-js';
import { Dimension, ImageBlock as ImageBlockEntity } from '@/modules/bloki-editor/types/blocks';
import { useBlockStore } from '../block.store';
import { useEditorStore } from '../../editor.store';
import { getImageOrFallback, getImgDimension, readAsDataUrl } from '../../helpers';

type ImageBlockProps = {
} & ComponentProps<'img'>;

export function ImageBlock(props: ImageBlockProps) {
   const [local, other] = splitProps(props, []);

   const [, { gridSize }] = useEditorStore();
   const [, { shadowed, block, isMeResizing, isMeDragging, blockData, isMeEditingByRoommate }] = useBlockStore<ImageBlockEntity>();

   if (shadowed) {
      return (
         <div class='img-block shadowed'>
            <Switch>
               <Match when={block.value}>
                  <img
                     src={block.value}
                     {...other}
                  />
               </Match>
               <Match when={!block.value}>
                  <div class="mock">
                     <div class="dnd">
                        <div class="pic" />
                        <div class="ask">{'blocks.attachments.image.mock.ask'}</div>
                        <div class="orDrop">{'blocks.attachments.image.mock.or-drag'}</div>
                     </div>
                     <div class="input-block">
                        <div class="name">
                           {'blocks.attachments.image.mock.or-link'}
                        </div>
                        <input
                           type="url"
                           class="link"
                           placeholder={"https://cstor.nn2.ru/forum/data/forum/files/2014-12/108480959-9743143_original-1-.jpg"}
                        />
                     </div>
                  </div>
               </Match>
            </Switch>
         </div>
      );
   }
   const [editorStore, { setEditorStore }] = useEditorStore();

   let imgRef: HTMLImageElement;

   function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter') {
         // e.preventDefault();
      }
   }

   const dimension: Dimension = {
      width: gridSize(block.width),
      height: gridSize(block.height)
   };
   const currRatio = () => dimension.width / dimension.height;

   const defaultRelDimension: Dimension = {
      width: editorStore.document.layoutOptions.mGridWidth,
      height: 16,
   };

   function getContentDimension(transform: Dimension) {
      if (!block.value) {
         return {
            width: gridSize(defaultRelDimension.width),
            height: gridSize(defaultRelDimension.height),
         };
      }
      return {
         width: transform.width,
         height: Math.round(transform.height / currRatio())
      };
   }
   createComputed(() => {
      blockData.getContentDimension = getContentDimension;
   });

   createEffect(on(
      () => block.value,
      async () => {
         let value = block.value;
         try {
            await getImageOrFallback(block.value);
         }
         catch (e) {
            value = null;
         }
         if (!value) {
            setEditorStore('layout', editorStore.layout.indexOf(block), defaultRelDimension);
            if (value !== block.value) {
               setEditorStore('layout', editorStore.layout.indexOf(block), 'value', null);
            }
            // send(WSMsgType.ChangeBlock, unwrap(block));
            dimension.width = gridSize(defaultRelDimension.width);
            dimension.height = gridSize(defaultRelDimension.height);
         }
         else if (!block.width || !block.height) {
            const { width, height } = await getImgDimension(block.value);
            const ratio = height / width;
            const relSize = {
               width: editorStore.document.layoutOptions.mGridWidth,
               height: Math.ceil(editorStore.document.layoutOptions.mGridWidth * ratio)
            };
            dimension.width = gridSize(relSize.width);
            dimension.height = gridSize(relSize.height);
            setEditorStore('layout', editorStore.layout.indexOf(block), relSize);
            // send(WSMsgType.ChangeBlock, unwrap(block));
         }
      })
   );

   async function onFileChoose(e: Event & { currentTarget: HTMLInputElement; }) {
      const file = e.currentTarget.files[0];
      const base64 = await readAsDataUrl(file);
      setEditorStore('layout', editorStore.layout.indexOf(block), {
         value: base64
      });
      // send(WSMsgType.ChangeBlock, unwrap(block));
   }

   async function tryToSetUrlImage(imgSrc: string) {
      if (!imgSrc) return;
      try {
         const imgPath = await getImageOrFallback(imgSrc);
         setEditorStore('layout', editorStore.layout.indexOf(block), {
            value: imgPath,
         });
         // send(WSMsgType.ChangeBlock, unwrap(block));
      }
      catch (e) {
         alert('Wrong image url!');
      }
   }

   // TODO: throttle
   const onUrlInput = (e: InputEvent & { currentTarget: HTMLInputElement; }) => {
      tryToSetUrlImage(e.currentTarget.value);
   };

   // const onPaste = throttle((e: ClipboardEvent) => {
   //    const text = e.clipboardData.getData('text/html');
   //    console.log(e.clipboardData.types);
   //    tryToSetUrlImage(text);
   // }, 1000);


   return (
      <div
         class="img-block"
         classList={{
            'changing': isMeResizing() || isMeDragging(),
            'shadowed': shadowed,
         }}
      >
         <Switch>
            <Match when={block.value}>
               <img
                  src={block.value}
                  onKeyDown={onKeyDown}
                  ref={imgRef}
                  // onPaste={onPaste}
                  {...other}
               />
            </Match>
            <Match when={!block.value}>
               <div class="mock">
                  <div class="dnd">
                     <input type="file"
                        class="hidden-input-file"
                        accept=".png, .jpg, .jpeg, .svg"
                        onChange={onFileChoose}
                        disabled={!!isMeEditingByRoommate()}
                     />
                     <div class="pic" />
                     <div class="ask">{'blocks.attachments.image.mock.ask'}</div>
                     <div class="orDrop">{'blocks.attachments.image.mock.or-drag'}</div>
                  </div>
                  <div class="input-block">
                     <div class="name">
                        {'blocks.attachments.image.mock.or-link'}
                     </div>
                     <input
                        type="url"
                        class="link"
                        placeholder={"Image url"}
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
