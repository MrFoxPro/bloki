import { useAppStore } from '@/lib/app.store';
import { ComponentProps, For, mergeProps, Show } from 'solid-js';
import s from './side-menu.module.scss';
import cc from 'classcat';
import AddIcon from './assets/add.icon.svg';
import { useI18n } from '@solid-primitives/i18n';

const items = ['search', 'settings', 'trash'] as const;

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

   const [app, { setStore }] = useAppStore();

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
                           [s.itemHighlighed]: props.activeItems.includes(item),
                           [s.itemDisabled]: props.disabledItems.includes(item),
                        }}
                        onClick={() => props.onItemClick(item)}
                     >
                        <div classList={{ [s.icon]: true, [s[item]]: true }} />
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
                              [s.itemHighlighed]: doc.id === app.selectedDocument?.id
                           }}
                           onClick={() => setStore({ selectedDocument: doc })}
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