import './main.view.scss';
import { lazy, onMount } from 'solid-js';
import SideMenu from '@/modules/side-menu/side-menu';
import Workspace from '@/modules/workspace/workspace';
import toast from 'solid-toast';
import { LayersContextProvider } from '@/modules/layers';
const SettingsView = lazy(() => import('./settings/settings.view'));

export function MainView() {
   onMount(() => {
      toast.success('Давно тебя не было в уличных гонках!', {
         position: 'bottom-right',
         duration: 2700,
         iconTheme: {
            primary: '#ea580c',
            secondary: '#ffedd5'
         },
         style: {
            color: '#c2410c',
            background: '#ffedd5'
         }
      });
   });
   return (
      <main class="main">
         <LayersContextProvider
            graph={{
               settings: ['password_change'],
               password_change: []
            }}
            views={{
               settings: SettingsView
            }}
         >
            <SideMenu />
            <Workspace />
         </LayersContextProvider>
      </main>
   );
}
export default MainView;
