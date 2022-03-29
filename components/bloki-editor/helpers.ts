import { Dimension, Point } from "./types";

export function getImgDimension(dataURL: string): Promise<Dimension> {
   return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
         resolve({
            height: img.naturalHeight,
            width: img.naturalWidth
         });
         img.remove();
      };
      img.src = dataURL;
   });
}

export function distanceBetweenPoints(p1: Point, p2: Point) {
   return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

export function isInside(x: number, y: number, rect: DOMRect) {
   return x < rect.left + rect.width && x > rect.left && y < rect.top + rect.height && y > rect.top;
}