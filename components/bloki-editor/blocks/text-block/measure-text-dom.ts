import s from './text.block.module.scss';

interface Options {
   fontFamily: string;
   fontSize: string;
   fontWeight: string;
   lineHeight: string;
   width: string;
   wordBreak: string;
}

export class DOMTextMeasurer {
   public ruler: HTMLDivElement;

   constructor() {
      const el = document.createElement('div');
      el.id = 'text-measurer';
      el.className = s.measurer;
      el.style.position = 'fixed';
      // el.style.visibility = 'hidden';
      el.style.height = 'auto';
      el.style.pointerEvents = 'none';
      this.ruler = el;
      document.body.appendChild(this.ruler);
   }

   measureText(text: string, divWidth = 'auto') {
      if (this.ruler.textContent === text && this.ruler.style.width === divWidth) {
         const { width, height } = this.ruler.getBoundingClientRect();
         return { width, height };
      }
      this.ruler.textContent = text;
      this.ruler.style.width = divWidth;
      const { width, height } = this.ruler.getBoundingClientRect();
      return { width, height };
   }
   setOptions(options: Partial<Options> = {}) {
      Object.assign(this.ruler.style, options);
   }
   dispose() {
      document.body.removeChild(this.ruler);
   }
}