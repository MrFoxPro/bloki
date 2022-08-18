export enum SHAPES {
   POLY = 0,
   RECT = 1,
   CIRC = 2,
   ELIP = 3,
   RREC = 4,
}

export enum LINE_JOIN {
   MITER = 'miter',
   BEVEL = 'bevel',
   ROUND = 'round',
}
export enum LINE_CAP {
   BUTT = 'butt',
   ROUND = 'round',
   SQUARE = 'square',
}

export const GRAPHICS_CURVES = {
   adaptive: true,
   maxLength: 10,
   minSegments: 8,
   maxSegments: 2048,

   epsilon: 0.0001,

   _segmentsCount(length: number, defaultSegments = 20) {
      if (!this.adaptive || !length || isNaN(length)) {
         return defaultSegments
      }

      let result = Math.ceil(length / this.maxLength)

      if (result < this.minSegments) {
         result = this.minSegments
      } else if (result > this.maxSegments) {
         result = this.maxSegments
      }

      return result
   },
}

export class Point {
   public x = 0
   public y = 0

   constructor(x = 0, y = 0) {
      this.x = x
      this.y = y
   }
   set(x = 0, y = x): this {
      this.x = x
      this.y = y

      return this
   }
}

function round(
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

   /* if (absAngleDiff >= PI_LBOUND && absAngleDiff <= PI_UBOUND)
   {
       const r1x = cx - nxtPx;
       const r1y = cy - nxtPy;

       if (r1x === 0)
       {
           if (r1y > 0)
           {
               angleDiff = -angleDiff;
           }
       }
       else if (r1x >= -GRAPHICS_CURVES.epsilon)
       {
           angleDiff = -angleDiff;
       }
   }*/

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
function square(
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
   let exx
   let eyy

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
export function buildNonNativeLine(graphicsData, graphicsGeometry): void {
   const shape = graphicsData.shape
   // line coordinates
   let points = graphicsData.points || shape.points.slice()
   const eps = graphicsGeometry.closePointEps

   if (points.length === 0) {
      return
   }
   // if the line width is an odd number add 0.5 to align to a whole pixel
   // commenting this out fixes #711 and #1620
   // if (graphicsData.lineWidth%2)
   // {
   //     for (i = 0; i < points.length; i++)
   //     {
   //         points[i] += 0.5;
   //     }
   // }

   const style = graphicsData.lineStyle

   // get first and last point.. figure out the middle!
   const firstPoint = new Point(points[0], points[1])
   const lastPoint = new Point(points[points.length - 2], points[points.length - 1])
   const closedShape = shape.type !== SHAPES.POLY || shape.closeStroke
   const closedPath = Math.abs(firstPoint.x - lastPoint.x) < eps && Math.abs(firstPoint.y - lastPoint.y) < eps

   // if the first point is the last point - gonna have issues :)
   if (closedShape) {
      // need to clone as we are going to slightly modify the shape..
      points = points.slice()

      if (closedPath) {
         points.pop()
         points.pop()
         lastPoint.set(points[points.length - 2], points[points.length - 1])
      }

      const midPointX = (firstPoint.x + lastPoint.x) * 0.5
      const midPointY = (lastPoint.y + firstPoint.y) * 0.5

      points.unshift(midPointX, midPointY)
      points.push(midPointX, midPointY)
   }

   // real points to draw with respect to width and other  stuff
   const verts = graphicsGeometry.points
   const length = points.length / 2
   let indexCount = points.length
   const indexStart = verts.length / 2

   // Max. inner and outer width
   const width = style.width / 2
   const widthSquared = width * width
   const miterLimitSquared = style.miterLimit * style.miterLimit

   /* Line segments of interest where (x1,y1) forms the corner. */
   let x0 = points[0]
   let y0 = points[1]
   let x1 = points[2]
   let y1 = points[3]
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
      if (style.cap === LINE_CAP.ROUND) {
         indexCount +=
            round(
               x0 - perpx * (innerWeight - outerWeight) * 0.5,
               y0 - perpy * (innerWeight - outerWeight) * 0.5,
               x0 - perpx * innerWeight,
               y0 - perpy * innerWeight,
               x0 + perpx * outerWeight,
               y0 + perpy * outerWeight,
               verts,
               true
            ) + 2
      } else if (style.cap === LINE_CAP.SQUARE) {
         indexCount += square(x0, y0, perpx, perpy, innerWeight, outerWeight, true, verts)
      }
   }

   // Push first point (below & above vertices)
   verts.push(x0 - perpx * innerWeight, y0 - perpy * innerWeight)
   verts.push(x0 + perpx * outerWeight, y0 + perpy * outerWeight)

   for (let i = 1; i < length - 1; ++i) {
      x0 = points[(i - 1) * 2]
      y0 = points[(i - 1) * 2 + 1]

      x1 = points[i * 2]
      y1 = points[i * 2 + 1]

      x2 = points[(i + 1) * 2]
      y2 = points[(i + 1) * 2 + 1]

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
         verts.push(x1 - perpx * innerWeight, y1 - perpy * innerWeight)
         verts.push(x1 + perpx * outerWeight, y1 + perpy * outerWeight)

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
         if (style.join === LINE_JOIN.BEVEL || pdist / widthSquared > miterLimitSquared) {
            if (clockwise) {
               /* rotating at inner angle */
               verts.push(imx, imy) // inner miter point
               verts.push(x1 + perpx * outerWeight, y1 + perpy * outerWeight) // first segment's outer vertex
               verts.push(imx, imy) // inner miter point
               verts.push(x1 + perp1x * outerWeight, y1 + perp1y * outerWeight) // second segment's outer vertex
            } /* rotating at outer angle */ else {
               verts.push(x1 - perpx * innerWeight, y1 - perpy * innerWeight) // first segment's inner vertex
               verts.push(omx, omy) // outer miter point
               verts.push(x1 - perp1x * innerWeight, y1 - perp1y * innerWeight) // second segment's outer vertex
               verts.push(omx, omy) // outer miter point
            }

            indexCount += 2
         } else if (style.join === LINE_JOIN.ROUND) {
            if (clockwise) {
               /* arc is outside */
               verts.push(imx, imy)
               verts.push(x1 + perpx * outerWeight, y1 + perpy * outerWeight)

               indexCount +=
                  round(
                     x1,
                     y1,
                     x1 + perpx * outerWeight,
                     y1 + perpy * outerWeight,
                     x1 + perp1x * outerWeight,
                     y1 + perp1y * outerWeight,
                     verts,
                     true
                  ) + 4

               verts.push(imx, imy)
               verts.push(x1 + perp1x * outerWeight, y1 + perp1y * outerWeight)
            } /* arc is inside */ else {
               verts.push(x1 - perpx * innerWeight, y1 - perpy * innerWeight)
               verts.push(omx, omy)

               indexCount +=
                  round(
                     x1,
                     y1,
                     x1 - perpx * innerWeight,
                     y1 - perpy * innerWeight,
                     x1 - perp1x * innerWeight,
                     y1 - perp1y * innerWeight,
                     verts,
                     false
                  ) + 4

               verts.push(x1 - perp1x * innerWeight, y1 - perp1y * innerWeight)
               verts.push(omx, omy)
            }
         } else {
            verts.push(imx, imy)
            verts.push(omx, omy)
         }
      } // inside miter is NOT ok
      else {
         verts.push(x1 - perpx * innerWeight, y1 - perpy * innerWeight) // first segment's inner vertex
         verts.push(x1 + perpx * outerWeight, y1 + perpy * outerWeight) // first segment's outer vertex
         if (style.join === LINE_JOIN.ROUND) {
            if (clockwise) {
               /* arc is outside */
               indexCount +=
                  round(
                     x1,
                     y1,
                     x1 + perpx * outerWeight,
                     y1 + perpy * outerWeight,
                     x1 + perp1x * outerWeight,
                     y1 + perp1y * outerWeight,
                     verts,
                     true
                  ) + 2
            } /* arc is inside */ else {
               indexCount +=
                  round(
                     x1,
                     y1,
                     x1 - perpx * innerWeight,
                     y1 - perpy * innerWeight,
                     x1 - perp1x * innerWeight,
                     y1 - perp1y * innerWeight,
                     verts,
                     false
                  ) + 2
            }
         } else if (style.join === LINE_JOIN.MITER && pdist / widthSquared <= miterLimitSquared) {
            if (clockwise) {
               verts.push(omx, omy) // inner miter point
               verts.push(omx, omy) // inner miter point
            } else {
               verts.push(imx, imy) // outer miter point
               verts.push(imx, imy) // outer miter point
            }
            indexCount += 2
         }
         verts.push(x1 - perp1x * innerWeight, y1 - perp1y * innerWeight) // second segment's inner vertex
         verts.push(x1 + perp1x * outerWeight, y1 + perp1y * outerWeight) // second segment's outer vertex
         indexCount += 2
      }
   }

   x0 = points[(length - 2) * 2]
   y0 = points[(length - 2) * 2 + 1]

   x1 = points[(length - 1) * 2]
   y1 = points[(length - 1) * 2 + 1]

   perpx = -(y0 - y1)
   perpy = x0 - x1

   dist = Math.sqrt(perpx * perpx + perpy * perpy)
   perpx /= dist
   perpy /= dist
   perpx *= width
   perpy *= width

   verts.push(x1 - perpx * innerWeight, y1 - perpy * innerWeight)
   verts.push(x1 + perpx * outerWeight, y1 + perpy * outerWeight)

   if (!closedShape) {
      if (style.cap === LINE_CAP.ROUND) {
         indexCount +=
            round(
               x1 - perpx * (innerWeight - outerWeight) * 0.5,
               y1 - perpy * (innerWeight - outerWeight) * 0.5,
               x1 - perpx * innerWeight,
               y1 - perpy * innerWeight,
               x1 + perpx * outerWeight,
               y1 + perpy * outerWeight,
               verts,
               false
            ) + 2
      } else if (style.cap === LINE_CAP.SQUARE) {
         indexCount += square(x1, y1, perpx, perpy, innerWeight, outerWeight, false, verts)
      }
   }

   const indices = graphicsGeometry.indices
   const eps2 = GRAPHICS_CURVES.epsilon * GRAPHICS_CURVES.epsilon

   // indices.push(indexStart);
   for (let i = indexStart; i < indexCount + indexStart - 2; ++i) {
      x0 = verts[i * 2]
      y0 = verts[i * 2 + 1]

      x1 = verts[(i + 1) * 2]
      y1 = verts[(i + 1) * 2 + 1]

      x2 = verts[(i + 2) * 2]
      y2 = verts[(i + 2) * 2 + 1]

      /* Skip zero area triangles */
      if (Math.abs(x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1)) < eps2) {
         continue
      }

      indices.push(i, i + 1, i + 2)
   }
}
