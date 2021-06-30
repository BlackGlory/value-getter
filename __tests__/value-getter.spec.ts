import { ValueGetter } from '@src/value-getter'
import { Getter } from 'hotypes'
import { getError } from 'return-style'

describe('ValueGetter', () => {
  describe('default<U>(val: U))', () => {
    describe('T includes Nullable', () => {
      it('return ValueGetter<NonNullable<T> | U>', () => {
        const defaultValue = 64
        const getter: Getter<string | undefined> = () => undefined
        const vg = new ValueGetter(getter)

        const result = vg.default(defaultValue)
        const value = result.value()

        expect(result).not.toBe(vg)
        expect(result).toBeInstanceOf(ValueGetter)
        expect(value).toBe(defaultValue)
      })
    })

    describe('T does not include Nullable', () => {
      it('return ValueGetter<T>', () => {
        const defaultValue = 64
        const getter: Getter<string> = () => '64'
        const vg = new ValueGetter(getter)

        const result = vg.default(defaultValue)
        const value = result.value()

        expect(result).not.toBe(vg)
        expect(result).toBeInstanceOf(ValueGetter)
        expect(value).toBe('64')
      })
    })
  })

  describe('assert(predicate: (val: T) => unknown)', () => {
    describe('pass', () => {
      it('return ValueGetter<T>', () => {
        const url = 'https://example.com'
        const getter: Getter<string> = () => url
        const vg = new ValueGetter(getter)

        const result = vg.assert(isURL)
        const value = result.value()

        expect(result).not.toBe(vg)
        expect(result).toBeInstanceOf(ValueGetter)
        expect(value).toBe(url)
      })
    })

    describe('not pass', () => {
      it('throws', () => {
        const url = 'example.com'
        const getter: Getter<string> = () => url
        const vg = new ValueGetter(getter, 'URL')

        const result = vg.assert(isURL)
        const err = getError(() => result.value())

        expect(result).not.toBe(vg)
        expect(result).toBeInstanceOf(ValueGetter)
        expect(err).not.toBeUndefined()
      })
    })
  })

  describe('required()', () => {
    describe('pass', () => {
      it('return ValueGetter<NonNullable<T>>', () => {
        const getter: Getter<string | undefined> = () => 'value'
        const vg = new ValueGetter(getter)

        const result = vg.required()
        const value = result.value()

        expect(result).not.toBe(vg)
        expect(value).toBe('value')
      })
    })

    describe('not pass', () => {
      it('throws', () => {
        const getter: Getter<string | undefined> = () => undefined
        const vg = new ValueGetter(getter, 'param')

        const result = vg.required()
        const err = getError(() => result.value())

        expect(result).not.toBe(vg)
        expect(err).toBeInstanceOf(Error)
        expect(err?.message).toBe('param should not be null or undefined')
      })
    })
  })

  describe('memoize', () => {
    describe('memoize(cache: WeakMap<Getter<T>, T>)', () => {
      it('return ValueGetter<T>', () => {
        const fn = jest.fn().mockReturnValueOnce('value1').mockReturnValueOnce('value2')
        const cache = new WeakMap()
        const vg = new ValueGetter(fn)

        const result = vg.memoize(cache)
        const value1 = result.value()
        const value2 = result.value()

        expect(result).not.toBe(vg)
        expect(value1).toBe('value1')
        expect(value2).toBe('value1')
        expect(fn).toBeCalledTimes(1)
      })
    })

    describe('memoize(cacheGetter: Getter<WeakMap<Getter<T>, T>>)', () => {
      it('return ValueGetter<T>', () => {
        const fn = jest.fn().mockReturnValueOnce('value1').mockReturnValueOnce('value2')
        const cache = new WeakMap()
        const cacheGetter = () => cache
        const vg = new ValueGetter(fn)

        const result = vg.memoize(cacheGetter)
        const value1 = result.value()
        const value2 = result.value()

        expect(result).not.toBe(vg)
        expect(value1).toBe('value1')
        expect(value2).toBe('value1')
        expect(fn).toBeCalledTimes(1)
      })

      describe('reset cache', () => {
        it('return ValueGetter<T>', () => {
          const fn = jest.fn().mockReturnValueOnce('value1').mockReturnValueOnce('value2')
          let cache = new WeakMap()
          const cacheGetter = () => cache
          const vg = new ValueGetter(fn)

          const result = vg.memoize(cacheGetter)
          const value1 = result.value()
          cache = new WeakMap()
          const value2 = result.value()

          expect(result).not.toBe(vg)
          expect(value1).toBe('value1')
          expect(value2).toBe('value2')
          expect(fn).toBeCalledTimes(2)
        })
      })
    })
  })

  describe('convert<U>(convert: (val: T) => U)', () => {
    it('return ValueGetter<U>', () => {
      const getter: Getter<string> = () => '64'
      const vg = new ValueGetter(getter)

      const result = vg.convert(Number)
      const value = result.value()

      expect(result).not.toBe(vg)
      expect(result).toBeInstanceOf(ValueGetter)
      expect(value).toBe(64)
    })
  })

  describe('tap(sideEffect: (val: T) => U)', () => {
    it('return ValueGetter<T>', () => {
      const fn = jest.fn()
      const getter: Getter<string> = () => 'value'
      const vg = new ValueGetter(getter)

      const result = vg.tap(fn)
      const value = result.value()

      expect(result).not.toBe(vg)
      expect(value).toBe('value')
      expect(fn).toBeCalledWith(value)
      expect(fn).toBeCalledTimes(1)
    })
  })

  describe('get()', () => {
    it('return Getter<T>', () => {
      const getter: Getter<string> = () => 'value'
      const vg = new ValueGetter(getter)

      const result = vg.get()
      const value = result()

      expect(value).toBe('value')
    })
  })

  describe('value()', () => {
    it('return T', () => {
      const getter: Getter<string> = () => 'value'
      const vg = new ValueGetter(getter)

      const result = vg.value()

      expect(result).toBe('value')
    })
  })
})

function isURL(url: string): void {
  new URL(url)
}
