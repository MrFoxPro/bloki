import { Point2DTupleView } from '@/modules/editor/types'

export function chaikin(input: Point2DTupleView[]) {
   const output: Point2DTupleView[] = []
   if (input.length > 0) output.push([...input[0]])
   for (let i = 0; i < input.length - 1; i++) {
      const p0 = input[i]
      const p1 = input[i + 1]
      const p0x = p0[0],
         p0y = p0[1],
         p1x = p1[0],
         p1y = p1[1]

      const Q: Point2DTupleView = [0.75 * p0x + 0.25 * p1x, 0.75 * p0y + 0.25 * p1y]
      const R: Point2DTupleView = [0.25 * p0x + 0.75 * p1x, 0.25 * p0y + 0.75 * p1y]
      output.push(Q)
      output.push(R)
   }
   if (input.length > 1) output.push([...input.at(-1)])
   return output
}
