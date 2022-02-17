interface IBlokiDocumentController {
   fetchDocument: () => void;
   applyDelta: (node: Element, slatePath: any, delta: any) => void;
}