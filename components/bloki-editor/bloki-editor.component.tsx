import s from './bloki-editor.module.scss';
import { ComponentProps, createEffect, For, mergeProps, on, onCleanup, onMount, Show, splitProps } from 'solid-js';
import cc from 'classcat';
import { EditorStoreProvider, useEditorStore } from './editor.store';
import { Block } from './blocks/block.component';
import { AnyBlock, ImageBlock, TextBlock } from '@/lib/entities';
import { useAppStore } from '@/lib/app.store';
import { unwrap } from 'solid-js/store';
import { BlockTransform, Dimension, Point } from './types';
import { getAsString, getGoodImageRelativeSize } from './helpers';
import { TextBlockFontFamily, TextTypes } from './blocks/text-block/types';
import DomPurify from 'dompurify';
import { BacklightDrawer } from './backlight/BacklightDrawer';
import { useI18n } from '@solid-primitives/i18n';

function isTextBlock(block: AnyBlock): block is TextBlock {
   return block.type === 'text';
}

type BlokiEditorProps = {
   showMeta?: boolean;
   gridType?: 'dom' | 'canvas';
};
function BlokiEditor(props: BlokiEditorProps) {
   props = mergeProps({
      gridType: 'dom'
   }, props);
   let containerRef: HTMLDivElement;
   let wrapperRef: HTMLDivElement;
   const [app, { apiProvider }] = useAppStore();
   const [t] = useI18n();
   const [
      store,
      {
         editor,
         realSize,
         selectBlock,
         setStore,
         getRelativePosition,
         checkPlacement
      }
   ] = useEditorStore();

   const GRID_COLOR_CELL = '#ffae0020';


   function calculateBoxRect() {
      if (!containerRef) return;
      const containerRect = containerRef.getBoundingClientRect();
      editor.containerRect = containerRect;
      editor.emit('containerrectchanged', containerRect);
   };

   function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
         if (store.editingType === 'content' || store.editingType === 'select') {
            selectBlock(null);
         }
      }
      if (e.key === 'Enter') {
         if (!store.editingType || (store.editingType === 'content' && isTextBlock(store.editingBlock))) {
            console.log('enter');
            e.preventDefault();
         }
      }
   }

   function isInMainGrid(x: number) {
      const { mGridWidth, fGridWidth } = store.document.layoutOptions;
      const start = (fGridWidth - mGridWidth) / 2;
      const end = start + mGridWidth;
      return x >= start && x < end;
   }

   // Todo: sort vertically in createComputed and find space between blocks too.
   function findNextSpaceBelow(requiredSpace: Dimension, startFrom: Point = { x: 0, y: 0 }) {
      let start: Point;
      const { y, height } = unwrap(store.document).blocks
         .filter((b) => isInMainGrid(b.x) || isInMainGrid(b.x + b.width))
         .sort((a, b) => b.y + b.height - a.y - a.height)[0];
      // console.log('last vert block in main grid', lastVerticalBlockInMainGrid);
      return y + height;
   }

   function onMainGridMouseMove(e: MouseEvent) {
      if (store.editingType) return;
      const { y } = getRelativePosition(e.pageX - editor.containerRect.x, e.pageY - editor.containerRect.y);
      const { mGridWidth, fGridWidth } = store.document.layoutOptions;
      const x = (fGridWidth - mGridWidth) / 2;
      const block = { x, y, width: mGridWidth, height: 1 };
      const { correct } = checkPlacement(block);
      if (correct) {
         editor.emit('maingridcursormoved', block, false);
      }
   }

   function onMainGridMouseOut(e: MouseEvent) {
      editor.emit('maingridcursormoved', null, true);
   }

   async function onPaste(e: ClipboardEvent) {
      e.preventDefault();
      // const file = Array.from(e.clipboardData.files)[0];
      const item = Array.from(e.clipboardData.items)[0];

      if (!item || item.type !== 'text/html') {
         alert('We are allowing only images pasted from other internet sources!');
         return;
      }
      const str = await getAsString(item).then(str => DomPurify.sanitize(str));
      const imgSrc = str.match(/<img [^>]*src="[^"]*"[^>]*>/gm)
         .map(x => x.replace(/.*src="([^"]*)".*/, '$1'))[0];

      if (!imgSrc?.includes('http')) {
         alert('We are allowing only images pasted from other internet sources!');
         return;
      }
      const { fGridWidth, mGridWidth } = store.document.layoutOptions;
      const { width, height } = await getGoodImageRelativeSize(imgSrc, store.document.layoutOptions);
      const x = (fGridWidth - mGridWidth) / 2;
      const y = findNextSpaceBelow(null);
      const transform: BlockTransform = {
         width, height,
         x, y,
      };
      const { correct } = checkPlacement(transform, x, y);
      if (!correct) {
         alert(t("errors.layout.not-enough-space"));
         return;
      }
      const block: ImageBlock = {
         id: crypto.randomUUID(),
         type: 'image',
         src: imgSrc,
         ...transform,
      };
      setStore('document', 'blocks', blocks => blocks.concat(block));
      setStore({
         editingBlock: store.document.blocks[store.document.blocks.length - 1],
         editingType: 'select'
      });
      await app.apiProvider.updateDocument(app.selectedDocument);

      // console.log(img.src);
      // if (file?.type.includes('image')) {
      //    const objUrl = URL.createObjectURL(file);
      //    const dimension = await getImgDimension(objUrl);
      //    URL.revokeObjectURL(objUrl);
      //    const ratio = dimension.width / dimension.height;
      //    const { fGridWidth, mGridWidth, blockMaxSize } = store.document.layoutOptions;
      //    let width = mGridWidth;
      //    let height = Math.ceil(width / ratio);
      //    console.log('calculated image dimension', dimension, 'relative', width, height);

      //    if (height > blockMaxSize.height) {
      //       height = blockMaxSize.height;
      //       width = Math.ceil(ratio * height);
      //    }
      //    const x = (fGridWidth - mGridWidth) / 2;
      //    const y = findNextSpaceBelow(null);
      //    const transform: BlockTransform = {
      //       width, height,
      //       x, y,
      //    };
      //    console.log(x, y, width, height);
      //    const { correct } = checkPlacement(transform, x, y);
      //    if (!correct) {
      //       alert('Not enough space to place block in layout =(');
      //       return;
      //    }
      //    const imgBase64 = await readAsDataUrl(file);
      //    const block: ImageBlock = {
      //       id: crypto.randomUUID(),
      //       type: 'image',
      //       src: imgBase64,
      //       ...transform,
      //    };
      //    setStore('document', 'blocks', blocks => blocks.concat(block));
      //    setStore({
      //       editingBlock: store.document.blocks[store.document.blocks.length - 1],
      //       editingType: 'select'
      //    });
      //    await app.apiProvider.updateDocument(app.selectedDocument);
      // }
   }

   function onGridClick(e: MouseEvent & { currentTarget: HTMLDivElement; }, grid: 'main' | 'foreground') {
      if (store.editingBlock) {
         selectBlock(null);
         return;
      }
      let { x, y } = getRelativePosition(e.pageX - editor.containerRect.x, e.pageY - editor.containerRect.y);

      const { mGridWidth, fGridWidth } = store.document.layoutOptions;
      if (grid === 'main') {
         x = (fGridWidth - mGridWidth) / 2;
      }
      else return;

      const newBlockTransform: BlockTransform = {
         height: 1,
         width: mGridWidth,
         x, y
      };

      if (checkPlacement(newBlockTransform, x, y).correct) {
         let block: TextBlock = {
            id: crypto.randomUUID(),
            type: 'text',
            value: '',
            fontFamily: TextBlockFontFamily.Inter,
            textType: TextTypes.Regular,
            ...newBlockTransform,
         };
         setStore('document', 'blocks', blocks => blocks.concat(block));
         setStore({
            editingBlock: store.document.blocks[store.document.blocks.length - 1],
            editingType: 'content'
         });
      }
   }

   onMount(() => {
      calculateBoxRect();
      wrapperRef.addEventListener('scroll', calculateBoxRect, { passive: true });

      window.addEventListener('resize', calculateBoxRect);
      window.addEventListener('keydown', onKeyDown);
      document.addEventListener('paste', onPaste);

      onCleanup(() => {
         wrapperRef.removeEventListener('scroll', calculateBoxRect);

         window.removeEventListener('resize', calculateBoxRect);
         window.removeEventListener('keydown', onKeyDown);
         document.removeEventListener('paste', onPaste);
      });

   });

   createEffect(() => {
      const unbindChangeEnd = editor.on('changeend', (block, { placement, relTransform, type }) => {
         if (placement.correct) {
            console.log('should sync changes here');
            apiProvider.updateDocument(unwrap(store.document));
         }
      });

      onCleanup(() => {
         unbindChangeEnd();
      });
   });

   createEffect(on(() => JSON.stringify(store.document.layoutOptions), calculateBoxRect));
   return (
      <>
         <div
            class={s.wrapper}
            ref={wrapperRef}
         >
            <div
               class={s.container}
               ref={containerRef}
               style={{
                  'background-image': store.document.layoutOptions.showGridGradient === true ?
                     `repeating-linear-gradient(
                  0deg,
                  ${GRID_COLOR_CELL} 0 ${realSize().size_px},
                  transparent 0 ${realSize().sum_px}
               ),
               repeating-linear-gradient(90deg, ${GRID_COLOR_CELL} 0 ${realSize().size_px}, transparent 0 ${realSize().sum_px})`
                     : null,
                  width: realSize().fGridWidth_px,
                  height: realSize().fGridHeight_px,
                  top: realSize().size_px,
               }}
            >
               <BacklightDrawer type={props.gridType} />
               <div
                  class={cc([s.grid, s.foregroundGrid])}
                  style={{
                     width: realSize().fGridWidth_px,
                     height: realSize().fGridHeight_px,
                  }}
                  onClick={(e) => onGridClick(e, 'foreground')}
               />
               <div
                  class={cc([s.grid, s.mainGrid])}
                  style={{
                     width: realSize().mGridWidth_px,
                     height: realSize().mGridHeight_px,
                     margin: `0 ${(realSize().fGridWidth - realSize().mGridWidth) / 2}px`,
                     background: store.document.layoutOptions.showGridGradient === true ? 'rgba(128, 128, 128, 0.507)' : null,
                     cursor: store.editingBlock ? 'initial' : 'cell'
                  }}
                  onClick={(e) => onGridClick(e, 'main')}
                  onMouseMove={onMainGridMouseMove}
                  onMouseOut={onMainGridMouseOut}
               />
               <For each={store.document.blocks}>
                  {(block) => (
                     <Block block={block} />
                  )}
               </For>
               <Show when={store.editingType === 'drag'}>
                  <Block block={store.editingBlock} shadowed />
               </Show>
            </div>
         </div>
         <Show when={props.showMeta}>
            <div class={s.controls}>
               <div class={s.control}>Block id: [{store.editingBlock?.id}]</div>
               <div class={s.control}>Editing type: [{store.editingType}]</div>
            </div>
         </Show>
      </>
   );
}

type WrappedEditorProps = Omit<ComponentProps<typeof EditorStoreProvider>, 'children'> & ComponentProps<typeof BlokiEditor>;
const WrappedEditor = (props: WrappedEditorProps) => {
   const [storeProps, compProps] = splitProps(props, ['document']);
   return (
      <EditorStoreProvider {...storeProps}>
         <BlokiEditor {...compProps} />
      </EditorStoreProvider>
   );
};

export {
   WrappedEditor as BlokiEditor
};