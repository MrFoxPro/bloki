import s from './dom-grid.module.scss';
import { useEditorStore } from "../../editor.store";
import { createComputed, createSignal, For } from 'solid-js';
import { CellState, FillColors, IGridImpl } from '../shared';

export function BlokiDomGrid(): IGridImpl {
   const [store, { realSize }] = useEditorStore();

   const makeEmptyGrid = () => new Array<CellState>(store.document.layoutOptions.fGridWidth * store.document.layoutOptions.fGridHeight).fill(CellState.None);

   const [grid, setGrid] = createSignal(makeEmptyGrid());
   createComputed(() => {
      setGrid(makeEmptyGrid());
      console.log('grid cleared');
   });

   const drawArea: IGridImpl['drawArea'] = (rect, type) => {
      const { x, y, width, height } = rect;
      const array = makeEmptyGrid();
      for (let i = x; i < x + width; i++) {
         for (let j = y; j < y + height; j++) {
            const ind = i + j * store.document.layoutOptions.fGridWidth;
            const value = typeof type === 'function' ? type(x, y) : type;
            array[ind] = value;
         }
      }
      setGrid(array);
   };
   return {
      drawArea,
      clearArea: (rect) => drawArea(rect, CellState.None),
      component: () => (
         <div
            class={s.domGrid}
            style={{
               display: 'grid',
               width: realSize().fGridWidth_px,
               height: realSize().fGridHeight_px,
               gap: store.document.layoutOptions.gap + 'px',
               "grid-template-columns": `repeat(${store.document.layoutOptions.fGridWidth}, 1fr)`,
               "grid-template-row": `repeat(${store.document.layoutOptions.fGridHeight}, 1fr)`,
            }}
         >
            <For each={grid()}>
               {(cell) => (
                  <div
                     class={s.cell}
                     style={{
                        width: store.document.layoutOptions.size + 'px',
                        height: store.document.layoutOptions.size + 'px',
                        'background-color': FillColors[cell],
                     }}
                  />
               )}
            </For>
         </div>
      )
   };
}

