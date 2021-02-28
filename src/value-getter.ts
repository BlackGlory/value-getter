import { Getter, isFunction } from '@blackglory/types'

type WithDefaultType<T, DefaultType> =
  T extends undefined | null
  ? NonNullable<T> | DefaultType
  : T

export class ValueGetter<T> {
  #get: Getter<T>

  constructor(get: Getter<T>) {
    this.#get = get
  }

  default<U>(val: U): ValueGetter<WithDefaultType<T, U>> {
    return new ValueGetter(() => this.value() ?? val) as ValueGetter<WithDefaultType<T, U>>
  }

  assert<U extends T = T>(assert: (val: T) => unknown): ValueGetter<U> {
    return new ValueGetter(() => {
      const val = this.value()
      assert(val)
      return val
    }) as ValueGetter<U>
  }

  required(): ValueGetter<NonNullable<T>> {
    return this.assert(val => {
      if (val === undefined || val === null) throw new Error(`${val} should not be null or undefined`)
    })
  }

  memoize(cache: WeakMap<Getter<T>, T>): ValueGetter<T>
  memoize(cacheGetter: Getter<WeakMap<Getter<T>, T>>): ValueGetter<T>
  memoize(cacheOrCacheGetter: WeakMap<Getter<T>, T> | Getter<WeakMap<Getter<T>, T>>): ValueGetter<T> {
    const get = () => this.value()

    return new ValueGetter(() => {
      const cache = isFunction(cacheOrCacheGetter) ? cacheOrCacheGetter() : cacheOrCacheGetter

      if (!cache.has(get)) {
        const val = get()
        cache.set(get, val)
      }
      return cache.get(get)!
    })
  }

  convert<U>(convert: (val: T) => U): ValueGetter<U> {
    return new ValueGetter(() => convert(this.#get()))
  }

  tap(sideEffect: (val: T) => void): ValueGetter<T> {
    return new ValueGetter(() => {
      const val = this.value()
      sideEffect(val)
      return val
    })
  }

  get(): Getter<T> {
    return this.#get
  }

  value(): T {
    return this.#get()
  }
}
