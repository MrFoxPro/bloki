import { ComponentProps, createComponent, createEffect, For, lazy, mergeProps, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { useLocation, useNavigate } from 'solid-app-router';
import { useAppStore } from '@/modules/app.store';

import './side-menu.scss';
import PageIcon from './assets/page.svg';
// import ArrowIcon from './assets/arrow.icon.svg';
// import AddIcon from './assets/add.icon.svg';
import SearchIcon from './assets/search.svg';
import SettingsIcon from './assets/settings.svg';
import TrashIcon from './assets/trash.svg';
// const Settings = lazy(() => import('../settings/settings'));
// import { useModalStore } from '../modals/modal';

const items = ['search', 'settings', 'trash'] as const;
const itemIconDict = {
   search: SearchIcon,
   settings: SettingsIcon,
   trash: TrashIcon
} as const;

type SideMenuProps = {
} & ComponentProps<'div'>;

export function SideMenu(props: SideMenuProps) {
   const location = useLocation();
   const navigate = useNavigate();

   const [state, setState] = createStore({
      menu: {
         settings: false,
         search: null,
         trash: null,
      }
   });
   // const createModal = useModalStore();


   // const [sysSettingsVisible, setSysSettingsVisible] = createModal(Settings, { useBlur: true, canHide: true });

   // createEffect(() => setSysSettingsVisible(state.menu.settings));
   // createEffect(() => setState('menu', 'settings', sysSettingsVisible()));

   const [app, { setAppStore }] = useAppStore();

   const PageItem = (props: { doc: BlokiDocument; }) => (
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
         <div class="top-bar workspace-bar">
            <div
               class="box"
            // style={{
            //    "background-image": `url(${selectedWorkspace()?.workspaceIcon})`
            // }}
            />
            {/* <div class="title">{selectedWorkspace()?.title ?? 'Select workspace'}</div> */}
         </div>
         <div class="menus">
            <div class="items">
               <For each={items}>
                  {(item) => (
                     <div
                        class="item"
                        classList={{
                           'highlighted': state.menu[item] === true,
                           'disabled': state.menu[item] === null,
                        }}
                        onClick={() => setState('menu', item, act => !act)}
                     >
                        {createComponent(itemIconDict[item], { class: "icon" })}
                        <span class="text">{`menu.items.${item}`}</span>
                     </div>
                  )}
               </For>
            </div>
            <div class="items-block">
               <div class="name">
                  {'menu.label.pages'}
                  {/* <AddIcon class="icon" /> */}
               </div>
               <div class="items">
                  <For each={app.documents?.filter(d => !d.shared) ?? []}>
                     {(doc) => <PageItem doc={doc} />}
                  </For>
               </div>
            </div>
            <div class="items-block">
               <div class="name">
                  {'menu.label.shared-pages'}
                  {/* <AddIcon class="icon" /> */}
               </div>
               <div class="items">
                  <For each={app.documents?.filter(d => d.shared) ?? []}>
                     {(doc) => <PageItem doc={doc} />}
                  </For>
               </div>
            </div>
         </div>
      </div>
   );
}

export default SideMenu;
