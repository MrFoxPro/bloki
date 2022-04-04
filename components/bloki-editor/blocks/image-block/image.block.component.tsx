import { ComponentProps, createComputed, createEffect, Match, on, splitProps, Switch } from 'solid-js';
import { Dimension, ImageBlock as ImageBlockEntity } from '@/components/bloki-editor/types';
import s from './image.block.module.scss';
import { useBlockStore } from '../block.store';
import { useI18n } from '@solid-primitives/i18n';
import { useEditorStore } from '../../editor.store';
import { getImageOrFallback, getImgDimension, readAsDataUrl } from '../../helpers';
import throttle from 'lodash.throttle';
import cc from 'classcat';

type ImageBlockProps = {
} & ComponentProps<'img'>;

export function ImageBlock(props: ImageBlockProps) {
   const [t] = useI18n();
   const [local, other] = splitProps(props, []);

   const [, { gridSize }] = useEditorStore();
   const [, { shadowed, block, isMeResizing, isMeDragging, blockData }] = useBlockStore<ImageBlockEntity>();

   if (shadowed) {
      return (
         <div class={cc([s.shadowed, s.imgBlock])}>
            <Switch>
               <Match when={block.src}>
                  <img
                     src={block.src}
                     {...other}
                  />
               </Match>
               <Match when={!block.src}>
                  <div class={s.mock}>
                     <div class={s.dnd}>
                        <div class={s.pic} />
                        <div class={s.ask}>{t('blocks.attachments.image.mock.ask')}</div>
                        <div class={s.orDrop}>{t('blocks.attachments.image.mock.or-drag')}</div>
                     </div>
                     <div class={s.inputBlock}>
                        <div class={s.name}>
                           {t('blocks.attachments.image.mock.or-link')}
                        </div>
                        <input
                           type="url"
                           class={s.link}
                           placeholder={"https://cstor.nn2.ru/forum/data/forum/files/2014-12/108480959-9743143_original-1-.jpg"}
                        />
                     </div>
                  </div>
               </Match>
            </Switch>
         </div>
      );
   }
   const [editorStore, { setStore }] = useEditorStore();

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
      if (!block.src) {
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
      () => block.src,
      async () => {
         if (!block.src) {
            setStore('document', 'blocks', editorStore.document.blocks.indexOf(block), defaultRelDimension);
            dimension.width = gridSize(defaultRelDimension.width);
            dimension.height = gridSize(defaultRelDimension.height);
         }
         else {
            const { width, height } = await getImgDimension(block.src);
            const ratio = height / width;
            const relSize = {
               width: editorStore.document.layoutOptions.mGridWidth,
               height: Math.ceil(editorStore.document.layoutOptions.mGridWidth * ratio)
            };
            dimension.width = gridSize(relSize.width);
            dimension.height = gridSize(relSize.height);
            setStore('document', 'blocks', editorStore.document.blocks.indexOf(block), relSize);
         }
      })
   );

   async function onFileChoose(e: Event & { currentTarget: HTMLInputElement; }) {
      const file = e.currentTarget.files[0];
      const base64 = await readAsDataUrl(file);
      setStore('document', 'blocks', editorStore.document.blocks.indexOf(block), {
         src: base64
      });
   }

   async function tryToSetUrlImage(imgSrc: string) {
      if (!imgSrc) return;
      try {
         const imgPath = await getImageOrFallback(imgSrc);
         setStore('document', 'blocks', editorStore.document.blocks.indexOf(block), {
            src: imgPath,
         });
      }
      catch (e) {
         alert('Wrong image url!');
      }
   }

   const onUrlInput = throttle((e: InputEvent & { currentTarget: HTMLInputElement; }) => {
      tryToSetUrlImage(e.currentTarget.value);
   }, 1000);

   // const onPaste = throttle((e: ClipboardEvent) => {
   //    const text = e.clipboardData.getData('text/html');
   //    console.log(e.clipboardData.types);
   //    tryToSetUrlImage(text);
   // }, 1000);


   return (
      <div
         class={s.imgBlock}
         classList={{
            [s.changing]: isMeResizing() || isMeDragging(),
            [s.shadowed]: shadowed,
         }}
      >
         <Switch>
            <Match when={block.src}>
               <img
                  src={block.src}
                  onKeyDown={onKeyDown}
                  ref={imgRef}
                  // onPaste={onPaste}
                  {...other}
               />
            </Match>
            <Match when={!block.src}>
               <div class={s.mock}>
                  <div class={s.dnd}>
                     <input type="file"
                        class={s.hiddenInputFile}
                        accept=".png, .jpg, .jpeg, .svg"
                        onChange={onFileChoose}
                     />
                     <div class={s.pic} />
                     <div class={s.ask}>{t('blocks.attachments.image.mock.ask')}</div>
                     <div class={s.orDrop}>{t('blocks.attachments.image.mock.or-drag')}</div>
                  </div>
                  <div class={s.inputBlock}>
                     <div class={s.name}>
                        {t('blocks.attachments.image.mock.or-link')}
                     </div>
                     <input
                        type="url"
                        class={s.link}
                        placeholder={"https://cstor.nn2.ru/forum/data/forum/files/2014-12/108480959-9743143_original-1-.jpg"}
                        onInput={onUrlInput}
                        // onPaste={(e) => {
                        //    e.stopImmediatePropagation();
                        //    e.stopPropagation();
                        //    // onPaste(e);
                        // }}
                     />
                  </div>
               </div>
            </Match>
         </Switch>
      </div>
   );
}