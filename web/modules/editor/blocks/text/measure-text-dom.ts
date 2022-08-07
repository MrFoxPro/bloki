// TODO: Precalculate every char size in script?

interface Options {
   fontFamily: string;
   fontSize: string;
   fontWeight: string;
   lineHeight: string;
   width: string;
   overflowWrap: string;
}

export class DOMTextMeasurer {
   public ruler: HTMLDivElement;

   constructor() {
      const el = document.createElement('div');
      el.className = 'measurer';
      el.style.height = 'auto';
      // el.style.visibility = import.meta.env.PROD ? 'hidden' : 'unset';
      el.style.visibility = 'hidden';
      this.ruler = el;
      document.documentElement.appendChild(this.ruler);
   }

   measureText(text: string, maxWidth = 'auto', width = 'auto') {
      this.ruler.textContent = text;
      this.ruler.style.maxWidth = maxWidth;
      this.ruler.style.width = width;
      return this.ruler.getBoundingClientRect();
   }
   setOptions(options: Partial<Options> = {}) {
      Object.keys(options).forEach((key) => {
         this.ruler.style[key] = options[key];
      });
   }
   dispose() {
      document.body.removeChild(this.ruler);
   }
}
