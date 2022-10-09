export function createWatchDecorator<T extends Object>(
   beforeGet?: (currentValue: T) => void,
   beforeSet?: (oldValue: T, newValue: T) => void,
   afterSet?: (oldValue: T, newValue: T) => void
) {
   const decorator: PropertyDecorator = (target: T, propKey) => {
      let value = target[propKey]
      Reflect.defineProperty(target, propKey, {
         get: () => {
            beforeGet?.(value)
            return value
         },
         set: (v) => {
            beforeSet?.(value, v)
            value = v
            afterSet?.(value, v)
         },
         value,
      })
   }
   return decorator
}
