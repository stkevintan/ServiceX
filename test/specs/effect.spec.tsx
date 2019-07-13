import { Observable, of } from 'rxjs'
import { map, mergeMap, withLatestFrom } from 'rxjs/operators'

import {
  Service,
  Effect,
  EffectAction,
  Reducer,
  Injectable,
  container,
  ScopeTypes,
  Inject,
  Scope,
} from '../../src'

interface TipsState {
  tips: string
}

@Injectable()
class Tips extends Service<TipsState> {
  defaultState = {
    tips: '',
  }

  @Reducer()
  showTipsWithReducer(state: TipsState, tips: string): TipsState {
    return { ...state, tips }
  }

  @Effect()
  showTipsWithEffectAction(tips$: Observable<string>): Observable<EffectAction> {
    return tips$.pipe(map((tips) => this.getActions().showTipsWithReducer(tips)))
  }
}

interface CountState {
  count: number
}

@Injectable()
class Count extends Service<CountState> {
  defaultState = {
    count: 0,
  }

  @Inject(Tips) @Scope(ScopeTypes.Transient) readonly tips!: Tips

  @Reducer()
  setCount(state: CountState, count: number): CountState {
    return { ...state, count }
  }

  @Effect()
  add(count$: Observable<number>, state$: Observable<CountState>): Observable<EffectAction> {
    return count$.pipe(
      withLatestFrom(state$),
      mergeMap(([addCount, state]) =>
        of(
          this.getActions().setCount(state.count + addCount),
          this.tips.getActions().showTipsWithReducer(`add ${addCount}`),
        ),
      ),
    )
  }

  @Effect()
  minus(count$: Observable<number>, state$: Observable<CountState>): Observable<EffectAction> {
    return count$.pipe(
      withLatestFrom(state$),
      mergeMap(([subCount, state]) =>
        of(
          this.getActions().setCount(state.count - subCount),
          this.tips.getActions().showTipsWithEffectAction(`minus ${subCount}`),
        ),
      ),
    )
  }

  @Effect()
  error(payload$: Observable<void>) {
    return payload$.pipe(
      map(() => {
        throw new Error('error!')
      }),
    )
  }
}

describe('Effect spec:', () => {
  const count = container.resolve(Count, ScopeTypes.Transient)
  const countActions = count.getActionMethods()
  const tips = count.tips
  const getCount = () => count.getState().count
  const getTips = () => tips.getState().tips

  describe('Emitted EffectAction will trigger corresponding Action', () => {
    it('Reducer Action', () => {
      countActions.add(1)
      expect(getCount()).toBe(1)
      expect(getTips()).toBe('add 1')
    })

    it('Effect Action', () => {
      countActions.minus(1)
      expect(getCount()).toBe(0)
      expect(getTips()).toBe('minus 1')
    })
  })

  describe('Error handles', () => {
    it(`Error won't affect the main state$`, () => {
      const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {})
      countActions.error()
      expect(errorLog.mock.calls.length).toBe(1)
      errorLog.mockRestore()

      countActions.add(1)
      countActions.minus(2)
      countActions.minus(3)
      expect(getCount()).toBe(-4)
    })
  })
})
