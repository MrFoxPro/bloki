import { lazy } from 'solid-js'
import { Route, Router, Routes } from '@solidjs/router'
const LandingView = lazy(() => import('./landing/landing'))
const PlaygroundView = lazy(() => import('./playground/playground'))
const WelcomeView = lazy(() => import('./welcome/welcome.view'))

export enum UrlPath {
   Index = '/',
   Welcome = '/welcome',
   Welcome_Confirm = '/welcome/confirm',
   Playground = '/playground',
}

export const BlokiAppRouter = () => (
   <Router>
      <Routes>
         <Route path={UrlPath.Index} component={LandingView} />
         <Route path={UrlPath.Welcome} component={WelcomeView} />
         <Route path={UrlPath.Welcome_Confirm} component={WelcomeView} />
         <Route path={UrlPath.Playground} component={PlaygroundView} />
      </Routes>
   </Router>
)
