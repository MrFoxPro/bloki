import { TextBlock as TextBlockEntity } from '@/lib/entities';
import { useEditorStore } from '../../editor.store';
import s from './text.block.module.scss';

type TextBlockProps = {
   block: TextBlockEntity;
};

export function TextBlock(props: TextBlockProps) {
   const [editor, { onTextBlockClick }] = useEditorStore();
   return (
      <div
         classList={{ [s.content]: true, [s.regular]: true }}
         onClick={(e) => {
            console.log('click!');
            onTextBlockClick(props.block);
         }}
         contentEditable={editor.editingBlock === props.block}
         ref={props.ref}
      >
         {props.block.value}
      </div>
   );
}