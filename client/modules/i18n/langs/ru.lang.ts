const ru = {
	component: {
		input: {
			placeholderDefault: '<Пусто>'
		}
	},
	page: {
		welcome: {
			title: 'Добро пожаловать!',
			input: {
				name: {
					label: (name: string) => `Ваше имя ${name}`,
					placeholder: 'Валерий'
				},
				email: {
					label: 'Электронная почта',
					placeholder: 'v.a.epifancev@yandex.ru'
				},
				code: {
					label: 'Код',
					footnote: 'Мы только что отправили вам временный код регистрации. Пожалуйста, проверьте свой почтовый ящик и вставьте код регистрации ниже.'
				}
			},
			continue: 'Продолжить',
			edit: '< Изменить данные'
		}
	}
};
export type BaseTranslation = typeof ru;
export default ru;