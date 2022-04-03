import { useEditorStore } from '../editor.store';
import s from './drawer.module.scss';

export function Drawer() {

   const [] = useEditorStore();

   return (
      <canvas
         class={s.drawer}
      />
   );
}