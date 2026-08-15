import { ValueGetter } from '@src/value-getter.js'
import { Getter } from 'justypes'
import { getError, isSuccess } from 'return-style'
import { jest } from '@jest/globals'
import { AssertionError } from '@blackglory/errors'

describe('ValueGetter', () => {
  describe('default<U>(val: U))', () => {
    describe('T includes Nullable', () => {
      it('return ValueGetter<NonNullable<T> | U>', () => {
        const defaultValue = 64
        const getter: Getter<string | undefined> = () => undefined
        const valueGetter = new ValueGetter(getter)

        const result = valueGetter.default(defaultValue)
        const value = result.value()

        expect(result).not.toBe(valueGetter)
        expect(result).toBeInstanceOf(ValueGetter)
        expect(value).toBe(defaultValue)
      })
    })

    describe('T does not include Nullable', () => {
      it('return ValueGetter<T>', () => {
        const defaultValue = 64
        const getter: Getter<string> = () => '64'
        const valueGetter = new ValueGetter(getter)

        const result = valueGetter.default(defaultValue)
        const value = result.value()

        expect(result).not.toBe(valueGetter)
        expect(result).toBeInstanceOf(ValueGetter)
        expect(value).toBe('64')
      })
    })
  })

  describe('assert', () => {
    describe('(predicate: (val: T) => boolean, message: string)', () => {
      test('pass', () => {
        const url = 'https://example.com'
        const getter: Getter<string> = () => url
        const valueGetter = new ValueGetter(getter)

        const result = valueGetter.assert(
          val => isSuccess(() => new URL(val))
        , 'The param is not a valid URL'
        )
        const value = result.value()

        expect(result).not.toBe(getter)
        expect(result).toBeInstanceOf(ValueGetter)
        expect(value).toBe(url)
      })

      test('not pass', () => {
        const url = 'example.com'
        const getter: Getter<string> = () => url
        const valueGetter = new ValueGetter(getter)

        const result = valueGetter.assert(
          val => isSuccess(() => new URL(val))
        , 'The param is not a valid URL'
        )
        const err = getError(() => result.value())

        expect(result).not.toBe(getter)
        expect(result).toBeInstanceOf(ValueGetter)
        expect(err).toBeInstanceOf(AssertionError)
      })
    })

    describe('(assertion: (val: T) => void)', () => {
      test('pass', () => {
        const url = 'https://example.com'
        const getter: Getter<string> = () => url
        const valueGetter = new ValueGetter(getter)

        const result = valueGetter.assert(val => new URL(val))
        const value = result.value()

        expect(result).not.toBe(getter)
        expect(result).toBeInstanceOf(ValueGetter)
        expect(value).toBe(url)
      })

      test('not pass', () => {
        const url = 'example.com'
        const getter: Getter<string> = () => url
        const valueGetter = new ValueGetter(getter)

        const result = valueGetter.assert(val => new URL(val))
        const err = getError(() => result.value())

        expect(result).not.toBe(valueGetter)
        expect(result).toBeInstanceOf(ValueGetter)
        expect(err).not.toBeUndefined()
      })
    })
  })

  describe('required()', () => {
    describe('pass', () => {
      it('return ValueGetter<NonNullable<T>>', () => {
        const getter: Getter<string | undefined> = () => 'value'
        const valueGetter = new ValueGetter(getter)

        const result = valueGetter.required()
        const value = result.value()

        expect(result).not.toBe(valueGetter)
        expect(value).toBe('value')
      })
    })

    describe('not pass', () => {
      it('throws', () => {
        const getter: Getter<string | undefined> = () => undefined
        const valueGetter = new ValueGetter('param', getter)

        const result = valueGetter.required()
        const err = getError(() => result.value())

        expect(result).not.toBe(valueGetter)
        expect(err).toBeInstanceOf(Error)
        expect(err?.message).toBe('The param should not be null or undefined')
      })
    })
  })

  describe('memoize', () => {
    describe.each([
      ['Map', Map]
    , ['WeakMap', WeakMap]
    ])('memoize(cache: %s)', (_, Map) => {
      it('return ValueGetter<T>', () => {
        const fn = jest.fn().mockReturnValueOnce('value1').mockReturnValueOnce('value2')
        const cache = new Map()
        const valueGetter = new ValueGetter(fn)

        const result = valueGetter.memoize(cache)
        const value1 = result.value()
        const value2 = result.value()

        expect(result).not.toBe(valueGetter)
        expect(value1).toBe('value1')
        expect(value2).toBe('value1')
        expect(fn).toBeCalledTimes(1)
      })
    })

    describe.each([
      ['Map', Map]
    , ['WeakMap', WeakMap]
    ])('memoize(cacheGetter: %s)', (_, Map) => {
      it('return ValueGetter<T>', () => {
        const fn = jest.fn().mockReturnValueOnce('value1').mockReturnValueOnce('value2')
        const cache = new Map()
        const cacheGetter = () => cache
        const valueGetter = new ValueGetter(fn)

        const result = valueGetter.memoize(cacheGetter)
        const value1 = result.value()
        const value2 = result.value()

        expect(result).not.toBe(valueGetter)
        expect(value1).toBe('value1')
        expect(value2).toBe('value1')
        expect(fn).toBeCalledTimes(1)
      })

      describe('reset cache', () => {
        it('return ValueGetter<T>', () => {
          const fn = jest.fn().mockReturnValueOnce('value1').mockReturnValueOnce('value2')
          let cache = new Map()
          const cacheGetter = () => cache
          const valueGetter = new ValueGetter(fn)

          const result = valueGetter.memoize(cacheGetter)
          const value1 = result.value()
          cache = new Map()
          const value2 = result.value()

          expect(result).not.toBe(valueGetter)
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
      const valueGetter = new ValueGetter(getter)

      const result = valueGetter.convert(Number)
      const value = result.value()

      expect(result).not.toBe(valueGetter)
      expect(result).toBeInstanceOf(ValueGetter)
      expect(value).toBe(64)
    })
  })

  describe('tap(sideEffect: (val: T) => U)', () => {
    it('return ValueGetter<T>', () => {
      const fn = jest.fn()
      const getter: Getter<string> = () => 'value'
      const valueGetter = new ValueGetter(getter)

      const result = valueGetter.tap(fn)
      const value = result.value()

      expect(result).not.toBe(valueGetter)
      expect(value).toBe('value')
      expect(fn).toBeCalledWith(value)
      expect(fn).toBeCalledTimes(1)
    })
  })

  describe('get()', () => {
    it('return Getter<T>', () => {
      const getter: Getter<string> = () => 'value'
      const valueGetter = new ValueGetter(getter)

      const result = valueGetter.get()
      const value = result()

      expect(value).toBe('value')
    })
  })

  describe('value()', () => {
    it('return T', () => {
      const getter: Getter<string> = () => 'value'
      const valueGetter = new ValueGetter(getter)

      const result = valueGetter.value()

      expect(result).toBe('value')
    })
  })
})
