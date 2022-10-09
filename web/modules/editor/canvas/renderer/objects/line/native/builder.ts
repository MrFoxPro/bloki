import { Point2DArray } from '@/modules/editor/types'

export module NativeLineBuilder {
   /**
    * Builds a line to draw using the gl.drawArrays(gl.LINES) method
    * @param {PIXI.GraphicsData} opts - The graphics object containing all the necessary properties
    * @param {PIXI.GraphicsGeometry} output - Geometry where to append output
    */
   export function build(segments: Point2DArray, closedShape = false) {
      const points = segments

      const verts: number[] = []
      const indices: number[] = []
      const result = {
         verts,
         indices,
      }

      if (points.length === 0) return result

      const length = points.length / 2

      const startIndex = verts.length / 2
      let currentIndex = startIndex

      verts.push(points[0], points[1])

      for (let i = 1; i < length; i++) {
         verts.push(points[i * 2], points[i * 2 + 1])
         indices.push(currentIndex, currentIndex + 1)

         currentIndex++
      }

      if (closedShape) {
         indices.push(currentIndex, startIndex)
      }
      return result
   }
}
