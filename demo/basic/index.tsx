import React from 'react'
import ReactDOM from 'react-dom'
import './index.less'
import {
  useService,
  Injectable,
  Service,
  Reducer,
  ImmerReducer,
  Effect,
  EffectAction,
  DefineAction,
  useServiceInstance,
  Inject,
} from '../../src'
import { Observable, of, from } from 'rxjs'
import { withLatestFrom, map, catchError, repeatWhen, switchMap, startWith } from 'rxjs/operators'

interface State {
  count: number
  data?: any
  loading: boolean
}

@Injectable()
class OtherService extends Service<{ count: number }> {
  defaultState = {
    count: 1,
  }

  @Reducer()
  setCount(_state: { count: number }, x: number) {
    return { count: x }
  }
}

// service.ts
@Injectable()
class CountService extends Service<State> {
  defaultState = {
    count: 0,
    loading: false,
  }

  constructor(public other2: OtherService) {
    super()
  }

  @Inject(OtherService) other!: OtherService

  @DefineAction()
  retry$!: Observable<void>

  @Reducer()
  saveState(state: State, payload: Partial<State>): State {
    return { ...state, ...payload }
  }
  @Reducer()
  setCount(state: State, count: number) {
    return { ...state, count: count }
  }

  @ImmerReducer()
  add(state: State, count: number): void {
    state.count += count
  }

  @Reducer()
  reset(): State {
    return this.defaultState
  }
  @Effect()
  subtract(count$: Observable<number>, state$: Observable<State>): Observable<EffectAction> {
    return count$.pipe(
      withLatestFrom(state$),
      map(([count, state]) => {
        return this.actions().setCount(state.count - count)
      }),
      catchError((err) => {
        console.error(err)
        return of(this.actions().reset())
      }),
      repeatWhen(() => this.retry$),
    )
  }
  @Effect()
  fetch(trigger$: Observable<void>): Observable<EffectAction> {
    return trigger$.pipe(
      switchMap(() => {
        return from(
          fetch('https://yapi.bytedance.net/mock/844/xztech/blog/v1/posts/').then((data) =>
            data.json(),
          ),
        ).pipe(
          startWith(() => this.actions().saveState({ loading: true })),
          map((data) => this.actions().saveState({ loading: false, data })),
        )
      }),
    )
  }
}

const Count: React.FC<{}> = () => {
  const [state, actions, service] = useService(CountService)
  const [state2] = useServiceInstance(service.other)
  const [state3] = useServiceInstance(service.other2)
  return (
    <div className="container">
      <span className="count">
        {state.count},{state2.count}, {state3.count}
      </span>
      <div>
        <button onClick={() => actions.add(1)}>Add one</button>
        <button onClick={() => actions.subtract(1)}>Subtract one</button>
        <button onClick={() => actions.reset()}>Reset</button>
      </div>
    </div>
  )
}

ReactDOM.render(<Count />, document.getElementById('app'))
