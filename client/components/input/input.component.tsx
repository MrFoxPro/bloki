import { children, ComponentProps, createEffect, createMemo, JSX, mergeProps } from "solid-js";

import { langs } from "@/modules/i18n/i18n.module";
import s from "@/styles";
import ResetIcon from './assets/reset.svg';
import { ResolvedJSXElement } from 'solid-js/types/reactive/signal';

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

type InputChildren = {
   type: 'label' | 'input-icon-right';
   comp: () => JSX.Element;
};
type InputProps = {
   container?: ComponentProps<'div'>;
   input?: ComponentProps<'input'>;
   label?: { text: string; } & ComponentProps<'label'>;

   children?: InputChildren | InputChildren[];
};

export function Input(props: InputProps) {
   props = mergeProps({
      placeholder: t().placeholderDefault
   }, props);

   const controls = createMemo(() => props.children);
   const resolvedChildren = children(() => props.children);
   createEffect(() => console.log('resolved children', resolvedChildren()));
   createEffect(() => console.log('controls', controls()));

   const placeholder = () => {
      console.log('placeholder', props.input?.disabled);
      if (props.input?.disabled) {
         return t().placeholderDefault;
      }
      return props.input?.placeholder ?? t().placeholderDefault;
   };

   return (
      <div class={s.textInputGroup} {...props.container}>
         <input
            class={s.textInput}
            placeholder={placeholder()}
            {...props.input}
         />
         {/* render icon here if presented in children */}
      </div>
   );
}

export function InputReset() {
   return (<ResetIcon class={s.reset} />);
}

type InputLabelProps = ComponentProps<'label'>;
export function InputLabel(props: InputLabelProps) {
   return (<label>{props.children}</label>);
}
