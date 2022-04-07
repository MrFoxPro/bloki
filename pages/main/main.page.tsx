import { createEffect, createRenderEffect, lazy, on, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { createCountdownFromNow } from '@solid-primitives/date';
import { useI18n } from '@solid-primitives/i18n';
import { useAppStore } from '@/lib/app.store';
import s from './main.page.module.scss';
import { useNavigate, useParams } from 'solid-app-router';

const BlokiEditor = lazy(() => import('@/components/bloki-editor/bloki-editor.component'));
const SideMenu = lazy(() => import('@/components/side-menu/side-menu.component'));

export function MainPage() {
   const navigate = useNavigate();
   const params = useParams();

   const [t] = useI18n();
   const [app, { setAppStore, selectedDocument }] = useAppStore();
   let leftBarRef: HTMLDivElement;
   let rightBarRef: HTMLDivElement;

   const [state, setState] = createStore({
      toolbox: false,
      docSettings: false,
   });

   const [countdown] = createCountdownFromNow(() => selectedDocument()?.willUpdateAtUnix, 1000);

   createEffect(() => {
      if (params.docId) {
         setAppStore({ selectedDocumentId: params.docId });
      }
   });

   createRenderEffect(() => {
      if (!app.selectedDocumentId) navigate('/', { replace: true });
      else if (params.docId !== app.selectedDocumentId) navigate('/docs/' + app.selectedDocumentId, { replace: true });
   });

   return (
      <main class={s.main}>
         <SideMenu />
         <div class={s.workspace}>
            <div class={s.topBar}>
               <div class={s.leftBar} ref={leftBarRef}>
                  {/* Toolbox can be here */}
               </div>
               <h4>{selectedDocument()?.title} <Show when={selectedDocument()?.willUpdateAtUnix}>{countdown.minutes}:{countdown.seconds}</Show></h4>
               <div class={s.rightBar} ref={rightBarRef}>

               </div>
            </div>
            <Show when={selectedDocument()}>
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

