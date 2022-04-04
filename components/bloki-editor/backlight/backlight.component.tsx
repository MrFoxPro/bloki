import { createMemo, onCleanup, onMount } from "solid-js";
import { useEditorStore } from "../editor.store";
import { isInsideRect } from "../helpers";
import { BlockTransform, PlacementStatus } from "../types";
import { BlokiCanvasGrid } from "./canvas-grid/canvas-grid.component";
import { BlokiDomGrid } from "./dom-grid/dom-grid.component";
import { CellState } from "./shared";

type BacklightDrawerProps = {
   type: 'canvas' | 'dom';
};
export function Backlight(props: BacklightDrawerProps) {
   const [store, { staticEditorData: editor }] = useEditorStore();

   const implMap = {
      canvas: BlokiCanvasGrid(),
      dom: BlokiDomGrid()
   };

   const impl = () => implMap[props.type];

   const comp = createMemo(() => impl().component);

   function clearProjection(target: BlockTransform, { affected }: PlacementStatus) {
      if (target) {
         impl().clearArea(target);
      }
      for (let i = 0; i < affected.length; i++) {
         impl().clearArea(affected[i]);
      }
   }

   function drawProjection(target: BlockTransform, placement: PlacementStatus) {
      const { intersections, outOfBorder, affected } = placement;

      impl().drawArea(target, CellState.Free);

      for (let i = 0; i < affected.length; i++) {
         impl().drawArea(affected[i], CellState.Affected);
      }

      for (let i = 0; i < intersections.length; i++) {
         impl().drawArea(intersections[i], (x, y) => {
            if (outOfBorder) return CellState.Intersection;
            else if (intersections.some(sect => isInsideRect(x, y, sect))) {
               return CellState.Intersection;
            }
            else return CellState.Free;
         });
      }
   }

   onMount(() => {
      let prevPlacement: PlacementStatus = null;
      let prevRelTransform: BlockTransform = null;

      const unbindChangeEnd = editor.on('changeend', function () {
         if (prevRelTransform) {
            clearProjection(prevRelTransform, prevPlacement);
            prevPlacement = null;
         }
      });

      // It's very cpu ineffective to use createEffect(on()) here
      // IDK how to implement performant solution here
      const unbindChange = editor.on('change', function (_, { placement, relTransform }) {
         if (!store.editingBlock || (store.editingType !== 'drag' && store.editingType !== 'resize')) return;
         if (prevRelTransform &&
            prevRelTransform.x === relTransform.x &&
            prevRelTransform.y === relTransform.y &&
            prevRelTransform.height === relTransform.height &&
            prevRelTransform.width === relTransform.width
         ) {
            // Skip unwanted updates
            return;
         }
         if (prevPlacement) {
            clearProjection(prevRelTransform, prevPlacement);
         }
         drawProjection(relTransform, placement);

         prevPlacement = placement;
         prevRelTransform = relTransform;
      });

      let prevTransform: BlockTransform = null;
      const unbindGridMouseMove = editor.on('maingridcursormoved', function (transform, isOut) {
         prevTransform && impl().clearArea(prevTransform);
         if (isOut) {
            prevTransform = null;
            return;
         }
         impl().drawArea(transform, CellState.Free);
         prevTransform = transform;
      });

      onCleanup(() => {
         unbindGridMouseMove();
         unbindChange();
         unbindChangeEnd();
      });
   });

   return comp;
};
