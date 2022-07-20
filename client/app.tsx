import '@/styles/app.scss';

import { RouteDefinition, Router, useRoutes } from 'solid-app-router';
import { render } from 'solid-js/web';
import { useConsolePrintBuildInfo } from './lib/build-info';
import { AppStoreProvider } from './modules/app.store';
import { I18n } from './modules/i18n/i18n.module';
import { lazy } from 'solid-js';
import { ThemeContextProvider } from './modules/theme.store';
import { Toaster } from 'solid-toast';

const LandingView = lazy(() => import('./views/landing/landing.view'));
const MainView = lazy(() => import('./views/main/main.view'));
const WelcomeView = lazy(() => import('./views/welcome/welcome.view'));

const routes: RouteDefinition[] = [
   {
      path: '/',
      component: LandingView
   },
   {
      path: '/welcome',
      component: WelcomeView,
      children: [
         { path: '/', component: WelcomeView },
         { path: '/confirm', component: WelcomeView }
      ]
   },
   {
      path: '/demo',
      component: MainView
   }
];

function App() {
   useConsolePrintBuildInfo();
   const Routes = useRoutes(routes);
   return (
      <AppStoreProvider>
         <I18n>
            <ThemeContextProvider>
               {/* <ModalStoreProvider> */}
               <Router>
                  <Routes />
               </Router>
               {/* </ModalStoreProvider> */}
               <Toaster />
            </ThemeContextProvider>
         </I18n>
      </AppStoreProvider>
   );
}

render(App, document.body);
