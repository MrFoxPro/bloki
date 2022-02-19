import { BlokiDocument } from "@/components/bloki-editor/entities";
import { Accessor } from "solid-js";
import { DeepReadonly, SetStoreFunction } from "solid-js/store";

interface IDocumentProvider {
   (): [{ document: DeepReadonly<BlokiDocument>, setDocument: SetStoreFunction<BlokiDocument>; }];
}

export {
   IDocumentProvider
};