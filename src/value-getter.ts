import { Getter, isFunction } from '@blackglory/types'

export class ValueGetter<T> {
  #get: Getter<T>

  constructor(get: Getter<T>) {
    this.#get = get
  }

  default(val: NonNullable<T>): ValueGetter<NonNullable<T>> {
    return new ValueGetter(() => this.value() ?? val)
  }

  assert(assert: (val: T) => unknown): ValueGetter<T> {
    return new ValueGetter(() => {
      const val = this.value()
      assert(val)
      return val
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

  get(): Getter<T> {
    return this.#get
  }

  value(): T {
    return this.#get()
  }
}
