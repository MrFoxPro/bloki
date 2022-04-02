import s from './main.page.module.scss';
import { createEffect, For, lazy, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { useI18n } from '@solid-primitives/i18n';
import { useAppStore } from '@/lib/app.store';
import { useModalStore } from '@/components/modal/modal';
import { defaultLayoutOptions } from '@/lib/test-data/layout-options';

const BlokiEditor = lazy(() => import('@/components/bloki-editor/bloki-editor.component'));
const SideMenu = lazy(() => import('@/components/side-menu/side-menu.component'));
const AccountSettings = lazy(() => import('@/components/account-settings/account-settings.component'));
import { Toolbox } from './toolbox/toolbox.component';

import TripleDotsIcon from '@/components/side-menu/assets/triple-dots.icon.svg';

import { getTextBlockSize } from '@/components/bloki-editor/blocks/text-block/helpers';
import { isTextBlock } from '@/components/bloki-editor/types';

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
   });

   const createModal = useModalStore();

   const [sysSettingsVisible, setSysSettingsVisible] = createModal(AccountSettings, true);

   createEffect(() => setSysSettingsVisible(state.menu.settings));
   createEffect(() => setState('menu', 'settings', sysSettingsVisible()));

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
                  {/* <div class={s.arrow} />
                  <div class={s.arrow} /> */}
                  <Toolbox />
               </div>
               <h4>{app.selectedDocument?.title}</h4>
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
                  showMeta={state.docSettings}
                  gridType={app.gridRenderMethod}
               />
            </Show>
         </div>
      </main>
   );
};

function DocumentSettings() {
   const [t] = useI18n();
   const [app, { setStore }] = useAppStore();

   function logCalculatedSizes() {
      app.selectedDocument.blocks.forEach(block => {
         if (isTextBlock(block)) {
            getTextBlockSize(block, block.value, app.selectedDocument.layoutOptions);
         }
      });
   }
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
            <div class={s.gridType}>
               <div>
                  {t("settings.system.render-method.title")}
               </div>
               <div class={s.methods}>
                  {(['canvas', 'dom'] as const).map((type) => (
                     <div>
                        <input
                           type="radio"
                           id={type + 'method'}
                           checked={app.gridRenderMethod === type}
                           onInput={() => setStore({ gridRenderMethod: type })}
                        />
                        <label for={type + 'method'}>{t(`settings.system.render-method.${type}`)}</label>
                     </div>
                  ))}
               </div>
            </div>
            <button
               onClick={() => {
                  setStore('selectedDocument', 'layoutOptions', defaultLayoutOptions);
               }}>
               {t('settings.document.reset-layout')}
            </button>
            <button
               style={{
                  color: 'red'
               }}
               onClick={() => app.apiProvider.clearCache().then(() => location.reload())}
            >
               {t('settings.document.purge-db')}
            </button>
            <button
               onClick={logCalculatedSizes}
            >
               {t('settings.document.log-calculated-sizes')}
            </button>
         </div>
      </div>
   );
}