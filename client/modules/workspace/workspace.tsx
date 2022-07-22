import './workspace.scss';

import { lazy, Show } from 'solid-js';
import { useAppStore } from '../app.store';
import { DrawerStoreProvider } from '../bloki-editor/drawer.store';
import { EditorStoreProvider, useEditorContext } from '../bloki-editor/editor.store';
import { Avatars } from '../collab/avatars/avatars.component';
const BlokiEditor = lazy(() => import('@/modules/bloki-editor/bloki-editor'));
const Toolbox = lazy(() => import('../bloki-editor/toolbox/toolbox.component'));

export function Workspace() {
   const [app] = useAppStore();

   const ConnectionStatus = () => {
      const [editor] = useEditorContext();
      return (
         <div class="status" classList={{ connected: editor.connected }}>
            [{editor.connected ? 'topbar.doc-status.connected' : 'topbar.doc-status.disconnected'}]
         </div>
      );
   };

   return (
      <Show when={app.selectedDocument}>
         <DrawerStoreProvider>
            <EditorStoreProvider document={app.selectedDocument}>
               <div class="workspace">
                  <div class="top-bar">
                     <div class="left-bar">
                        <Toolbox />
                     </div>
                     <h4 class="doc-title">
                        {app.selectedDocument?.title} <ConnectionStatus />
                     </h4>
                     <div class="right-bar">
                        <Avatars />
                        <button class="share">Share</button>
                     </div>
                  </div>
                  <Show when={app.selectedDocument}>
                     <BlokiEditor />
                  </Show>
               </div>
            </EditorStoreProvider>
         </DrawerStoreProvider>
      </Show>
   );
}

export default Workspace;
