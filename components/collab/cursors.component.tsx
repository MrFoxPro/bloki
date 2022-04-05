import { useAppStore } from "@/lib/app.store";
import { createEffect, For, Show } from "solid-js";
import { useEditorStore } from "../bloki-editor/editor.store";
import s from './cursors.module.scss';

export function Cursors() {
   const [app, { selectedDocument }] = useAppStore();
   const [, { staticEditorData }] = useEditorStore();
   createEffect(() => console.log(app.teammates.map(x => x.cursor)));

   return (
      <Show when={selectedDocument().shared}>
         <For each={app.teammates.filter(x => x.name !== app.name)}>
            {teammate => (
               <div
                  class={s.cursor}
                  style={{
                     transform: `translate(${teammate.cursor?.x - staticEditorData.containerRect.x}px, ${teammate.cursor?.y - staticEditorData.containerRect.y}px)`,
                     background: '#' + teammate.color,
                     transition: `transform 400ms ease`
                  }}
               >
                  {teammate.name}
               </div>
            )}
         </For>
      </Show>
   );
}