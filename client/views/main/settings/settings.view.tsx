import './settings.view.scss';
import ResetIcon from './assets/reset.svg';
import { createStore } from 'solid-js/store';
import { langs } from '@/modules/i18n/i18n.module';
import { Switch } from '@/components/input-switch/input-switch';
import { Dynamic } from 'solid-js/web';

export function SettingsView() {
   const [store, setStore] = createStore({
      selectedItem: 'system',
      system: {
         touchZone: 10,
         controlsOffset: 10,
         showGrid: false
      }
   });
   const system = () => (
      <>
         <div class="control-group">
            <h4>{t().system.touch_area}</h4>
            <div class="panel">
               <input type="range" class="range" id="resize-additional-zone" min="0" max="100" />
               <input class="numeric" />
               <ResetIcon class="reset" />
            </div>
         </div>
         <div class="control-group">
            <h4>{t().system.block_corners_margin}</h4>
            <div class="panel">
               <input type="range" class="range" id="resize-additional-zone" min="0" max="100" />
               <input class="numeric" />
               <ResetIcon class="reset" />
            </div>
         </div>
         <h4>{t().system.show_grid}</h4>
         <Switch checked />
      </>
   );
   const views = {
      system
   } as const;
   return (
      <>
         <div class="menu">
            {Object.keys(t().menu)
               .filter((k) => !['changes', 'logout'].includes(k))
               .map((list) => (
                  <div class="items bottom-line">
                     <div class="name">{t().menu[list]['_header_']}</div>
                     {Object.keys(t().menu[list])
                        .filter((k) => k !== '_header_')
                        .map((item) => (
                           <div
                              class="item"
                              onClick={() => setStore('selectedItem', item)}
                              classList={{
                                 highlighted: store.selectedItem === item
                              }}
                           >
                              {t().menu[list][item]}
                           </div>
                        ))}
                  </div>
               ))}
            <div class="items bottom-line">
               <div class="item">{t().menu.changes}</div>
            </div>
            <div class="items">
               <div class="item red">{t().menu.logout}</div>
            </div>
         </div>
         <div class="content">
            <Dynamic component={views[store.selectedItem]} />
         </div>
      </>
   );
}
export default SettingsView;

const t = langs({
   en: {
      menu: {
         personal: {
            _header_: 'Personal',
            account: 'Account',
            integrations: 'Integrations'
         },
         app: {
            _header_: 'Application',
            appearance: 'Appearance',
            system: 'System',
            lang: 'Language',
            keyboard: 'Keyboard'
         },
         changes: 'Changes',
         logout: 'Log out'
      },
      system: {
         touch_area: 'Touch area size (px.)',
         block_corners_margin: 'Space between block and it`s corners',
         show_grid: 'Show grid'
      }
   },
   ru: {
      menu: {
         personal: {
            _header_: 'Персональные',
            account: 'Учётная запись',
            integrations: 'Интеграции'
         },
         app: {
            _header_: 'Приложение',
            appearance: 'Внешний вид',
            system: 'Система',
            lang: 'Язык',
            keyboard: 'Сочетания клавиш'
         },
         changes: 'Список изменений',
         logout: 'Выйти'
      },
      system: {
         touch_area: 'Дополнительная зона касания (пикс.)',
         block_corners_margin: 'Отступ контролов от блока',
         show_grid: 'Отображение сетки'
      }
   }
});
