import s from './test.page.module.scss';
import { createStore } from 'solid-js/store';
import { BlokiEditor } from '@/components/bloki-editor/bloki-editor.component';

export function TestPage() {
   const [blocks, setBlocks] = createStore([
      { b: true }
   ]);

   return (
      <main class={s.test}>
         <BlokiEditor />
      </main>
   );
}