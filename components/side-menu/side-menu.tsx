import { useAppStore } from '@/lib/app.store';
import { BlokiDocument, Workspace } from '@/lib/entities';
import { ComponentProps, For, Show } from 'solid-js';
import { upperFirst } from 'lodash-es';
import s from './side-menu.module.scss';

type SideMenuProps = {

} & ComponentProps<'div'>;

export function SideMenu(props: SideMenuProps) {
   const [app] = useAppStore();

   return (
      <div classList={{ [s.sideMenu]: true, [props.class]: true }}>
         <div class={s.workspaceBar}>
            <div class={s.box} />
            <div class={s.title}>{app.selectedWorkspace?.title ?? 'Select workspace'}</div>
            {/* new file and search */}
         </div>
         <div class={s.menus}>
            <div classList={{ [s.block]: true, [s.controls]: true }}>
               <For each={['search', 'settings', 'trash'] as const}>
                  {(item) => (
                     <div classList={{ [s.item]: true }}>
                        <div classList={{ [s.icon]: true, [s[item]]: true }} />
                        <span>{upperFirst(item)}</span>
                     </div>
                  )}
               </For>
            </div>
            <div class={s.block}>
               <div class={s.name}>
                  Pages
               </div>
               <div class={s.pages}>
                  <For each={app.selectedWorkspace?.documents}>
                     {(doc) => (
                        <div classList={{ [s.page]: true, [s.item]: true, [s.itemHighlighed]: doc.id === app.selectedDocument.id }}>
                           <Show when={true}>
                              <div classList={{ [s.icon]: true, [s.arrow]: true }} />
                           </Show>
                           <div classList={{ [s.icon]: true, [s.page]: true }} />
                           <span>{doc.title}</span>
                        </div>
                     )}
                  </For>
               </div>
            </div>
         </div>
      </div>
   );
}