import { css } from '@linaria/core';
import { lazy } from 'solid-js';
import F from '@/modules/editor/editor'
const BlokiEditor = lazy(() => import('@/modules/editor/editor'))

export function Page() {
   return (
      <main>
         <BlokiEditor />
      </main>
   )
}

