import { RouteDefinition, Router, useRoutes } from 'solid-app-router';
import { render } from 'solid-js/web';
import { BuildInfo } from './modules/build-info/build-info.component';
import { AppStoreProvider } from './modules/app.store';
import { I18n } from './modules/i18n/i18n.module';
import { ModalStoreProvider } from './modules/modals/modal';
import { lazy } from 'solid-js';

const MainPage = lazy(() => import('./pages/main'));
const WelcomePage = lazy(() => import('./pages/welcome'));
const routes: RouteDefinition[] = [
	{
		path: '/',
		component: MainPage,
	},
	{
		path: '/welcome',
		component: WelcomePage,
		children: [
			{ path: '/', component: WelcomePage, },
			{ path: '/confirm', component: WelcomePage }
		]
	},
	{
		path: '/docs',
		component: MainPage,
	},
	{
		path: '/docs/:docId',
		component: MainPage,
	},
];

function App() {
	const Routes = useRoutes(routes);
	return (
		<AppStoreProvider>
			<I18n>
				<ModalStoreProvider>
					<Router>
						<Routes />
					</Router>
					<BuildInfo />
				</ModalStoreProvider>
			</I18n>
		</AppStoreProvider>
	);
}

render(App, document.body);