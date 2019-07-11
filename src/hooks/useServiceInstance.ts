import { Service } from '../service'
import { ActionMethodOfService, InjectService } from '../types'
import { useEffect, useMemo } from 'react'
import { useServiceSelector } from './useServiceSelector'
import { InjectSymbol } from '../symbols'

export interface UseServiceInstanceOptions {
  destroyOnUnmount?: boolean
}

export type UseServiceInstanceResult<M extends Service<S>, S, P = undefined> = [
  Readonly<P extends undefined ? S : P extends (...args: any) => infer R ? R : never>,
  ActionMethodOfService<M, S>,
  InjectService<M, S>,
]

export function useServiceInstance<M extends Service<any>>(
  service: M,
  options?: UseServiceInstanceOptions,
): M extends Service<infer S> ? UseServiceInstanceResult<M, S> : never

export function useServiceInstance<M extends Service<any>, F>(
  service: M,
  selector: (state: M extends Service<infer S> ? Readonly<S> : never) => F,
  options?: UseServiceInstanceOptions,
): M extends Service<infer S> ? UseServiceInstanceResult<M, S, typeof selector> : never

export function useServiceInstance<M extends Service<any>>(service: M, ...args: any) {
  const injectServices = useMemo(() => {
    const injectedProperties: string[] =
      Reflect.getMetadata(InjectSymbol, service.constructor) || []
    return injectedProperties.reduce(
      (mp, name) => {
        mp[name] = (service as any)[name]
        return mp
      },
      {} as any,
    )
  }, [service])

  const [selector, options] = useMemo(() => {
    let options = {
      destroyOnUnmount: false,
    }
    let selector: any = undefined
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
    return [selector, options]
  }, [args])

  const state = useServiceSelector(service, selector)
  useEffect(
    () => () => {
      if (options.destroyOnUnmount) {
        service.destroy()
      }
    },
    [options.destroyOnUnmount, service],
  )

  return [state, service.getActionMethods(), injectServices]
}
