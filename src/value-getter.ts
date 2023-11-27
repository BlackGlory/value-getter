import { isFunction, isNull, isUndefined } from 'extra-utils'
import { WithDefault } from 'hotypes'
import { Getter } from 'justypes'

export class ValueGetter<T> {
  private getter: Getter<T>
  private name: string

  constructor(getter: Getter<T>)
  constructor(name: string, getter: Getter<T>)
  constructor(...args:
  | [name: string, getter: Getter<T>]
  | [getter: Getter<T>]
  ) {
    if (args.length === 1) {
      const [getter] = args
      this.getter = getter
      this.name = 'anonymous'
    } else {
      const [name, getter] = args
      this.getter = getter
      this.name = name
    }
  }

  default<U>(val: U): ValueGetter<WithDefault<T, U>> {
    return new ValueGetter(this.name, () => this.value() ?? val) as ValueGetter<WithDefault<T, U>>
  }

  assert<U extends T = T>(assert: (val: T) => unknown): ValueGetter<U> {
    return new ValueGetter(this.name, () => {
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

  memoize(cache:
  | Map<Getter<T>, T>
  | WeakMap<Getter<T>, T>
  ): ValueGetter<T>
  memoize(cacheGetter: Getter<
  | Map<Getter<T>, T>
  | WeakMap<Getter<T>, T>
  >): ValueGetter<T>
  memoize(param:
  | Map<Getter<T>, T>
  | WeakMap<Getter<T>, T>
  | Getter<Map<Getter<T>, T>>
  | Getter<WeakMap<Getter<T>, T>>
  ): ValueGetter<T> {
    const get = () => this.value()

    return new ValueGetter(this.name, () => {
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
    return new ValueGetter(this.name, () => convert(this.getter()))
  }

  tap(sideEffect: (val: T) => void): ValueGetter<T> {
    return new ValueGetter(this.name, () => {
      const val = this.value()
      sideEffect(val)
      return val
    })
  }

  get(): Getter<T> {
    return this.getter
  }

  value(): T {
    return this.getter()
  }
}
