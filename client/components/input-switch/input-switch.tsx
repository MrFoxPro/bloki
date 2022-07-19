import './input-switch.scss';
import { batch, ComponentProps, createEffect, on } from 'solid-js';
import { createRAF, targetFPS } from '@solid-primitives/raf';
import { createStore } from 'solid-js/store';

type SwitchProps = {} & ComponentProps<'input'>;
export function Switch(props: SwitchProps) {
   const [store, setStore] = createStore({
      checked: props.checked,
      d1: !props.checked ? 'M7,1 L1,7' : 'M8.5,1 L2.5,7',
      d2: !props.checked ? 'M1,1 L7,7' : 'M2.5,7 L0,4.5'
   });
   let startTime: number;
   const animDuration = 100;
   const [, start, stop] = createRAF(
      targetFPS((time) => {
         if (!startTime) {
            startTime = time;
         }
         let progress = (time - startTime) / animDuration;
         if (!store.checked) progress = 1 - progress;
         progress = Math.min(1, Math.max(0, progress));
         const l1 = {
            x1: 7 + (8.5 - 7) * progress,
            y1: 1,
            x2: 1 + (2.5 - 1) * progress,
            y2: 7
         };
         const l2 = {
            x1: 1 + (2.5 - 1) * progress,
            y1: 1 + (7 - 1) * progress,
            x2: 7 + (0 - 7) * progress,
            y2: 7 + (4.5 - 7) * progress
         };
         batch(() => {
            setStore('d1', `M${l1.x1},${l1.y1} L${l1.x2},${l1.y2}`);
            setStore('d2', `M${l2.x1},${l2.y1} L${l2.x2},${l2.y2}`);
         });
         if ((store.checked && progress === 1) || (!store.checked && progress === 0)) {
            startTime = null;
            stop();
         }
      }, 60)
   );

   createEffect(
      on(
         () => store.checked,
         () => start()
      )
   );
   return (
      <div class="custom-input switch" classList={{ checked: store.checked }}>
         <div class="box">
            <svg class="x" viewBox="-5 -5 18 18">
               <path d={store.d1} />
               <path d={store.d2} />
            </svg>
         </div>
         <input
            class="input"
            type="checkbox"
            {...props}
            onInput={(e) => {
               props.onInput?.(e);
               if (!e.defaultPrevented) {
                  setStore('checked', e.currentTarget.checked);
               }
            }}
         />
      </div>
   );
}
