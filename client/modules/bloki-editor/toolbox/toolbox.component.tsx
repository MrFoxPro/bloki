import './toolbox.scss';

import { createRenderEffect, createSignal, For, onCleanup, Show } from 'solid-js';

import RectIcon from './assets/rect.icon.svg';
import TriangleIcon from './assets/triangle.icon.svg';
import CircleIcon from './assets/circle.icon.svg';

import CursorIcon from './assets/cursor.icon.svg';
import PencilIcon from './assets/pencil.icon.svg';
import EraserIcon from './assets/eraser.icon.svg';
import { useDrawerStore } from '../drawer.store';
import { useEditorContext } from '../editor.store';
import { DrawingColor } from '../types/drawings';
import { Instrument } from '../types/editor';
import { useAppStore } from '@/modules/app.store';

const instruments = [
   // [Instrument.Circle, CircleIcon],
   // [Instrument.Triangle, TriangleIcon],
   // [Instrument.Rect, RectIcon],
   [Instrument.Cursor, CursorIcon],
   [Instrument.Marker, PencilIcon],
   [Instrument.Lastik, EraserIcon]
] as const;

export function Toolbox() {
   const [app] = useAppStore();
   const [drawer, { setDrawerStore }] = useDrawerStore();
   const [editor] = useEditorContext();

   const [showInstrSettings, setShowInstrSettings] = createSignal(false);

   function onClick(type: Instrument) {
      if (showInstrSettings()) {
         setShowInstrSettings(false);
      }
      setShowInstrSettings(type !== Instrument.Cursor);
      setDrawerStore({ instrument: type });
   }

   const instrumentsKeyMap = {
      ['KeyR']: Instrument.Rect,
      ['KeyP']: Instrument.Marker,
      ['KeyV']: Instrument.Cursor,
      ['KeyL']: Instrument.Lastik,
      ['KeyO']: Instrument.Circle
   } as const;
   const availableCodes = Object.keys(instrumentsKeyMap);

   function onKeyUp(e: KeyboardEvent) {
      if (!app.name || editor.editingBlock) return;
      if (availableCodes.includes(e.code)) {
         setDrawerStore({
            instrument: instrumentsKeyMap[e.code]
         });
      }
   }

   createRenderEffect(() => {
      document.addEventListener('keydown', onKeyUp);
      onCleanup(() => {
         document.removeEventListener('keydown', onKeyUp);
      });
   });
   return (
      <div class="toolbox">
         <For each={instruments}>
            {([type, Icon]) => (
               <Icon
                  classList={{
                     'active': type === drawer.instrument
                  }}
                  onClick={() => onClick(type)}
               />
            )}
         </For>
         <Show when={showInstrSettings()}>
            <div class="configurator">
               <div class="strokeWidth">
                  <label>{'toolbox.configurator.stroke-width'}: {drawer.strokeWidth}</label>
                  <input
                     type="range"
                     min={2}
                     max={20}
                     step={0.5}
                     value={drawer.strokeWidth}
                     onInput={(e) => setDrawerStore({
                        strokeWidth: e.currentTarget.valueAsNumber
                     })}
                  />
               </div>
               <Show when={drawer.instrument !== Instrument.Lastik}>
                  <div class="colors">
                     {Object.values(DrawingColor).map(color =>
                        <div
                           class="color"
                           classList={{
                              "selected": drawer.drawingColor === color
                           }}
                           style={{
                              background: color,
                           }}
                           onClick={() => setDrawerStore({ drawingColor: color })}
                        />
                     )}
                  </div>
               </Show>
            </div>
         </Show>
      </div>
   );
}

export default Toolbox;
