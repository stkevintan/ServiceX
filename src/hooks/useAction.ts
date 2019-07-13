import { ActionMethodOfService, ConstructorOf } from '../types'
import { Service } from '../service'
import { useService } from './useService'
import { useServiceInstance } from './useServiceInstance'
import { ScopeType } from '../ioc'

const noSelected = () => undefined
export function useAction<M extends Service<any>>(
  service: ConstructorOf<M>,
  scope?: ScopeType,
): M extends Service<infer S> ? ActionMethodOfService<M, S> : never {
  const [, actions] = useService(service, noSelected, { scope })
  return actions as any
}

export function useInstanceAction<M extends Service<any>>(
  service: M,
): M extends Service<infer S> ? ActionMethodOfService<M, S> : never {
  const [, actions] = useServiceInstance(service, noSelected)
  return actions as any
}
