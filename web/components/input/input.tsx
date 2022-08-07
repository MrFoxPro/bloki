import './input.scss';
import { JSX, ParentProps, splitProps } from 'solid-js';

type InputProps = ParentProps<{
   title: JSX.Element;
   color?: 'white' | 'black';
   loading?: boolean;
}> &
   JSX.InputHTMLAttributes<HTMLInputElement>;

// https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete
// https://developers.google.com/web/fundamentals/design-and-ux/input/forms
export function Input(props: InputProps) {
   const [local, other] = splitProps(props, ['title', 'children', 'color', 'class', 'loading']);
   return (
      <div class="field-container">
         <div classList={{ field: true, [local.class]: true, loading: local.loading }}>
            <input class="input" placeholder={local.title} {...other} />
            <label class="label" for={local.title}>
               {!local.loading ? local.title : 'Загрузка'}
            </label>
            {local.children}
         </div>
      </div>
   );
}
