import './workspace.scss';

import { lazy, Show } from "solid-js";
import { useAppStore } from "../app.store";
import { DrawerStoreProvider } from "../bloki-editor/drawer.store";
import { EditorStoreProvider, useEditorStore } from "../bloki-editor/editor.store";
import { Avatars } from "../collab/avatars/avatars.component";
const BlokiEditor = lazy(() => import('@/modules/bloki-editor/bloki-editor'));
const Toolbox = lazy(() => import('../bloki-editor/toolbox/toolbox.component'));

export function Workspace() {
   const [app, { selectedDocument }] = useAppStore();

   const ConnectionStatus = () => {
      const [editor] = useEditorStore();
      return (
         <div class="status" classList={{ "connected": editor.connected }}>
            [{editor.connected ? 'topbar.doc-status.connected' : 'topbar.doc-status.disconnected'}]
         </div>
      );
   };

   return (
      <Show when={selectedDocument()}>
         <DrawerStoreProvider>
            <EditorStoreProvider document={selectedDocument()}>
               <div class="workspace">
                  <div class="top-bar">
                     <div class="left-bar">
                        <Toolbox />
                     </div>
                     <h4 class="doc-title">{selectedDocument()?.title} <ConnectionStatus /></h4>
                     <div class="right-bar">
                        <Avatars />
                        <button class="share">Share</button>
                     </div>
                  </div>
                  <Show when={selectedDocument()}>
                     <BlokiEditor
                        gridType='canvas'
                     />
                  </Show>
               </div>
            </EditorStoreProvider>
         </DrawerStoreProvider>
      </Show>
   );
}

export default Workspace;
