import { useAppStore } from "@/lib/app.store";
import { createEffect, createSignal, For, on, Show } from "solid-js";
import s from './cursors.module.scss';
import CursorIcon from '../assets/cursor.icon.svg';
import { CURSOR_UPDATE_RATE, Roommate } from "@/lib/network.types";
import { useEditorStore } from "@/components/bloki-editor/editor.store";
import { useCollabStore } from "../collab.store";
import { Point } from "@/components/bloki-editor/types/blocks";

export function Cursors() {
   const [app] = useAppStore();
   const [editor, { staticEditorData }] = useEditorStore();
   const [collab] = useCollabStore();

   function UserCursor(props) {
      let delayTimeout;

      const [pos, setPos] = createSignal(props.user.cursor);

      const [transitioning, setTransitioning] = createSignal(false);

      createEffect(on(
         () => props.user.cursor,
         (prevCursor, currCursor) => {
            if (!currCursor) return;
            if (transitioning()) return;
            setTransitioning(true);
            setPos(currCursor);
            setTimeout(() => {
               setTransitioning(false);
            }, CURSOR_UPDATE_RATE);
         })
      );
      createEffect(on(
         () => transitioning(),
         (tr) => {
            if (!tr && (pos().x !== props.user.cursor.x || pos().y !== props.user.cursor.y)) {
               console.log('starting transition again');
               setPos(props.user.cursor);
               setTimeout(() => {
                  setTransitioning(false);
               }, CURSOR_UPDATE_RATE);
            }
         }, { defer: true }));

      return (
         <div
            class={s.user}
            style={{
               transform: `translate(${pos().x - staticEditorData.containerRect.x}px, ${pos().y - staticEditorData.containerRect.y}px)`,
               transition: `transform ${CURSOR_UPDATE_RATE}ms ease`
            }}
         >
            <CursorIcon fill={props.user.color} />
            <div
               class={s.badge}
               style={{ background: props.user.color }}
            >
               {props.user.name}
            </div>
         </div>
      );
   }
   return (
      <Show when={editor.document.shared}>
         <For each={collab.rommates.filter(x => x.name !== app.name)}>
            {user => <UserCursor user={user} />}
         </For>
      </Show>
   );
}