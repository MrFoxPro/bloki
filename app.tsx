import '@/assets/styles/global.scss';
import '@/assets/styles/fonts.scss';

import { RouteDefinition, Router, useRoutes } from 'solid-app-router';
// import { AppProvider } from '@/stores/app-store';

import { render } from 'solid-js/web';
import { TestPage } from './pages/test';

const routes: RouteDefinition[] = [
   {
      path: '/test',
      component: TestPage,
   },
]

function App() {
   const Routes = useRoutes(routes);
   return (
      <Router>
         {/* <AppProvider> */}
         <Routes />
         {/* </AppProvider> */}
      </Router>
   );
}

render(App, document.body);
