import '@/assets/styles/global.scss';
import '@/assets/styles/fonts.scss';

import { RouteDefinition, Router, useRoutes } from 'solid-app-router';

import { render } from 'solid-js/web';
import { MainPage } from './pages/main/main.page';
import { BuildInfo } from './components/build-info/build-info.component';
import { AppStoreProvider } from './lib/app.store';

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
         <Router>
            <Routes />
         </Router>
         <BuildInfo />
      </AppStoreProvider>
   );
}

render(App, document.body);
