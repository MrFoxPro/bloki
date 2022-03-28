import { ComponentProps, createEffect, createRenderEffect, For, on, onCleanup, onMount, Show, splitProps } from 'solid-js';
import s from './bloki-editor.module.scss';
import cc from 'classcat';
import { EditorStoreProvider, useEditorStore } from './editor.store';
import { BlokiCanvasGrid } from './canvas-grid/canvas-grid.component';
import { Block } from './blocks/block.component';
import { throttle } from 'lodash-es';
import { AnyBlock, TextBlock } from '@/lib/entities';
import { useAppStore } from '@/lib/app.store';
import { unwrap } from 'solid-js/store';


function isTextBlock(block: AnyBlock): block is TextBlock {
   return block.type === 'text';
}

type BlokiEditorProps = {

};
function BlokiEditor(props: BlokiEditorProps) {

   let containerRef: HTMLDivElement;

   const [app, { apiProvider }] = useAppStore();
   const [editor, { onGridClick, realSize, selectBlock, setStore, emitter }] = useEditorStore();

   const calculateBoxRect = throttle(() => {
      if (!containerRef) return;
      const containerRect = containerRef.getBoundingClientRect();
      setStore({ containerRect });
   }, 66);

   function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
         if (editor.editingType === 'content' || editor.editingType === 'select') {
            selectBlock(null);
         }
      }
      if (e.key === 'Enter') {
         if (!editor.editingType || (editor.editingType === 'content' && isTextBlock(editor.editingBlock))) {
            console.log('enter');
            e.preventDefault();
         }
      }
   }
   createRenderEffect(() => {
      calculateBoxRect();
      window.addEventListener('resize', calculateBoxRect);
      window.addEventListener('keydown', onKeyDown);
      onCleanup(() => {
         window.removeEventListener('resize', calculateBoxRect);
         window.removeEventListener('keydown', onKeyDown);
      });
   });

   createEffect(on(
      () => JSON.stringify(editor.document.layoutOptions),
      () => {
         calculateBoxRect();
      }
   ));

   onMount(() => {
      const unbindChangeEnd = emitter.on('changeend', (block, { placement, relTransform, type }) => {
         if (placement.correct) {
            console.log('should sync changes here');
            apiProvider.updateDocument(unwrap(editor.document));
         }
      });

      onCleanup(() => {
         unbindChangeEnd();
      });
   });
   const GRID_COLOR_CELL = '#ffae0020';

   async function onPaste(e: ClipboardEvent) {
      e.preventDefault();
      console.log('pasting', e);
      console.log(Array.from(e.clipboardData.files));
   }

   return (
      <div
         class={s.wrapper}
         onScroll={calculateBoxRect}
         onPaste={onPaste}
      >
         <div
            class={s.container}
            ref={containerRef}
            style={{
               'background-image': editor.document.layoutOptions.showGridGradient === true ?
                  `repeating-linear-gradient(
                  0deg,
                  ${GRID_COLOR_CELL} 0 ${realSize().size_px},
                  transparent 0 ${realSize().sum_px}
               ),
               repeating-linear-gradient(90deg, ${GRID_COLOR_CELL} 0 ${realSize().size_px}, transparent 0 ${realSize().sum_px})`
                  : null,
               width: realSize().fGridWidth_px,
               height: realSize().fGridHeight_px,
            }}
            onScroll={calculateBoxRect}
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
                  background: editor.document.layoutOptions.showGridGradient === true ? 'rgba(128, 128, 128, 0.507)' : null,
                  cursor: editor.editingBlock ? 'initial' : 'cell'
               }}
               onClick={(e) => onGridClick(e, 'main')}
            />
            <For each={editor.document.blocks}>
               {(block) => (
                  <Block block={block} />
               )}
            </For>
            <Show when={editor.editingType === 'drag'}>
               <Block block={editor.editingBlock} shadowed />
            </Show>
         </div>
         <div class={s.controls}>
            <div class={s.control}>Block id: [{editor.editingBlock?.id}]</div>
            <div class={s.control}>Editing type: [{editor.editingType}]</div>
         </div>

      </div>
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