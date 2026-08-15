import { isFunction, isntNullish } from 'extra-utils'
import { WithDefault } from 'hotypes'
import { Getter } from 'justypes'
import { assert } from '@blackglory/errors'

export class ValueGetter<T> {
  private readonly getter: Getter<T>
  private readonly name?: string

  constructor(getter: Getter<T>)
  constructor(name: string | undefined, getter: Getter<T>)
  constructor(...args:
  | [name: string | undefined, getter: Getter<T>]
  | [getter: Getter<T>]
  ) {
    if (args.length === 1) {
      const [getter] = args

      this.getter = getter
    } else {
      const [name, getter] = args

      this.getter = getter
      this.name = name
    }
  }

  default<U>(val: U): ValueGetter<WithDefault<T, U>> {
    return new ValueGetter(this.name, () => {
      return this.value()
          ?? val
    }) as ValueGetter<WithDefault<T, U>>
  }

  assert<U extends T = T>(
    predicate: (val: T) => boolean
  , message: string
  ): ValueGetter<U>
  assert<U extends T = T>(
    assertion: (val: T) => void
  ): ValueGetter<U>
  assert<U extends T = T>(...args:
  | [predicate: (val: T) => boolean, message: string]
  | [assert: (val: T) => void]
  ): ValueGetter<U> {
    return new ValueGetter(this.name, () => {
      if (args.length === 1) {
        const [assert] = args

        const val = this.value()
        assert(val)

        return val
      } else {
        const [predicate, message] = args

        const val = this.value()
        assert(predicate(val), message)

        return val
      }
    }) as ValueGetter<U>
  }

  required(): ValueGetter<NonNullable<T>> {
    return this.assert(
      isntNullish
    , `The ${this.name ?? 'value'} should not be null or undefined`
    )
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
    const getter = this.getter

    return new ValueGetter(this.name, () => {
      const cache = isFunction(param)
                  ? param()
                  : param

      if (cache.has(getter)) {
        return cache.get(getter)!
      } else {
        const val = getter()

        cache.set(getter, val)

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
