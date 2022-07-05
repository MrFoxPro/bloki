// @ts-nocheck
import { children, createMemo, JSXElement } from 'solid-js';
import { TOrTArray } from './helpers';

// TODO: Improve typings when solid will improve it.
// export function typedChildrenMap<T extends string>(_ch: JSXElement) {
//    const ch = children(() => _ch);

//    const map: Element[] & Partial<{
//       [key in T]: TOrTArray<Element>;
//    }> = [];
//    if (!ch()) return map;
//    if (Array.isArray(ch())) {
//       for (const c of ch()) {
//          if (!c) continue;
//          const type = c._type_;
//          if (!type) {
//             map.push(c);
//             continue;
//          }
//          if (Array.isArray(map[type])) {
//             map[type].push(c);
//          }
//          else if (map[type]) {
//             map[type] = [map[type], c];
//          }
//          else map[type] = c;
//       }
//    }
//    else {
//       map[_ch._type_] = ch();
//    }
//    return map as { [key in T]: JSXElement };
// };

export function typedChildren<T extends string>(childrenGetter, types: T[]) {
   const ch = children(childrenGetter);
   const resChildren = createMemo(() => [].concat(ch()));
   const parts = {};
   for (const type of types) {
      Object.defineProperty(parts, type, {
         get: () => resChildren().filter((x) => x?.dataset.comp === type)
      });
   }
   return parts as Record<T, JSXElement>;
}
export function typeComponent<T>(type: T, component) {
   Object.defineProperty(component, '_type_', { value: type });
   return component;
}
