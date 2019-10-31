import { BehaviorSubject } from 'rxjs'
import produce from 'immer'

export class QueryList<M = any> {
  private readonly queryList$: BehaviorSubject<M[]> = new BehaviorSubject<M[]>([])
  get queryList() {
    return this.queryList$.getValue()
  }
  push = (item: M) => {
    this.queryList$.next(
      produce(this.queryList, (draft) => {
        draft.push(item as any)
      }),
    )
  }
  update = (items: M[]) => {
    this.queryList$.next(items)
  }

  observable() {
    return this.queryList$.asObservable()
  }
}
