import 'uno.css'
import './workspace.css'

import { lazy, Show } from 'solid-js'
import { Avatars } from '../collab/avatars/avatars.component'
const BlokiEditor = lazy(() => import('@/modules/editor/editor'))
import { useLayersContext } from '../layers/layers'
import AbacusIcon from '@/assets/img/abacus.svg'
import ShareIcon from '@/assets/img/share.svg'
import { useSettings } from '../settings.store'
import { sampleDoc } from '@/lib/samples'

function TopBar() {
   const layers = useLayersContext()
   return (
      <div>
         <button>
            <ShareIcon />
            <span color-primary hover:color-red>
               Share
            </span>
         </button>
         <AbacusIcon class='icon clickable' onClick={[layers.toggle, 'settings']} />
      </div>
   )
}

export function Workspace() {
   // const { settings } = useSettings()

   return (
      <div class='workspace'>
         <TopBar />
         <BlokiEditor document={sampleDoc} />
      </div>
   )
}

export default Workspace
