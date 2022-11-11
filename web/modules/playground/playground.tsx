import './playground.css'

import { lazy } from 'solid-js'
import Workspace from '@/modules/workspace/workspace'
import { WindowsContextProvider, TransitionGraph } from '@/modules/layers/layers'
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
      <main class="m2 dark:hover:color-red">
         <WindowsContextProvider graph={layersGraph} views={layersViews}>
            <Workspace />
         </WindowsContextProvider>
      </main>
   )
}
export default Playground
