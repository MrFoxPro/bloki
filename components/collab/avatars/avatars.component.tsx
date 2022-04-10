import { For, Show } from "solid-js";
import { useEditorStore } from "@/components/bloki-editor/editor.store";
import s from './avatars.module.scss';
import { useCollabStore } from "../collab.store";
import { useAppStore } from "@/lib/app.store";

type AvatarsProps = {
};

export function Avatars(props: AvatarsProps) {
   const [app] = useAppStore();
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
      <Show when={editor.document.shared}>
         <div class={s.avatars}>
            <For each={collab.rommates}>
               {user => (
                  <div
                     title={user.name}
                     class={s.avatar}
                     style={{
                        border: `2px solid ${user.color}`,
                        background: user.color,
                        outline: user.name === app.name ? '2px solid blue' : 'unset'
                     }}
                  >
                     {getFormattedName(user.name)}
                  </div>
               )}
            </For>
         </div>
      </Show>
   );
}