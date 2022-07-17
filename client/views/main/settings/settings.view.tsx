import './settings.view.scss';
import ResetIcon from './assets/reset.svg';
import { createStore } from 'solid-js/store';
import { langs } from '@/modules/i18n/i18n.module';

export function SettingsView() {
   const [store, setStore] = createStore({
      selectedItem: '',
      system: {
         touchZone: 10,
         controlsOffset: 10,
         showGrid: false
      }
   });
   return (
      <>
         <div class="menu">
            {Object.keys(t())
               .filter((k) => !['changes', 'logout'].includes(k))
               .map((list) => (
                  <div class="items bottom-line">
                     <div class="name">{t()[list]['name']}</div>
                     {Object.keys(t()[list])
                        .filter((k) => k !== 'name')
                        .map((item) => (
                           <div
                              class="item"
                              onClick={() => setStore('selectedItem', item)}
                              classList={{
                                 highlighted: store.selectedItem === item
                              }}
                           >
                              {t()[list][item]}
                           </div>
                        ))}
                  </div>
               ))}
            <div class="items bottom-line">
               <div class="item">{t().changes}</div>
            </div>
            <div class="items">
               <div class="item red">{t().logout}</div>
            </div>
         </div>
         <div class="content">
            <div class="control-group">
               <label for="resize-additional-zone">Дополнительная зона касания ресайза</label>
               <div class="panel">
                  <input type="range" class="range" id="resize-additional-zone" min="0" max="100" />
                  <input class="numeric" type="number" />
                  <ResetIcon class="reset" />
               </div>
            </div>
            <output />
         </div>
      </>
   );
}
export default SettingsView;

const t = langs({
   en: {
      personal: {
         name: 'Personal',
         account: 'Account',
         integrations: 'Integrations'
      },
      app: {
         name: 'Application',
         appearance: 'Appearance',
         system: 'System',
         lang: 'Language',
         keyboard: 'Keyboard'
      },
      changes: 'Changes',
      logout: 'Log out'
   },
   ru: {
      personal: {
         name: 'Персональные',
         account: 'Учётная запись',
         integrations: 'Интеграции'
      },
      app: {
         name: 'Приложение',
         appearance: 'Внешний вид',
         system: 'Система',
         lang: 'Язык',
         keyboard: 'Сочетания клавиш'
      },
      changes: 'Список изменений',
      logout: 'Выйти'
   }
});
