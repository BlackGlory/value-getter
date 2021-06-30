import { isFunction, isNull, isUndefined } from '@blackglory/types'
import { Getter, WithDefault } from 'hotypes'

export class ValueGetter<T> {
  #get: Getter<T>

  constructor(get: Getter<T>, private name: string = 'anonymous') {
    this.#get = get
  }

  default<U>(val: U): ValueGetter<WithDefault<T, U>> {
    return new ValueGetter(() => this.value() ?? val) as ValueGetter<WithDefault<T, U>>
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
      if (isUndefined(val) || isNull(val)) {
        throw new Error(`${this.name} should not be null or undefined`)
      }
    })
  }

  memoize(cache: WeakMap<Getter<T>, T>): ValueGetter<T>
  memoize(cacheGetter: Getter<WeakMap<Getter<T>, T>>): ValueGetter<T>
  memoize(param:
  | WeakMap<Getter<T>, T>
  | Getter<WeakMap<Getter<T>, T>>
  ): ValueGetter<T> {
    const get = () => this.value()

    return new ValueGetter(() => {
      const cache = isFunction(param) ? param() : param

      if (cache.has(get)) {
        return cache.get(get)!
      } else {
        const val = get()
        cache.set(get, val)
        return val
      }
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
