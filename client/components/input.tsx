import { ComponentProps, mergeProps } from "solid-js";

import { langs } from "@/modules/i18n/i18n.module";
import s from "@/styles";

const t = langs({
	en: {
		placeholderDefault: '<None>'
	},
	ru: {
		placeholderDefault: '<Пусто>'
	},
	zh: {
		placeholderDefault: '<None>'
	}
} as const);

type InputProps = {
	container?: ComponentProps<'div'>;
	input?: ComponentProps<'input'>;
	label?: { text: string; } & ComponentProps<'label'>;
};
export function Input(props: InputProps) {
	props = mergeProps({
		placeholder: t().placeholderDefault
	}, props);

	const placeholder = () => {
		console.log('placeholder', props.input?.disabled);
		if (props.input?.disabled) {
			return t().placeholderDefault;
		}
		return props.input?.placeholder ?? t().placeholderDefault;
	};

	return (
		<div class={s.textInputGroup} {...props.container}>
			{props.label?.text && <label>{props.label.text}</label>}
			<input
				class={s.textInput}
				placeholder={placeholder()}
				{...props.input}
			/>
		</div>
	);
}