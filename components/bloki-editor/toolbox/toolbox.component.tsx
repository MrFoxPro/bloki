import s from './toolbox.module.scss';
import { DrawingColor, Instrument } from '@/components/bloki-editor/types';
import { createSignal, For, Show } from 'solid-js';
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
import { createStore } from 'solid-js/store';
import { useDrawerStore } from '../drawer.store';

const instruments = [
   [Instrument.Circle, CircleIcon],
   [Instrument.Triangle, TriangleIcon],
   [Instrument.Rect, RectIcon],
   [Instrument.Cursor, CursorIcon],
   [Instrument.Marker, FlomasterIcon],
   [Instrument.Lastik, EraserIcon]
] as const;

export function Toolbox() {
   const [store, { setStore }] = useDrawerStore();

   const [showInstrSettings, setShowInstrSettings] = createSignal(false);


   function onClick(type: Instrument) {
      if (showInstrSettings()) {
         setShowInstrSettings(false);
         return;
      }
      setShowInstrSettings(type !== Instrument.Cursor);
      setStore({ instrument: type });
   }

   return (
      <div class={s.toolbox}>
         <For each={instruments}>
            {([type, icon]) => (
               <SVGIcon
                  classList={{
                     [s.active]: type === store.instrument
                  }}
                  component={icon}
                  onClick={() => onClick(type)}
               />
            )}
         </For>
         <Show when={showInstrSettings()}>
            <div class={s.configurator}>
               <input
                  type="range"
                  min={2}
                  max={20}
                  step={0.5}
                  value={store.drawingColor}
                  onChange={(e) => setStore({
                     strokeWidth: e.currentTarget.valueAsNumber
                  })}
               />
               <div class={s.colors}>
                  {Object.values(DrawingColor).map(color =>
                     <div
                        class={s.color}
                        style={{
                           background: color
                        }}
                        onClick={() => setStore({ drawingColor: color })}
                     />
                  )}
               </div>
            </div>
         </Show>
      </div>
   );
}

export default Toolbox;

// TODO: It can be also implmeneted inside <BlokiEditor> but with portal
// export const createToolbox = () => {
//    const [state, setState] = createStore({
//       instrument: Instrument.Cursor,
//       showInstrSettings: false,
//       strokeWidth: 5,
//       strokeColor: DrawingColor.Blue,
//    });

//    function onClick(type: Instrument) {
//       if (state.showInstrSettings) {
//          setState({
//             showInstrSettings: false
//          });
//          return;
//       }
//       setState({
//          instrument: type,
//          showInstrSettings: type !== Instrument.Cursor
//       });
//    }

//    const component = () => (
//       <div class={s.toolbox}>
//          <For each={instruments}>
//             {([type, icon]) => (
//                <SVGIcon
//                   classList={{
//                      [s.active]: type === state.instrument
//                   }}
//                   component={icon}
//                   onClick={() => onClick(type)}
//                />
//             )}
//          </For>
//          <Show when={state.showInstrSettings}>
//             <div class={s.configurator}>
//                <input type="range" value={state.strokeColor} />
//                <div class={s.colors}>
//                   {Object.values(DrawingColor).map(color =>
//                      <div
//                         class={s.color}
//                         style={{
//                            background: color
//                         }}
//                         onClick={() => setState({ strokeColor: color })}
//                      />
//                   )}
//                </div>
//             </div>
//          </Show>
//       </div>
//    );
//    return [component, state] as const;
// };