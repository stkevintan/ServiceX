import { container, ScopeType } from '../ioc'
import { useMemo, useEffect } from 'react'
import { Service } from '../service'
import { ConstructorOf } from '../types'
import { useServiceInstance } from './useServiceInstance'
import { ServiceResult } from './types'
import { Transient, Singleton, Request } from '../symbols'
import { useDefault } from './useDefault'

export interface UseServiceOptions {
  scope?: ScopeType
  resetOnUnmount?: boolean
}

export function useService<M extends Service<any>, S = M extends Service<infer SS> ? SS : never>(
  serviceConstructor: ConstructorOf<M>,
  options?: UseServiceOptions,
): ServiceResult<M, S, S>

export function useService<
  M extends Service<any>,
  S = M extends Service<infer SS> ? SS : never,
  F = S
>(
  serviceConstructor: ConstructorOf<M>,
  selector?: (state: Readonly<S>) => F,
  options?: UseServiceOptions,
): ServiceResult<M, S, F>

export function useService<M extends Service<any>>(
  serviceIdentifier: ConstructorOf<M>,
  ...args: any
) {
  const [selector, options] = useDefault(args, {
    scope: Singleton,
    // do not make this params true default
    resetOnUnmount: false,
  })

  const service: M = useMemo(() => {
    return container.resolveInScope(serviceIdentifier, options.scope!)
  }, [options.scope, serviceIdentifier])

  useEffect(() => {
    // singleton
    if (options.scope === Singleton && options.resetOnUnmount) {
      service.$awake()
      return () => {
        service.$sleep()
        service.$setState(service.defaultState, true)
      }
    }
    return undefined
  }, [options.resetOnUnmount, options.scope, service])

  const serviceInstanceOptions = useMemo(
    () => ({
      destroyOnUnmount: options.scope === Transient || options.scope === Request,
    }),
    [options.scope],
  )

  return useServiceInstance(service, selector, serviceInstanceOptions)
}
