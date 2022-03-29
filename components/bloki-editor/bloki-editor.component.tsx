import { ComponentProps, createEffect, createSignal, For, on, onCleanup, onMount, Show, splitProps } from 'solid-js';
import s from './bloki-editor.module.scss';
import cc from 'classcat';
import { EditorStoreProvider, useEditorStore } from './editor.store';
import { BlokiCanvasGrid } from './canvas-grid/canvas-grid.component';
import { Block } from './blocks/block.component';
import { AnyBlock, ImageBlock, TextBlock } from '@/lib/entities';
import { useAppStore } from '@/lib/app.store';
import { unwrap } from 'solid-js/store';
import { DrawerToolbox } from '@/components/drawer/toolbox/toolbox.component';
import { BlockTransform, Dimension, Point } from './types';
import { getImgDimension } from './helpers';


function isTextBlock(block: AnyBlock): block is TextBlock {
   return block.type === 'text';
}

type BlokiEditorProps = {
   showDrawerToolbox?: boolean;
};
function BlokiEditor(props: BlokiEditorProps) {
   let containerRef: HTMLDivElement;
   let wrapperRef: HTMLDivElement;
   const [app, { apiProvider }] = useAppStore();
   const [
      store,
      {
         editor,
         realSize,
         selectBlock,
         setStore,
         getRelativePosition,
         getRelativeSize,
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
   function readAsDataUrl(b: Blob) {
      return new Promise<string>((resolve, reject) => {
         const reader = new FileReader();
         reader.onloadend = () => resolve(reader.result as string);
         reader.onerror = (e) => reject(reader.error);
         reader.readAsDataURL(b);
      });
   }
   async function onPaste(e: ClipboardEvent) {
      e.preventDefault();
      console.log(e);
      const file = Array.from(e.clipboardData.files)[0];
      if (!file) return;

      if (file.type.includes('image')) {

         const dimension = await getImgDimension(URL.createObjectURL(file));
         const ratio = dimension.width / dimension.height;
         const { fGridWidth, mGridWidth, blockMaxSize, blockMinSize } = store.document.layoutOptions;
         let width = mGridWidth;
         let height = Math.ceil(width / ratio);
         console.log('calculated image dimension', dimension, 'relative', width, height);

         if (height > blockMaxSize.height) {
            height = blockMaxSize.height;
            width = Math.ceil(ratio * height);
         }
         const x = (fGridWidth - mGridWidth) / 2;
         const y = findNextSpaceBelow(null);
         const transform: BlockTransform = {
            width, height,
            x, y,
         };
         console.log(x, y, width, height);
         const { correct } = checkPlacement(transform, x, y);
         if (!correct) {
            alert('Not enough space to place block in layout =(');
            return;
         }
         const imgBase64 = await readAsDataUrl(file);
         const block: ImageBlock = {
            id: crypto.randomUUID(),
            type: 'image',
            src: imgBase64,
            ...transform,
         };
         setStore('document', 'blocks', blocks => blocks.concat(block));
         setStore({
            editingBlock: store.document.blocks[store.document.blocks.length - 1],
            editingType: 'select'
         });
         await app.apiProvider.updateDocument(app.selectedDocument);
      }
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
            ...newBlockTransform,
         };
         setStore('document', 'blocks', blocks => blocks.concat(block));
         block = store.document.blocks[store.document.blocks.length - 1];
         setStore({
            editingBlock: block,
            editingType: 'content'
         });
      }
   }

   //    function requirestClipboardPermissions() {
   //       navigator.permissions.query({name:''}).then(function(result) {
   //          report(result.state);
   //        });
   //    }

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
               <BlokiCanvasGrid />
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
         <div class={s.controls}>
            <div class={s.control}>Block id: [{store.editingBlock?.id}]</div>
            <div class={s.control}>Editing type: [{store.editingType}]</div>
         </div>
         <Show when={props.showDrawerToolbox}>
            <DrawerToolbox />
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