import { useAppStore } from "@/lib/app.store";
import { For, Show } from "solid-js";
import s from './cursors.module.scss';
import CursorIcon from '../assets/cursor.icon.svg';
import { useEditorStore } from "@/components/bloki-editor/editor.store";
import { CURSOR_UPDATE_RATE, useCollabStore } from "../collab.store";

export function Cursors() {
   const [app] = useAppStore();
   const [editor] = useEditorStore();
   const [collab] = useCollabStore();
   return (
      <Show when={editor.document.shared}>
         <For each={collab.rommates.filter(x => x.name !== app.name)}>
            {user => (
               <div
                  class={s.user}
                  style={{
                     transform: `translate(${user.cursor.x}px, ${user.cursor.y}px)`,
                     transition: `transform ${CURSOR_UPDATE_RATE}ms linear`
                  }}
               >
                  <CursorIcon fill={user.color} />
                  <div
                     class={s.badge}
                     style={{ background: user.color }}
                  >
                     {user.name}
                  </div>
               </div>
            )}
         </For>
      </Show>
   );
}