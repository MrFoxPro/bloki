import { For, Show } from 'solid-js';
import { useEditorContext } from '@/modules/bloki-editor/editor.store';
import './avatars.scss';
import { useAppStore } from '@/modules/app.store';

type AvatarsProps = {};

export function Avatars(props: AvatarsProps) {
   const [app] = useAppStore();
   const [editor] = useEditorContext();

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
            <For each={editor.rommates}>
               {(user) => (
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
