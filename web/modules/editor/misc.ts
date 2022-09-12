import type { AnyBlock, Transform, CodeBlock, Dimension, ImageBlock, Point2D, TextBlock } from './types'

export const GRID_COLOR_CELL = '#005eff32'
export const BLOCK_SETTINGS = {
   minWidth: 1,
   minHeight: 1,
   maxWidth: 45,
   maxHeight: 45,
}

export enum EditType {
   Drag = 1,
   Resize,
   Select,
   Content,
}
export enum ToolType {
   Cursor = 1,
   Pen,
   BezierPen,
   Lastik,
   Circle,
   Triangle,
   Rect,
   Arrow,
}
export enum BlockType {
   Title = 1,
   Regular,
   H1,
   H2,
   H3,
   Description = 6,
   Image = 7,
   Code = 8,
}

export function isTextBlock(block: AnyBlock): block is TextBlock {
   return block?.type < 6
}
export function isImageBlock(block: AnyBlock): block is ImageBlock {
   return block?.type === BlockType.Image
}
export function isCodeBlock(block: AnyBlock): block is CodeBlock {
   return block?.type === BlockType.Code
}

export function calcGridSize(factor: number, size: number, gap: number) {
   if (factor <= 0) return 0
   return factor * (size + gap) - gap
}
export function getImgDimension(dataURL: string): Promise<Dimension> {
   return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
         resolve({
            height: img.naturalHeight,
            width: img.naturalWidth,
         })
         img.remove()
      }
      img.src = dataURL
   })
}
export const getImageOrFallback = (src: string) => {
   return new Promise<string>((resolve, reject) => {
      const img = new Image()
      img.src = src
      img.onload = () => resolve(src)
      img.onerror = () => reject()
   })
}
export const toBase64 = (file) =>
   new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
   })
export function distanceBetweenPoints(p1: Point2D, p2: Point2D) {
   return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)
}
export function isInsideRect(x: number, y: number, rect: Transform | DOMRect) {
   return x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height
}
export function readAsDataUrl(b: Blob) {
   return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = (e) => reject(reader.error)
      reader.readAsDataURL(b)
   })
}
export async function getGoodImageRelativeSize(imgSrc: string, options) {
   if (!imgSrc) {
      return { width: options.mGridWidth, height: (options.mGridWidth * 2) / 3 }
   }
   let dimension: Dimension
   if (imgSrc.includes('svg')) {
      dimension = { width: options.mGridWidth, height: options.mGridWidth }
   } else dimension = await getImgDimension(imgSrc)
   const ratio = dimension.width / dimension.height
   const width = options.mGridWidth
   const height = Math.ceil(width / ratio)
   return { width, height }
}
export const getAsString = (item: DataTransferItem) =>
   new Promise<string>((res, rej) => {
      item.getAsString((value) => {
         res(value)
      })
   })
