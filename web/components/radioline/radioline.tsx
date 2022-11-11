// import './radioline.scss';
import { ComponentProps, ParentProps, splitProps } from 'solid-js';

type RadioLineProps = ParentProps<{}> & ComponentProps<'input'>;
export function RadioLine(props: RadioLineProps) {
   let inputRef: HTMLInputElement;
   const [customProps, inputProps] = splitProps(props, ['children']);
   function onInput(e: Event) {
      // @ts-ignore
      props.onInput?.(e);
   }

   return (
      <div class="radio-line" classList={{ checked: props.checked }} onClick={onInput}>
         <input
            {...inputProps}
            type="radio"
            onClick={(e) => {
               e.preventDefault();
               onInput(e);
            }}
            ref={inputRef}
            checked={props.checked}
         />
         {customProps.children}
      </div>
   );
}
