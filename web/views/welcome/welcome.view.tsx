import './welcome.scss';
import { createMutable } from 'solid-js/store';
import { useLocation, useNavigate } from '@solidjs/router';
import { createEffect, createMemo, Show } from 'solid-js';
import { Transition } from 'solid-transition-group';

import LogoIcon from '@/assets/img/logo-orange.svg?url';
import MosaicIcon from '@/assets/img/mosaic.svg';

import { langs } from '@/modules/i18n/i18n.module';
import { emailRegex } from '@/lib/helpers';

const t = langs({
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

export function WelcomeView() {
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

   return (
      <main class='page'>
         <img src={LogoIcon} />
         <MosaicIcon
            style={{
               position: 'absolute',
               color: '#FAF3F39A'
            }}
         />
         <div>
            <div id="page-title">
               {t().title}
            </div>
            {/* <Input
               id='name-input'
               autocomplete='on'
               name='name'
               placeholder={t().input.name.placeholder}
               disabled={confirming()}
               onInput={(e) => state.name.value = e.currentTarget.value}
               value={state.name.value}
            >
               <InputLabel>{t().input.name.label}</InputLabel>
               <Show when={state.name.value.length > 0}>
                  <InputReset
                     onClick={() => state.name.value = ''}
                  />
               </Show>
            </Input> */}

            {/* <Input
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
            /> */}
            <Show when={confirming()}>
               <div >
                  <label>
                     {t().input.code.label}
                  </label>
                  <input />
               </div>
            </Show>
            <button
               id='continue-button'
               // class={s.button}
               onClick={() => navigate('/welcome/confirm')}
               disabled={!(isNameCorrect() && isEmailCorrect())}
            >
               {t().continue}
            </button>
            <Transition>
               <Show when={confirming()}>

               </Show>
            </Transition>
         </div>
      </main>
   );
}
export default WelcomeView;
