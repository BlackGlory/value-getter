# value-getter
## Install
```sh
npm install --save value-getter
# or
yarn add value-getter
```

## Usage
```ts
import { ValueGetter } from 'value-getter'

const getNodeEnv =
  env('NODE_ENV')
    .required()
    .get()

function env(name: string): ValueGetter<string | undefined> {
  return new ValueGetter(name, () => process.env[name])
}
```

## API
```ts
class ValueGetter<T> {
  new (name: string, get: Getter<T>) => ValueGetter<T>
  new (get: Getter<T>) => ValueGetter<T>

  default<U>(val: U): IValueGetter<AddDefault<T, U>>
  assert<U extends T = T>(assert: (val: T) => unknown): IValueGetter<U>
  required(): IValueGetter<NonNullable<T>>
  memoize(cache:
  | Map<Getter<T>, T>
  | WeakMap<Getter<T>, T>
  ): ValueGetter<T>
  memoize(cacheGetter: Getter<
  | Map<Getter<T>, T>
  | WeakMap<Getter<T>, T>
  >): ValueGetter<T>
  convert<U>(convert: (val: T) => U): IValueGetter<U>
  tap(sideEffect: (val: T) => void): IValueGetter<T>
  get(): Getter<T>
  value(): T
}
```
