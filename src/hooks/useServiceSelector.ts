import { Service } from '../service'
import { useRef, useState, useEffect } from 'react'
import { Subscription } from 'rxjs'
import { map, distinctUntilChanged, skip } from 'rxjs/operators'
import { shallowEqual } from '../utils'

export function useServiceSelector<
  M extends Service<any>,
  S = M extends Service<infer SS> ? SS : never,
  F = S
>(service: M, selector?: (state: Readonly<S>) => F): F {
  const serviceRef = useRef<Service<any> | null>(null)
  const subscriptionRef = useRef<Subscription | null>(null)
  const [state, setState] = useState(() =>
    selector ? selector(service.getState()) : service.getState(),
  )
  if (serviceRef.current !== service) {
    const count = serviceRef.current === null ? 1 : 0
    serviceRef.current = service
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }

    if (service) {
      subscriptionRef.current = service
        .getState$()
        .pipe(
          skip(count),
          map((state) => (selector ? selector(state) : state)),
          distinctUntilChanged(shallowEqual),
        )
        .subscribe(setState)
    }
  }

  useEffect(
    () => () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    },
    [subscriptionRef],
  )
  return state
}
