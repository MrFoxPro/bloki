import '@/assets/styles/global.scss';
import '@/assets/styles/fonts.scss';

import { RouteDefinition, Router, useRoutes } from 'solid-app-router';
// import { AppProvider } from '@/stores/app-store';

import { render } from 'solid-js/web';
import { TestPage } from './pages/test/test.page';
import { BuildInfo } from './components/build-info/build-info.component';
import { AppStoreProvider } from './lib/app.store';

const routes: RouteDefinition[] = [
   {
      path: '/',
      component: TestPage,
   },
   {
      path: '/test',
      component: TestPage,
   }
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
