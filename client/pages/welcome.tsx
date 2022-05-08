import cc from 'classcat';
import { createStore } from 'solid-js/store';
import { useLocation, useNavigate } from 'solid-app-router';
import { createMemo, Show } from 'solid-js';
import { Transition } from 'solid-transition-group';

import LogoIcon from '@/assets/images/logo-orange.svg?url';
import MosaicIcon from '@/assets/images/mosaic.svg';

import { langs } from '@/modules/i18n/i18n.module';
import { Input } from '@/components/input';
import s from '@/styles';

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
				label: 'Your name',
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
	const [state, setState] = createStore({
		form: {
			email: '',
			name: '',
		}
	});

	const confirming = createMemo(() => location.pathname.includes('/confirm'));

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
						placeholder: t().input.name.placeholder,
						disabled: confirming()
					}}
				/>
				<Input
					label={{
						text: t().input.email.label
					}}
					input={{
						id: 'email-input',
						placeholder: t().input.email.placeholder,
						disabled: confirming()
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