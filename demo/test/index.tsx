import React, { useContext, useMemo, useRef } from 'react'
import ReactDOM from 'react-dom'
import './index.less'
import {
  Injectable,
  Service,
  Reducer,
  ImmerReducer,
  Effect,
  EffectAction,
  DefineAction,
  useConnect,
  Request,
  useServiceInstance,
} from '../../src'
import { Observable, of, from } from 'rxjs'
import { withLatestFrom, map, catchError, repeatWhen, switchMap, startWith } from 'rxjs/operators'

interface State {
  count: number
  data?: any
  loading: boolean
}

// service.ts
@Injectable()
class CountService extends Service<State> {
  defaultState = {
    count: 0,
    loading: false,
  }

  // constructor(public other2: OtherService) {
  //   super()
  // }

  // @Inject(OtherService) other!: OtherService

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
        return this.getActions().setCount(state.count - count)
      }),
      catchError((err) => {
        console.error(err)
        return of(this.getActions().reset())
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
          startWith(() => this.getActions().saveState({ loading: true })),
          map((data) => this.getActions().saveState({ loading: false, data })),
        )
      }),
    )
  }
}

interface IProps {}
const Count = ({  }: IProps) => {
  const [render, hooks] = useConnect()
  const [state, actions] = hooks.useService(CountService, {
    selector: (state) => ({ count: state.count }),
  })

  return render(
    <div className="container">
      <span className="count">
        parent: {state.count}, <Child inherit={true} />
      </span>

      <div>
        <button onClick={() => actions.add(1)}>Add one</button>
        <button onClick={() => actions.subtract(1)}>Subtract one</button>
        <button onClick={() => actions.reset()}>Reset</button>
      </div>
    </div>,
  )
}

const Count2 = () => {
  const [render, hooks] = useConnect()
  const [state, actions] = hooks.useService(CountService)
  const queryList = hooks.useContentChild(CountService)

  // const [state1, actions1] = useServiceInstance(queryList.take(0))
  const list = Array.from({ length: state.count }, (_, i) => i)

  return render(
    <div className="container">
      <span className="count">
        parent: {state.count}, child1's count: {state1.count}
        {list.map((i) => (
          <Child key={i} inherit={false} />
        ))}
      </span>
      <div>
        <button onClick={() => actions.add(1)}>Add one</button>
        <button onClick={() => actions.subtract(1)}>Subtract one</button>
        <button onClick={() => actions.reset()}>Reset</button>
      </div>
    </div>,
  )
}

const Child = ({ inherit }: { inherit: boolean }) => {
  const [render, { useService }] = useConnect()
  const [state] = useService(CountService, { inherit })
  return render(<span>child: {state.count}</span>)
}

const App = () => {
  console.log('app')
  return (
    <div>
      <Count />
      <Count2 />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('app'))
