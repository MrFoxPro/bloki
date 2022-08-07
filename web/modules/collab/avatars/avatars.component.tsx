import { For, Show } from 'solid-js'
import { useEditorContext } from '@/modules/bloki-editor/editor.store'
import './avatars.scss'
import { useSettings } from '@/modules/settings.store'

type AvatarsProps = {}

export function Avatars(props: AvatarsProps) {
   const { settings } = useSettings()
   const [editor] = useEditorContext()

   function getFormattedName(name: string) {
      const parts = name.split(' ')
      const firstPart = parts[0][0].toUpperCase()
      if (parts.length === 1) return firstPart
      const secondPart = parts[1][0].toUpperCase()
      return firstPart + secondPart
   }

   return (
      <Show when={editor.document.shared}>
         <div class="avatars">
            <For each={editor.rommates}>
               {(user) => (
                  <div
                     title={user.name}
                     class="avatar"
                     style={{
                        border: `2px solid ${user.color}`,
                        background: user.color,
                        outline: user.name === settings.name ? '2px solid blue' : 'unset',
                     }}
                  >
                     {getFormattedName(user.name)}
                  </div>
               )}
            </For>
         </div>
      </Show>
   )
}
