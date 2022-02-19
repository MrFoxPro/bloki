import s from './test.page.module.scss';
import { BlokiEditor } from '@/components/bloki-editor/bloki-editor.component';
import { useTestDocumentProvider } from '@/lib/document-providers/test-document-provider';
import { For } from 'solid-js';

export function TestPage() {
   const [{ initialDocument, document, setDocument, reset }] = useTestDocumentProvider();
   return (
      <main class={s.test}>
         <div class={s.controls}>
            <div class={s.control}>
               <For each={[['gap', [2, 10]], ['size', [4, 48]], ['mGridWidth', [5, 50]], ['mGridHeight', [10, 60]], ['fGridWidth', [32, 92]], ['fGridHeight', [10, 60]]] as const}>
                  {([p, [min, max]]) =>
                     <div class={s.control}>
                        <span>{p} {document.layoutOptions[p]}</span>
                        <input
                           type="range"
                           min={min}
                           max={max}
                           value={document.layoutOptions[p]}
                           onInput={(e) => setDocument('layoutOptions', p, e.currentTarget.valueAsNumber)}
                        />
                     </div>
                  }
               </For>
               <button onClick={() => {
                  setDocument('layoutOptions', initialDocument.layoutOptions);
               }}>Reset</button>
            </div>
         </div>
         <BlokiEditor document={document} />
      </main >
   );
}