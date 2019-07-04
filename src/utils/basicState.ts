import { BehaviorSubject, Observable } from 'rxjs'
import { shallowEqual } from './helpers'

export class BasicState<S> {
  readonly state$: Observable<S>

  readonly getState: () => Readonly<S>

  readonly setState: (state: Readonly<S>) => void

  constructor(defaultState: S) {
    const state$ = new BehaviorSubject<S>(defaultState)

    this.getState = () => state$.getValue()

    this.setState = (nextState: Readonly<S>) => {
      if (!shallowEqual(this.getState(), nextState)) {
        state$.next(nextState)
      }
    }

    this.state$ = state$.asObservable()
  }
}
