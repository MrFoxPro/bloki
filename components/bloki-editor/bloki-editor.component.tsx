import { ComponentProps, For, Show, splitProps } from 'solid-js';
import s from './bloki-editor.module.scss';
import cc from 'classcat';
import { EditorStoreProvider, useEditorStore } from './editor.store';
import { BlokiCanvasGrid } from './canvas-grid/canvas-grid.component';
import type { Block as BlockTsType } from '../../lib/entities';
import { Block } from './blocks/block.component';
import { useAppStore } from '@/lib/app.store';

type BlokiEditorProps = {

};
function BlokiEditor(props: BlokiEditorProps) {

   let editingBlock: HTMLDivElement;
   let containerRef: HTMLDivElement;

   const [editor, { onDragStart, onDrag, onDragEnd, onGridDblClick, gridSize, realSize, getRelativePosition }] = useEditorStore();
   const [app, { setStore }] = useAppStore();

   // function onGridDblClick(e: MouseEvent & { currentTarget: HTMLDivElement; }) {
   //    const { x, y } = getRelativePosition(e.offsetX, e.offsetY);
   //    console.log(x, y, e.offsetX, e.offsetY);
   //    const newBlock: BlockTsType = {
   //       id: crypto.randomUUID(),
   //       height: 1,
   //       width: 3,
   //       type: 'text',
   //       x, y
   //    };
   //    setStore('selectedDocument', 'blocks', blocks => [...blocks, newBlock]);
   // }
   return (
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
            height: realSize().fGridHeight_px
         }}
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
               height: realSize().fGridHeight_px
            }}
            onDblClick={onGridDblClick}
         />
         <For each={editor.document.blocks}>
            {(block) => (
               <Block block={block} />
            )}
         </For>
         <Show when={editor.draggingBlock}>
            <Block block={/*@once*/editor.draggingBlock} shadowed />
         </Show>
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