interface Options {
   fontFamily: string;
   fontSize: string;
   fontWeight: string;
   lineHeight: string;
   width: string;
   wordBreak: string;
}

function createDummyElement(text: string, options: Options): HTMLElement {
   const element = document.createElement('div');
   const textNode = document.createTextNode(text);

   element.appendChild(textNode);

   Object.assign(element.style, options);

   element.style.position = 'absolute';
   element.style.visibility = 'hidden';
   element.style.left = '-999px';
   element.style.top = '-999px';
   element.style.height = 'auto';

   document.body.appendChild(element);
   return element;
}

function destroyElement(element: HTMLElement): void {
   element.parentNode.removeChild(element);
}

export function measureText(text: string, options: Partial<Options> = {}) {
   options.fontFamily = options.fontFamily;
   options.fontSize = options.fontSize;
   options.fontWeight = options.fontWeight;
   options.lineHeight = options.lineHeight || 'normal';
   options.width = options.width || 'auto';
   options.wordBreak = options.wordBreak || 'normal';

   const element = createDummyElement(text, options as Options);

   const { width, height } = element.getBoundingClientRect();
   destroyElement(element);
   return {
      width,
      height
   };
};