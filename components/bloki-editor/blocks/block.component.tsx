import { createComputed, createEffect, createMemo, createSignal, For, onCleanup, Show } from 'solid-js';
import { Point, useEditorStore } from '../editor.store';
import type { AnyBlock, BlockType } from '@/lib/entities';
import s, { edge } from './block.module.scss';

import { Dynamic } from 'solid-js/web';
import { TextBlock } from './text-block/text.block.component';
import { createStore } from 'solid-js/store';

type BlockProps = {
   block: AnyBlock;
   shadowed?: boolean;
};
const blockContentTypeMap: Record<BlockType, any> = {
   image: null,
   text: TextBlock,
};

enum BlockVert {
   NW,
   NE,
   SE,
   SW,
}

enum BlockEdge {
   L,
   T,
   R,
   B
}
export function Block(props: BlockProps) {
   const [editor, {
      onChangeStart,
      onChange,
      onChangeEnd,
      getAbsoluteSize,
      getAbsolutePosition,
      selectBlock,
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
   let mouseInside = false;

   enum ResizerState {
      None,
      Micro,
      Full
   }
   enum VertEdgeCursor {
      W = 'w-resize',
      N = 'n-resize',
      E = 'e-resize',
      S = 's-resize',
   }
   const [state, setState] = createStore({
      fixed: false,
      transform: {
         ...getAbsolutePosition(props.block.x, props.block.y),
         ...getAbsoluteSize(props.block.width, props.block.height)
      },
      dot: {
         state: ResizerState.None,
         x: 0,
         y: 0,
         side: VertEdgeCursor.E,
      },
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

   const RESIZER_LOD_ACTIVATE_OUTER_LIM = 130;
   const RESIZER_ACTIVATE_OUTER_LIM = 60;

   const CURSOR_X_OFFSET = 0;
   const CURSOR_Y_OFFSET = -1;


   let relPoints: Point[];

   createComputed(() => {
      const x = 0, y = 0;
      relPoints = [
         { x, y },
         { x: x + state.transform.width, y },
         { x: x + state.transform.width, y: y + state.transform.height },
         { x, y: y + state.transform.height }
      ];
   });

   function onMouseMove(e: MouseEvent) {

      // if (mouseInside) {
      //    setState('dot', { state: ResizerState.None });
      //    return;
      // }
      // Current mouse point
      const M: Point = {
         x: e.pageX - editor.containerRect.x - state.transform.x + CURSOR_X_OFFSET,
         y: e.pageY - editor.containerRect.y - state.transform.y + CURSOR_Y_OFFSET,
      };

      let sample: {
         point: Point;
         dist: number;
         t: number;
         i: number;
      }[] = [];

      for (let i = 0; i < 4; i++) {
         const p1 = relPoints[!i ? 3 : i - 1];
         const p2 = relPoints[i];

         const t = ((M.x - p1.x) * (p2.x - p1.x) + (M.y - p1.y) * (p2.y - p1.y)) / ((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

         const point: Point = {
            x: p1.x + t * (p2.x - p1.x),
            y: p1.y + t * (p2.y - p1.y)
         };

         const dist = Math.sqrt((point.x - M.x) ** 2 + (point.y - M.y) ** 2);
         sample.push({
            dist,
            i,
            point,
            t
         });
      }

      sample = sample.sort((a, b) => a.dist - b.dist);

      let dot = sample[0];
      if(dot.t < 0 || dot.t > 1) {

      }
      if (!dot) {
         setState('dot', { state: ResizerState.None });
         return;
      }

      let resState: ResizerState;
      if (dot.dist > RESIZER_LOD_ACTIVATE_OUTER_LIM) {
         resState = ResizerState.None;
      }
      else if (dot.dist <= RESIZER_LOD_ACTIVATE_OUTER_LIM && dot.dist > RESIZER_ACTIVATE_OUTER_LIM) {
         resState = ResizerState.Micro;
      }
      else if (dot.dist <= RESIZER_ACTIVATE_OUTER_LIM) {
         resState = ResizerState.Full;
      }

      dot.point.x -= resState === ResizerState.Full ? 3 : 2;
      dot.point.y -= resState === ResizerState.Full ? 3 : 2;

      if (dot.i === 0) {
         dot.point.x -= 1;
      }

      else if (dot.i === 1) {
         dot.point.y -= 1;
      }

      setState('dot', {
         state: resState,
         x: dot.point.x,
         y: dot.point.y,
         side: Object.values(VertEdgeCursor)[dot.i]
      });
   }

   createEffect(() => {
      if (isMeEditing()) {
         window.addEventListener('mousemove', onMouseMove, { passive: true });
      }
      else {
         setState('dot', 'state', ResizerState.None);
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
      e.preventDefault();
      e.stopImmediatePropagation();
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
      pointerDown = false;
      boxRef.onpointermove = null;
      const { x, y, width, height } = state.transform;
      onChangeEnd(props.block, { x, y, width, height }, 'drag');
      e.preventDefault();
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

   function onVertPointerDown(e: PointerEvent & { currentTarget: HTMLDivElement; }, vertIndex: number) {
      e.preventDefault();

      relX = e.pageX;
      relY = e.pageY;

      e.currentTarget.setPointerCapture(e.pointerId);

      e.currentTarget.onpointerup = (e) => onVertPointerUp(e, vertIndex);
      e.currentTarget.onpointermove = (e) => onVertPointerMove(e, vertIndex);
      // onChangeStart(props.block, 'resize');
   }

   function onVertPointerMove(e: PointerEvent, vert: BlockVert) {
      let { x, y, width, height } = state.transform;

      switch (vert) {
         case BlockVert.NW: {
            const yc = e.pageY - editor.containerRect.y;
            height += y - yc;
            y = yc;

            const xc = e.pageX - editor.containerRect.x;
            width += x - xc;
            x = xc;
            break;
         }
         case BlockVert.NE: {
            width = e.pageX - state.transform.x - editor.containerRect.x;

            const yc = e.pageY - editor.containerRect.y;
            height += y - yc;
            y = yc;
            break;
         }
         case BlockVert.SE: {
            width = e.pageX - state.transform.x - editor.containerRect.x;
            height = e.pageY - state.transform.y - editor.containerRect.y;
            break;
         }

         case BlockVert.SW: {
            const xc = e.pageX - editor.containerRect.x;
            width += x - xc;
            x = xc;

            height = e.pageY - state.transform.y - editor.containerRect.y;
            break;
         }

      }
      // const { width: minWidth, height: minHeight } = minBlockstate.transform.size;
      // const { width: maxWidth, height: maxHeight } = maxBlockstate.transform.size;

      // if (width < minWidth) width = minWidth;
      // if (height < minHeight) height = minHeight;
      // if (width > maxWidth) width = maxWidth;
      // if (height > maxHeight) height = maxHeight;

      // if (x < 1) x = state.transform.pos.x;
      // if (y < 1) y = state.transform.pos.y;

      // if (x <> 1) height = state.transform.pos.x;
      // if (y < 1) width = state.transform.pos.y;
      setState('transform', {
         x, y, width, height
      });

      onChange(props.block, { x, y, width, height }, 'resize');
   }

   function onVertPointerUp(e: PointerEvent, vertIndex: number) {
      (e.currentTarget as HTMLDivElement).onpointermove = null;
      (e.currentTarget as HTMLDivElement).onpointerup = null;
      const { x, y, width, height } = state.transform;
      onChangeEnd(props.block, { x, y, width, height }, 'resize');
   }


   return (
      <div
         style={{
            transform: `translate(${state.transform.x}px, ${state.transform.y}px)`,
            width: `${state.transform.width}px`,
            height: `${state.transform.height}px`,
         }}
         classList={{
            [s.block]: true,
            [s.draggable]: true,
            [s.dragging]: isMeDragging(),
            [s.selected]: isMeEditing(),
         }}
         ref={boxRef}
         onClick={onBoxClick}
         ondragstart={(e) => e.preventDefault()}
         ondrop={(e) => e.preventDefault()}
         draggable={false}
         onPointerDown={(e) => onBoxPointerDown(e, 1)}
         onPointerUp={() => pointerDown = false}
         onPointerOver={() => {
            mouseInside = true;
         }}
         onPointerOut={() => {
            mouseInside = false;
            if (pointerDown && isMeEditing() && !isMeDragging()) {
               selectBlock(props.block, 'select');
            }
         }}
      >
         <svg
            classList={{
               [s.handy]: true,
               [s.dragging]: isMeDragging()
            }}
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
         <Show when={state.dot.state !== ResizerState.None}>
            <div
               class={s.dotWrapper}
               style={{
                  transform: `translate(${state.dot.x}px, ${state.dot.y}px)`,
               }}
            >
               <div
                  classList={{
                     [s.sizedot]: true,
                     [s.expand]: state.dot.state === ResizerState.Full
                  }}
                  style={{
                     transform: `scale(${state.dot.state === ResizerState.Full ? 2.2 : 1})`,
                     cursor: state.dot.side,
                  }}
               />
            </div>
         </Show>
         <Dynamic component={blockContentTypeMap[props.block.type]} block={props.block} selected={isMeEditing()} />
      </div>
   );
};