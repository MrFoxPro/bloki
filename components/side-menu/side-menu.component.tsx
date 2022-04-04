import { useAppStore } from '@/lib/app.store';
import { ComponentProps, createComponent, For, mergeProps, Show } from 'solid-js';
import s from './side-menu.module.scss';
import cc from 'classcat';
import { useI18n } from '@solid-primitives/i18n';

import AddIcon from './assets/add.icon.svg';
import SearchIcon from './assets/search.icon.svg';
import SettingsIcon from './assets/settings.icon.svg';
import TrashIcon from './assets/trash.icon.svg';

const items = ['search', 'settings', 'trash'] as const;
const itemIconDict = {
   search: SearchIcon,
   settings: SettingsIcon,
   trash: TrashIcon
} as const;

type SideMenuProps = {
   activeItems: ((typeof items)[any] | string)[];
   disabledItems: ((typeof items) | string)[any][];
   onItemClick(item: typeof items[any]): void;
} & ComponentProps<'div'>;

export function SideMenu(props: SideMenuProps) {
   props = mergeProps({
      onItemClick: () => void 0
   }, props);

   const [t] = useI18n();

   const [app, { setAppStore }] = useAppStore();

   return (
      <div class={s.sideMenu} classList={{ [props.class]: true }}>
         <div class={s.workspaceBar}>
            <div
               class={s.box}
               style={{
                  "background-image": `url(${app.selectedWorkspace?.workspaceIcon})`
               }}
            />
            <div class={s.title}>{app.selectedWorkspace?.title ?? 'Select workspace'}</div>
         </div>
         <div class={s.menus}>
            <div class={cc([s.block, s.controls])}>
               <For each={items}>
                  {(item) => (
                     <div
                        classList={{
                           [s.item]: true,
                           [s.highlighted]: props.activeItems.includes(item),
                           [s.disabled]: props.disabledItems.includes(item),
                        }}
                        onClick={() => props.onItemClick(item)}
                     >
                        {createComponent(itemIconDict[item], { class: s.icon })}
                        <span>{t(`menu.items.${item}`)}</span>
                     </div>
                  )}
               </For>
            </div>
            <div class={s.block}>
               <div class={s.name}>
                  {t('menu.label.pages')}
                  <AddIcon class={s.icon} />
               </div>
               <div class={s.pages}>
                  <For each={app.selectedWorkspace?.documents}>
                     {(doc) => (
                        <div
                           class={cc([s.page, s.item])}
                           classList={{
                              [s.highlighted]: doc.id === app.selectedDocument?.id
                           }}
                           onClick={() => setAppStore({ selectedDocument: doc })}
                        >
                           <Show when={true}>
                              <div class={cc([s.icon, s.arrow])} />
                           </Show>
                           <div class={cc([s.icon, s.page])} />
                           <span>{doc.title}</span>
                           <Show when={doc.id === app.selectedDocument?.id}>
                              <div class={s.dotsIcon} />
                           </Show>
                        </div>
                     )}
                  </For>
               </div>
            </div>
         </div>
      </div>
   );
}

export default SideMenu;