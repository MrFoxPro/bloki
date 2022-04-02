import { ComponentProps, createEffect, For, mergeProps, on, onCleanup, onMount, Show, splitProps, Suspense } from 'solid-js';
import { unwrap } from 'solid-js/store';
import cc from 'classcat';
import DomPurify from 'dompurify';
import s from './bloki-editor.module.scss';
import { useAppStore } from '@/lib/app.store';
import { useI18n } from '@solid-primitives/i18n';
import { EditorStoreProvider, useEditorStore } from './editor.store';
import { Block } from './blocks/block.component';
import { AnyBlock, BlockTransform, BlockType, Dimension, EditType, isTextBlock, Point } from './types';
import { getAsString, getGoodImageRelativeSize } from './helpers';
import { TextBlockFontFamily } from './blocks/text-block/types';
import { BacklightDrawer } from './backlight/backlight-drawer.component';
import { BlockContextMenu } from './context-menu/context-menu.component';

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

   const pasteError = () => alert('We are allowing only images pasted from other internet sources!');

   async function onPaste(e: ClipboardEvent) {
      e.preventDefault();
      // const file = Array.from(e.clipboardData.files)[0];
      const item = Array.from(e.clipboardData.items)[0];

      if (!item || item.type !== 'text/html') {
         pasteError();
         return;
      }
      const str = await getAsString(item).then(str => DomPurify.sanitize(str));
      if (!str) {
         pasteError();
      }
      const imgSrc = str.match(/<img [^>]*src="[^"]*"[^>]*>/gm)
         .map(x => x.replace(/.*src="([^"]*)".*/, '$1'))[0];

      if (!imgSrc?.includes('http')) {
         pasteError();
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
      createBlock({
         type: BlockType.Image,
         src: imgSrc,
         ...transform,
      }, 'select');
      await app.apiProvider.updateDocument(app.selectedDocument);
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
         createBlock({
            type: BlockType.Regular,
            value: '',
            fontFamily: TextBlockFontFamily.Inter,
            ...newBlockTransform,
         }, 'content');
      }
   }
   function createBlock(block: Partial<AnyBlock>, editingType: EditType = 'content', id = crypto.randomUUID()) {
      block.id = id;

      setStore('document', 'blocks', blocks => blocks.concat(block as AnyBlock));
      const createdBlock = store.document.blocks[store.document.blocks.length - 1];
      setStore({
         editingBlock: createdBlock,
      });
      return createdBlock;
   }
   onMount(() => {
      calculateBoxRect();
      wrapperRef.addEventListener('scroll', calculateBoxRect, { passive: true });

      window.addEventListener('resize', calculateBoxRect);
      window.addEventListener('keydown', onKeyDown);
      wrapperRef.addEventListener('paste', onPaste);

      onCleanup(() => {
         wrapperRef.removeEventListener('scroll', calculateBoxRect);

         window.removeEventListener('resize', calculateBoxRect);
         window.removeEventListener('keydown', onKeyDown);
         wrapperRef.removeEventListener('paste', onPaste);
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
               <BlockContextMenu />
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
      <Suspense>
         <EditorStoreProvider {...storeProps}>
            <BlokiEditor {...compProps} />
         </EditorStoreProvider>
      </Suspense>
   );
};

export {
   WrappedEditor as BlokiEditor
};
export default WrappedEditor;