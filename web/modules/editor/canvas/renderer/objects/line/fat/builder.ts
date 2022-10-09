import { Point2DArray } from '@/modules/editor/types'
import { ObjectKind } from '../../object_kind'
import { GRAPHICS_CURVES } from '../graphic_curves'
import { FatLineStyle, LineCap, LineJoin } from '../line2d'

/**
 * {@link https://github.com/pixijs/pixijs/blob/dev/packages/graphics/src/utils/buildLine.ts Source}
 * Additional references:
 * - {@link https://github.com/evanw/theta/blob/master/src/core/smooth.sk Theta}
 * - {@link https://github.com/m-schuetz/Potree2/blob/prototyping/src/modules/mesh/WireframeMaterial.js Potree2}
 * - {@link https://registry.khronos.org/webgl/sdk/tests/conformance/limits/gl-line-width.html Khronos line width}
 * - {@link https://github.com/gpuweb/gpuweb/issues/1546 GPUWeb line width}
 * - {@link http://output.jsbin.com/ApitIxo/2/ ApitIxo}
 * - gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE)
 */
export module FatLineBuilder {
   /**
    * Buffers vertices to draw a square cap.
    * {@link https://github.com/pixijs/pixijs/blob/dev/packages/graphics/src/utils/buildLine.ts#L24 Source}
    * @param {number} x - X-coord of end point
    * @param {number} y - Y-coord of end point
    * @param {number} nx - X-coord of line normal pointing inside
    * @param {number} ny - Y-coord of line normal pointing inside
    * @param {number} innerWeight - Weight of inner points
    * @param {number} outerWeight - Weight of outer points
    * @param {boolean} clockwise - Whether the cap is drawn clockwise
    * @param {Array<number>} verts - vertex buffer
    * @returns {number} - no. of vertices pushed
    */
   function makeSquareCap(
      x: number,
      y: number,
      nx: number,
      ny: number,
      innerWeight: number,
      outerWeight: number,
      clockwise: boolean /* rotation for square (true at left end, false at right end) */,
      verts: Array<number>
   ): number {
      const ix = x - nx * innerWeight
      const iy = y - ny * innerWeight
      const ox = x + nx * outerWeight
      const oy = y + ny * outerWeight

      /* Rotate nx,ny for extension vector */
      let exx: number
      let eyy: number

      if (clockwise) {
         exx = ny
         eyy = -nx
      } else {
         exx = -ny
         eyy = nx
      }

      /* [i|0]x,y extended at cap */
      const eix = ix + exx
      const eiy = iy + eyy
      const eox = ox + exx
      const eoy = oy + eyy

      /* Square itself must be inserted clockwise*/
      verts.push(eix, eiy)
      verts.push(eox, eoy)

      return 2
   }

   /**
    * Buffers vertices to draw an arc at the line joint or cap.
    * {@link https://github.com/pixijs/pixijs/blob/dev/packages/graphics/src/utils/buildLine.ts#L84 Source}
    * @param {number} cx - X-coord of center
    * @param {number} cy - Y-coord of center
    * @param {number} sx - X-coord of arc start
    * @param {number} sy - Y-coord of arc start
    * @param {number} ex - X-coord of arc end
    * @param {number} ey - Y-coord of arc end
    * @param {Array<number>} verts - buffer of vertices
    * @param {boolean} clockwise - orientation of vertices
    * @returns {number} - no. of vertices pushed
    */
   function makeRoundCap(
      cx: number,
      cy: number,
      sx: number,
      sy: number,
      ex: number,
      ey: number,
      verts: Array<number>,
      clockwise: boolean /* if not cap, then clockwise is turn of joint, otherwise rotation from angle0 to angle1 */
   ): number {
      const cx2p0x = sx - cx
      const cy2p0y = sy - cy

      let angle0 = Math.atan2(cx2p0x, cy2p0y)
      let angle1 = Math.atan2(ex - cx, ey - cy)

      if (clockwise && angle0 < angle1) {
         angle0 += Math.PI * 2
      } else if (!clockwise && angle0 > angle1) {
         angle1 += Math.PI * 2
      }

      let startAngle = angle0
      const angleDiff = angle1 - angle0
      const absAngleDiff = Math.abs(angleDiff)

      const radius = Math.sqrt(cx2p0x * cx2p0x + cy2p0y * cy2p0y)
      const segCount = (((15 * absAngleDiff * Math.sqrt(radius)) / Math.PI) >> 0) + 1
      const angleInc = angleDiff / segCount

      startAngle += angleInc

      if (clockwise) {
         verts.push(cx, cy)
         verts.push(sx, sy)

         for (let i = 1, angle = startAngle; i < segCount; i++, angle += angleInc) {
            verts.push(cx, cy)
            verts.push(cx + Math.sin(angle) * radius, cy + Math.cos(angle) * radius)
         }

         verts.push(cx, cy)
         verts.push(ex, ey)
      } else {
         verts.push(sx, sy)
         verts.push(cx, cy)

         for (let i = 1, angle = startAngle; i < segCount; i++, angle += angleInc) {
            verts.push(cx + Math.sin(angle) * radius, cy + Math.cos(angle) * radius)
            verts.push(cx, cy)
         }

         verts.push(ex, ey)
         verts.push(cx, cy)
      }

      return segCount * 2
   }

   export function build(segments: Point2DArray, style: FatLineStyle, closedShape = false) {
      // line coordinates
      const eps = style.closePointEps

      const vertices: number[] = []
      const indices: number[] = []
      const result = {
         vertices,
         indices,
      }
      if (segments.length === 0) return result

      // if the line width is an odd number add 0.5 to align to a whole pixel
      // commenting this out fixes #711 and #1620
      // if (graphicsData.lineWidth%2)
      // {
      //     for (let i = 0; i < points.length; i++)
      //     {
      //         points[i] += 0.5;
      //     }
      // }

      // get first and last point.. figure out the middle!
      const firstPoint = segments.slice(0, 2)
      const lastPoint = segments.slice(-2)
      const closedPath =
         Math.abs(firstPoint[0] - lastPoint[0]) < eps && Math.abs(firstPoint[1] - lastPoint[1]) < eps

      // if the first point is the last point - gonna have issues :)
      if (closedShape) {
         // need to clone as we are going to slightly modify the shape..
         segments = segments.slice()

         if (closedPath) {
            segments.pop()
            segments.pop()
            lastPoint[0] = segments[segments.length - 2]
            lastPoint[1] = segments[segments.length - 1]
         }

         const midPointX = (firstPoint[0] + lastPoint[0]) * 0.5
         const midPointY = (lastPoint[1] + firstPoint[1]) * 0.5

         segments.unshift(midPointX, midPointY)
         segments.push(midPointX, midPointY)
      }

      // real points to draw with respect to width and other  stuff
      const length = segments.length / 2
      let indexCount = segments.length
      const indexStart = vertices.length / 2

      // Max. inner and outer width
      const width = style.width / 2
      const widthSquared = width * width
      const miterLimitSquared = style.miterLimit * style.miterLimit

      /* Line segments of interest where (x1,y1) forms the corner. */
      let x0 = segments[0]
      let y0 = segments[1]
      let x1 = segments[2]
      let y1 = segments[3]
      let x2 = 0
      let y2 = 0

      /* perp[?](x|y) = the line normal with magnitude lineWidth. */
      let perpx = -(y0 - y1)
      let perpy = x0 - x1
      let perp1x = 0
      let perp1y = 0

      let dist = Math.sqrt(perpx * perpx + perpy * perpy)

      perpx /= dist
      perpy /= dist
      perpx *= width
      perpy *= width

      const ratio = style.alignment // 0.5;
      const innerWeight = (1 - ratio) * 2
      const outerWeight = ratio * 2

      if (!closedShape) {
         if (style.cap === LineCap.Round) {
            indexCount +=
               makeRoundCap(
                  x0 - perpx * (innerWeight - outerWeight) * 0.5,
                  y0 - perpy * (innerWeight - outerWeight) * 0.5,
                  x0 - perpx * innerWeight,
                  y0 - perpy * innerWeight,
                  x0 + perpx * outerWeight,
                  y0 + perpy * outerWeight,
                  vertices,
                  true
               ) + 2
         } else if (style.cap === LineCap.Sqaure) {
            indexCount += makeSquareCap(x0, y0, perpx, perpy, innerWeight, outerWeight, true, vertices)
         }
      }

      // Push first point (below & above vertices)

      vertices.push(x0 - perpx * innerWeight, y0 - perpy * innerWeight)
      vertices.push(x0 + perpx * outerWeight, y0 + perpy * outerWeight)

      for (let i = 1; i < length - 1; ++i) {
         x0 = segments[(i - 1) * 2]
         y0 = segments[(i - 1) * 2 + 1]

         x1 = segments[i * 2]
         y1 = segments[i * 2 + 1]

         x2 = segments[(i + 1) * 2]
         y2 = segments[(i + 1) * 2 + 1]

         perpx = -(y0 - y1)
         perpy = x0 - x1

         dist = Math.sqrt(perpx * perpx + perpy * perpy)
         perpx /= dist
         perpy /= dist
         perpx *= width
         perpy *= width

         perp1x = -(y1 - y2)
         perp1y = x1 - x2

         dist = Math.sqrt(perp1x * perp1x + perp1y * perp1y)
         perp1x /= dist
         perp1y /= dist
         perp1x *= width
         perp1y *= width

         /* d[x|y](0|1) = the component displacement between points p(0,1|1,2) */
         const dx0 = x1 - x0
         const dy0 = y0 - y1
         const dx1 = x1 - x2
         const dy1 = y2 - y1

         /* +ve if internal angle counterclockwise, -ve if internal angle clockwise. */
         const cross = dy0 * dx1 - dy1 * dx0
         const clockwise = cross < 0

         /* Going nearly straight? */
         if (Math.abs(cross) < 0.1) {
            vertices.push(x1 - perpx * innerWeight, y1 - perpy * innerWeight)
            vertices.push(x1 + perpx * outerWeight, y1 + perpy * outerWeight)

            continue
         }

         /* p[x|y] is the miter point. pdist is the distance between miter point and p1. */
         const c1 = (-perpx + x0) * (-perpy + y1) - (-perpx + x1) * (-perpy + y0)
         const c2 = (-perp1x + x2) * (-perp1y + y1) - (-perp1x + x1) * (-perp1y + y2)
         const px = (dx0 * c2 - dx1 * c1) / cross
         const py = (dy1 * c1 - dy0 * c2) / cross
         const pdist = (px - x1) * (px - x1) + (py - y1) * (py - y1)

         /* Inner miter point */
         const imx = x1 + (px - x1) * innerWeight
         const imy = y1 + (py - y1) * innerWeight
         /* Outer miter point */
         const omx = x1 - (px - x1) * outerWeight
         const omy = y1 - (py - y1) * outerWeight

         /* Is the inside miter point too far away, creating a spike? */
         const smallerInsideSegmentSq = Math.min(dx0 * dx0 + dy0 * dy0, dx1 * dx1 + dy1 * dy1)
         const insideWeight = clockwise ? innerWeight : outerWeight
         const smallerInsideDiagonalSq = smallerInsideSegmentSq + insideWeight * insideWeight * widthSquared
         const insideMiterOk = pdist <= smallerInsideDiagonalSq

         if (insideMiterOk) {
            if (style.join === LineJoin.Bevel || pdist / widthSquared > miterLimitSquared) {
               if (clockwise) {
                  /* rotating at inner angle */
                  vertices.push(imx, imy) // inner miter point
                  vertices.push(x1 + perpx * outerWeight, y1 + perpy * outerWeight) // first segment's outer vertex
                  vertices.push(imx, imy) // inner miter point
                  vertices.push(x1 + perp1x * outerWeight, y1 + perp1y * outerWeight) // second segment's outer vertex
               } /* rotating at outer angle */ else {
                  vertices.push(x1 - perpx * innerWeight, y1 - perpy * innerWeight) // first segment's inner vertex
                  vertices.push(omx, omy) // outer miter point
                  vertices.push(x1 - perp1x * innerWeight, y1 - perp1y * innerWeight) // second segment's outer vertex
                  vertices.push(omx, omy) // outer miter point
               }

               indexCount += 2
            } else if (style.join === LineJoin.Round) {
               if (clockwise) {
                  /* arc is outside */
                  vertices.push(imx, imy)
                  vertices.push(x1 + perpx * outerWeight, y1 + perpy * outerWeight)

                  indexCount +=
                     makeRoundCap(
                        x1,
                        y1,
                        x1 + perpx * outerWeight,
                        y1 + perpy * outerWeight,
                        x1 + perp1x * outerWeight,
                        y1 + perp1y * outerWeight,
                        vertices,
                        true
                     ) + 4

                  vertices.push(imx, imy)
                  vertices.push(x1 + perp1x * outerWeight, y1 + perp1y * outerWeight)
               } /* arc is inside */ else {
                  vertices.push(x1 - perpx * innerWeight, y1 - perpy * innerWeight)
                  vertices.push(omx, omy)

                  indexCount +=
                     makeRoundCap(
                        x1,
                        y1,
                        x1 - perpx * innerWeight,
                        y1 - perpy * innerWeight,
                        x1 - perp1x * innerWeight,
                        y1 - perp1y * innerWeight,
                        vertices,
                        false
                     ) + 4

                  vertices.push(x1 - perp1x * innerWeight, y1 - perp1y * innerWeight)
                  vertices.push(omx, omy)
               }
            } else {
               vertices.push(imx, imy)
               vertices.push(omx, omy)
            }
         } // inside miter is NOT ok
         else {
            vertices.push(x1 - perpx * innerWeight, y1 - perpy * innerWeight) // first segment's inner vertex
            vertices.push(x1 + perpx * outerWeight, y1 + perpy * outerWeight) // first segment's outer vertex
            if (style.join === LineJoin.Round) {
               if (clockwise) {
                  /* arc is outside */
                  indexCount +=
                     makeRoundCap(
                        x1,
                        y1,
                        x1 + perpx * outerWeight,
                        y1 + perpy * outerWeight,
                        x1 + perp1x * outerWeight,
                        y1 + perp1y * outerWeight,
                        vertices,
                        true
                     ) + 2
               } /* arc is inside */ else {
                  indexCount +=
                     makeRoundCap(
                        x1,
                        y1,
                        x1 - perpx * innerWeight,
                        y1 - perpy * innerWeight,
                        x1 - perp1x * innerWeight,
                        y1 - perp1y * innerWeight,
                        vertices,
                        false
                     ) + 2
               }
            } else if (style.join === LineJoin.Miter && pdist / widthSquared <= miterLimitSquared) {
               if (clockwise) {
                  vertices.push(omx, omy) // inner miter point
                  vertices.push(omx, omy) // inner miter point
               } else {
                  vertices.push(imx, imy) // outer miter point
                  vertices.push(imx, imy) // outer miter point
               }
               indexCount += 2
            }
            vertices.push(x1 - perp1x * innerWeight, y1 - perp1y * innerWeight) // second segment's inner vertex
            vertices.push(x1 + perp1x * outerWeight, y1 + perp1y * outerWeight) // second segment's outer vertex
            indexCount += 2
         }
      }

      x0 = segments[(length - 2) * 2]
      y0 = segments[(length - 2) * 2 + 1]

      x1 = segments[(length - 1) * 2]
      y1 = segments[(length - 1) * 2 + 1]

      perpx = -(y0 - y1)
      perpy = x0 - x1

      dist = Math.sqrt(perpx * perpx + perpy * perpy)
      perpx /= dist
      perpy /= dist
      perpx *= width
      perpy *= width

      vertices.push(x1 - perpx * innerWeight, y1 - perpy * innerWeight)
      vertices.push(x1 + perpx * outerWeight, y1 + perpy * outerWeight)

      if (!closedShape) {
         if (style.cap === LineCap.Round) {
            indexCount +=
               makeRoundCap(
                  x1 - perpx * (innerWeight - outerWeight) * 0.5,
                  y1 - perpy * (innerWeight - outerWeight) * 0.5,
                  x1 - perpx * innerWeight,
                  y1 - perpy * innerWeight,
                  x1 + perpx * outerWeight,
                  y1 + perpy * outerWeight,
                  vertices,
                  false
               ) + 2
         } else if (style.cap === LineCap.Sqaure) {
            indexCount += makeSquareCap(x1, y1, perpx, perpy, innerWeight, outerWeight, false, vertices)
         }
      }

      // indices.push(indexStart);
      for (let i = indexStart; i < indexCount + indexStart - 2; ++i) {
         x0 = vertices[i * 2]
         y0 = vertices[i * 2 + 1]

         x1 = vertices[(i + 1) * 2]
         y1 = vertices[(i + 1) * 2 + 1]

         x2 = vertices[(i + 2) * 2]
         y2 = vertices[(i + 2) * 2 + 1]

         /* Skip zero area triangles */
         if (Math.abs(x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1)) < GRAPHICS_CURVES.epsilon ** 2) {
            continue
         }

         indices.push(i, i + 1, i + 2)
      }
      return result
   }
}
