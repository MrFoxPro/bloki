import { ComponentProps, createComponent, splitProps } from "solid-js";

type SVGIconProps = {
	component: any;
} & ComponentProps<'svg'>;

export function SVGIcon(props: SVGIconProps) {
	const [, other] = splitProps(props, ['component']);
	return createComponent(props.component, other);
}