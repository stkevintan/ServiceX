import { Observable } from 'rxjs'
import { map, elementAt } from 'rxjs/operators'

import {
  Service,
  Injectable,
  Effect,
  EffectAction,
  Reducer,
  DefineAction,
  container,
  Transient,
} from '../../src'

interface CountState {
  count: number
}

@Injectable()
class Count extends Service<CountState> {
  defaultState = {
    count: 0,
  }

  @DefineAction()
  resetCountDown$!: Observable<number>

  @Reducer()
  setCount(state: CountState, count: number): CountState {
    return { ...state, count }
  }

  @Effect()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _(_: Observable<void>): Observable<EffectAction> {
    return this.resetCountDown$.pipe(map((count) => this.actions().setCount(count)))
  }
}

describe('DefineAction spec:', () => {
  // const testModule = Test.createTestingModule().compile()
  const count = container.resolveInScope<Count>(Count, Transient)
  const countActions = count.getActions()

  it('should setup properly', () => {
    expect(count.resetCountDown$).toBeInstanceOf(Observable)
  })

  it('should trigger action properly', () => {
    countActions.resetCountDown$(22)
    count
      .getState$()
      .pipe(elementAt(1))
      .subscribe((state) => expect(state.count).toBe(22))
  })
})
