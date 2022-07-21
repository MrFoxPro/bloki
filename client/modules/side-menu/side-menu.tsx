import './side-menu.scss';
import { ComponentProps, createComponent, createEffect, For, lazy, mergeProps, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { useLocation, useNavigate } from 'solid-app-router';

import PageIcon from './assets/page.svg';
// import ArrowIcon from './assets/arrow.icon.svg';
// import AddIcon from './assets/add.icon.svg';

import SearchIcon from './assets/search.svg';
import SettingsIcon from './assets/settings.svg';
import TrashIcon from './assets/trash.svg';
import { langs } from '../i18n/i18n.module';
import { useLayersContext } from '../layers';
// const Settings = lazy(() => import('../settings/settings'));
// import { useModalStore } from '../modals/modal';

// const items = ['search', 'settings', 'trash'] as const;
const itemIconDict = {
   search: SearchIcon,
   settings: SettingsIcon,
   trash: TrashIcon
};

type SideMenuProps = {} & ComponentProps<'div'>;
export function SideMenu(props: SideMenuProps) {
   // const location = useLocation();
   // const navigate = useNavigate();
   const layers = useLayersContext();

   const PageItem = (props: { doc: BlokiDocument }) => (
      <div
         class="page item"
         // classList={{
         //    'highlighted': props.doc.id === app.selectedDocumentId
         // }}
         // onClick={() => setAppStore({ selectedDocumentId: props.doc.id })}
      >
         {/* <Show when={true}>
				<div class={cc([s.icon, s.arrow])} />
			</Show> */}
         <PageIcon class="icon page" />
         <span class="text">{props.doc.title}</span>
         {/* <Show when={props.doc.id === app.selectedDocumentId}>
            <div class="dots" />
         </Show> */}
      </div>
   );

   return (
      <div class="side-menu" classList={{ [props.class]: true }}>
         <div class="workspace-bar">
            <div class="box" />
            <h3 class="title">Workspace</h3>
         </div>
         <div class="menus">
            <div class="items">
               <For each={['search', 'settings', 'trash'] as const}>
                  {(item) => (
                     <div
                        class="item"
                        classList={{
                           highlighted: layers.includes(item),
                           disabled: item !== 'settings'
                        }}
                        onClick={() => {
                           layers.toggle(item);
                        }}
                     >
                        {createComponent(itemIconDict[item], { class: 'icon' })}
                        <span class="text">{t().items[item]}</span>
                     </div>
                  )}
               </For>
            </div>
         </div>
      </div>
   );
}

export default SideMenu;

const t = langs({
   en: {
      items: {
         search: 'Search',
         settings: 'Settings',
         trash: 'Trash'
      }
   },
   ru: {
      items: {
         search: 'Поиск',
         settings: 'Настройки',
         trash: 'Помойка'
      }
   }
});
