import { Component, ComponentProps, For, splitProps, useContext } from 'solid-js';
import s from './bloki-editor.module.scss';
import cc from 'classcat';
import { EditorStoreProvider, useEditorStore } from './editor.store';
import { BlokiCanvasGrid } from './canvas-grid/canvas-grid.component';
import type { BlockType } from '../../lib/entities';
import { Block } from './blocks/block.component';

type BlokiEditorProps = {

};

function BlokiEditor(props: BlokiEditorProps) {

   let editingBlock: HTMLDivElement;
   let containerRef: HTMLDivElement;

   const [editor, { onDragStart, onDrag, onDragEnd, gridSize, realSize }] = useEditorStore();

   const blockMap: Record<BlockType, Component> = {
      text: null,
      image: null,
   };

   return (
      <div
         class={s.container}
         ref={containerRef}
         style={{
            'background-image': `repeating-linear-gradient(
               0deg,
               #dadada60 0 ${realSize().size_px},
               transparent 0 ${realSize().sum_px}
            ),
            repeating-linear-gradient(90deg, #dadada60 0 ${realSize().size_px}, transparent 0 ${realSize().sum_px})`,
            width: realSize().fGridWidth_px,
            height: realSize().fGridHeight_px
         }}
      >
         <BlokiCanvasGrid />
         <div
            class={cc([s.grid, s.foregroundGrid])}
            style={{
               width: realSize().fGridWidth_px,
               height: realSize().fGridHeight_px
            }}
         />
         <div
            class={cc([s.grid, s.mainGrid])}
            style={{
               width: realSize().mGridWidth_px,
               height: realSize().mGridHeight_px,
               margin: `0 ${(realSize().fGridWidth - realSize().mGridWidth) / 2}px`
            }}
         >
         </div>
         <For each={editor.document.blocks}>
            {(block) => (
               <Block block={block} />
            )}
         </For>
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