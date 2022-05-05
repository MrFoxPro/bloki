import { useI18n } from "@solid-primitives/i18n";
import { lazy, Show } from "solid-js";
import { useAppStore } from "../app.store";
import { DrawerStoreProvider } from "../bloki-editor/drawer.store";
import { EditorStoreProvider, useEditorStore } from "../bloki-editor/editor.store";
import { Avatars } from "../collab/avatars/avatars.component";
const BlokiEditor = lazy(() => import('@/modules/bloki-editor/bloki-editor.component'));
const Toolbox = lazy(() => import('../bloki-editor/toolbox/toolbox.component'));
import s from './workspace.module.scss';

export function Workspace() {
	const [t] = useI18n();
	const [app, { selectedDocument }] = useAppStore();

	const ConnectionStatus = () => {
		const [editor] = useEditorStore();
		return (
			<div class={s.status} classList={{ [s.connected]: editor.connected }}>
				[{editor.connected ? t('topbar.doc-status.connected') : t('topbar.doc-status.disconnected')}]
			</div>
		);
	};
	return (
		<Show when={selectedDocument()}>
			<DrawerStoreProvider>
				<EditorStoreProvider document={selectedDocument()}>
					<div class={s.workspace}>
						<div class={s.topBar}>
							<div class={s.leftBar}>
								<Toolbox />
							</div>
							<h4 class={s.docTitle}>{selectedDocument()?.title} <ConnectionStatus /></h4>
							<div class={s.rightBar}>
								<Avatars />
								<button class={s.share}>Share</button>
							</div>
						</div>
						<Show when={selectedDocument()}>
							<BlokiEditor
								gridType={app.gridRenderMethod}
							/>
						</Show>
					</div>
				</EditorStoreProvider>
			</DrawerStoreProvider>
		</Show>
	);
}
export default Workspace;