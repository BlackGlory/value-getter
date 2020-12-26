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
  return new ValueGetter(() => process.env[name])
}

```

## API

```ts
class ValueGetter<T> {
  new (get: Getter<T>) => ValueGetter<T>
  default<U>(val: U): IValueGetter<AddDefault<T, U>>
  assert<U extends T = T>(assert: (val: T) => unknown): IValueGetter<U>
  required(): IValueGetter<NonNullable<T>>
  memoize(cache: WeakMap<Getter<T>, T>): IValueGetter<T>
  memoize(cacheGetter: Getter<WeakMap<Getter<T>, T>>): IValueGetter<T>
  convert<U>(convert: (val: T) => U): IValueGetter<U>
  tap(sideEffect: (val: T) => void): IValueGetter<T>
  get(): Getter<T>
  value(): T
}
```
