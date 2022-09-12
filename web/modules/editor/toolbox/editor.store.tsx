import { BlokiDocument } from '@/lib/samples'
import { batch, createContext, createMemo, createUniqueId, useContext } from 'solid-js'
import { createStore } from 'solid-js/store'
import { BLOCK_SETTINGS, EditType, isTextBlock, ToolType } from '../misc'
import { AnyBlock, Transform, Point2D, PlacementStatus, Dimension } from '../types'

type ChangeHandler = (block: AnyBlock, absTransform: Transform, type: EditType) => void

function makeEditorProvider(props) {
   const [store, setStore] = createStore({
      tool: ToolType.Cursor,
      color: '#ffffff',
      strokeWidth: 5,
      action: {
         type: null as EditType,
         block: null as AnyBlock,
      },
      editingBlock: null as AnyBlock,
      editingType: null as EditType,
      selectedBlocks: [] as AnyBlock[],
      showContextMenu: false,
      overflowedBlocks: [] as AnyBlock[],
      isPlacementCorrect: false,
      doc: props.document as BlokiDocument,
      layout: [] as AnyBlock[],
      rommates: [] as any[],
      cursor: { x: 0, y: 0 } as Point2D,
      connected: false,
      placement: null as PlacementStatus,
   })

   const boxSize = createMemo(() => store.doc.gridOptions.gap + store.doc.gridOptions.size)
   const toAbs = (factor: number) => (factor <= 0 ? 0 : factor * boxSize() - store.doc.gridOptions.gap)
   const getRelPos = (absX: number, absY: number) => ({
      x: Math.floor(absX / boxSize()),
      y: Math.floor(absY / boxSize()),
   })
   const getRelSize = (width: number, height: number, roundFn = Math.ceil) => ({
      width: roundFn(width / boxSize()),
      height: roundFn(height / boxSize()),
   })
   const getAbsPos = (x: number, y: number) => ({ x: x * boxSize(), y: y * boxSize() })
   const getAbsSize = (width: number, height: number) => ({ width: toAbs(width), height: toAbs(height) })

   function isInMainGrid(x: number) {
      const { gridOptions: grid } = store.doc
      const start = (grid.width - grid.flowWidth) / 2
      const end = start + grid.flowWidth
      return x >= start && x < end
   }

   // Todo: sort vertically in createComputed and find space between blocks too.
   function findNextSpaceBelow(requiredSpace: Dimension, startFrom: Point2D = { x: 0, y: 0 }): Point2D {
      const sorted = store.layout
         .filter((b) => isInMainGrid(b.x) || isInMainGrid(b.x + b.width))
         .sort((a, b) => -b.y - b.height + a.y + a.height)

      let pos: Point2D
      for (let i = 1; i < sorted.length; i++) {
         const prev = sorted[i - 1]
         const curr = sorted[i]
         if (requiredSpace.height < curr.y - (prev.y + prev.height)) {
            const p = { x: prev.x, y: prev.y + prev.height }
            const { correct } = check({ ...p, ...requiredSpace })
            if (correct) {
               pos = p
               break
            }
         }
      }
      if (pos) return pos

      const lastBlock = sorted[sorted.length - 1]
      if (!lastBlock) return { x: store.doc.gridOptions.flowWidth, y: 1 }
      return { x: lastBlock.x, y: lastBlock.y + lastBlock.height }
   }

   function createBlock(block: Partial<AnyBlock>, editingType: EditType = EditType.Content, id = createUniqueId()) {
      block.id = id
      setStore('layout', (blocks) => blocks.concat(block as AnyBlock))
      const createdBlock = store.layout[store.layout.length - 1]
      setStore({
         editingBlock: createdBlock,
         editingType,
      })
      return createdBlock
   }

   function selectBlock(target: AnyBlock, type: EditType = EditType.Select) {
      if (target) {
         setStore({
            editingBlock: target,
            editingType: type,
         })
      } else {
         if (isTextBlock(store.editingBlock) && store.editingBlock.value === '') {
            deleteBlock(store.editingBlock)
         }
         setStore({
            editingBlock: null,
            editingType: null,
         })
      }
   }

   function deleteBlock(block: AnyBlock) {
      if (store.editingBlock === block) {
         setStore({
            editingBlock: null,
            editingType: null,
         })
      }
      setStore('layout', (blocks) => blocks.filter((b) => b.id !== block.id))
   }

   function check(block: AnyBlock, x = block.x, y = block.y, width = block.width, height = block.height) {
      const status: PlacementStatus = {
         correct: true,
         outOfBorder: false,
         intersections: [],
         affected: [],
      }
      const { gridOptions } = store.doc
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
      for (let i = 0; i < store.doc.layout.length; i++) {
         const sBlock = store.doc.layout[i]
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
   }

   function onChangeStart(block: AnyBlock, abs: Transform, type: EditType) {
      setStore({ editingBlock: block, editingType: type })
      const relTransform = { height: block.height, width: block.width, x: block.x, y: block.y }
      // emit
   }

   function onChange(block: AnyBlock, absTransform: Transform, type: EditType) {
      const { x, y } = getRelPos(absTransform.x, absTransform.y)
      const { width, height } = getRelSize(absTransform.width, absTransform.height)
      const placement = check(block, x, y, width, height)
      setStore({ isPlacementCorrect: placement.correct, overflowedBlocks: placement.affected, placement })
   }

   function onChangeEnd(block: AnyBlock, absTransform: Transform, type: EditType) {
      const { x, y } = getRelPos(absTransform.x, absTransform.y)
      const { width, height } = getRelSize(absTransform.width, absTransform.height)
      const placement = check(block, x, y, width, height)
      batch(() => {
         setStore({
            editingBlock: null,
            editingType: EditType.Select,
            isPlacementCorrect: true,
            overflowedBlocks: [],
            placement: null,
         })

         if (placement.correct) {
            setStore('layout', store.layout.indexOf(block), { x, y, width, height })
            return
         }
         setStore('layout', store.layout.indexOf(block), {
            x: block.x,
            y: block.y,
            width: block.width,
            height: block.height,
         })
      })
      //  emit
   }
   return {
      editor: store,
      setEditorStore: setStore,
      boxSize,
      check,
      createBlock,
      selectBlock,
      deleteBlock,
      getAbsPos,
      getAbsSize,
      getRelPos,
      getRelSize,
      toAbs,
      onChangeStart,
      onChange,
      onChangeEnd,
      findNextSpaceBelow,
   }
}

const EditorContext = createContext<ReturnType<typeof makeEditorProvider>>()

export function EditorContextProvider(props) {
   return <EditorContext.Provider value={makeEditorProvider(props)}>{props.children}</EditorContext.Provider>
}
export const useEditorContext = () => useContext(EditorContext)
