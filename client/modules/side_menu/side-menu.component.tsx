import cc from 'classcat';
import { ComponentProps, createComponent, createEffect, For, lazy, mergeProps, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { useLocation, useNavigate } from 'solid-app-router';
import { useI18n } from '@solid-primitives/i18n';
import { useAppStore } from '@/modules/app.store';

import s from './side-menu.module.scss';
import PageIcon from './assets/page.icon.svg';
// import ArrowIcon from './assets/arrow.icon.svg';
// import AddIcon from './assets/add.icon.svg';
import SearchIcon from './assets/search.icon.svg';
import SettingsIcon from './assets/settings.icon.svg';
import TrashIcon from './assets/trash.icon.svg';
const Settings = lazy(() => import('../settings/settings.component'));
import { NameInput } from '../modals/name-input/name-input.modal';
import { useModalStore } from '../modals/modal';
import { BlokiDocument } from '@/lib/entities';

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
	const createModal = useModalStore();

	const [nameVisible, setNameVisible] = createModal(NameInput, { useBlur: true, canHide: false });
	setNameVisible(true);

	createEffect(() => setNameVisible(!app.name));

	const [sysSettingsVisible, setSysSettingsVisible] = createModal(Settings, { useBlur: true, canHide: true });

	createEffect(() => setSysSettingsVisible(state.menu.settings));
	createEffect(() => setState('menu', 'settings', sysSettingsVisible()));

	const [t] = useI18n();

	const [app, { setAppStore, selectedWorkspace }] = useAppStore();

	const PageItem = (props: { doc: BlokiDocument; }) => (
		<div
			class={cc([s.item, s.page])}
			classList={{
				[s.highlighted]: props.doc.id === app.selectedDocumentId
			}}
			onClick={() => setAppStore({ selectedDocumentId: props.doc.id })}
		>
			{/* <Show when={true}>
				<div class={cc([s.icon, s.arrow])} />
			</Show> */}
			<PageIcon class={cc([s.icon, s.page])} />
			<span class={s.text}>{props.doc.title}</span>
			<Show when={props.doc.id === app.selectedDocumentId}>
				<div class={s.dots} />
			</Show>
		</div>
	);

	return (
		<div class={s.sideMenu} classList={{ [props.class]: true }}>
			<div class={s.workspaceBar}>
				<div
					class={s.box}
				// style={{
				//    "background-image": `url(${selectedWorkspace()?.workspaceIcon})`
				// }}
				/>
				<div class={s.title}>{selectedWorkspace()?.title ?? 'Select workspace'}</div>
			</div>
			<div class={s.menus}>
				<div class={s.items}>
					<For each={items}>
						{(item) => (
							<div
								class={s.item}
								classList={{
									[s.highlighted]: state.menu[item] === true,
									[s.disabled]: state.menu[item] === null,
								}}
								onClick={() => setState('menu', item, act => !act)}
							>
								{createComponent(itemIconDict[item], { class: s.icon })}
								<span class={s.text}>{t(`menu.items.${item}`)}</span>
							</div>
						)}
					</For>
				</div>
				<div class={s.block}>
					<div class={s.name}>
						{t('menu.label.pages')}
						{/* <AddIcon class={s.icon} /> */}
					</div>
					<div class={s.items}>
						<For each={app.documents?.filter(d => !d.shared) ?? []}>
							{(doc) => <PageItem doc={doc} />}
						</For>
					</div>
				</div>
				<div class={s.block}>
					<div class={s.name}>
						{t('menu.label.shared-pages')}
						{/* <AddIcon class={s.icon} /> */}
					</div>
					<div class={s.items}>
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