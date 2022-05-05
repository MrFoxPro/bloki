// import { createEffect, createRenderEffect, lazy, Suspense } from 'solid-js';
// import { useAppStore } from '@/components/app.store';
// import { useNavigate, useParams } from 'solid-app-router';
// const SideMenu = lazy(() => import('@/components/side-menu/side-menu.component'));
// const Workspace = lazy(() => import('@/components/workspace/workspace.component'));
// import f from '@/styles/framework';
// import s from './main.page.module.scss';

import s from "@/styles";
import { useNavigate } from "solid-app-router";

export function MainPage() {
	const navigate = useNavigate();
	navigate('/welcome');
	// const params = useParams();
	// const [app, { setAppStore }] = useAppStore();

	// createEffect(() => {
	// 	if (params.docId) {
	// 		setAppStore({ selectedDocumentId: params.docId });
	// 	}
	// });

	// createRenderEffect(() => {
	// 	if (!app.selectedDocumentId) navigate('/', { replace: true });
	// 	else if (params.docId !== app.selectedDocumentId) navigate('/docs/' + app.selectedDocumentId, { replace: true });
	// });

	return (
		<main class={s.page}>
			{/* <SideMenu />
			<Suspense>
				<Workspace />
			</Suspense> */}
		</main>
	);
};