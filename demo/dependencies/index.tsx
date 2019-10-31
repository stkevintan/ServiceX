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
} from '../../src'
import { Observable, of } from 'rxjs'
import { withLatestFrom, map, catchError, repeatWhen } from 'rxjs/operators'
import { CompA } from './CompA'
import { CompB } from './CompB'

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

  constructor(public other2: OtherService) {
    super()
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
        return this.actions().setCount(state.count - count)
      }),
      catchError((err) => {
        console.error(err)
        return of(this.actions().reset())
      }),
      repeatWhen(() => this.retry$),
    )
  }
}

const Count: React.FC<{}> = () => {
  const [state, actions] = useService(CountService)
  return (
    <div>
      <div className="container">
        <span className="count">Main: {state.count}</span>
        <div>
          <button onClick={() => actions.add(1)}>Add one</button>
          <button onClick={() => actions.subtract(1)}>Subtract one</button>
          <button onClick={() => actions.reset()}>Reset</button>
        </div>
      </div>
      <div>
        <CompA />
        <CompB />
      </div>
    </div>
  )
}

ReactDOM.render(<Count />, document.getElementById('app'))
