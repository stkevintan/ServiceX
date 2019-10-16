import { container, ScopeType } from '../ioc'
import { useMemo, useEffect, useContext } from 'react'
import { Service } from '../service'
import { ConstructorOf } from '../types'
import { useServiceInstance } from './useServiceInstance'
import { ServiceResultWithSelf } from './types'
import { Transient, Singleton, Request } from '../symbols'
import { useDefault } from './useDefault'
import { context } from '../utils'

export interface UseServiceOptions {
  scope?: ScopeType
}

export function useService<M extends Service<any>>(
  serviceConstructor: ConstructorOf<M>,
  options?: UseServiceOptions,
): M extends Service<infer SS> ? ServiceResultWithSelf<M, SS> : never

export function useService<M extends Service<any>, F>(
  serviceConstructor: ConstructorOf<M>,
  selector?: (state: M extends Service<infer SS> ? Readonly<SS> : never) => F,
  options?: UseServiceOptions,
): M extends Service<infer SS> ? ServiceResultWithSelf<M, SS, typeof selector> : never

export function useService<M extends Service<any>>(
  serviceIdentifier: ConstructorOf<M>,
  ...args: any
) {
  const [selector, options] = useDefault(args, {
    scope: Singleton,
    resetOnUnmount: false,
  })

  // const map = useContext(context)

  const service = useMemo(() => {
    // if (map.has(serviceIdentifier)) {
    //   const instance = map.get(serviceIdentifier)
    //   return instance!
    // }
    // const instance = container.resolveInScope<M>(serviceIdentifier, options.scope!)
    // map.set(serviceIdentifier, instance)
    // return instance
    return container.resolveInScope(serviceIdentifier, options.scope!)
  }, [options.scope, serviceIdentifier])

  useEffect(() => {
    // singleton
    if (options.scope === Singleton && options.resetOnUnmount) {
      return () => service.setState(service.defaultState, true)
    }
    return undefined
  }, [options.resetOnUnmount, options.scope, service])

  const serviceInstanceOptions = useMemo(
    () => ({
      destroyOnUnmount: options.scope === Transient || options.scope === Request,
    }),
    [options.scope],
  )

  return [...useServiceInstance(service, selector, serviceInstanceOptions), service] as any
}
