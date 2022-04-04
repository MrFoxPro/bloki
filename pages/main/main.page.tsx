import s from './main.page.module.scss';
import { createEffect, lazy, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { useI18n } from '@solid-primitives/i18n';
import { useAppStore } from '@/lib/app.store';
import { useModalStore } from '@/components/modal/modal';

const BlokiEditor = lazy(() => import('@/components/bloki-editor/bloki-editor.component'));
const SideMenu = lazy(() => import('@/components/side-menu/side-menu.component'));
const DocumentSettings = lazy(() => import('./doc-settings/doc-settings.component'));
const AccountSettings = lazy(() => import('@/components/account-settings/account-settings.component'));

import TripleDotsIcon from '@/components/side-menu/assets/triple-dots.icon.svg';

// import { createToolbox } from '../../components/bloki-editor/toolbox/toolbox.component';

export function MainPage() {
   const [t] = useI18n();
   const [app, { setStore }] = useAppStore();
   let toolboxMountRef: HTMLDivElement;

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
   // const [Toolbox, toolboxState] = createToolbox();

   createEffect(() => setSysSettingsVisible(state.menu.settings));
   createEffect(() => setState('menu', 'settings', sysSettingsVisible()));

   return (
      <main class={s.main}>
         <SideMenu
            activeItems={Object.keys(state.menu).filter(i => state.menu[i] === true)}
            disabledItems={['trash']}
            onItemClick={(item) => {
               setState('menu', item, s => !s);
            }}
         />
         <div class={s.workspace}>
            <div class={s.topBar}>
               <div class={s.leftBar} ref={toolboxMountRef}>
                  {/* Toolbox can be here */}
               </div>
               <h4>{app.selectedDocument?.title}</h4>
               <div class={s.rightBar}>
                  <TripleDotsIcon class={s.optionsIcon} onClick={() => setState('docSettings', s => !s)} />
               </div>
            </div>
            <Show when={app.selectedWorkspace && app.selectedDocument}>
               <BlokiEditor
                  document={app.selectedDocument}
                  showMeta={state.docSettings}
                  gridType={app.gridRenderMethod}
                  toolboxMountRef={toolboxMountRef}
               />
            </Show>
         </div>
         <Show when={app.selectedDocument && state.docSettings}>
            <DocumentSettings />
         </Show>
      </main>
   );
};

