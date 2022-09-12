import { CodeBlockTheme } from './blocks/code/types'
import type { TextBlockFontFamily } from './blocks/text/types'
import type { BlockType } from './misc'

export type Point2D = { x: number; y: number }
export type Point2DTupleView = [x: number, y: number]
export type Point2DArray = number[]

export type Dimension = { width: number; height: number }

export type Transform = Point2D & Dimension

export type PlacementStatus = {
   correct: boolean
   intersections: Transform[]
   outOfBorder: boolean
   affected: AnyBlock[]
}
export type Block = {
   id: string
   type: BlockType
   x: number
   y: number
   width: number
   height: number
}
export type ImageBlock = Block & {
   value: string
   width: number
   height: number
}
export type TextBlock = Block & {
   value: string
   fontFamily: TextBlockFontFamily
}
export type CodeBlock = Block & {
   value: string
   theme: CodeBlockTheme
}
export type AnyBlock = Block | TextBlock | ImageBlock | CodeBlock
