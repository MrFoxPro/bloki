import { createMemo, onCleanup, onMount } from "solid-js";
import { useEditorStore } from "../editor.store";
import { isInsideRect } from "../helpers";
import { BlockTransform, PlacementStatus } from "../types";
import { BlokiCanvasGrid } from "./canvas-grid/canvas-grid.component";
import { BlokiDomGrid } from "./dom-grid/dom-grid.component";
import { CachedPlacement, CellState } from "./shared";

type BacklightDrawerProps = {
   type: 'canvas' | 'dom';
};
export function BacklightDrawer(props: BacklightDrawerProps) {
   const [store, { editor }] = useEditorStore();

   const implMap = {
      canvas: BlokiCanvasGrid(),
      dom: BlokiDomGrid()
   };

   const impl = () => implMap[props.type];

   const comp = createMemo(() => impl().component);

   function clearProjection({ affected, block }: CachedPlacement) {
      if (block) {
         impl().clearArea(block);
      }
      for (let i = 0; i < affected.length; i++) {
         impl().clearArea(affected[i]);
      }
   }

   function drawProjection(block: BlockTransform, placement: PlacementStatus) {
      const { intersections, outOfBorder, affected } = placement;

      impl().drawArea(block, CellState.Free);

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
      const prevPlacement: CachedPlacement = {
         intersections: [],
         affected: [],
         block: null,
      };

      const unbindChangeEnd = editor.on('changeend', function () {
         clearProjection(prevPlacement);
      });

      const unbindChange = editor.on('change', function (_, { placement, relTransform }) {
         const old = prevPlacement.block;
         if (old &&
            old.x + old.width === relTransform.x + relTransform.width &&
            old.y + old.height === relTransform.y + relTransform.height) {
            // Skip unwanted updates
            return;
         }
         if (!store.editingBlock || (store.editingType !== 'drag' && store.editingType !== 'resize')) return;

         clearProjection(prevPlacement);
         drawProjection(relTransform, placement);

         prevPlacement.affected = placement.affected;
         prevPlacement.intersections = placement.intersections;
         prevPlacement.block = relTransform;
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
