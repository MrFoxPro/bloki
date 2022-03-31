import '@/assets/styles/global.scss';
import '@/assets/styles/fonts.scss';

import { RouteDefinition, Router, useRoutes } from 'solid-app-router';
import { render } from 'solid-js/web';
import { MainPage } from './pages/main/main.page';
import { BuildInfo } from './components/build-info/build-info.component';
import { AppStoreProvider } from './lib/app.store';
import { Internationalization } from './components/i18n/internationalization.component';
import { ModalStoreProvider } from './components/modal/modal';

const routes: RouteDefinition[] = [
   {
      path: '/',
      component: MainPage,
   },
   {
      path: '/test',
      component: MainPage,
   },
];

function App() {
   const Routes = useRoutes(routes);
   return (
      <AppStoreProvider>
         <Internationalization>
            <ModalStoreProvider>
               <Router>
                  <Routes />
               </Router>
               <BuildInfo />
            </ModalStoreProvider>
         </Internationalization>
      </AppStoreProvider>
   );
}

render(App, document.body);
