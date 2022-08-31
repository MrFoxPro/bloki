import './playground.scss'

import { lazy } from 'solid-js'
// import Workspace from '@/modules/workspace/workspace'
import { WindowsContextProvider, TransitionGraph } from '@/modules/layers/layers'
import { Title } from '@solidjs/meta'
import { DrawerSinglePipeline } from '@/modules/editor/drawer/drawer-single';
const SettingsView = lazy(() => import('./settings/settings.view'))

const layersGraph: TransitionGraph = {
   settings: ['password_change'],
   password_change: [],
}
const layersViews = {
   settings: SettingsView,
}
export function Playground() {
   return (
      <main class="main">
         <Title>Bloki | Playground | Single Pipeline</Title>
         <WindowsContextProvider graph={layersGraph} views={layersViews}>
            {/* <Workspace /> */}
            <DrawerSinglePipeline />
         </WindowsContextProvider>
      </main>
   )
}
export default Playground
