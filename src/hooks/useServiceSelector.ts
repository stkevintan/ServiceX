import { Service } from '../service'
import { useRef, useState, useEffect } from 'react'
import { Subscription } from 'rxjs'
import { map, distinctUntilChanged, skip } from 'rxjs/operators'
import { shallowEqual } from '../utils'

export type UseServiceSelectorResult<P, S> = P extends undefined
  ? S
  : P extends (...args: any) => infer R
  ? R
  : never

export function useServiceSelector<M extends Service<any>, F>(
  service: M,
  selector?: (state: M extends Service<infer S> ? Readonly<S> : never) => F,
): M extends Service<infer S> ? UseServiceSelectorResult<typeof selector, S> : never {
  const serviceRef = useRef<Service<any> | null>(null)
  const skipCountRef = useRef(1)
  const subscriptionRef = useRef<Subscription | null>(null)
  const [state, setState] = useState(() =>
    selector ? selector(service.getState() as any) : service.getState(),
  )
  if (serviceRef.current !== service) {
    serviceRef.current = service
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }

    if (service) {
      subscriptionRef.current = service
        .getState$()
        .pipe(
          skip(skipCountRef.current),
          map((state) => (selector ? selector(state as any) : state)),
          distinctUntilChanged(shallowEqual),
        )
        .subscribe(setState)
    }
    skipCountRef.current = 0
  }

  useEffect(
    () => () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    },
    [subscriptionRef],
  )

  return state as any
}
