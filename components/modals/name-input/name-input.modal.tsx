import { useAppStore } from "@/lib/app.store";
import { useI18n } from "@solid-primitives/i18n";
import s from './name-input.module.scss';
import { randAnimalType } from '@ngneat/falso';
import { upperFirst } from "@/lib/helpers";

export function NameInput() {
   const [app, { setAppStore }] = useAppStore();
   const [t] = useI18n();
   let name = upperFirst(randAnimalType({ length: 5 }).find(x => x.length < 18));
   return (
      <div class={s.askName}>
         <div class={s.question}>{t('auth.ask-name.question')}</div>
         <input type="text" onInput={(e) => name = e.currentTarget.value} value={name} class={s.link} />
         <button
            onClick={() => {
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