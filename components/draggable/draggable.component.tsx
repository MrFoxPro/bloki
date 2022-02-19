import {
   batch,
   ComponentProps,
   createComputed,
   createSignal,
   JSX,
   onCleanup,
   onMount,
   splitProps,
} from 'solid-js';

import s from './draggable.module.scss';

type DraggableProps = {
   x?: number;
   y?: number;
   onDrag?: (absX?: number, absY?: number, x?: number, y?: number) => void;
   onDragStart?: (absX?: number, absY?: number, x?: number, y?: number) => void;
   onDragEnd?: (absX?: number, absY?: number, x?: number, y?: number) => void;

   disallowed?: string[];
   children?: JSX.Element | JSX.Element[];

   relativeParent?: boolean;

   addRelX?: (el: Element) => number;
   addRelY?: (el: Element) => number;

   style?: JSX.CSSProperties;
} & Omit<ComponentProps<'div'>, 'onDrag' | 'ondrag' | 'onDragStart' | 'ondragstart' | 'onDragEnd' | 'ondragend' | 'style'>;

export default function Draggable(props: DraggableProps) {
   let relX = 0;
   let relY = 0;

   const [x, setX] = createSignal(props?.x ?? 0);
   const [y, setY] = createSignal(props?.y ?? 0);
   const [fixed, setFixed] = createSignal(false);

   let parentElement: HTMLElement;
   let handle: HTMLDivElement | undefined;

   onMount(() => (parentElement = handle.parentElement));

   createComputed(() => {
      const parentBox = parentElement?.getBoundingClientRect();

      batch(() => {
         setX(props.x - (props.relativeParent ? parentBox?.x : 0));
         setY(props.y - (props.relativeParent ? parentBox?.y : 0));
      });
   });

   onCleanup(() => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
   });

   function onStart(e: MouseEvent) {
      if (!handle) throw new Error('handle is undefined!');
      const body = document.body;
      const box = handle.getBoundingClientRect();
      relX = e.clientX - (box.left + body.scrollLeft - body.clientLeft);
      relY = e.clientY - (box.top + body.scrollTop - body.clientTop);
      onMouseMove(e, false);
      props.onDragStart && props.onDragStart(e.clientX - relX, e.clientY - relY);
   }

   function onMouseDown(e: MouseEvent) {
      if (e.button !== 0) return;
      if (fixed()) setFixed(false);
      onStart(e);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
   }

   function onMouseUp(e: MouseEvent) {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      props.onDragEnd && props.onDragEnd(e.clientX - relX, e.clientY - relY, x(), y());
      e.preventDefault();
   }

   function onMouseMove(e: MouseEvent, notify = true) {
      const isPathDisallowed =
         props.disallowed && e.composedPath().some(x => props.disallowed.includes((x as Element).id));
      if (isPathDisallowed || fixed()) {
         if (!fixed()) setFixed(true);
         return;
      }
      const parentBox = parentElement.getBoundingClientRect();
      const offX = props.addRelX ? props.addRelX(handle) : 0;
      const offY = props.addRelY ? props.addRelY(handle) : 0;
      const newX = e.clientX - relX - parentBox.x + offX;
      const newY = e.clientY - relY - parentBox.y + offY;
      if (newX !== x() || newY !== y()) {
         batch(() => {
            setX(newX);
            setY(newY);
         });
         notify && props.onDrag && props.onDrag(e.clientX - relX, e.clientY - relY, newX, newY);
      }
   }

   const [local, others] = splitProps(props, [
      'classList',
      'style',
      'onDrag',
      'onDragStart',
      'onDragEnd',
      'relativeParent',
      'x',
      'y',
   ]);

   return (
      <div
         onMouseDown={onMouseDown}
         classList={{ [s.draggable]: true, ...local.classList }}
         style={{
            transform: `translate(${x()}px, ${y()}px)`,
            ...local.style,
         }}
         ref={handle}
         {...others}
      >
         {props.children}
      </div>
   );
}
