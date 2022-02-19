import { BlokiDocument } from "@/components/bloki-editor/entities";
import { getTestDocument } from "@/components/bloki-editor/test";
import { reconcile } from "solid-js/store";
import { createState } from "../solid-hooks";
import { IDocumentProvider } from "./idocument-provider";

export const useTestDocumentProvider: IDocumentProvider = () => {
   const initialDocument: BlokiDocument = getTestDocument(false, 0);
   const [document, setDocument] = createState(getTestDocument(false, 0));
   function reset() {
      setDocument('layoutOptions', reconcile(initialDocument.layoutOptions));
   }
   return [{ initialDocument, document: document, setDocument, reset }];
};