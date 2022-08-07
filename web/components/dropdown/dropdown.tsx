import './dropdown.scss';
import { Input } from '../input/input';
import { ComponentProps, createEffect, createSignal, For, JSX, on, onCleanup, Show, splitProps } from 'solid-js';
import { mergeProps } from 'solid-js';

type Option = {
   key: string;
   label: string;
   disabled?: boolean;
   prefix?: string;
};

type DropdownInputProps = {
   title: JSX.Element;
   options: Option[];
   selectedKey?: string;
   onSelect?: (opt: Option) => void;
} & Omit<ComponentProps<typeof Input>, 'onSelect'>;

export function DropdownInput(props: DropdownInputProps) {
   let inputRef: HTMLInputElement;
   props = mergeProps(
      {
         options: []
      },
      props
   );

   const [lProps, other] = splitProps(props, ['children', 'class', 'onSelect', 'selectedKey', 'options']);

   const [opened, setOpened] = createSignal(false);
   const [showingOptions, setShowingOptions] = createSignal(lProps.options);
   const [selectedOptionKey, setSelectedOptionKey] = createSignal(lProps.selectedKey ?? lProps.options[0]?.key ?? null);

   const renderOption = (opt: Option) => {
      let value = opt.label;
      if (opt.prefix) value = opt.prefix.concat(' ', value);
      return value;
   };

   function calculateHints(inputValue: string) {
      inputValue = inputValue.trim().toLowerCase();
      if (inputValue === '') {
         setShowingOptions(lProps.options);
         return;
      }
      const searching = lProps.options.filter((o) => o.label.toLowerCase().startsWith(inputValue));
      setShowingOptions(searching);
   }

   function calculateActiveHint() {
      let indexOfCurr = showingOptions().findIndex((opt) => opt.key === selectedOptionKey());
      return indexOfCurr;
   }

   function onClick(opt: Option) {
      inputRef.value = opt.label;
      calculateHints(opt.label);
      const firstShowing = showingOptions()[0];
      if (firstShowing) {
         setSelectedOptionKey(firstShowing.key);
      }
      lProps.onSelect && lProps.onSelect(opt);
   }

   function onOutsideClick(ev: MouseEvent) {
      setOpened(false);
   }

   function onKeyDown(ev: KeyboardEvent, key = ev.code) {
      if (!opened()) return;

      if (key === 'Tab') {
         ev.preventDefault();
         ev.stopImmediatePropagation();
         ev.stopPropagation();
         let indexOfCurr = calculateActiveHint();
         if (indexOfCurr < 0) {
            setSelectedOptionKey(lProps.options[0]?.key);
            return;
         }
         if (indexOfCurr === showingOptions().length - 1) indexOfCurr = 0;
         else ++indexOfCurr;

         const opt = showingOptions()[indexOfCurr];
         if (opt) {
            setSelectedOptionKey(opt.key);
            inputRef.value = opt.label;
         }
      } else if (key === 'Enter') {
         if (opened() && inputRef === document.activeElement) {
            let curOpt = showingOptions().find((opt) => opt.key === selectedOptionKey());
            inputRef.value = curOpt.label;
            calculateHints(curOpt.label);
            setOpened(false);
            lProps.onSelect(curOpt);
            ev.preventDefault();
            ev.stopImmediatePropagation();
         }
      } else if (key === 'ArrowUp' || key === 'ArrowDown') {
         let indexOfCurr = showingOptions().findIndex((opt) => opt.key === selectedOptionKey());
         if (indexOfCurr < 0) {
            setSelectedOptionKey(lProps.options[0]?.key);
            return;
         } else {
            if (key === 'ArrowDown') indexOfCurr = indexOfCurr === showingOptions().length - 1 ? 0 : indexOfCurr + 1;
            else indexOfCurr = indexOfCurr === 0 ? showingOptions().length - 1 : indexOfCurr - 1;
            setSelectedOptionKey(showingOptions()[indexOfCurr].key);
         }
      } else if (key === 'Escape') {
         setOpened(false);
      }
   }

   function onInput(ev: InputEvent & { currentTarget: HTMLInputElement; target: Element }) {
      if (!opened()) setOpened(true);
      calculateHints(ev.currentTarget.value);
      const firstShowing = showingOptions()[0];
      if (firstShowing) {
         setSelectedOptionKey(firstShowing.key);
      }
   }

   createEffect(
      on(
         () => props.options,
         (options) => {
            if (options) {
               setShowingOptions(options);
               setSelectedOptionKey(options[0]?.key);
            }
         }
      )
   );

   createEffect(() => {
      document.addEventListener('keydown', onKeyDown);
      document.addEventListener('click', onOutsideClick);
      onCleanup(() => {
         document.removeEventListener('keydown', onKeyDown);
         document.removeEventListener('click', onOutsideClick);
      });
   });

   createEffect(() => {
      if (!inputRef || !lProps.options) return;
      const selectedOption = lProps.options.find((x) => x.key === lProps.selectedKey);
      if (!selectedOption) return console.warn('no option for dropdown');
      inputRef.value = selectedOption.label;
   });

   return (
      <Input
         {...other}
         class="dropdown"
         ref={inputRef}
         onClick={(e) => {
            setOpened(true);
            e.stopImmediatePropagation();
         }}
         onInput={onInput}
         tabIndex={-1}
      >
         <Show when={opened()}>
            <div class="options">
               <For each={showingOptions()}>
                  {(opt, i) => (
                     <option
                        classList={{
                           active: selectedOptionKey() === opt.key
                        }}
                        value={opt.key}
                        onClick={() => onClick(opt)}
                        disabled={opt.disabled}
                        tabIndex={i() + 2}
                     >
                        {renderOption(opt)}
                     </option>
                  )}
               </For>
            </div>
         </Show>
      </Input>
   );
}
