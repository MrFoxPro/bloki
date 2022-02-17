import '@/assets/styles/global.scss';
import '@/assets/styles/fonts.scss';

import { RouteDefinition, Router, useRoutes } from 'solid-app-router';
// import { AppProvider } from '@/stores/app-store';

import { render } from 'solid-js/web';
import { TestPage } from './pages/test';
import { BuildInfo } from './components/build-info/build-info.component';

const routes: RouteDefinition[] = [
   {
      path: '/',
      component: TestPage,
   },
   {
      path: '/test',
      component: TestPage,
   },
];

function App() {
   const Routes = useRoutes(routes);
   return (
      <>
         <Router>
            <Routes />
         </Router>
         <BuildInfo />
      </>
   );
}

render(App, document.body);
