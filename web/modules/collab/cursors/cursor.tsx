import { For, Show } from 'solid-js'
import s from './cursors.module.scss'
import CursorIcon from '../assets/cursor.icon.svg'
import { useSettings } from '@/modules/settings.store'

const CURSOR_UPDATE_RATE = 300

export function Cursors() {
   const { settings } = useSettings()
   const [editor] = useEditorContext()
   return (
      <Show when={editor.document.shared}>
         <For each={editor.rommates.filter((x) => x.name !== settings.name)}>
            {(user) => (
               <div
                  class={s.user}
                  style={{
                     transform: `translate(${user.cursor.x}px, ${user.cursor.y}px)`,
                     transition: `transform ${(CURSOR_UPDATE_RATE * 2) / 3}ms ease`,
                  }}
               >
                  <CursorIcon fill={user.color} />
                  <div class={s.badge} style={{ background: user.color }}>
                     {user.name}
                  </div>
               </div>
            )}
         </For>
      </Show>
   )
}
