import SideMenu from '@/modules/side-menu/side-menu';
import Workspace from '@/modules/workspace/workspace';
import './main.view.scss';
export function MainView() {

   return (
      <div class='main'>
         <SideMenu />
         <Workspace />
      </div>
   );
}
export default MainView;
