import { ActionMethodOfService, ConstructorOf } from '../types'
import { Service } from '../service'
import { useService, UseServiceOptions } from './useService'
import { useServiceInstance, UseServiceInstanceOptions } from './useServiceInstance'

const noSelected = () => undefined

export function useAction<M extends Service<any>>(
  service: ConstructorOf<M>,
  options?: UseServiceOptions,
): M extends Service<infer S> ? ActionMethodOfService<M, S> : never {
  const [, actions] = useService(service, noSelected, options)
  return actions as any
}

export function useInstanceAction<M extends Service<any>>(
  service: M,
  options?: UseServiceInstanceOptions,
): M extends Service<infer S> ? ActionMethodOfService<M, S> : never {
  const [, actions] = useServiceInstance(service, noSelected, options)
  return actions as any
}
