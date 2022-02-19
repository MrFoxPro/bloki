import s from './test.page.module.scss';
import { createStore } from 'solid-js/store';
import { BlokiEditor } from '@/components/bloki-editor/bloki-editor.component';
import { useTestDocumentProvider } from '@/lib/document-providers/test-document-provider';
import { For, untrack } from 'solid-js';

export function TestPage() {
   const [{ document, setDocument }] = useTestDocumentProvider();

   return (
      <main class={s.test}>
         <div class={s.controls}>
            <div class={s.control}>
               <For each={[['gap', []], 'size', 'mGridWidth', 'mGridHeight', 'fGridWidth', 'fGridHeight']}>
                  {p =>
                     <div class={s.control}>
                        <span>{p} {document.layoutOptions[p]}</span>
                        <input
                           type="range"
                           min={}
                           max={}
                           value={document.layoutOptions[p]}
                           onInput={(e) => setDocument('layoutOptions', p as any, e.currentTarget.valueAsNumber)}
                        />
                     </div>
                  }
               </For>

            </div>
         </div>
         <BlokiEditor document={document} />
      </main>
   );
}