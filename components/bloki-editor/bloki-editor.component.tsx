import { ComponentProps, createEffect, For, on, onCleanup, onMount, Show, splitProps } from 'solid-js';
import s from './bloki-editor.module.scss';
import cc from 'classcat';
import { EditorStoreProvider, useEditorStore } from './editor.store';
import { BlokiCanvasGrid } from './canvas-grid/canvas-grid.component';
import { Block } from './blocks/block.component';
import { AnyBlock, TextBlock } from '@/lib/entities';
import { useAppStore } from '@/lib/app.store';
import { unwrap } from 'solid-js/store';
import { DrawerToolbox } from '@/components/drawer/toolbox/toolbox.component';


function isTextBlock(block: AnyBlock): block is TextBlock {
   return block.type === 'text';
}

type BlokiEditorProps = {

};
function BlokiEditor(props: BlokiEditorProps) {

   let containerRef: HTMLDivElement;
   let wrapperRef: HTMLDivElement;

   const [app, { apiProvider }] = useAppStore();
   const [store, { onGridClick, realSize, selectBlock, setStore, editor }] = useEditorStore();

   const calculateBoxRect = () => {
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

   //    function requirestClipboardPermissions() {
   //       navigator.permissions.query({name:''}).then(function(result) {
   //          report(result.state);
   //        });
   //    }

   onMount(() => {
      calculateBoxRect();
      window.addEventListener('resize', calculateBoxRect);
      wrapperRef.addEventListener('scroll', calculateBoxRect, { passive: true });
      window.addEventListener('keydown', onKeyDown);

      onCleanup(() => {
         window.removeEventListener('resize', calculateBoxRect);
         wrapperRef.removeEventListener('scroll', calculateBoxRect);
         window.removeEventListener('keydown', onKeyDown);
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

   createEffect(on(
      () => JSON.stringify(store.document.layoutOptions),
      () => {
         calculateBoxRect();
      }
   ));
   const GRID_COLOR_CELL = '#ffae0020';

   async function onPaste(e: ClipboardEvent) {
      e.preventDefault();
      console.log('pasting', e);
      console.log(Array.from(e.clipboardData.files));
   }

   return (
      <>
         <div
            class={s.wrapper}
            onPaste={onPaste}
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
                  left: realSize().size_px
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
         <DrawerToolbox />
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