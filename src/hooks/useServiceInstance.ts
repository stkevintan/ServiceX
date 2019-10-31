import { Service } from '../service'
import { useEffect } from 'react'
import { useServiceSelector } from './useServiceSelector'
import { ServiceResult } from './types'

export interface UseServiceInstanceOptions<S, F> {
  destroyOnUnmount?: boolean
  selector?: (state: S) => F
}

export function useServiceInstance<M extends Service<any>, S, F = undefined>(
  service: M,
  options: UseServiceInstanceOptions<M extends Service<infer SS> ? SS : S, F> = {},
): ServiceResult<M, M extends Service<infer SS> ? SS : S, F> {
  if (service === undefined) return [] as any
  const state = useServiceSelector(service, options.selector as any)
  useEffect(
    () => () => {
      if (options.destroyOnUnmount) {
        service.destroy()
      }
    },
    [options.destroyOnUnmount, service],
  )

  return [state, service.getActionMethods()] as any
}
