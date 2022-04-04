import s from './toolbox.module.scss';
import { Instrument } from '@/components/bloki-editor/types';
import { createComponent, createSignal, For } from 'solid-js';
import { SVGIcon } from '@/components/svg-icon/svg-icon.component';

import ArrowIcon from './assets/arrow.icon.svg';
import RectIcon from './assets/rect.icon.svg';
import TriangleIcon from './assets/triangle.icon.svg';
import CircleIcon from './assets/circle.icon.svg';
import CursorIcon from './assets/cursor.icon.svg';
import PencilIcon from './assets/pencil.icon.svg';
import PenIcon from './assets/pen.icon.svg';
import FlomasterIcon from './assets/flomaster.icon.svg';
import EraserIcon from './assets/eraser.icon.svg';


const instruments = [
   [Instrument.Circle, CircleIcon],
   [Instrument.Triangle, TriangleIcon],
   [Instrument.Rect, RectIcon],
   [Instrument.Cursor, CursorIcon],
   [Instrument.Marker, FlomasterIcon],
   [Instrument.Lastik, EraserIcon]
] as const;

export const createToolbox = () => {
   const [instr, selectInstr] = createSignal(Instrument.Cursor);
   const component = () => (
      <div class={s.toolbox}>
         <For each={instruments}>
            {([type, icon]) => (
               <SVGIcon
                  classList={{
                     [s.active]: type === instr()
                  }}
                  component={icon}
                  onClick={() => selectInstr(type)}
               />
            )}
         </For>
      </div>
   );
   return [component, instr] as const;
};

function ColorPickers() {
   return (
      <div class={s.pickers}>
         <div
            class={s.picker}
            classList={{ [s.active]: false }}
         >
            <div
               class={s.eyedrop}
               style={{
                  background: '#FC5A5A',
                  width: 10 + 'px',
                  height: 10 + 'px'
               }}
            />
         </div>

         <div
            class={s.picker}
            classList={{ [s.active]: false }}
         >
            <div
               class={s.eyedrop}
               style={{
                  background: '#0075FF',
                  width: 16 + 'px',
                  height: 16 + 'px'
               }}
            />
         </div>
         <div
            class={s.picker}
            classList={{ [s.active]: true }}
         >
            <div
               class={s.eyedrop}
               style={{
                  background: '#FFD600',
                  width: 24 + 'px',
                  height: 24 + 'px'
               }}
            />
         </div>
      </div>
   );
}