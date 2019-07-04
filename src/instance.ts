import { Container, ScopeTypes } from './Container'
import { injectable, inject } from 'inversify'
import { useState, useMemo, useEffect } from 'react'
import { Service } from './service'

import { ScopeSymbol, InjectSymbol } from './symbols'
import { ActionMethodOfService, ConstructorOf, InjectService } from './types'
import { map, distinctUntilChanged } from 'rxjs/operators'
import { shallowEqual } from './utils/helpers'

export const container = new Container()

export type HooksResult<M extends Service<SS>, SS, P = undefined> = [
  Readonly<P extends undefined ? SS : P extends (...args: any) => infer R ? R : never>,
  ActionMethodOfService<M, SS>,
  InjectService<M, SS>,
]

const defaultPick = <T>(state: T) => state

interface Options {
  destoryOnUnmount?: boolean
}

export function useService<M extends Service<any>>(
  serviceConstructor: ConstructorOf<M>,
  options?: Options,
): M extends Service<infer SS> ? HooksResult<M, SS> : never

export function useService<M extends Service<any>, F>(
  serviceConstructor: ConstructorOf<M>,
  pick: (state: M extends Service<infer SS> ? Readonly<SS> : never) => F,
  options?: Options,
): M extends Service<infer SS> ? HooksResult<M, SS, typeof pick> : never

export function useService<M extends Service<any>>(
  serviceConstructor: ConstructorOf<M>,
  ...args: any
) {
  const service = useMemo(() => {
    // if (serviceConstructor instanceof Service) {
    //   return serviceConstructor
    // }
    return container.get<M>(serviceConstructor)
  }, [])

  let pick: Function = defaultPick
  let options: Options = { destoryOnUnmount: false }
  if (args.length === 1) {
    if (typeof args[0] === 'function') {
      pick = args[0]
    } else {
      options = { ...options, ...args[0] }
    }
  }

  if (args.length === 2) {
    pick = args[0]
    options = { ...options, ...args[1] }
  }

  const injectedProperties: string[] = Reflect.getMetadata(InjectSymbol, service.constructor) || []

  const injectServices: any = {}

  for (const name of injectedProperties) {
    injectServices[name] = (service as any)[name]
  }

  const [state, setState] = useState(() => pick(service.getState()))

  useEffect(() => {
    const subscription = service
      .getState$()
      .pipe(
        map((state) => pick(state)),
        distinctUntilChanged(shallowEqual),
      )
      .subscribe(setState)
    return () => subscription.unsubscribe()
  }, [service])

  useEffect(
    () => () => {
      const scope: ScopeTypes | undefined = Reflect.getMetadata(ScopeSymbol, serviceConstructor)
      if (scope !== ScopeTypes.Singleton || options.destoryOnUnmount) {
        service.destroy()
      }
    },
    [service],
  )
  return [state, service.store.triggerActions, injectServices]
}

export const Injectable = <T extends ConstructorOf<Service<any>>>(scope?: ScopeTypes) => (
  target: T,
): any => {
  const injectableTarget = injectable()(target)
  container.bind(injectableTarget, scope)
}

export const Inject = <T extends ConstructorOf<Service<S>>, S>(serviceIdentifier: T) => {
  return (target: any, key: string, index?: number) => {
    const decoratedInjectNames = Reflect.getMetadata(InjectSymbol, target.constructor) || []
    Reflect.defineMetadata(InjectSymbol, [...decoratedInjectNames, key], target.constructor)

    inject(serviceIdentifier)(target, key, index)
  }
}
