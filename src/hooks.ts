import { container, ScopeTypes } from './Container'
import { useState, useMemo, useEffect } from 'react'
import { Service } from './service'
import { ActionMethodOfService, ConstructorOf } from './types'
import { map, distinctUntilChanged } from 'rxjs/operators'
import { shallowEqual } from './utils/helpers'

export type HooksResult<M extends Service<SS>, SS, P = undefined> = [
  Readonly<P extends undefined ? SS : P extends (...args: any) => infer R ? R : never>,
  ActionMethodOfService<M, SS>,
]

const defaultSelector = <T>(state: T) => state

interface Options {
  destoryOnUnmount?: boolean
}

export function useService<M extends Service<any>>(
  serviceConstructor: ConstructorOf<M> | M,
  options?: Options,
): M extends Service<infer SS> ? HooksResult<M, SS> : never

export function useService<M extends Service<any>, F>(
  serviceConstructor: ConstructorOf<M> | M,
  selector: (state: M extends Service<infer SS> ? Readonly<SS> : never) => F,
  options?: Options,
): M extends Service<infer SS> ? HooksResult<M, SS, typeof selector> : never

export function useService<M extends Service<any>>(
  serviceIdentifier: ConstructorOf<M> | M,
  ...args: any
) {
  const service = useMemo(() => {
    if (serviceIdentifier instanceof Service) {
      return serviceIdentifier
    }
    return container.get<M>(serviceIdentifier)
  }, [])

  let selector: Function = defaultSelector
  let options: Options = {
    destoryOnUnmount:
      serviceIdentifier instanceof Service
        ? false
        : container.getScope(serviceIdentifier) !== ScopeTypes.Singleton,
  }

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

  const [state, setState] = useState(() => selector(service.getState()))

  useEffect(() => {
    const subscription = service
      .getState$()
      .pipe(
        map((state) => selector(state)),
        distinctUntilChanged(shallowEqual),
      )
      .subscribe(setState)
    return () => subscription.unsubscribe()
  }, [service])

  useEffect(
    () => () => {
      if (options.destoryOnUnmount) {
        service.destroy()
      }
    },
    [service],
  )
  return [state, service.getActionMethods()]
}
