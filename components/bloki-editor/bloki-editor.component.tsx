import { ComponentProps, createRenderEffect, For, onCleanup, Show, splitProps } from 'solid-js';
import s from './bloki-editor.module.scss';
import cc from 'classcat';
import { EditorStoreProvider, useEditorStore } from './editor.store';
import { BlokiCanvasGrid } from './canvas-grid/canvas-grid.component';
import { Block } from './blocks/block.component';
import { debounce } from 'lodash-es';

type BlokiEditorProps = {

};
function BlokiEditor(props: BlokiEditorProps) {

   let containerRef: HTMLDivElement;

   const [editor, { onGridDblClick, realSize, selectBlock, setStore }] = useEditorStore();

   const calculateBoxRect = debounce(() => {
      const containerRect = containerRef.getBoundingClientRect();
      setStore({ containerRect });
   }, 150);

   createRenderEffect(() => {
      calculateBoxRect();
      window.addEventListener('resize', calculateBoxRect);
      onCleanup(() => {
         window.removeEventListener('resize', calculateBoxRect);
      });
   });

   return (
      <div class={s.wrapper} onScroll={calculateBoxRect}>
         <div
            class={s.container}
            ref={containerRef}
            style={{
               'background-image': editor.document.layoutOptions.showGridGradient === true ?
                  `repeating-linear-gradient(
                  0deg,
                  #dadada60 0 ${realSize().size_px},
                  transparent 0 ${realSize().sum_px}
               ),
               repeating-linear-gradient(90deg, #dadada60 0 ${realSize().size_px}, transparent 0 ${realSize().sum_px})`
                  : null,
               width: realSize().fGridWidth_px,
               height: realSize().fGridHeight_px,
            }}
            onScroll={calculateBoxRect}
         >
            <BlokiCanvasGrid />
            <div
               class={cc([s.grid])}
               style={{
                  width: realSize().mGridWidth_px,
                  height: realSize().mGridHeight_px,
                  margin: `0 ${(realSize().fGridWidth - realSize().mGridWidth) / 2}px`,
                  background: editor.document.layoutOptions.showGridGradient === true ? 'rgba(128, 128, 128, 0.507)' : null,
               }}
            />
            <div
               class={cc([s.grid, s.foregroundGrid])}
               style={{
                  width: realSize().fGridWidth_px,
                  height: realSize().fGridHeight_px,
               }}
               onDblClick={onGridDblClick}
               onPointerDown={() => selectBlock(null)}
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