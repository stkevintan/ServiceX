import { useMemo } from 'react'

export const useDefault = <T>(args: any, defaultOptions: T) => {
  return useMemo(() => {
    let options: T = defaultOptions
    let selector: ((args: any) => any) | undefined = undefined
    if (args.length === 1) {
      if (typeof args[0] === 'function') {
        selector = args[0]
      } else {
        options = { ...options, ...args[0] }
      }
    } else if (args.length === 2) {
      selector = args[0]
      options = { ...options, ...args[1] }
    }
    return [selector, options] as const
  }, [args, defaultOptions])
}
