import s from './toolbox.module.scss';

import ArrowIcon from '../assets/arrow.icon.svg';
import RectIcon from '../assets/rect.icon.svg';
import TriangleIcon from '../assets/triangle.icon.svg';
import CircleIcon from '../assets/circle.icon.svg';

import CursorIcon from '../assets/cursor.icon.svg';
import PencilIcon from '../assets/pencil.icon.svg';
import PenIcon from '../assets/pen.icon.svg';
import FlomasterIcon from '../assets/flomaster.icon.svg';
import EraserIcon from '../assets/eraser.icon.svg';

type DrawerToolboxProps = {

};
export function DrawerToolbox(props: DrawerToolboxProps) {

   return (
      <div class={s.toolbox}>
         <div class={s.figures}>
            <ArrowIcon />
            <RectIcon />
            <TriangleIcon />
            <CircleIcon />
         </div>
         <div class={s.vr} />
         <div class={s.tools}>
            <CursorIcon />
            <PencilIcon />
            <PenIcon />
            <FlomasterIcon />
            <EraserIcon />
         </div>
         <div class={s.vr} />
         <div class={s.pickers}>
            <div
               class={s.picker}
               classList={{ [s.active]: false }}
            >
               <div
                  class={s.eyedrop}
                  style={{
                     background: '#FC5A5A',
                     width: 10 + 'px',
                     height: 10 + 'px'
                  }}
               />
            </div>

            <div
               class={s.picker}
               classList={{ [s.active]: false }}
            >
               <div
                  class={s.eyedrop}
                  style={{
                     background: '#0075FF',
                     width: 16 + 'px',
                     height: 16 + 'px'
                  }}
               />
            </div>
            <div
               class={s.picker}
               classList={{ [s.active]: true }}
            >
               <div
                  class={s.eyedrop}
                  style={{
                     background: '#FFD600',
                     width: 24 + 'px',
                     height: 24 + 'px'
                  }}
               />
            </div>
         </div>
      </div>
   );
}