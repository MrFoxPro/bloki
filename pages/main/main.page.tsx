import s from './main.page.module.scss';
import { BlokiEditor } from '@/components/bloki-editor/bloki-editor.component';
import { createEffect, For, Show } from 'solid-js';
import { SideMenu } from '@/components/side-menu/side-menu';
import { useAppStore } from '@/lib/app.store';
import { defaultLayoutOptions } from '@/lib/test-data/layout-options';
import TripleDotsIcon from '@/components/side-menu/assets/triple-dots.icon.svg';
import { createStore } from 'solid-js/store';
import { useI18n } from '@solid-primitives/i18n';
import { AccountSettings } from '@/components/account-settings/account-settings.component';
import { useModalStore } from '@/components/modal/modal';

export function MainPage() {
   const [t] = useI18n();
   const [app, { setStore }] = useAppStore();

   const [state, setState] = createStore({
      menu: {
         settings: false,
         search: true,
         trash: false,
      },
      toolbox: false,
      docSettings: false,

      gridType: 'canvas'
   });

   const useModal = useModalStore();

   const [sysSettingsVisible, setSysSettingsVisible] = useModal(AccountSettings, true);

   createEffect(() => setSysSettingsVisible(state.menu.settings));
   createEffect(() => setState('menu', 'settings', sysSettingsVisible()));

   function DocumentSettings() {
      return (
         <div class={s.settings}>
            <div class={s.control}>
               <For each={[
                  ['gap', [2, 10]],
                  ['size', [4, 48]],
                  ['mGridWidth', [5, 100]],
                  ['mGridHeight', [10, 550]],
                  ['fGridWidth', [32, 150]],
                  ['fGridHeight', [10, 550]]
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
               <div class={s.check}>
                  <input
                     type="checkbox"
                     name="show-gradient"
                     onClick={(e) => setStore('selectedDocument', 'layoutOptions', 'showGridGradient', e.currentTarget.checked)}
                     checked={app.selectedDocument.layoutOptions.showGridGradient}
                  />
                  <label for="show-gradient">{t('settings.document.grid-gradient')}</label>
               </div>
               <div class={s.check}>
                  <input
                     type="checkbox"
                     name="show-resizers"
                     onClick={(e) => setStore('selectedDocument', 'layoutOptions', 'showResizeAreas', e.currentTarget.checked)}
                     checked={app.selectedDocument.layoutOptions.showResizeAreas}
                  />
                  <label for="show-resizers">{t('settings.document.resize-areas')}</label>
               </div>
               <div class={s.check}>
                  <input
                     type="checkbox"
                     name="show-toolbox"
                     onClick={_ => setState('toolbox', s => !s)}
                     checked={state.toolbox}
                  />
                  <label for="show-toolbox">{t('settings.document.toolbox')}</label>
               </div>
               <div class={s.gridType}>
                  <div>
                     {t("settings.system.render-method.title")}
                  </div>
                  <div class={s.methods}>
                     <div>
                        <input
                           type="radio"
                           id="canvasMethod"
                           checked={state.gridType === 'canvas'}
                           onInput={() => setState({ gridType: 'canvas' })}
                        />
                        <label for="canvasMethod">{t('settings.system.render-method.canvas')}</label>
                     </div>
                     <div>
                        <input
                           type="radio"
                           id="domMethod"
                           checked={state.gridType === 'dom'}
                           onInput={() => setState({ gridType: 'dom' })}
                        />
                        <label for="domMethod">{t("settings.system.render-method.dom")}</label>
                     </div>
                  </div>
               </div>
               <button
                  onClick={() => {
                     setStore('selectedDocument', 'layoutOptions', defaultLayoutOptions);
                  }}>
                  {t('settings.document.reset-layout')}
               </button>
               <button
                  onClick={() => app.apiProvider.clearCache().then(() => location.reload())}
               >
                  {t('settings.document.purge-db')}
               </button>
            </div>
         </div>
      );
   }

   return (
      <main class={s.test}>
         <SideMenu
            activeItems={Object.keys(state.menu).filter(i => state.menu[i] === true)}
            disabledItems={['trash']}
            onItemClick={(item) => {
               setState('menu', item, s => !s);
            }}
         />
         <div class={s.workspace}>
            <div class={s.topBar}>
               <div class={s.leftBar}>
                  <div class={s.arrow} />
                  <div class={s.arrow} />
                  <h4>{app.selectedDocument?.title}</h4>
               </div>
               <div class={s.rightBar}>
                  <TripleDotsIcon class={s.optionsIcon} onClick={() => setState('docSettings', s => !s)} />
               </div>
            </div>
            <Show when={app.selectedWorkspace && app.selectedDocument}>
               <Show when={state.docSettings}>
                  <DocumentSettings />
               </Show>
               <BlokiEditor
                  document={app.selectedDocument}
                  showDrawerToolbox={state.toolbox}
                  showMeta={state.docSettings}
                  gridType={state.gridType}
               />
            </Show>
         </div>
      </main>
   );
};