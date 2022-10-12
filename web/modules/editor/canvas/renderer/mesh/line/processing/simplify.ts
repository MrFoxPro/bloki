import { Point2DTupleView } from '@/modules/editor/types'

function getSqDist(p1: Point2DTupleView, p2: Point2DTupleView) {
   const dx = p1[0] - p2[0]
   const dy = p1[1] - p2[1]
   return dx * dx + dy * dy
}

// basic distance-based simplification
export function simplifyRadialDist(points: Point2DTupleView[], tolerance = 1) {
   if (points.length <= 1) return points
   const sqTolerance = tolerance * tolerance
   let prevPoint = points[0]
   let point: Point2DTupleView
   const newPoints = [prevPoint]
   for (let i = 1, len = points.length; i < len; i++) {
      point = points[i]
      if (getSqDist(point, prevPoint) > sqTolerance) {
         newPoints.push(point)
         prevPoint = point
      }
   }
   if (prevPoint !== point) newPoints.push(point)
   return newPoints
}

// square distance from a point to a segment
function getSqSegDist(p: Point2DTupleView, p1: Point2DTupleView, p2: Point2DTupleView) {
   let x = p1[0],
      y = p1[1],
      dx = p2[0] - x,
      dy = p2[1] - y
   if (dx !== 0 || dy !== 0) {
      const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy)
      if (t > 1) {
         x = p2[0]
         y = p2[1]
      } else if (t > 0) {
         x += dx * t
         y += dy * t
      }
   }
   dx = p[0] - x
   dy = p[1] - y
   return dx * dx + dy * dy
}

function simplifyDPStep(
   points: Point2DTupleView[],
   first: number,
   last: number,
   sqTolerance: number,
   simplified: Point2DTupleView[]
) {
   let maxSqDist = sqTolerance
   let index: number
   for (let i = first + 1; i < last; i++) {
      const sqDist = getSqSegDist(points[i], points[first], points[last])
      if (sqDist > maxSqDist) {
         index = i
         maxSqDist = sqDist
      }
   }
   if (maxSqDist > sqTolerance) {
      if (index - first > 1) simplifyDPStep(points, first, index, sqTolerance, simplified)
      simplified.push(points[index])
      if (last - index > 1) simplifyDPStep(points, index, last, sqTolerance, simplified)
   }
}

export function simplifyDouglasPeucker(points: Point2DTupleView[], tolerance = 1) {
   if (points.length <= 1) return points
   const sqTolerance = tolerance * tolerance
   const last = points.length - 1
   const simplified = [points[0]]
   simplifyDPStep(points, 0, last, sqTolerance, simplified)
   simplified.push(points[last])
   return simplified
}

export function simplify(points: Point2DTupleView[], tolerance = 1) {
   points = simplifyRadialDist(points, tolerance)
   points = simplifyDouglasPeucker(points, tolerance)
   return points
}
