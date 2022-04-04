// TODO: Precalculate every char size in script?

function getTextWidth(text: string, font: string) {
   // re-use canvas object for better performance
   const canvas: HTMLCanvasElement = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
   const context = canvas.getContext("2d");
   context.font = font;
   const metrics = context.measureText(text);
   return metrics.width;
}
