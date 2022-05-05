import cc from 'classcat';
import LogoIcon from '@/assets/images/logo-orange.image.svg?url';
import { createStore } from 'solid-js/store';
import { useI18n } from '@/modules/i18n/i18n.module';
import { useLocation, useNavigate } from 'solid-app-router';
import { createMemo, Show } from 'solid-js';
import { Transition } from 'solid-transition-group';
import { Input } from '@/components/input.component';
import { inlineCss as css } from 'vite-plugin-inline-css-modules';

const t = langs({
	en: {
		title: 'Welcome'
	},
	de: {
		title: 'Willkommen'
	}
});

const s = css`
$test: 2;
.btn {
	height: 2rem;
	width: 25px;
	&.primary {
		color: white;
		border: 1px solid white;
		background-color: red;
		margin-top: #{$test}px;
	 }
 }
`;

export function WelcomePage() {
	const navigate = useNavigate();
	const location = useLocation();

	const { LL } = useI18n();

	const [state, setState] = createStore({
		form: {
			email: '',
			name: '',
		}
	});

	const confirming = createMemo(() => location.pathname.includes('/confirm'));

	return (
		<main class={cc([s.page, s.mosaic, s.welcome, s.btn, s.primary])}>
			<img class={s.logoRu} src={LogoIcon} />
			<div class={s.waterfall}>
				<div class={s.pageTitle} pw="page-title">
					{LL().page.welcome.title}
				</div>
				<Input
					label={{
						text: LL().page.welcome.input.name.label(state.form.name)
					}}
					input={{
						placeholder: LL().page.welcome.input.name.placeholder,
						disabled: confirming()
					}}
				/>
				<Input
					label={{
						text: LL().page.welcome.input.email.label
					}}
					input={{
						placeholder: LL().page.welcome.input.email.placeholder,
						disabled: confirming()
					}}
				/>
				<Show when={confirming()}>
					<div class={s.textInputGroup}>
						<label>
							{LL().page.welcome.input.code.label}
						</label>
						<input class={s.textInput} />
					</div>
				</Show>
				<button
					class={s.button}
					onClick={() => navigate('/welcome/confirm')}
				>
					{LL().page.welcome.continue}
				</button>
				<Transition enterClass={s.enter} exitToClass={s.exitTo}>
					<Show when={confirming()}>

					</Show>
				</Transition>
			</div>
		</main>
	);
}