import s from './test.page.module.scss';
import { BlokiEditor } from '@/components/bloki-editor/bloki-editor.component';
import { createEffect, createSignal, For, Show } from 'solid-js';
import { SideMenu } from '@/components/side-menu/side-menu';
import { useAppStore } from '@/lib/app.store';
import { BlokiDocument } from '@/lib/entities';

export function TestPage() {
   const [app, { changeLayoutOptions }] = useAppStore();

   // const [document, setDocument] = createSignal<BlokiDocument>();

   return (
      <main class={s.test}>
         <SideMenu />
         <div class={s.workspace}>
            <div class={s.topBar}>
               <div class={s.arrow} />
               <div class={s.arrow} />

               <h4>{app.selectedDocument?.title}</h4>
            </div>
            <Show when={app.selectedDocument}>
               <div class={s.controls}>
                  <div class={s.control}>
                     <For each={[['gap', [2, 10]], ['size', [4, 48]], ['mGridWidth', [5, 50]], ['mGridHeight', [10, 60]], ['fGridWidth', [32, 92]], ['fGridHeight', [10, 60]]] as const}>
                        {([p, [min, max]]) => (
                           <div class={s.control}>
                              <span>{p} {app.selectedDocument.layoutOptions[p]}</span>
                              <input
                                 type="range"
                                 min={min}
                                 max={max}
                                 value={app.selectedDocument.layoutOptions[p]}
                              // onInput={(e) => setDocument('layoutOptions', p, e.currentTarget.valueAsNumber)}
                              />
                           </div>
                        )}
                     </For>
                     <button
                        onClick={() => {
                           changeLayoutOptions(app.selectedDocument, app.selectedDocument.layoutOptions);
                        }}>
                        Reset
                     </button>
                  </div>
               </div>
               <BlokiEditor document={app.selectedDocument} />
            </Show>
         </div>
      </main >
   );
}