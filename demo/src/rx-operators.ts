import { Observable, of, EMPTY, from } from 'rxjs'
import { mergeMap, startWith, tap, catchError, switchMap } from 'rxjs/operators'

const excludeNill = <T>(x: T): x is NonNullable<T> => {
  return x !== undefined && x !== null
}

type Arrayable<T> = T | T[]

function isArray<T>(x: any): x is T[] {
  return Array.isArray(x)
}

export function handleRequest<T, E>(
  map: (value: T) => Arrayable<E | undefined>,
  onLoading?: (loading: boolean) => E | undefined,
  onError?: (err: any) => E | undefined,
) {
  return (src: Observable<T>): Observable<E> => {
    let loaded: E | undefined
    let loading: E | undefined
    if (onLoading) {
      loaded = onLoading(false)
      loading = onLoading(true)
    }
    return src.pipe(
      mergeMap((value) => {
        let ret = map(value)
        if (!Array.isArray(ret)) ret = [ret]
        const actions = ret.filter(excludeNill)
        return loaded ? of(loaded, ...actions) : of(...actions)
      }),
      loading ? startWith(loading) : tap(),
      catchError<any, any>((err) => {
        if (!onError) {
          // any err handlers
          console.error(err)
        }
        const afterActions = [loaded, onError && onError(err)].filter(excludeNill)
        return afterActions.length ? of(...afterActions) : EMPTY
      }),
    )
  }
}

export function switchFetch<T, R, E>(
  req: (v: T) => Observable<R> | E[],
  map: (value: R, v: T) => Arrayable<E | undefined>,
  onLoading?: (loading: boolean, v: T) => E | undefined,
  onError?: (err: any, v: T) => E | undefined,
) {
  return (src: Observable<T>): Observable<E> =>
    src.pipe(
      switchMap((v) => {
        const source = req(v)
        if (isArray<E>(source)) {
          return from(source)
        }
        return source.pipe(
          handleRequest(
            (value) => map(value, v),
            onLoading && ((loading) => onLoading(loading, v)),
            onError && ((err) => onError(err, v)),
          ),
        )
      }),
    )
}
