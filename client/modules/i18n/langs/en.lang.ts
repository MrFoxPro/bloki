import type { BaseTranslation } from './ru.lang';

const en: BaseTranslation = {
	component: {
		input: {
			placeholderDefault: '<None>'
		}
	},
	page: {
		welcome: {
			title: 'Welcome',
			input: {
				name: {
					label: (name) => `Your name is ${name}`,
					placeholder: 'Vladimir'
				},
				email: {
					label: 'Email',
					placeholder: 'v.a.epifancev@gmail.com'
				},
				code: {
					label: 'Code',
					footnote: 'Hey'
				}
			},
			continue: 'Continue',
			edit: 'Edit'
		},
	}
};

export default en;