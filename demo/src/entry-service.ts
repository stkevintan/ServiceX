// entry-service.ts
import {
  Injectable,
  Service,
  Reducer,
  ImmerReducer,
  Effect,
  EffectAction,
  DefineAction,
} from '../../src/index'
import { Observable, merge } from 'rxjs'
import { map, distinctUntilChanged, combineLatest, debounceTime } from 'rxjs/operators'

import { Entry, fetchEntries } from './fetch-entries'
import { switchFetch } from './rx-operators'

interface State {
  entries: Entry[]
  loading: boolean
  keyword?: string
}

@Injectable()
export class EntryService extends Service<State> {
  defaultState: State = {
    entries: [],
    loading: false,
  }
  // trigger loadEntries reload
  @DefineAction()
  reload$!: Observable<void>

  @ImmerReducer()
  setLoading(state: State, loading: boolean) {
    state.loading = loading
  }

  @ImmerReducer()
  setKeyword(state: State, keyword: string) {
    state.keyword = keyword
  }

  @ImmerReducer()
  setEntries(state: State, entries: Entry[]) {
    state.entries = entries
  }

  @Reducer()
  reset(): State {
    return this.defaultState
  }

  @Effect()
  loadEntries(trigger$: Observable<void>, state$: Observable<State>): Observable<EffectAction> {
    const keyword$ = state$.pipe(
      map((state) => state.keyword),
      distinctUntilChanged(),
      // debounce the input
      debounceTime(500),
    )

    return merge(trigger$, this.reload$).pipe(
      combineLatest(keyword$, (_, keyword) => keyword),
      switchFetch(
        (keyword) => fetchEntries(keyword),
        (entries) => this.actions().setEntries(entries),
        (loading) => this.actions().setLoading(loading),
      ),
    )
  }
}
