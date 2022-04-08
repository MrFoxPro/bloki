import { lazy, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { useI18n } from "@solid-primitives/i18n";
import { createCountdownFromNow } from "@solid-primitives/date";
import { CollabStoreProvider } from "../collab/collab.store";
import { DrawerStoreProvider } from "../bloki-editor/drawer.store";
import { EditorStoreProvider } from "../bloki-editor/editor.store";
import { useAppStore } from "@/lib/app.store";
import { Avatars } from "../collab/avatars/avatars.component";
import { Cursors } from "../collab/cursors/cursors.component";
const BlokiEditor = lazy(() => import('@/components/bloki-editor/bloki-editor.component'));
const Toolbox = lazy(() => import('../bloki-editor/toolbox/toolbox.component'));
const DocumentSettings = lazy(() => import('@/components/modals/doc-settings/doc-settings.component'));
import s from './workspace.module.scss';

export function Workspace() {
   const [t] = useI18n();
   const [app, { setAppStore, selectedDocument }] = useAppStore();

   const [state, setState] = createStore({
      toolbox: false,
      docSettings: false,
   });

   const [countdown] = createCountdownFromNow(() => selectedDocument()?.willUpdateAtUnix, 1000);

   return (
      <EditorStoreProvider document={selectedDocument()}>
         <DrawerStoreProvider>
            <CollabStoreProvider>
               <div class={s.workspace}>
                  <div class={s.topBar}>
                     <div class={s.leftBar}>
                        <Toolbox />
                     </div>
                     <h4>{selectedDocument()?.title} <Show when={selectedDocument()?.willUpdateAtUnix}>{countdown.minutes}:{countdown.seconds}</Show></h4>
                     <div class={s.rightBar}>
                        <Avatars />
                        <button class={s.share}>Share</button>
                        <DocumentSettings />
                     </div>
                  </div>
                  <Show when={selectedDocument()}>
                     <BlokiEditor
                        showMeta={state.docSettings}
                        gridType={app.gridRenderMethod}
                     />
                  </Show>

               </div>
               <Cursors />
            </CollabStoreProvider>
         </DrawerStoreProvider>
      </EditorStoreProvider>
   );
}
export default Workspace;