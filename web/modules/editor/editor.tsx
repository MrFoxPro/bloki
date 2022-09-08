import './editor.scss'
import { createMemo, onCleanup, Show, createEffect } from 'solid-js'
import { isFirefox } from '@solid-primitives/platform'
import { Repeat } from '@solid-primitives/range'
import type { Transform } from './types'
import {
   BlockType,
   EditType,
   getAsString,
   getGoodImageRelativeSize,
   GRID_COLOR_CELL,
   ToolType,
   isTextBlock,
   toBase64,
} from './misc'
import { TextBlockFontFamily } from './blocks/text/types'
import { Backlight } from './backlight/backglight'
import { BlockContextMenu } from './context-menu/ctx_menu'
import { Toolbox, toolsIconMap } from './toolbox/toolbox'
import { EditorContextProvider, useEditorContext } from './toolbox/editor.store'
import { useThemeContext } from '../theme.store'
import { Drawer } from './drawer/drawer'

function BlokiEditor() {
   let wrapperRef: HTMLDivElement
   let containerRef: HTMLDivElement

   const { createCSSColorMemo } = useThemeContext()
   const { editor, createBlock, selectBlock, boxSize, getRelPos, findNextSpaceBelow, check, toAbs } = useEditorContext()

   const containerBg = createMemo(() => {
      const {
         gridOptions: { size },
      } = editor.doc
      if (!editor.doc.showGrid) return null
      return `repeating-linear-gradient(0deg,${GRID_COLOR_CELL} 0 ${size}, transparent 0 ${boxSize()}px),
              repeating-linear-gradient(90deg, ${GRID_COLOR_CELL} 0 ${size}px, transparent 0 ${boxSize()}px)`
   })

   const cursorStrokeColor = createCSSColorMemo('--color-text-main')
   const cursor = createMemo(() => {
      const [toolType, ToolIcon] = toolsIconMap.find(([t]) => editor.tool === t)
      if (!toolType) return undefined

      const stroke = encodeURIComponent(cursorStrokeColor())
      const icon = ToolIcon({ stroke, width: 24, height: 24 }).outerHTML
      const cursor = `url('data:image/svg+xml;utf8, ${icon}') 0 20, auto`
      return cursor
   })

   function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
         if ([EditType.Content, EditType.Select].includes(editor.editingType)) {
            selectBlock(null)
         }
      } else if (e.key === 'Enter') {
         if (
            editor.editingType === null ||
            (editor.editingType === EditType.Content && isTextBlock(editor.editingBlock))
         ) {
            console.log('enter')
            e.preventDefault()
         }
      }
   }
   function onMainGridMouseMove(e: MouseEvent) {
      if (editor.editingType) return
      const { y } = getRelPos(e.offsetX, e.offsetY)
      const { gridOptions } = editor.doc
      const x = (gridOptions.width - gridOptions.flowWidth) / 2
      const block = { x, y, width: gridOptions.width, height: 1 }
      // const { correct } = checkPlacement(block);
   }

   function onMainGridMouseOut(e: MouseEvent) {}

   const pasteError = () => alert('We are allowing only images pasted from other internet sources!')
   async function onPaste(e: ClipboardEvent) {
      e.preventDefault()
      let src: string
      const file = Array.from(e.clipboardData.files)[0]
      const itemHtml = Array.from(e.clipboardData.items).find((x) => x.type === 'text/html')
      if (itemHtml) {
         const str = await getAsString(itemHtml)
         const regexp = str.match(/<img [^>]*src="[^"]*"[^>]*>/gm)
         if (!regexp) return
         const imgSrc = regexp.map((x) => x.replace(/.*src="([^"]*)".*/, '$1'))[0] as string
         if (!imgSrc?.includes('http')) {
            pasteError()
            return
         }
         src = imgSrc
      }
      if (file && !src) {
         const isFileImage = ['png', 'svg', 'jpeg', 'jpg', 'gif'].some((ext) => file.type.includes(ext))
         if (!isFileImage) return
         console.log(Array.from(e.clipboardData.files), Array.from(e.clipboardData.items))
         const imgSrc = await toBase64(file)
         src = imgSrc
      }
      if (!src) return
      const { width, height } = await getGoodImageRelativeSize(src, editor.doc.gridOptions)
      const { x, y } = findNextSpaceBelow({ width, height })
      const transform: Transform = {
         width,
         height,
         x,
         y,
      }
      // create block
   }

   function onGridClick(e: MouseEvent & { currentTarget: HTMLDivElement }) {
      if (editor.editingBlock) {
         selectBlock(null)
         return
      }
      let { x, y } = getRelPos(e.offsetX, e.offsetY)

      const newBlockTransform: Transform = {
         height: 1,
         width: 4,
         x,
         y,
      }
      if (check(newBlockTransform, x, y).correct) {
         createBlock(
            {
               type: BlockType.Regular,
               value: '',
               fontFamily: TextBlockFontFamily.Inter,
               ...newBlockTransform,
            },
            EditType.Content
         )
      }
   }

   createEffect(() => {
      window.addEventListener('keydown', onKeyDown)
      wrapperRef.addEventListener('paste', onPaste)
      onCleanup(() => {
         window.removeEventListener('keydown', onKeyDown)
         wrapperRef.removeEventListener('paste', onPaste)
      })
   })

   return (
      <>
         <div
            class="wrapper"
            ref={wrapperRef}
            style={{
               'scroll-snap-type': !isFirefox ? 'x mandatory' : undefined,
            }}
         >
            <div
               class="container"
               ref={containerRef}
               style={{
                  'background-image': containerBg(),
                  width: toAbs(editor.doc.gridOptions.width).px,
                  height: toAbs(editor.doc.gridOptions.height).px,
                  'user-select': editor.tool !== ToolType.Cursor ? 'none' : 'initial',
                  // cursor: cursor(),
               }}
            >
               <Show when={/*@once*/ !isFirefox}>
                  <div class="zones">
                     <Repeat times={3}>
                        <div
                           class="zone"
                           style={{
                              width: toAbs(editor.doc.gridOptions.flowWidth).px,
                           }}
                        />
                     </Repeat>
                  </div>
               </Show>
               <Backlight />
               {/* <div class="grid main" onClick={(e) => onGridClick(e)} onContextMenu={(e) => e.preventDefault()} /> */}
               {/* <div
                  class="grid flow"
                  style={{
                     width: toAbs(editor.doc.gridOptions.flowWidth).px,
                     'margin-inline': (toAbs(editor.doc.gridOptions.width - editor.doc.gridOptions.flowWidth) / 2).px,
                     background: editor.doc.showGrid ? 'rgba(128, 128, 128, 0.507)' : null,
                  }}
                  onClick={(e) => onGridClick(e)}
                  onMouseMove={onMainGridMouseMove}
                  onMouseOut={onMainGridMouseOut}
                  onContextMenu={(e) => e.preventDefault()}
               /> */}
               <BlockContextMenu />
               <Drawer />
               {/* <Cursors /> */}
            </div>
         </div>
         <Toolbox />
      </>
   )
}
export default (props) => (
   <EditorContextProvider {...props}>
      <BlokiEditor />
   </EditorContextProvider>
)
