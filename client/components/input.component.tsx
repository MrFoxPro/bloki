import { useI18n } from "@/modules/i18n/i18n.module";
import s from "@/styles";
import { ComponentProps, mergeProps } from "solid-js";

type InputProps = {
	container?: ComponentProps<'div'>;
	input?: ComponentProps<'input'>;
	label?: { text: string; } & ComponentProps<'label'>;
};

export function Input(props: InputProps) {
	const { LL } = useI18n();

	props = mergeProps({
		placeholder: LL().component.input.placeholderDefault
	}, props);

	const placeholder = () => {
		console.log('placeholder', props.input?.disabled);
		if (props.input?.disabled) {
			return LL().component.input.placeholderDefault;
		}
		return props.input?.placeholder ?? LL().component.input.placeholderDefault;
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