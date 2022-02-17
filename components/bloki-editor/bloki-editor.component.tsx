import { capacitor } from '@/lib/capacitor';
import { ComponentProps, createEffect, mergeProps, splitProps } from 'solid-js';
import Draggable from '../draggable/draggable.component';
import s from './bloki-editor.module.scss';
import { gridSize, DEFAULT_FOREGROUND_GRID_FACTOR } from './config';
import cc from 'classcat';
import { EditorStoreProvider } from './editor.store';
import { BlokiCanvasGrid } from './canvas-grid/canvas-grid.component';

type BlokiEditorProps = {

};

function BlokiEditor(props: BlokiEditorProps) {

   let editingBlock: HTMLDivElement;
   props = mergeProps({

   }, props);

   const onBlockDblClick = capacitor((e: MouseEvent & { currentTarget: HTMLDivElement; }) => {
      e.preventDefault();
      if (editingBlock === e.currentTarget) return;
      e.currentTarget.setAttribute('contenteditable', 'true');
      e.currentTarget.focus();
      editingBlock = e.currentTarget;
   }, 2);

   function onBlockUnfocus() {
      if (!editingBlock) return;
      editingBlock.removeAttribute('contenteditable');
      editingBlock = null;
   }

   return (
      <div class={s.container}>
         <BlokiCanvasGrid />
         <div class={cc([s.grid, s.foregroundGrid])} />
         <div class={cc([s.grid, s.mainGrid])}>
         </div>
         <Draggable
            class={s.block}
            onClick={onBlockDblClick}
            onFocusOut={onBlockUnfocus}
         >
         </Draggable>
      </div>
   );
}

type WrappedEditorProps = Omit<ComponentProps<typeof EditorStoreProvider>, 'children'> & ComponentProps<typeof BlokiEditor>;
const WrappedEditor = (props: WrappedEditorProps) => {
   const [provider, others] = splitProps(props, ['layout']);
   return (
      <EditorStoreProvider {...provider}>
         <BlokiEditor {...others} />
      </EditorStoreProvider>
   );
};

export {
   WrappedEditor as BlokiEditor
};