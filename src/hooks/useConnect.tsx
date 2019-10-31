import React, { useContext, useMemo, useRef, useEffect, useState } from 'react'
import { ConstructorOf } from '../types'
import { Service } from '../service'
import { container, ScopeType } from '../ioc'
import { Transient, Singleton } from '../symbols'
import { useServiceInstance } from './useServiceInstance'
import { ServiceResult } from './types'
import { BehaviorSubject } from 'rxjs'
import produce from 'immer'
import { QueryList } from '../QueryList'

type ServiceMap<M extends Service<any>> = Map<ConstructorOf<M>, M>

export class ServiceContextStruct {
  private map: ServiceMap<any> | undefined
  private readonly parent$: BehaviorSubject<ServiceContextStruct | undefined> = new BehaviorSubject<
    any
  >(undefined)

  private readonly children$: BehaviorSubject<ServiceContextStruct[]> = new BehaviorSubject<any>([])

  get children() {
    return this.children$.getValue()
  }

  get parent() {
    return this.parent$.getValue()
  }

  set parent(p: ServiceContextStruct | undefined) {
    this.parent$.next(p)
    if (p) {
      p.addChild(this)
    }
  }
  informParent = () => {
    if (this.parent === undefined) return
    this.parent.children$.next(this.parent.children)
  }

  addChild = (child: ServiceContextStruct) => {
    const children = produce(this.children, (draft) => {
      draft.push(child)
    })
    this.children$.next(children)
    this.informParent()
  }

  removeChild = (child: ServiceContextStruct) => {
    this.children$.next(
      produce(this.children, (draft) => {
        const index = draft.indexOf(child)
        draft.splice(index, 1)
      }),
    )
    this.informParent()
  }

  travelChildren = (
    travelFn: (child: ServiceContextStruct) => boolean,
    descendants: boolean = false,
  ) => {
    for (const child of this.children) {
      if (!travelFn(child)) break
      if (descendants) child.travelChildren(travelFn, descendants)
    }
  }

  destroy = () => {
    this.map = undefined
    // rmeove parent child ref
    if (this.parent !== undefined) {
      this.parent.removeChild(this)
    }
    this.children$.complete()
    this.parent$.complete()
  }

  private getMap<M extends Service<any> = any>(): ServiceMap<M> {
    if (this.map === undefined) {
      this.map = new Map()
    }
    return this.map
  }

  add = <S extends Service<any>>(serviceIdentifier: ConstructorOf<S>, service: S) => {
    this.getMap<S>().set(serviceIdentifier, service)
  }

  get = <S extends Service<any>>(serviceIdentifier: ConstructorOf<S>) => {
    return this.map === undefined ? undefined : this.getMap<S>().get(serviceIdentifier)
  }

  get size() {
    return this.map === undefined ? 0 : this.getMap().size
  }

  isEmpty = () => this.size === 0

  observable() {
    return this.children$.asObservable()
  }
}

export const ServiceContext = React.createContext<ServiceContextStruct>(new ServiceContextStruct())

export interface UseServiceOptions<S, F> {
  scope?: ScopeType
  inherit?: boolean
  selector?: (state: Readonly<S>) => F
}

const createUseServiceContextHook = (
  nextContextRef: React.MutableRefObject<ServiceContextStruct>,
) => <M extends Service<any>, S, F = undefined>(
  serviceIdentifier: ConstructorOf<M>,
  options: UseServiceOptions<M extends Service<infer SS> ? SS : S, F> = {},
): ServiceResult<M, M extends Service<infer SS> ? SS : S, F> => {
  const prevContext = useContext(ServiceContext)
  const service: M = useMemo(() => {
    nextContextRef.current.parent = options.scope === Singleton ? undefined : prevContext
    let service: any = undefined
    // inherit the parent service instance
    if (options.inherit === undefined || options.inherit === true) {
      for (
        let current = nextContextRef.current.parent;
        current !== undefined && service === undefined;
        current = current.parent!
      ) {
        service = current.get(serviceIdentifier)
      }
    }
    if (!service) {
      service = container.resolveInScope(serviceIdentifier, options.scope || Transient)
      if (options.scope !== Singleton) {
        nextContextRef.current.add(serviceIdentifier, service)
      }
    }
    return service
  }, [nextContextRef.current, prevContext, options.scope])

  useEffect(
    () => () => {
      if (options.scope !== Singleton) {
        nextContextRef.current.destroy()
      }
    },
    [],
  )

  return useServiceInstance(service, {
    destroyOnUnmount: options.scope !== Singleton,
    selector: options.selector as any,
  }) as any
}

interface UseContentChildOptions<S, F> {
  descendants?: boolean
  selector?: (state: Readonly<S>) => F
}
const createUseContentChild = (nextContextRef: React.MutableRefObject<ServiceContextStruct>) => <
  M extends Service<any>,
  S,
  F = undefined
>(
  serviceIdentifier: ConstructorOf<M>,
  options: UseContentChildOptions<M extends Service<infer SS> ? SS : S, F> = {},
): QueryList<M> => {
  const queryList = useRef(new QueryList<M>())
  useEffect(() => {
    const unsub = nextContextRef.current.observable().subscribe(() => {
      const services: M[] = []
      nextContextRef.current.travelChildren((child) => {
        let service = child.get(serviceIdentifier)
        if (service) {
          services.push(service)
        }
        return true
      }, options.descendants)
      queryList.current.update(services)
    })
    return () => unsub.unsubscribe()
  }, [])
  return queryList.current
}
export const useConnect = () => {
  const nextContextRef = useRef(new ServiceContextStruct())
  return [
    (children: React.ReactElement) =>
      nextContextRef.current.isEmpty() ? (
        children
      ) : (
        <ServiceContext.Provider value={nextContextRef.current}>{children}</ServiceContext.Provider>
      ),
    {
      useService: createUseServiceContextHook(nextContextRef),
      useContentChild: createUseContentChild(nextContextRef),
    },
    nextContextRef.current,
  ] as const
}
