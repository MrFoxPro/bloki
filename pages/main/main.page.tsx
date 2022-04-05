import s from './main.page.module.scss';
import { createEffect, lazy, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { useI18n } from '@solid-primitives/i18n';
import { useAppStore } from '@/lib/app.store';
import { useModalStore } from '@/components/modal/modal';
import faker from '@faker-js/faker';

const BlokiEditor = lazy(() => import('@/components/bloki-editor/bloki-editor.component'));
const SideMenu = lazy(() => import('@/components/side-menu/side-menu.component'));
const AccountSettings = lazy(() => import('@/components/account-settings/account-settings.component'));

import { createCountdownFromNow } from '@solid-primitives/date';


function NameInput() {
   const [app, { setAppStore }] = useAppStore();
   const [t] = useI18n();
   const animals = Object.entries(faker.animal).filter(([k]) => k !== 'type');
   let name: string = app.name ?? animals[Math.floor(Math.random() * animals.length - 1)][1]();
   return (
      <div class={s.askName}>
         <div>{t('auth.ask-name.question')}</div>
         <input type="text" onInput={(e) => name = e.currentTarget.value} value={name} />
         <button onClick={() => {
            if (name.length < 1 || name.length > 18) {
               return alert('Name is too short/long!');
            }
            setAppStore({ name });
         }}>
            {t('auth.ask-name.continue')}
         </button>
      </div>
   );
}

export function MainPage() {
   const [t] = useI18n();
   const [app, { setAppStore, selectedWorkspace, selectedDocument }] = useAppStore();
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

   const [nameVisible, setNameVisible] = createModal(NameInput, { useBlur: true, canHide: false });
   setNameVisible(true);

   createEffect(() => setNameVisible(!app.name));

   const [sysSettingsVisible, setSysSettingsVisible] = createModal(AccountSettings, { useBlur: true, canHide: true });

   createEffect(() => setSysSettingsVisible(state.menu.settings));
   createEffect(() => setState('menu', 'settings', sysSettingsVisible()));

   const [countdown] = createCountdownFromNow(state.timeToRefresh, 1000);

   return (
      <main class={s.main}>
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
               <h4>{selectedDocument()?.title} <Show when={selectedDocument()?.shared}>{countdown.minutes}:{countdown.seconds}</Show></h4>
               <div class={s.rightBar} ref={rightBarRef}>

               </div>
            </div>
            <Show when={selectedWorkspace() && selectedDocument()}>
               <BlokiEditor
                  document={selectedDocument()}
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

