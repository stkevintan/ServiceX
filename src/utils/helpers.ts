import { ObjectOf } from '../types'

export const noop = () => {}

//fbjs shallowequal: https://github.com/facebook/fbjs/blob/master/packages/fbjs/src/core/shallowEqual.js#L39
export function is(x: any, y: any): boolean {
  // SameValue algorithm
  if (x === y) {
    // Steps 1-5, 7-10
    // Steps 6.b-6.e: +0 != -0
    // Added the nonzero y check to make Flow happy, but it is redundant
    return x !== 0 || y !== 0 || 1 / x === 1 / y
  } else {
    // Step 6.a: NaN == NaN
    return x !== x && y !== y
  }
}

export function shallowEqual(objA: any, objB: any): boolean {
  if (is(objA, objB)) {
    return true
  }

  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false
  }

  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)

  if (keysA.length !== keysB.length) {
    return false
  }

  // Test for A's keys different from B.
  for (let i = 0; i < keysA.length; i++) {
    if (
      !Object.prototype.hasOwnProperty.call(objB, keysA[i]) ||
      !is(objA[keysA[i]], objB[keysA[i]])
    ) {
      return false
    }
  }

  return true
}

export function pick<T extends ObjectOf<any>, K extends string | number | symbol>(
  object: T,
  paths: K[],
): Partial<T>

export function pick<T extends ObjectOf<any>, K extends keyof T>(
  object: T,
  paths: K[],
): Pick<T, K> {
  return paths.reduce(
    (obj, key) => {
      obj[key] = object[key]
      return obj
    },
    {} as any,
  )
}

export function once<T extends (...args: any[]) => any>(func: T): T {
  let result: ReturnType<T>
  let isFirst = true
  if (typeof func === undefined) throw new TypeError('Expected a function')
  return ((...args: Parameters<T>) => {
    if (isFirst) {
      result = func(...args)
      func = undefined as any
      isFirst = false
    }
    return result
  }) as any
}

export const mapValues = <T extends object, R>(
  obj: T,
  callback: (value: T[keyof T], key: string, collection: T) => R,
): { [P in keyof T]: R } => {
  return Object.entries(obj).reduce(
    (ret, [key, val]) => {
      ret[key] = callback(val, key, obj)
      return ret
    },
    {} as any,
  )
}
