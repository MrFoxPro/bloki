import { Dimension } from "./types";

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