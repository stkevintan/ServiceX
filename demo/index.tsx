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
  Inject,
  useServiceInstance,
} from '../src'
import { Observable, of } from 'rxjs'
import { withLatestFrom, map, catchError, repeatWhen } from 'rxjs/operators'

interface State {
  count: number
}

@Injectable()
class OtherService extends Service<State> {
  defaultState = {
    count: 1,
  }
}
// service.ts
@Injectable()
class CountService extends Service<State> {
  defaultState = {
    count: 0,
  }

  @Inject(OtherService) other!: OtherService

  @DefineAction()
  retry$!: Observable<void>

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
        return this.getActions().setCount(state.count - count)
      }),
      catchError((err) => {
        console.error(err)
        return of(this.getActions().reset())
      }),
      repeatWhen(() => this.retry$),
    )
  }
}

const Count: React.FC<{}> = () => {
  const [state, actions, deps] = useService(CountService)
  const [state2] = useServiceInstance(deps.other)
  return (
    <div className="container">
      <span className="count">
        {state.count},{state2.count}
      </span>
      <button onClick={() => actions.add(1)}>Add one</button>
      <button onClick={() => actions.subtract(1)}>Subtract one</button>
      <button onClick={() => actions.reset()}>Reset</button>
    </div>
  )
}

ReactDOM.render(<Count />, document.getElementById('app'))
