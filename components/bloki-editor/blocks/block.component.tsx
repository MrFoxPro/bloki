import { createComputed, createEffect, createMemo, For, Match, onCleanup, Show, Switch } from 'solid-js';
import cc from 'classcat';
import { useEditorStore } from '../editor.store';
import type { AnyBlock, BlockType } from '@/lib/entities';
import s from './block.module.scss';

import { Dynamic } from 'solid-js/web';
import { TextBlock } from './text-block/text.block.component';
import { createStore } from 'solid-js/store';
import { Point } from '../types';


const blockContentTypeMap: Record<BlockType, any> = {
   image: null,
   text: TextBlock,
};
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

type BlockProps = {
   block: AnyBlock;
   shadowed?: boolean;
};
export function Block(props: BlockProps) {
   const [editor, {
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
            classList={{ [s.block]: true, [s.shadow]: true }}
            style={{
               width: `${width}px`,
               height: `${height}px`,
               transform: `translate(${x}px, ${y}px)`,
            }}
         >
            <Dynamic component={blockContentTypeMap[props.block.type]} block={props.block} />
         </div>
      );
   }

   let boxRef: HTMLDivElement | undefined;
   let relX = 0;
   let relY = 0;
   let pointerDown = false;

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

   const isMeEditing = createMemo(() => editor.editingBlock === props.block);
   const isMeDragging = createMemo(() => isMeEditing() && editor.editingType === 'drag');
   const isMeResizing = createMemo(() => isMeEditing() && editor.editingType === 'resize');

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

   function distanceBetweenPoints(p1: Point, p2: Point) {
      return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
   }

   let mouseInside = false;

   let pinnedDotPosition: Point;
   let capturingSide: CursorSide;

   function onMouseMove(e: MouseEvent) {
      if (mouseInside) {
         setState('dot', { state: DotState.None });
         return;
      }

      // Current mouse point
      const M: Point = {
         x: e.pageX - editor.containerRect.x - state.transform.x + CURSOR_X_OFFSET,
         y: e.pageY - editor.containerRect.y - state.transform.y + CURSOR_Y_OFFSET,
      };

      let minDist = Number.POSITIVE_INFINITY, dot: Point, edgeIndex: number, t: number;

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
      dot.x -= resState === DotState.Full ? 3 : 2;
      dot.y -= resState === DotState.Full ? 3 : 2;

      if (isMeResizing()) {
         if (!pinnedDotPosition) pinnedDotPosition = { x: dot.x, y: dot.y };
         if (capturingSide) {
            switch (capturingSide) {
               case CursorSide.E:
               case CursorSide.W:
                  pinnedDotPosition.x = dot.x;
                  break;
               case CursorSide.N:
               case CursorSide.S:
                  pinnedDotPosition.y = dot.y;
                  break;
               default:
                  pinnedDotPosition = { x: dot.x, y: dot.y };
                  break;
            }
            setState('dot', {
               ...pinnedDotPosition
            });
            return;
         }
      }

      setState('dot', {
         state: resState,
         x: dot.x,
         y: dot.y,
      });
   }

   createEffect(() => {
      if (isMeEditing()) {
         window.addEventListener('mousemove', onMouseMove);
      }
      else {
         setState('dot', 'state', DotState.None);
         window.removeEventListener('mousemove', onMouseMove);
      }
   });

   onCleanup(() => {
      window.removeEventListener('mousemove', onmousemove);
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

   function isInside(x: number, y: number, rect: DOMRect) {
      return x < rect.left + rect.width && x > rect.left && y < rect.top + rect.height && y > rect.top;
   }

   function onBoxClick(e: MouseEvent & { currentTarget: HTMLDivElement; }) {
      const rect = e.currentTarget.getBoundingClientRect();

      if (isInside(e.pageX, e.pageY, rect)) {
         selectBlock(props.block, 'content');
      }
      else {
         e.preventDefault();
      }
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

      switch (capturingSide) {
         case CursorSide.W: {
            const xc = e.pageX - editor.containerRect.x;
            width += x - xc;
            x = xc;
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

      const minWidth = gridSize(1);
      const minHeight = gridSize(1);
      if (width < minWidth) width = minWidth;
      if (height < minHeight) height = minHeight;

      // if (height < minHeight) height = minHeight;
      // if (width > maxWidth) width = maxWidth;
      // if (height > maxHeight) height = maxHeight;

      // if (x < 1) x = state.transform.pos.x;
      // if (y < 1) y = state.transform.pos.y;

      // if (x <> 1) height = state.transform.pos.x;
      // if (y < 1) width = state.transform.pos.y;

      // batch here?
      setState('transform', { x, y, width, height });
      onChange(props.block, { x, y, width, height }, 'resize');
   }

   function onDotPointerUp(e: PointerEvent) {
      const dot = e.currentTarget as HTMLDivElement;
      dot.onpointermove = null;
      dot.onpointerup = null;
      pinnedDotPosition = null;
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
         <svg
            class={s.handy}
            width="10"
            height="18"
            viewBox="0 0 10 18"
            onPointerDown={(e) => onBoxPointerDown(e, 0)}
         >
            <path d="M1.5 3.5C2.32843 3.5 3 2.82843 3 2C3 1.17157 2.32843 0.5 1.5 0.5C0.671573 0.5 0 1.17157 0 2C0 2.82843 0.671573 3.5 1.5 3.5Z" />
            <path d="M8.5 3.5C9.32843 3.5 10 2.82843 10 2C10 1.17157 9.32843 0.5 8.5 0.5C7.67157 0.5 7 1.17157 7 2C7 2.82843 7.67157 3.5 8.5 3.5Z" />
            <path d="M1.5 10.5C2.32843 10.5 3 9.82843 3 9C3 8.17157 2.32843 7.5 1.5 7.5C0.671573 7.5 0 8.17157 0 9C0 9.82843 0.671573 10.5 1.5 10.5Z" />
            <path d="M8.5 10.5C9.32843 10.5 10 9.82843 10 9C10 8.17157 9.32843 7.5 8.5 7.5C7.67157 7.5 7 8.17157 7 9C7 9.82843 7.67157 10.5 8.5 10.5Z" />
            <path d="M1.5 17.5C2.32843 17.5 3 16.8284 3 16C3 15.1716 2.32843 14.5 1.5 14.5C0.671573 14.5 0 15.1716 0 16C0 16.8284 0.671573 17.5 1.5 17.5Z" />
            <path d="M8.5 17.5C9.32843 17.5 10 16.8284 10 16C10 15.1716 9.32843 14.5 8.5 14.5C7.67157 14.5 7 15.1716 7 16C7 16.8284 7.67157 17.5 8.5 17.5Z" />
         </svg>
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
               mouseInside = true;
            }}
            onPointerLeave={() => {
               mouseInside = false;
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
               selected={isMeEditing()}
            />
         </div>
         <Show when={isMeEditing()}>
            <For each={/*@once*/Object.keys(CursorSide) as (keyof typeof CursorSide)[]}>
               {side => (
                  <div
                     class={cc([side.length === 2 ? s.vert : s.edge, s[side.toLowerCase()]])}
                     classList={{
                        [s.showResizeAreas]: editor.document.layoutOptions.showResizeAreas
                     }}
                     onPointerDown={(e) => onHookPointerDown(e, CursorSide[side])}
                  />
               )}
            </For>
         </Show>
      </div>
   );
};