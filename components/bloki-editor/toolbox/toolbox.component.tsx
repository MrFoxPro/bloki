import s from './toolbox.module.scss';
import { createRenderEffect, createSignal, For, onCleanup, Show } from 'solid-js';
import { SVGIcon } from '@/components/svg-icon/svg-icon.component';

import RectIcon from './assets/rect.icon.svg';
import TriangleIcon from './assets/triangle.icon.svg';
import CircleIcon from './assets/circle.icon.svg';
import CursorIcon from './assets/cursor.icon.svg';
import PencilIcon from './assets/pencil.icon.svg';
import EraserIcon from './assets/eraser.icon.svg';
import { useDrawerStore } from '../drawer.store';
import { useEditorStore } from '../editor.store';
import { useI18n } from '@solid-primitives/i18n';
import { DrawingColor } from '../types/drawings';
import { Instrument } from '../types/editor';

const instruments = [
   [Instrument.Circle, CircleIcon],
   [Instrument.Triangle, TriangleIcon],
   [Instrument.Rect, RectIcon],
   [Instrument.Cursor, CursorIcon],
   [Instrument.Marker, PencilIcon],
   [Instrument.Lastik, EraserIcon]
] as const;

export function Toolbox() {
   const [t] = useI18n();
   const [drawerStore, { setDrawerStore }] = useDrawerStore();
   const [editorStore, { setEditorStore }] = useEditorStore();

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
      if (editorStore.editingBlock) return;
      if (availableCodes.includes(e.code)) {
         e.preventDefault();
         setDrawerStore({
            instrument: instrumentsKeyMap[e.code]
         });
      }
   }

   createRenderEffect(() => {
      window.addEventListener('keydown', onKeyUp);
      onCleanup(() => {
         window.removeEventListener('keydown', onKeyUp);
      });
   });
   return (
      <div class={s.toolbox}>
         <For each={instruments}>
            {([type, icon]) => (
               <SVGIcon
                  classList={{
                     [s.active]: type === drawerStore.instrument
                  }}
                  component={icon}
                  onClick={() => onClick(type)}
               />
            )}
         </For>
         <Show when={showInstrSettings()}>
            <div class={s.configurator}>
               <div class={s.strokeWidth}>
                  <label>{t('toolbox.configurator.stroke-width')}: {drawerStore.strokeWidth}</label>
                  <input
                     type="range"
                     min={2}
                     max={20}
                     step={0.5}
                     value={drawerStore.strokeWidth}
                     onInput={(e) => setDrawerStore({
                        strokeWidth: e.currentTarget.valueAsNumber
                     })}
                  />
               </div>
               <Show when={drawerStore.instrument !== Instrument.Lastik}>
                  <div class={s.colors}>
                     {Object.values(DrawingColor).map(color =>
                        <div
                           class={s.color}
                           style={{
                              background: color
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