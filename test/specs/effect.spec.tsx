import { Observable, of } from 'rxjs'
import { map, mergeMap, withLatestFrom, elementAt } from 'rxjs/operators'

import {
  Service,
  Effect,
  EffectAction,
  Reducer,
  Injectable,
  container,
  Inject,
  Scope,
  Transient,
} from '../../src'

const wait = (fn: (...args: any[]) => any) => Promise.resolve().then(() => fn())

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
    return tips$.pipe(map((tips) => this.actions().showTipsWithReducer(tips)))
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

  @Inject(Tips) @Scope(Transient) readonly tips!: Tips

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
          this.actions().setCount(state.count + addCount),
          this.tips.actions().showTipsWithReducer(`add ${addCount}`),
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
          this.actions().setCount(state.count - subCount),
          this.tips.actions().showTipsWithEffectAction(`minus ${subCount}`),
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
  const count = container.resolveInScope(Count, Transient)
  const countActions = count.getActions()
  const tips = count.tips
  const getCount = () => count.getState().count

  describe('Emitted EffectAction will trigger corresponding Action', () => {
    it('Effect Action', async () => {
      countActions.minus(1)
      await Promise.all([
        wait(() => expect(getCount()).toBe(-1)),
        tips
          .getState$()
          .pipe(elementAt(1))
          .toPromise()
          .then((state) => expect(state.tips).toBe('minus 1')),
      ])
    })
  })

  describe('Error handles', () => {
    it(`Error won't affect the main state$`, async () => {
      const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {})
      countActions.error()
      expect(errorLog.mock.calls.length).toBe(1)
      errorLog.mockRestore()

      countActions.add(1)
      countActions.minus(2)
      countActions.minus(3)
      await wait(() => expect(getCount()).toBe(-4))
    })
  })
})
