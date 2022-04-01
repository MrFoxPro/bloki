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
      el.className = s.measurer;
      el.style.height = 'auto';
      el.style.visibility = import.meta.env.PROD ? 'hidden' : 'unset';
      this.ruler = el;
      document.body.appendChild(this.ruler);
   }

   measureText(text: string, maxWidth = 'auto', width = 'auto') {
      this.ruler.textContent = text;
      this.ruler.style.maxWidth = maxWidth;
      this.ruler.style.width = width;
      return this.ruler.getBoundingClientRect();
   }
   setOptions(options: Partial<Options> = {}) {
      Object.keys(options).forEach(key => {
         this.ruler.style[key] = options[key];
      });
   }
   dispose() {
      document.body.removeChild(this.ruler);
   }
}