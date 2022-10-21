import { Route, Router, Routes } from '@solidjs/router'
import { lazy } from 'solid-js'
// import LandingView from './landing/landing'
// import { Link, Route, Router, Routes } from '@solidjs/router'
const LandingView = lazy(() => import('./landing/landing'))
const PlaygroundView = lazy(() => import('./playground/playground'))
// const WelcomeView = lazy(() => import('./welcome/welcome.view'))

export enum AppPath {
   Index = '/',
   Welcome = '/welcome',
   Welcome_Confirm = '/welcome/confirm',
   Playground = '/playground',
}
export function BlokiAppRouter() {
   // const devViews = import.meta.glob('./dev/*.tsx', { eager: false })
   // const paths = Object.keys(devViews)
   // const links = paths.map((p) => p.replace('./', '/').replace('.tsx', ''))
   // const DevRoutes = links.map((link, ind) => (
   //    <Route path={link} component={lazy(devViews[paths[ind]] as any)} />
   // ))

   // function DevIndex() {
   //    return (

   //       <div class="themed-bg">
   //          <h4>Dev pages:</h4>
   //          <ul class="items">
   //             {links.map((l) => (
   //                <li class="item">
   //                   <Link href={l}>{l}</Link>
   //                </li>
   //             ))}
   //          </ul>
   //       </div>
   //    )
   // }
   return (
      <Router>
         <Routes>
            <Route path={AppPath.Index} component={LandingView} />
            <Route path={AppPath.Playground} component={PlaygroundView} />
            {/* <Route path="/dev" component={DevIndex} /> */}
            {/* {DevRoutes} */}
            <Route path={'*'} element="Not found" />
         </Routes>
      </Router>
   )
}
