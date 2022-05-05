import type { BaseTranslation } from './ru.lang';

const zhCn: BaseTranslation = {
	page: {
		welcome: {
			title: 'Тин тян тин тьюон',
			input: {
				name: {
					label: (name: string) => `Васе имя ${name}-сан`,
					placeholder: 'Тин тян тин тьюон'
				},
				email: {
					label: 'Тин тян тин тьюон',
					placeholder: 'Тин тян тин тьюон'
				}
			}
		}
	}
};

export default zhCn;