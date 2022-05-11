import cc from 'classcat';
import { createMutable, createStore } from 'solid-js/store';
import { useLocation, useNavigate } from 'solid-app-router';
import { createMemo, JSX, Show } from 'solid-js';
import { Transition } from 'solid-transition-group';

import LogoIcon from '@/assets/images/logo-orange.svg?url';
import MosaicIcon from '@/assets/images/mosaic.svg';

import { langs } from '@/modules/i18n/i18n.module';
import { Input, InputReset } from '@/components/input/input.component';
import s from '@/styles';
import { emailRegex } from '@/lib/helpers';

export const t = langs({
   ru: {
      title: `Добро пожаловать!`,
      input: {
         name: {
            label: 'Ваше имя',
            placeholder: 'Александр',
         },
         email: {
            label: 'Почта',
            placeholder: 'a.pistoletov@mail.ru',
         },
         code: {
            label: 'Код'
         }
      },
      continue: 'Продолжить'
   },
   en: {
      title: `Welcome!`,
      input: {
         name: {
            label: 'Name',
            placeholder: 'David',
         },
         email: {
            label: 'Email',
            placeholder: 'a.pistoletov@gmail.com',
         },
         code: {
            label: 'PIN'
         }
      },
      continue: 'Continue'
   },
} as const);

export function WelcomePage() {
   const navigate = useNavigate();
   const location = useLocation();

   const state = createMutable({
      email: {
         value: '',
         error: '',
      },
      name: {
         value: '',
         error: ''
      },
   });

   const confirming = createMemo(() => location.pathname.includes('/confirm'));

   function unfocus() {
      if (!isEmailCorrect()) {

      }
   }
   const isEmailCorrect = () => emailRegex.test(state.email.value);
   const isNameCorrect = () => state.name.value.length > 0;
   const LabelComp = () => <label>Hello ima label</label>;
   return (
      <main class={cc([s.page, s.welcome])}>
         <img class={s.logoRu} src={LogoIcon} />
         <MosaicIcon
            style={{
               position: 'absolute',
               color: '#FAF3F39A'
            }}
         />
         <div class={s.waterfall}>
            <div class={s.pageTitle} id="page-title">
               {t().title}
            </div>
            <Input
               label={{
                  text: t().input.name.label
               }}
               input={{
                  id: 'name-input',
                  autocomplete: 'on',
                  name: 'name',
                  placeholder: t().input.name.placeholder,
                  placeholder: t().input.name.placeholder,
                  disabled: confirming(),
                  onChange: (e) => state.name.value = e.currentTarget.value,
               }}
            >
               <label typeof='label'>Hello ima label</label>
            </Input>
            <Input
               label={{
                  text: t().input.email.label
               }}
               input={{
                  id: 'email-input',
                  type: 'email',
                  name: 'email',
                  autocomplete: 'on',
                  placeholder: t().input.email.placeholder,
                  disabled: confirming(),
                  onChange: (e) => state.email.value = e.currentTarget.value
               }}
            />
            <Show when={confirming()}>
               <div class={s.textInputGroup}>
                  <label>
                     {t().input.code.label}
                  </label>
                  <input class={s.textInput} />
               </div>
            </Show>
            <button
               id='continue-button'
               class={s.button}
               onClick={() => navigate('/welcome/confirm')}
               disabled={!(isNameCorrect() && isEmailCorrect())}
            >
               {t().continue}
            </button>
            <Transition enterClass={s.enter} exitToClass={s.exitTo}>
               <Show when={confirming()}>

               </Show>
            </Transition>
         </div>
      </main >
   );
}
export default WelcomePage;
