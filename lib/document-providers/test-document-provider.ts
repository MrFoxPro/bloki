import { testDocument1 } from "@/components/bloki-editor/test";
import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { IDocumentProvider } from "./idocument-provider";

export const useTestDocumentProvider: IDocumentProvider = () => {
   const [document, setDocument] = createStore(testDocument1);
   return [{ document, setDocument }];
};