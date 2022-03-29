import cc from 'classcat';
import { createComputed, createEffect, createMemo, For, Match, onCleanup, Show, Switch } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { createStore } from 'solid-js/store';
import s from './block.module.scss';
import { useEditorStore } from '../editor.store';
import { TextBlock } from './text-block/text.block.component';
import { Dimension, Point } from '../types';
import { ImageBlock } from './image-block/image.block.component';
import HandyIcon from './assets/handy.icon.svg';
import type { AnyBlock, BlockType } from '@/lib/entities';
import { isInside, distanceBetweenPoints } from '../helpers';

enum DotState {
   None,
   Micro,
   Full
}
enum CursorSide {
   NW = 'nw-resize',
   N = 'n-resize',
   NE = 'ne-resize',
   E = 'e-resize',
   SE = 'se-resize',
   S = 's-resize',
   SW = 'sw-resize',
   W = 'w-resize',
}

const blockContentTypeMap: Record<BlockType, any> = {
   image: ImageBlock,
   text: TextBlock,
};

type BlockProps = {
   block: AnyBlock;
   shadowed?: boolean;
};
export function Block(props: BlockProps) {
   const [store, {
      editor,
      onChangeStart,
      onChange,
      onChangeEnd,
      getAbsoluteSize,
      getAbsolutePosition,
      selectBlock,
      gridSize,
   }] = useEditorStore();

   if (props.shadowed) {
      const { x, y } = getAbsolutePosition(props.block.x, props.block.y);
      const { width, height } = getAbsoluteSize(props.block.width, props.block.height);
      return (
         <div
            class={s.block}
            style={{
               width: `${width}px`,
               height: `${height}px`,
               transform: `translate(${x}px, ${y}px)`,
            }}
         >
            <Dynamic component={blockContentTypeMap[props.block.type]} block={props.block} shadowed />
         </div>
      );
   }

   let boxRef: HTMLDivElement | undefined;

   let relX = 0;
   let relY = 0;

   let pointerDown = false;
   let pointerInside = false;

   let capturingSide: CursorSide;

   let getContentDimension: (d: Dimension) => Dimension;

   const RESIZER_LOD_ACTIVATE_OUTER_LIM = 130;
   const RESIZER_ACTIVATE_OUTER_LIM = 30;

   const CURSOR_X_OFFSET = 0;
   const CURSOR_Y_OFFSET = -1;

   let relPoints: Point[];

   const [state, setState] = createStore({
      fixed: false,
      transform: {
         ...getAbsolutePosition(props.block.x, props.block.y),
         ...getAbsoluteSize(props.block.width, props.block.height)
      },
      dot: {
         state: DotState.None,
         x: 0,
         y: 0,
      },
   });

   createComputed(() => {
      const x = 0, y = 0;
      relPoints = [
         { x, y },
         { x: x + state.transform.width, y },
         { x: x + state.transform.width, y: y + state.transform.height },
         { x, y: y + state.transform.height }
      ];
   });

   const isMeEditing = createMemo(() => store.editingBlock === props.block);
   const isMeDragging = createMemo(() => isMeEditing() && store.editingType === 'drag');
   const isMeResizing = createMemo(() => isMeEditing() && store.editingType === 'resize');

   createEffect(() => {
      setState('transform', getAbsolutePosition(props.block.x, props.block.y));
   });

   createEffect(() => {
      setState('transform', getAbsoluteSize(props.block.width, props.block.height));
   });

   createEffect(() => {
      if (!isMeDragging() && !isMeResizing()) {
         setState('transform', getAbsolutePosition(props.block.x, props.block.y));
      }
   });

   createEffect(() => {
      if (!isMeResizing()) {
         setState('transform', getAbsoluteSize(props.block.width, props.block.height));
      }
   });

   function onBoxClick(e: MouseEvent & { currentTarget: HTMLDivElement; }) {
      const rect = e.currentTarget.getBoundingClientRect();

      if (isInside(e.pageX, e.pageY, rect)) {
         selectBlock(props.block, 'content');
      }
      else {
         e.preventDefault();
      }
   }

   function onPointerMove(e: PointerEvent) {
      if (pointerInside) {
         setState('dot', { state: DotState.None });
         return;
      }

      // Current mouse point
      const M: Point = {
         x: e.pageX - editor.containerRect.x - state.transform.x + CURSOR_X_OFFSET,
         y: e.pageY - editor.containerRect.y - state.transform.y + CURSOR_Y_OFFSET,
      };

      let dot: Point;
      if (capturingSide && isMeResizing()) {
         dot = { x: 0, y: 0 };
         switch (capturingSide) {
            case CursorSide.E:
               dot.x = state.transform.width;
               dot.y = Math.min(Math.max(0, M.y), state.transform.height);
               break;
            case CursorSide.W:
               dot.x = 0;
               dot.y = Math.min(Math.max(0, M.y), state.transform.height);
               break;
            case CursorSide.N:
               dot.y = 0;
               dot.x = Math.min(Math.max(0, M.x), state.transform.width);
               break;
            case CursorSide.S:
               dot.y = state.transform.height;
               dot.x = Math.min(Math.max(0, M.x), state.transform.width);
               break;
            case CursorSide.NW:
               dot.x = 0;
               dot.y = 0;
               break;
            case CursorSide.NE:
               dot.x = state.transform.width;
               dot.y = 0;
               break;
            case CursorSide.SW:
               dot.x = 0;
               dot.y = state.transform.height;
               break;
            case CursorSide.SE:
               dot.x = state.transform.width;
               dot.y = state.transform.height;
               break;
         }
         dot.x -= 3;
         dot.y -= 3;
         setState('dot', {
            state: DotState.Full,
            ...dot
         });
         return;
      }

      let minDist = Number.POSITIVE_INFINITY, edgeIndex: number, t: number;

      for (let i = 0; i < 4; i++) {
         const p1 = relPoints[!i ? 3 : i - 1];
         const p2 = relPoints[i];

         const _t = ((M.x - p1.x) * (p2.x - p1.x) + (M.y - p1.y) * (p2.y - p1.y)) / ((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

         const _dot: Point = {
            x: p1.x + _t * (p2.x - p1.x),
            y: p1.y + _t * (p2.y - p1.y)
         };

         const dist = distanceBetweenPoints(_dot, M);
         if (dist < minDist) {
            minDist = dist;
            dot = _dot;
            edgeIndex = i;
            t = _t;
         }
      }

      let p: Point;

      if (t > 1) {
         p = relPoints[edgeIndex];
      }
      else if (t < 0) {
         const newIndex = !edgeIndex ? 3 : edgeIndex - 1;
         p = relPoints[newIndex];
      }
      if (t < 0 || t > 1) {
         dot.x = p.x;
         dot.y = p.y;
         minDist = distanceBetweenPoints(M, dot);
      }
      let resState = state.dot.state;

      if (!isMeResizing()) {
         if (minDist > RESIZER_LOD_ACTIVATE_OUTER_LIM) {
            resState = DotState.None;
         }
         else if (minDist <= RESIZER_LOD_ACTIVATE_OUTER_LIM && minDist > RESIZER_ACTIVATE_OUTER_LIM) {
            resState = DotState.Micro;
         }
         else if (minDist <= RESIZER_ACTIVATE_OUTER_LIM) {
            resState = DotState.Full;
         }
      }
      dot.x -= (resState === DotState.Full ? 3 : 2);
      dot.y -= (resState === DotState.Full ? 3 : 2);

      setState('dot', {
         state: resState,
         x: dot.x,
         y: dot.y,
      });
   }

   createEffect(() => {
      if (isMeEditing()) {
         window.addEventListener('pointermove', onPointerMove);
      }
      else {
         setState('dot', 'state', DotState.None);
         window.removeEventListener('pointermove', onPointerMove);
      }
   });

   onCleanup(() => {
      window.removeEventListener('pointermove', onPointerMove);
   });

   function onBoxPointerDown(e: PointerEvent, btn = 0) {
      pointerDown = true;
      if (e.button !== btn) {
         return;
      }
      if (state.fixed) setState('fixed', false);

      const box = boxRef.getBoundingClientRect();

      const body = document.body;
      relX = e.pageX - (box.left + body.scrollLeft - body.clientLeft);
      relY = e.pageY - (box.top + body.scrollTop - body.clientTop);

      onChangeStart(props.block, state.transform, 'drag');

      boxRef.onpointermove = onBoxPointerMove;
      boxRef.onpointerup = onBoxPointerUp;
      boxRef.setPointerCapture(e.pointerId);
   }

   function onBoxPointerMove(e: PointerEvent) {
      const x = e.pageX - relX - editor.containerRect.x;
      const y = e.pageY - relY - editor.containerRect.y;
      if (x !== state.transform.x || y !== state.transform.y) {
         setState('transform', { x, y });
         const { width, height } = state.transform;
         onChange(props.block, { x, y, width, height }, 'drag');
      }
   }

   function onBoxPointerUp(e: PointerEvent) {
      e.preventDefault();
      e.stopImmediatePropagation();
      pointerDown = false;
      boxRef.onpointermove = null;
      boxRef.onpointerup = null;
      const { x, y, width, height } = state.transform;
      onChangeEnd(props.block, { x, y, width, height }, 'drag');
   }

   function onHookPointerDown(e: PointerEvent, side: CursorSide) {
      relX = e.pageX;
      relY = e.pageY;

      capturingSide = side;

      const dot = e.currentTarget as HTMLDivElement;
      dot.setPointerCapture(e.pointerId);
      dot.onpointerup = onDotPointerUp;
      dot.onpointermove = onHookPointerMove;

      onChangeStart(props.block, state.transform, 'resize');
   }

   function onHookPointerMove(e: PointerEvent) {
      if (state.dot.state === DotState.None) return;

      let { x, y, width, height } = state.transform;

      let εX = 0, εY = 0;
      switch (capturingSide) {
         case CursorSide.W: {
            const xc = e.pageX - editor.containerRect.x;
            width += x - xc;
            x = xc;

            εX = store.document.layoutOptions.gap;
            break;
         }
         case CursorSide.E: {
            width = e.pageX - state.transform.x - editor.containerRect.x;
            break;
         }
         case CursorSide.N: {
            const yc = e.pageY - editor.containerRect.y;
            height += y - yc;
            y = yc;

            εY = store.document.layoutOptions.gap;
            break;
         }
         case CursorSide.S: {
            height = e.pageY - state.transform.y - editor.containerRect.y;
            break;
         }
         case CursorSide.NW: {
            const yc = e.pageY - editor.containerRect.y;
            height += y - yc;
            y = yc;

            const xc = e.pageX - editor.containerRect.x;
            width += x - xc;
            x = xc;

            εY = store.document.layoutOptions.gap;
            εX = store.document.layoutOptions.gap;
            break;
         }
         case CursorSide.NE: {
            width = e.pageX - state.transform.x - editor.containerRect.x;

            const yc = e.pageY - editor.containerRect.y;
            height += y - yc;
            y = yc;
            break;
         }
         case CursorSide.SE: {
            width = e.pageX - state.transform.x - editor.containerRect.x;
            height = e.pageY - state.transform.y - editor.containerRect.y;
            break;
         }
         case CursorSide.SW: {
            const xc = e.pageX - editor.containerRect.x;
            width += x - xc;
            x = xc;
            height = e.pageY - state.transform.y - editor.containerRect.y;
            break;
         }
      }

      const contentDimension = getContentDimension({ width, height });
      if (contentDimension.width > width) {
         if ([CursorSide.W, CursorSide.NW, CursorSide.SW].includes(capturingSide)) {
            x = state.transform.x;
         }
         width = contentDimension.width;
      }
      if (contentDimension.height > height) {
         if ([CursorSide.N, CursorSide.NW, CursorSide.NE].includes(capturingSide)) {
            y = state.transform.y;
         }
         height = contentDimension.height;
      }

      const minWidth = gridSize(1);
      const minHeight = gridSize(1);

      if (width < minWidth) {
         width = minWidth;
         x = state.transform.x;
      }
      if (height < minHeight) {
         height = minHeight;
         y = state.transform.y;
      }

      // batch here?
      setState('transform', { x, y, width, height });

      width += εX;
      height += εY;
      onChange(props.block, { x, y, width, height }, 'resize');
   }

   function onDotPointerUp(e: PointerEvent) {
      const dot = e.currentTarget as HTMLDivElement;
      dot.releasePointerCapture(e.pointerId);
      dot.onpointermove = null;
      dot.onpointerup = null;
      capturingSide = null;
      const { x, y, width, height } = state.transform;
      onChangeEnd(props.block, { x, y, width, height }, 'resize');
   }

   return (
      <div
         class={cc([s.block, s.draggable])}
         style={{
            transform: `translate(${state.transform.x}px, ${state.transform.y}px)`,
            width: `${state.transform.width}px`,
            height: `${state.transform.height}px`,
         }}
         classList={{
            [s.dragging]: isMeDragging(),
            [s.selected]: isMeEditing(),
            [s.resizing]: isMeResizing(),
         }}
         ondragstart={(e) => e.preventDefault()}
         ondrop={(e) => e.preventDefault()}
         draggable={false}
      >
         <HandyIcon
            class={s.handy}
            onPointerDown={(e) => onBoxPointerDown(e, 0)}
         />
         <Show when={state.dot.state !== DotState.None}>
            <div
               class={s.dotWrapper}
               style={{
                  transform: `translate(${state.dot.x}px, ${state.dot.y}px)`,
               }}
            >
               <div
                  class={s.sizedot}
                  classList={{
                     [s.expand]: state.dot.state === DotState.Full,
                  }}
                  style={{
                     transform: `scale(${state.dot.state === DotState.Full ? 2.2 : 1})`,
                  }}
               />
            </div>
         </Show>
         {/* This overlay helps with preveinting mouseenter on firing on child elements */}
         <div
            class={s.overlay}
            ref={boxRef}
            onPointerEnter={() => {
               pointerInside = true;
            }}
            onPointerLeave={() => {
               pointerInside = false;
               if (pointerDown && isMeEditing() && !isMeDragging()) {
                  selectBlock(props.block, 'select');
               }
            }}
            onPointerDown={(e) => onBoxPointerDown(e, 1)}
            onPointerUp={() => pointerDown = false}
            onClick={onBoxClick}
         >
            <Dynamic
               component={blockContentTypeMap[props.block.type]}
               block={props.block}
               isMeDragging={isMeDragging()}
               isMeEditing={isMeEditing()}
               isMeResizing={isMeResizing()}
               localTransform={state.transform}
               setGetContentDimension={(f) => getContentDimension = f}
            />
         </div>
         <Show when={isMeEditing()}>
            <For each={/*@once*/Object.keys(CursorSide) as (keyof typeof CursorSide)[]}>
               {side => (
                  <div
                     class={cc([side.length === 2 ? s.vert : s.edge, s[side.toLowerCase()]])}
                     classList={{
                        [s.showResizeAreas]: store.document.layoutOptions.showResizeAreas
                     }}
                     onPointerDown={(e) => onHookPointerDown(e, CursorSide[side])}
                  />
               )}
            </For>
         </Show>
      </div>
   );
};