import { createEffect, createRenderEffect, lazy, Suspense } from 'solid-js';
import { useAppStore } from '@/lib/app.store';
import { useNavigate, useParams } from 'solid-app-router';
const SideMenu = lazy(() => import('@/components/side-menu/side-menu.component'));
const Workspace = lazy(() => import('@/components/workspace/workspace.component'));
import s from './main.page.module.scss';

export function MainPage() {
   const navigate = useNavigate();
   const params = useParams();
   const [app, { setAppStore }] = useAppStore();

   createEffect(() => {
      if (params.docId) {
         setAppStore({ selectedDocumentId: params.docId });
      }
   });

   createRenderEffect(() => {
      if (!app.selectedDocumentId) navigate('/', { replace: true });
      else if (params.docId !== app.selectedDocumentId) navigate('/docs/' + app.selectedDocumentId, { replace: true });
   });

   return (
      <main class={s.main}>
         <SideMenu />
         <Suspense>
            <Workspace />
         </Suspense>
      </main>
   );
};

