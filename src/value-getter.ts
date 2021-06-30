import { isFunction, isNull, isUndefined } from '@blackglory/types'
import { Getter, WithDefault } from 'hotypes'

export class ValueGetter<T> {
  #get: Getter<T>
  #name: string

  constructor(get: Getter<T>)
  constructor(name: string, get: Getter<T>)
  constructor(...args:
  | [name: string, get: Getter<T>]
  | [get: Getter<T>]
  ) {
    if (args.length === 1) {
      const [get] = args
      this.#get = get
      this.#name = 'anonymous'
    } else {
      const [name, get] = args
      this.#get = get
      this.#name = name
    }
  }

  default<U>(val: U): ValueGetter<WithDefault<T, U>> {
    return new ValueGetter(this.#name, () => this.value() ?? val) as ValueGetter<WithDefault<T, U>>
  }

  assert<U extends T = T>(assert: (val: T) => unknown): ValueGetter<U> {
    return new ValueGetter(this.#name, () => {
      const val = this.value()
      assert(val)
      return val
    }) as ValueGetter<U>
  }

  required(): ValueGetter<NonNullable<T>> {
    return this.assert(val => {
      if (isUndefined(val) || isNull(val)) {
        throw new Error(`${this.#name} should not be null or undefined`)
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

    return new ValueGetter(this.#name, () => {
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
    return new ValueGetter(this.#name, () => convert(this.#get()))
  }

  tap(sideEffect: (val: T) => void): ValueGetter<T> {
    return new ValueGetter(this.#name, () => {
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
