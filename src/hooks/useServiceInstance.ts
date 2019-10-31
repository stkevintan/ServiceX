import { Service } from '../service'
import { useEffect } from 'react'
import { useServiceSelector } from './useServiceSelector'
import { ServiceResult } from './types'
import { useDefault } from './useDefault'

export interface UseServiceInstanceOptions {
  destroyOnUnmount?: boolean
}

export function useServiceInstance<
  M extends Service<any>,
  S = M extends Service<infer SS> ? SS : never
>(service: M, options?: UseServiceInstanceOptions): ServiceResult<M, S, S>

export function useServiceInstance<
  M extends Service<any>,
  S = M extends Service<infer SS> ? SS : never,
  F = S
>(
  service: M,
  selector?: (state: M extends Service<infer S> ? Readonly<S> : never) => F,
  options?: UseServiceInstanceOptions,
): ServiceResult<M, S, F>

export function useServiceInstance<M extends Service<any>>(service: M, ...args: any) {
  const [selector, options] = useDefault(args, {
    destroyOnUnmount: false,
  })
  const state = useServiceSelector(service, selector)
  useEffect(
    () => () => {
      if (options.destroyOnUnmount) {
        service.destroy()
      }
    },
    [options.destroyOnUnmount, service],
  )

  return [state, service.getActions(), service]
}
