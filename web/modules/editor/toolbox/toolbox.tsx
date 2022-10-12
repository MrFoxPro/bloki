import './toolbox.scss'
import { createEffect, createSignal, For, onCleanup, onError } from 'solid-js'
import { ToolType } from '../misc'
import PlusIcon from '@/assets/img/plus.svg'
import { reportBlokiError } from '@/lib/error'
import { useEditorContext } from './editor.store'

import CursorIcon from './assets/cursor.svg'
import PenIcon from './assets/pen.svg'
import LastikIcon from './assets/lastik.svg'
import RectIcon from './assets/rect.svg'
import ArrowIcon from './assets/arrow.svg'

const initialPenPresets: ReadonlyArray<PenDrawConfig> = [
   {
      color: '#FC5A5A',
      width: 1,
   },
   {
      color: '#0075FF',
      width: 2,
   },
   {
      color: '#FFD600',
      width: 10,
   },
]

export const toolsIconMap = [
   [ToolType.Cursor, CursorIcon],
   [ToolType.Pen, PenIcon],
   [ToolType.BezierPen, PenIcon],
   [ToolType.Lastik, LastikIcon],
   [ToolType.Rect, RectIcon],
   [ToolType.Arrow, ArrowIcon],
] as const

export const toolsKeyMap = {
   1: ToolType.Cursor,
   2: ToolType.Pen,
   3: ToolType.Lastik,
   4: ToolType.Rect,
   5: ToolType.Arrow,
} as const

export type PenDrawConfig = {
   color: string
   width: number
}

export function Toolbox() {
   let lastSelectedFigure = ToolType.Rect

   const { editor, setEditorStore } = useEditorContext()
   const [showInstrSettings, setShowInstrSettings] = createSignal(false)
   const [presets, setPresets] = createSignal(initialPenPresets)
   const [colorPalette, setColorPalette] = createSignal([
      '#0057FF',
      '#F8E327',
      '#F14725',
      '#000000',
      '#10A689',
   ])

   function onClick(tool: ToolType) {
      if (showInstrSettings()) {
         setShowInstrSettings(false)
      } else setShowInstrSettings(tool !== ToolType.Cursor)
      setEditorStore({ tool })
   }

   function onKeyDown(e: KeyboardEvent) {
      if (document.activeElement instanceof HTMLInputElement) {
         console.log(document.activeElement)
         return
      }
      if (editor.editingBlock) return
      const tool = toolsKeyMap[Number(e.key)]
      if (tool) {
         setEditorStore({
            tool,
         })
      }
   }

   // createEffect(() => {
   //    window.addEventListener('keydown', onKeyDown, false)
   //    onCleanup(() => {
   //       window.removeEventListener('keydown', onKeyDown, false)
   //    })
   // })

   onError((e) => {
      reportBlokiError(e)
   })

   return (
      <div class="toolbox">
         <div class="block tools">
            <For each={/*@once*/ toolsIconMap}>
               {([type, Icon]) => (
                  <Icon
                     classList={{
                        active: editor.tool === type,
                     }}
                     onClick={[onClick, type]}
                     aria-label="This"
                     aria-labelledby="This"
                  />
               )}
            </For>
         </div>
         <div class="block palette">
            <input
               type="range"
               min={2}
               max={10}
               step={0.5}
               value={editor.strokeWidth}
               onInput={(e) =>
                  setEditorStore({
                     strokeWidth: e.currentTarget.valueAsNumber,
                  })
               }
            />
            <div class="colors">
               <For each={colorPalette()}>
                  {(color) => (
                     <div
                        class="color"
                        style={{
                           background: color,
                        }}
                        onClick={() => setEditorStore({ color: color })}
                     />
                  )}
               </For>
               <PlusIcon class="plus" />
            </div>
         </div>
         <div class="block presets">
            <For each={presets()}>
               {(preset) => (
                  <div
                     class="color selectable"
                     classList={{
                        selected: editor.color === preset.color,
                     }}
                     onClick={() => setEditorStore({ color: preset.color })}
                  >
                     <svg class="pad" viewBox="0 0 100 100">
                        <circle
                           cx="50"
                           cy="50"
                           r={(preset.width / 20) * 90}
                           style={{
                              fill: preset.color,
                           }}
                        />
                     </svg>
                  </div>
               )}
            </For>
         </div>
         <div class="block picker">
            <ColorPicker />
         </div>
      </div>
   )
}
function ColorPicker() {
   let colorRef: HTMLInputElement
   const [hex, setHex] = createSignal('#ffa61f')

   createEffect(() => {
      colorRef.value = hex()
   })

   return (
      <>
         <input
            ref={colorRef}
            type="color"
            class="area"
            onChange={(e) => setHex(e.currentTarget.value)}
            value={hex()}
            title="Click to select"
         />
         <input
            type="text"
            class="hex"
            value={hex()}
            pattern="^#+([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$"
            onInput={(e) => {
               const { valid } = e.currentTarget.validity
               if (valid) setHex(e.currentTarget.value)
            }}
         />
      </>
   )
}
