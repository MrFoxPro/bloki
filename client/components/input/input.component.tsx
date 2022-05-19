import s from "@/styles";
import { ComponentProps, mergeProps, onMount } from "solid-js";
import { langs } from "@/modules/i18n/i18n.module";
import ResetIcon from './assets/reset.svg';
import { typeComponent, typedChildren } from '@/lib/typed-children';

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

type InputProps = ComponentProps<'input'>;
export function Input(props: InputProps) {
   props = mergeProps({
      placeholder: t().placeholderDefault
   }, props);

   const placeholder = () => {
      if (props.disabled) {
         return t().placeholderDefault;
      }
      return props.placeholder ?? t().placeholderDefault;
   };
   const parts = typedChildren(() => props.children, ['label', 'reset']);

   return (
      <div class={s.textInputGroup}>
         {parts.label}
         <input
            class={s.textInput}
            placeholder={placeholder()}
            {...props}
         />
         {parts.reset}
      </div>
   );
}

type InputResetProps = ComponentProps<'svg'>;
export function InputReset(props: InputResetProps) {
   return (
      <ResetIcon data-comp="reset" class={s.reset} {...props} />
   );
}

type InputLabelProps = ComponentProps<'label'>;
export function InputLabel(props: InputLabelProps) {
   console.log('InputLabel rendered');
   return (
      <label data-comp="label">
         {props.children}
      </label>
   );
};
