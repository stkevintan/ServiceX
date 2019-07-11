import {
  Service,
  ScopeTypes,
  Injectable,
  Reducer,
  container,
  ActionMethodOfService,
  Effect,
  EffectAction,
  Inject,
} from '../../src'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

interface State {
  count: number
}

@Injectable()
class OtherModel extends Service<State> {
  defaultState = {
    count: -1,
  }
  @Reducer()
  subtract(state: State, n: number): State {
    return { ...state, count: state.count - n }
  }
}

@Injectable()
class CountModel extends Service<State> {
  defaultState = { count: 0 }

  @Inject(OtherModel, ScopeTypes.Transient) other!: OtherModel
  @Inject(OtherModel, ScopeTypes.Transient) other2!: OtherModel

  @Reducer()
  setCount(state: State, count: number): State {
    return { ...state, count }
  }

  @Reducer()
  syncCount(state: State): State {
    return { ...state, count: this.other.getState().count }
  }

  @Effect()
  proxySubtract(payload$: Observable<number>): Observable<EffectAction> {
    return payload$.pipe(map((n) => this.other2.getActions().subtract(n)))
  }
}

describe('Inject specs:', () => {
  let countModel: CountModel
  let actions: ActionMethodOfService<CountModel, State>

  beforeEach(() => {
    countModel = container.resolve(CountModel, ScopeTypes.Transient)
    actions = countModel.getActionMethods()
  })

  it('getState', () => {
    expect(countModel.getState()).toEqual({ count: 0 })
    actions.setCount(10)
    expect(countModel.getState()).toEqual({ count: 10 })
  })

  it('syncCount', () => {
    expect(countModel.getState()).toEqual({ count: 0 })
    actions.proxySubtract(1)
    expect(countModel.other2.getState()).toEqual({ count: -2 })
    actions.syncCount()
    expect(countModel.getState()).toEqual({ count: -1 })
  })
})
