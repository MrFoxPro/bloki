export function toBlobAsync(ctx: CanvasRenderingContext2D, type?: string, quality?: any) {
   return new Promise<Blob>((res, rej) => {
      ctx.canvas.toBlob((result) => {
         res(result);
      }, type, quality);
   });
}