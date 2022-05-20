// TODO: Precalculate every char size in script?
import s from './text.block.module.scss';
export class DOMTextMeasurer {
   public ruler: HTMLDivElement;

   constructor() {
      const el = document.createElement('div');
      el.className = s.measurer;
      el.style.visibility = import.meta.env.PROD ? 'hidden' : 'unset';
      this.ruler = el;
      document.body.appendChild(this.ruler);
   }

   measureText(text: string, options: Partial<CSSStyleDeclaration> = {}) {
      for (const key in options) {
         this.ruler.style[key] = options[key];
      }
      this.ruler.innerHTML = text;
      const rect = this.ruler.getBoundingClientRect();
      for (const key in options) {
         this.ruler.style[key] = '';
      }
      return rect;
   }
   dispose() {
      document.body.removeChild(this.ruler);
   }
}