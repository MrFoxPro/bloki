import { For, Show } from "solid-js";
import { useEditorStore } from "@/components/bloki-editor/editor.store";
import s from './avatars.module.scss';
import { useCollabStore } from "../collab.store";

type AvatarsProps = {
};

export function Avatars(props: AvatarsProps) {
   const [editor] = useEditorStore();
   const [collab] = useCollabStore();

   function getFormattedName(name: string) {
      const parts = name.split(' ');
      const firstPart = parts[0][0].toUpperCase();
      if (parts.length === 1) return firstPart;
      const secondPart = parts[1][0].toUpperCase();
      return firstPart + secondPart;
   }

   return (
      <div class={s.avatars}>
         <Show when={editor.document.shared}>
            <For each={collab.rommates}>
               {user => (
                  <div
                     title={user.name}
                     class={s.avatar}
                     style={{
                        border: `2px solid ${user.color}`,
                        background: user.color
                     }}
                  >
                     {getFormattedName(user.name)}
                  </div>
               )}
            </For>
         </Show>
         <button class={s.share}>Share</button>
      </div>
   );
}