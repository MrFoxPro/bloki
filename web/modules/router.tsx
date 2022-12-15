import { Route, Router, Routes } from '@solidjs/router'
import { lazy } from 'solid-js'
const Playground = lazy(() => import('./playground/playground'))

export enum AppPath {
	Index = '/',
	Welcome = '/welcome',
	Welcome_Confirm = '/welcome/confirm',
	Playground = '/playground',
}

export function BlokiAppRouter() {
	return (
		<Router base="/spa">
			<Routes>
				<Route path={AppPath.Playground} component={Playground} />
				<Route path={'*'} element="[SPA] Not found" />
			</Routes>
		</Router>
	)
}
