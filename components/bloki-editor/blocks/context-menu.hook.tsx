import { createSignal, Show } from "solid-js";
import { useBlockStore } from "./block.store";

export function createBlockContextMenu() {

   const [show, setShow] = createSignal(false);


   return [] as const;
}