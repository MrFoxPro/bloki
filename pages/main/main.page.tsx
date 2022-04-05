import s from './main.page.module.scss';
import { createEffect, lazy, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { useI18n } from '@solid-primitives/i18n';
import { useAppStore } from '@/lib/app.store';
import { useModalStore } from '@/components/modal/modal';

const BlokiEditor = lazy(() => import('@/components/bloki-editor/bloki-editor.component'));
const SideMenu = lazy(() => import('@/components/side-menu/side-menu.component'));
const AccountSettings = lazy(() => import('@/components/account-settings/account-settings.component'));

import { createCountdownFromNow } from '@solid-primitives/date';

// import { createToolbox } from '../../components/bloki-editor/toolbox/toolbox.component';

export function MainPage() {
   const [t] = useI18n();
   const [app, { setAppStore }] = useAppStore();
   let leftBarRef: HTMLDivElement;
   let rightBarRef: HTMLDivElement;

   const fiveMin = 5 * 60 * 1000;
   const [state, setState] = createStore({
      menu: {
         settings: false,
         search: false,
         trash: false,
      },
      toolbox: false,
      docSettings: false,
      timeToRefresh: new Date(Date.now() + fiveMin)
   });

   const createModal = useModalStore();

   const [sysSettingsVisible, setSysSettingsVisible] = createModal(AccountSettings, true);
   // const [Toolbox, toolboxState] = createToolbox();

   createEffect(() => setSysSettingsVisible(state.menu.settings));
   createEffect(() => setState('menu', 'settings', sysSettingsVisible()));

   const [countdown] = createCountdownFromNow(state.timeToRefresh, 1000);

   return (
      <main class={s.main} >
         <SideMenu
            activeItems={Object.keys(state.menu).filter(i => state.menu[i] === true)}
            disabledItems={['trash', 'search']}
            onItemClick={(item) => {
               setState('menu', item, s => !s);
            }}
         />
         <div class={s.workspace}>
            <div class={s.topBar}>
               <div class={s.leftBar} ref={leftBarRef}>
                  {/* Toolbox can be here */}
               </div>
               <h4>{app.selectedDocument?.title} {countdown.minutes}:{countdown.seconds}</h4>
               <div class={s.rightBar} ref={rightBarRef}>

               </div>
            </div>
            <Show when={app.selectedWorkspace && app.selectedDocument}>
               <BlokiEditor
                  document={app.selectedDocument}
                  showMeta={state.docSettings}
                  gridType={app.gridRenderMethod}
                  toolboxMountRef={leftBarRef}
                  docSettingsMountRef={rightBarRef}
               />
            </Show>
         </div>

      </main>
   );
};

