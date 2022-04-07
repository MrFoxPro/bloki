import { useAppStore } from "@/lib/app.store";
import { createEffect, For, Show } from "solid-js";
import { useEditorStore } from "../bloki-editor/editor.store";
import { useCollabStore } from "./collab.store";
import s from './cursors.module.scss';
import CursorIcon from './assets/cursor.icon.svg';
import { CURSOR_UPDATE_RATE } from "@/lib/network.types";

export function Cursors() {
   const [app] = useAppStore();
   const [editor, { staticEditorData }] = useEditorStore();
   const [collab] = useCollabStore();

   createEffect(() => console.log(collab.rommates));

   return (
      <Show when={editor.document.shared}>
         <For each={collab.rommates.filter(x => x.name !== app.name)}>
            {user => (
               <div
                  class={s.user}
                  style={{
                     transform: `translate(${user.cursor.x - staticEditorData.containerRect.x}px, ${user.cursor.y - staticEditorData.containerRect.y}px)`,
                     transition: `transform ${CURSOR_UPDATE_RATE}ms ease`
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