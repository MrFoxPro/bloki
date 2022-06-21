import './bloki-editor.scss';

import { createEffect, For, mergeProps, on, onCleanup, onMount, Show } from 'solid-js';
import { useEditorStore } from './editor.store';
import { Block } from './blocks/block.component';
import { AnyBlock, BlockTransform, BlockType, Dimension, isTextBlock, Point } from './types/blocks';
import { getAsString, getGoodImageRelativeSize, toBase64 } from './helpers';
import { TextBlockFontFamily } from './blocks/text/types';
import { Backlight } from './backlight/backlight';
import { BlockContextMenu } from './context-menu/context-menu.component';
import { Drawer } from './drawer/drawer';
import { useDrawerStore } from './drawer.store';
import { EditType, Instrument } from './types/editor';
// import { WSMsgType } from '@/lib/network.types';
// import { Cursors } from '../collab/cursors/cursors.component';

type BlokiEditorProps = {
   gridType?: 'dom' | 'canvas';
};
function BlokiEditor(props: BlokiEditorProps) {
   props = mergeProps({
      gridType: 'canvas'
   }, props);

   let containerRef: HTMLDivElement;
   let wrapperRef: HTMLDivElement;
   const [
      store,
      {
         staticEditorData,
         realSize,
         selectBlock,
         setEditorStore,
         getRelativePosition,
         checkPlacement,
      }
   ] = useEditorStore();
   const [drawerStore] = useDrawerStore();

   const GRID_COLOR_CELL = '#ffae0020';

   function calculateBoxRect() {
      if (!containerRef) return;
      const containerRect = containerRef.getBoundingClientRect();
      staticEditorData.containerRect = containerRect;
      staticEditorData.emit('containerrectchanged', containerRect);
   };

   function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
         if ([EditType.Content, EditType.Select].includes(store.editingType)) {
            selectBlock(null);
         }
      }
      else if (e.key === 'Enter') {
         if (store.editingType === null || (store.editingType === EditType.Content && isTextBlock(store.editingBlock))) {
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
   function findNextSpaceBelow(requiredSpace: Dimension, startFrom: Point = { x: 0, y: 0 }): Point {
      const sorted = store.layout
         .filter((b) => isInMainGrid(b.x) || isInMainGrid(b.x + b.width))
         .sort((a, b) => -b.y - b.height + a.y + a.height);

      let pos: Point;
      for (let i = 1; i < sorted.length; i++) {
         const prev = sorted[i - 1];
         const curr = sorted[i];
         if (requiredSpace.height < curr.y - (prev.y + prev.height)) {
            const p = { x: prev.x, y: prev.y + prev.height };
            const { correct } = checkPlacement({ ...p, ...requiredSpace });
            if (correct) {
               pos = p;
               break;
            }
         }
      }
      console.log(pos);
      if (pos) return pos;

      const lastBlock = sorted[sorted.length - 1];
      if (!lastBlock) return { x: store.document.layoutOptions.mGridWidth, y: 1 };
      return { x: lastBlock.x, y: lastBlock.y + lastBlock.height };
   }

   function onMainGridMouseMove(e: MouseEvent) {
      if (store.editingType) return;
      const { y } = getRelativePosition(e.pageX - staticEditorData.containerRect.x, e.pageY - staticEditorData.containerRect.y);
      const { mGridWidth, fGridWidth } = store.document.layoutOptions;
      const x = (fGridWidth - mGridWidth) / 2;
      const block = { x, y, width: mGridWidth, height: 1 };
      const { correct } = checkPlacement(block);
      if (correct) {
         staticEditorData.emit('maingridcursormoved', block, false);
      }
   }

   function onMainGridMouseOut(e: MouseEvent) {
      staticEditorData.emit('maingridcursormoved', null, true);
   }

   const pasteError = () => alert('We are allowing only images pasted from other internet sources!');

   async function onPaste(e: ClipboardEvent) {
      e.preventDefault();
      let src: string;

      const file = Array.from(e.clipboardData.files)[0];
      const itemHtml = Array.from(e.clipboardData.items).find(x => x.type === 'text/html');
      if (itemHtml) {
         const str = await getAsString(itemHtml);
         const regexp = str.match(/<img [^>]*src="[^"]*"[^>]*>/gm);
         if (!regexp) return;
         const imgSrc = regexp.map(x => x.replace(/.*src="([^"]*)".*/, '$1'))[0] as string;
         if (!imgSrc?.includes('http')) {
            pasteError();
            return;
         }
         src = imgSrc;
      }
      if (file && !src) {
         const isFileImage = ['png', 'svg', 'jpeg', 'jpg', 'gif'].some((ext) => file.type.includes(ext));
         if (!isFileImage) return;
         console.log(Array.from(e.clipboardData.files), Array.from(e.clipboardData.items));
         const imgSrc = await toBase64(file);
         src = imgSrc;
      }
      if (!src) return;
      // const { fGridWidth, mGridWidth } = store.document.layoutOptions;
      const { width, height } = await getGoodImageRelativeSize(src, store.document.layoutOptions);
      const { x, y } = findNextSpaceBelow({ width, height });
      const transform: BlockTransform = {
         width, height,
         x, y,
      };
      createBlock({
         type: BlockType.Image,
         value: src,
         ...transform,
      }, EditType.Select);
   }

   function onGridClick(e: MouseEvent & { currentTarget: HTMLDivElement; }, grid: 'main' | 'foreground') {
      if (store.editingBlock) {
         selectBlock(null);
         return;
      }
      let { x, y } = getRelativePosition(e.pageX - staticEditorData.containerRect.x, e.pageY - staticEditorData.containerRect.y);

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
         }, EditType.Content);
      }
   }

   function createBlock(block: Partial<AnyBlock>, editingType: EditType = EditType.Content, id = crypto.randomUUID()) {
      block.id = id;
      setEditorStore('layout', blocks => blocks.concat(block as AnyBlock));
      const createdBlock = store.layout[store.layout.length - 1];
      // send(WSMsgType.CreateBlock, createdBlock);
      setEditorStore({
         editingBlock: createdBlock,
         editingType,
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

   createEffect(on(() => JSON.stringify(store.document.layoutOptions), calculateBoxRect));

   return (
      <div
         class="wrapper"
         id="wrapper"
         ref={wrapperRef}
      >
         <div
            class="container"
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
               'user-select': drawerStore.instrument !== Instrument.Cursor ? 'none' : 'initial',
            }}
         >
            {/* For scroll snap, but not working properly in ff */}
            {/*
					<div class={s.zones}>
						<For each={new Array(3).fill(null)}>
							{() => (
								<div
									class={s.zone}
									style={{
										width: realSize().mGridWidth_px,
										height: realSize().fGridHeight_px
									}}
								/>
							)}
						</For>
					</div>  */}
            <Backlight type={props.gridType} />
            <div
               class="grid foreground"
               style={{
                  width: realSize().fGridWidth_px,
                  height: realSize().fGridHeight_px,
               }}
               onClick={(e) => onGridClick(e, 'foreground')}
               onContextMenu={(e) => e.preventDefault()}
            />
            <div
               class="grid main"
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
               onContextMenu={(e) => e.preventDefault()}
            />
            <For each={store.layout}>
               {(block) => (
                  <Block block={block} />
               )}
            </For>
            <Show when={store.editingType === EditType.Drag}>
               <Block block={store.editingBlock} shadowed />
            </Show>
            <Drawer />
            <BlockContextMenu />
            {/* <Cursors /> */}
         </div>

      </div>
   );
}

export default BlokiEditor;
