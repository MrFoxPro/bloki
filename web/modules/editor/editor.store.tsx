import { BlokiDocument } from '@/lib/samples'
import { batch, createContext, createMemo, createUniqueId, useContext } from 'solid-js'
import { createStore } from 'solid-js/store'
import { BLOCK_SETTINGS, EditType, isTextBlock, ToolType } from './misc'
import { AnyBlock, Transform, Point2D, PlacementStatus, Dimension } from './types'

// type ChangeHandler = (block: AnyBlock, absTransform: Transform, type: EditType) => void
function createEditorProvider(props) {
   const [store, setStore] = createStore({
      tool: ToolType.Cursor,
      color: '#ffffff',
      strokeWidth: 5,
      action: {
         type: /** @type {number?} */ null,
         block: null as AnyBlock | null,
      },
      editingBlock: null as AnyBlock | null,
      editingType: null as EditType | null,
      selectedBlocks: [] as AnyBlock[],
      showContextMenu: false,
      overflowedBlocks: [] as AnyBlock[],
      isPlacementCorrect: false,
      doc: props.document as BlokiDocument,
      layout: [] as AnyBlock[],
      rommates: [] as any[],
      cursor: /**@type {Point2D} */ { x: 0, y: 0 },
      connected: false,
      placement: null as PlacementStatus | null,
      get boxSize() {
         return createMemo(() => this.doc.gridOptions.gap + this.doc.gridOptions.size)
      },
      toAbs(factor: number) {
         return factor <= 0 ? 0 : factor * this.boxSize() - this.doc.gridOptions.gap
      },
      getRelPos(absX: number, absY: number) {
         return {
            x: Math.floor(absX / this.boxSize()),
            y: Math.floor(absY / this.boxSize())
         } as const
      },
      getRelSize(width: number, height: number, roundFn = Math.ceil) {
         return {
            width: roundFn(width / this.boxSize()),
            height: roundFn(height / this.boxSize()),
         } as const
      },
      getAbsPos(x: number, y: number) {
         return {
            x: x * this.boxSize(),
            y: y * this.boxSize()
         }
      },
      getAbsSize(width: number, height: number) {
         return {
            width: this.toAbs(width),
            height: this.toAbs(height)
         }
      },
      isInMainGrid(x: number) {
         const { gridOptions: grid } = this.doc
         const start = (grid.width - grid.flowWidth) / 2
         const end = start + grid.flowWidth
         return x >= start && x < end
      },
      // Todo: sort vertically in createComputed and find space between blocks too.
      findNextSpaceBelow(requiredSpace: Dimension, startFrom: Point2D = { x: 0, y: 0 }): Point2D {
         const sorted = this.layout
            .filter((b) => this.isInMainGrid(b.x) || this.isInMainGrid(b.x + b.width))
            .sort((a, b) => -b.y - b.height + a.y + a.height)

         let pos: Point2D
         for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i - 1]
            const curr = sorted[i]
            if (requiredSpace.height < curr.y - (prev.y + prev.height)) {
               const p = { x: prev.x, y: prev.y + prev.height }
               const { correct } = this.check({ ...p, ...requiredSpace })
               if (correct) {
                  pos = p
                  break
               }
            }
         }
         if (pos) return pos

         const lastBlock = sorted[sorted.length - 1]
         if (!lastBlock) return { x: this.doc.gridOptions.flowWidth, y: 1 }
         return { x: lastBlock.x, y: lastBlock.y + lastBlock.height }
      },
      createBlock(block: Partial<AnyBlock>, editingType: EditType = EditType.Content, id = createUniqueId()) {
         block.id = id
         setStore('layout', (blocks) => blocks.concat(block as AnyBlock))
         const createdBlock = this.layout[this.layout.length - 1]
         setStore({
            editingBlock: createdBlock,
            editingType,
         })
         return createdBlock
      },
      selectBlock(target: AnyBlock, type: EditType = EditType.Select) {
         if (target) {
            setStore({
               editingBlock: target,
               editingType: type,
            })
         } else {
            if (isTextBlock(this.editingBlock) && this.editingBlock.value === '') {
               this.deleteBlock(this.editingBlock)
            }
            setStore({
               editingBlock: null,
               editingType: null,
            })
         }
      },
      deleteBlock(block: AnyBlock) {
         if (this.editingBlock === block) {
            setStore({
               editingBlock: null,
               editingType: null,
            })
         }
         setStore('layout', (blocks) => blocks.filter((b) => b.id !== block.id))
      },
      check(block: AnyBlock, x = block.x, y = block.y, width = block.width, height = block.height) {
         const status: PlacementStatus = {
            correct: true,
            outOfBorder: false,
            intersections: [],
            affected: [],
         }
         const { gridOptions } = this.doc
         const { minWidth, minHeight, maxWidth, maxHeight } = BLOCK_SETTINGS
         if (width > maxWidth || width < minWidth || height > maxHeight || height < minHeight) {
            status.correct = false
            status.outOfBorder = true
         }
         // TODO: different grid sizes?
         if (x < 0 || y < 0 || y + height > gridOptions.height || x + width > gridOptions.width) {
            status.correct = false
            status.outOfBorder = true
         }
         for (let i = 0; i < this.doc.layout.length; i++) {
            const sBlock = this.doc.layout[i]
            if (sBlock.id === block.id) continue
            const dx = sBlock.x - x,
               dy = sBlock.y - y,
               colXDist = dx > 0 ? width : sBlock.width,
               colYDist = dy > 0 ? height : sBlock.height,
               adx = Math.abs(dx),
               ady = Math.abs(dy)
            if (adx < colXDist && ady < colYDist) {
               status.correct = false
               status.affected.push(sBlock)
               const startX = Math.max(x, sBlock.x),
                  startY = Math.max(y, sBlock.y),
                  xEnd = Math.min(x + width, sBlock.x + sBlock.width),
                  yEnd = Math.min(y + height, sBlock.y + sBlock.height)
               status.intersections.push({
                  x: startX,
                  width: xEnd - startX,
                  y: startY,
                  height: yEnd - startY,
               })
            }
         }
         return status
      },
      onChangeStart(block: AnyBlock, abs: Transform, type: EditType) {
         setStore({ editingBlock: block, editingType: type })
         const relTransform = { height: block.height, width: block.width, x: block.x, y: block.y }
         // emit
      },
      onChange(block: AnyBlock, absTransform: Transform, type: EditType) {
         const { x, y } = this.getRelPos(absTransform.x, absTransform.y)
         const { width, height } = this.getRelSize(absTransform.width, absTransform.height)
         const placement = this.check(block, x, y, width, height)
         setStore({ isPlacementCorrect: placement.correct, overflowedBlocks: placement.affected, placement })
      },
      onChangeEnd(block: AnyBlock, absTransform: Transform, type: EditType) {
         const { x, y } = this.getRelPos(absTransform.x, absTransform.y)
         const { width, height } = this.getRelSize(absTransform.width, absTransform.height)
         const placement = this.check(block, x, y, width, height)
         batch(() => {
            setStore({
               editingBlock: null,
               editingType: EditType.Select,
               isPlacementCorrect: true,
               overflowedBlocks: [],
               placement: null,
            })

            if (placement.correct) {
               setStore('layout', this.layout.indexOf(block), { x, y, width, height })
               return
            }
            setStore('layout', this.layout.indexOf(block), {
               x: block.x,
               y: block.y,
               width: block.width,
               height: block.height,
            })
         })
         //  emit
      }
   })
   return store
}

const EditorContext = createContext<ReturnType<typeof createEditorProvider>>()

export function EditorContextProvider(props) {
   const editor = createEditorProvider(props)
   return <EditorContext.Provider value={editor}>{props.children}</EditorContext.Provider>
}

export const useEditorContext = () => useContext(EditorContext)!
