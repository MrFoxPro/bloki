import s from './test.page.module.scss';
import { BlokiEditor } from '@/components/bloki-editor/bloki-editor.component';
import { For, Show } from 'solid-js';
import { SideMenu } from '@/components/side-menu/side-menu';
import { useAppStore } from '@/lib/app.store';
import { defaultLayotOptions } from '@/lib/test-data/layout-options';
import TripleDotsIcon from '@/components/side-menu/assets/triple-dots.icon.svg?raw';

export function TestPage() {
   const [app, { setStore }] = useAppStore();

   return (
      <main class={s.test}>
         <SideMenu />
         <div class={s.workspace}>
            <div class={s.topBar}>
               <div class={s.leftBar}>
                  <div class={s.arrow} />
                  <div class={s.arrow} />
                  <h4>{app.selectedDocument?.title}</h4>
               </div>
               <div class={s.rightBar}>
                  <div class={s.optionsIcon} innerHTML={TripleDotsIcon} />
               </div>
            </div>
            <Show when={app.selectedWorkspace && app.selectedDocument}>
               <div class={s.controls}>
                  <div class={s.control}>
                     <For each={[
                        ['gap', [2, 10]],
                        ['size', [4, 48]],
                        ['mGridWidth', [5, 50]],
                        ['mGridHeight', [10, 60]],
                        ['fGridWidth', [32, 92]],
                        ['fGridHeight', [10, 60]]
                     ] as const}>
                        {([p, [min, max]]) => (
                           <div class={s.control}>
                              <span>{p} [{app.selectedDocument.layoutOptions[p]}]</span>
                              <input
                                 type="range"
                                 min={min}
                                 max={max}
                                 value={app.selectedDocument.layoutOptions[p]}
                                 oninput={(e) => setStore('selectedDocument', 'layoutOptions', p, e.currentTarget.valueAsNumber)}
                              />
                           </div>
                        )}
                     </For>
                     <div>
                        <label for="show-gradient">Show grid</label>
                        <input
                           type="checkbox"
                           name="show-gradient"
                           onClick={(e) => setStore('selectedDocument', 'layoutOptions', 'showGridGradient', e.currentTarget.checked)}
                           checked={app.selectedDocument.layoutOptions.showGridGradient}
                        />
                     </div>
                     <div>
                        <label for="show-gradient">Show resize areas</label>
                        <input
                           type="checkbox"
                           name="show-gradient"
                           onClick={(e) => setStore('selectedDocument', 'layoutOptions', 'showResizeAreas', e.currentTarget.checked)}
                           checked={app.selectedDocument.layoutOptions.showResizeAreas}
                        />
                     </div>
                     <button
                        onClick={() => {
                           setStore('selectedDocument', 'layoutOptions', defaultLayotOptions);
                        }}>
                        Reset layout options
                     </button>
                  </div>
               </div>
               <BlokiEditor document={app.selectedDocument} />
            </Show>
         </div>
      </main >
   );
}