import { useAppStore } from "@/lib/app.store";
import { useI18n } from "@solid-primitives/i18n";
import s from './name-input.module.scss';
import { randAnimalType } from '@ngneat/falso';

export function NameInput() {
   const [app, { setAppStore }] = useAppStore();
   const [t] = useI18n();
   let name = randAnimalType({ length: 5 }).find(x => x.length < 18);
   return (
      <div class={s.askName}>
         <div>{t('auth.ask-name.question')}</div>
         <input type="text" onInput={(e) => name = e.currentTarget.value} value={name} />
         <button onClick={() => {
            if (name.length < 1 || name.length > 18) {
               return alert('Name is too short/long!');
            }
            setAppStore({ name });
         }}>
            {t('auth.ask-name.continue')}
         </button>
      </div>
   );
}