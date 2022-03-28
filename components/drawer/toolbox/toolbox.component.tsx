import s from './drawer-menu.module.scss';

import ArrowIcon from '../assets/arrow.icon.svg';

type DrawerToolboxProps = {

};
export function DrawerToolbox(props: DrawerToolboxProps) {

   return (
      <div class={s.toolbox}>
         <div class={s.figures}>
            <div class={s.arrow} innerHTML={ArrowIcon} />
         </div>
         <div class={s.tools}>

         </div>
         <div class={s.pickers}></div>
      </div>
   );
}