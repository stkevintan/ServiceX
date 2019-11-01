import { merge, Observable, Subject, Subscription, NEVER, from } from 'rxjs'
import { map, catchError, delayWhen } from 'rxjs/operators'
import { mapValues } from './utils/helpers'
import produce from 'immer'

import {
  EffectAction,
  ReducerAction,
  OriginalEffectActions,
  OriginalReducerActions,
  OriginalImmerReducerActions,
  OriginalDefineActions,
  TriggerActions,
} from './types'

import { BasicState } from './utils'
import { logStateAction } from './reduxDevtool'

interface Config<State> {
  nameForLog: string
  defaultState: State
  effects: OriginalEffectActions<State>
  reducers: OriginalReducerActions<State>
  immerReducers: OriginalImmerReducerActions<State>
  defineActions: OriginalDefineActions
}

interface Action<State> {
  readonly effectAction?: EffectAction
  readonly reducerAction?: ReducerAction<State>
  readonly originalActionName: string
}

function catchRxError() {
  return catchError<any, any>((err) => {
    console.error(err)

    return NEVER
  })
}

export class Store<State> {
  state: BasicState<State>

  triggerActions: TriggerActions = {}

  subscription = new Subscription()

  private effectSubs: Record<string, Subscription> = {}

  private effects: Record<string, Subject<any>> = {}

  initEffects = () => {
    for (const actionName of Object.keys(this.config.effects)) {
      // if exist subscription
      if (this.effects[actionName]) continue
      this.effects[actionName] = new Subject<any>()
      this.effectSubs[actionName] = this.config.effects[actionName](
        this.effects[actionName],
        this.state.state$,
      )
        .pipe(
          // a promise delay
          delayWhen(() => from(Promise.resolve())),
          map(
            (effectAction): Action<State> => {
              return {
                effectAction,
                originalActionName: actionName,
              }
            },
          ),
          catchRxError(),
        )
        .subscribe((action) => {
          this.log(action)
          this.handleAction(action)
        })
    }
  }

  destroyEffects = () => {
    for (const actionName of Object.keys(this.config.effects)) {
      if (this.effects[actionName]) {
        this.effects[actionName].complete()
      }
      if (this.effectSubs[actionName]) {
        this.effectSubs[actionName].unsubscribe()
      }
    }
    this.effectSubs = {}
    this.effects = {}
  }

  constructor(private readonly config: Readonly<Config<State>>) {
    this.state = new BasicState<State>(config.defaultState)
    const effectActions: TriggerActions = {}
    for (const actionName of Object.keys(this.config.effects)) {
      effectActions[actionName] = (payload: any) => {
        if (this.effects[actionName]) {
          this.effects[actionName].next(payload)
        }
      }
    }

    const [reducerActions$, reducerActions] = setupReducerActions(
      this.config.reducers,
      this.state.getState,
    )

    const [immerReducerActions$, immerReducerActions] = setupImmerReducerActions(
      this.config.immerReducers,
      this.state.getState,
    )

    this.triggerActions = {
      ...effectActions,
      ...reducerActions,
      ...immerReducerActions,
      ...mapValues(this.config.defineActions, ({ next }) => next),
    }

    this.subscription.add(
      reducerActions$.subscribe((action) => {
        this.log(action)
        this.handleAction(action)
      }),
    )

    this.subscription.add(
      immerReducerActions$.subscribe((action) => {
        this.log(action)
        this.handleAction(action)
      }),
    )
  }

  destroy() {
    this.subscription.unsubscribe()
    this.destroyEffects()
    this.triggerActions = {}
  }

  private log = ({ originalActionName, effectAction, reducerAction }: Action<State>) => {
    if (effectAction) {
      logStateAction(this.config.nameForLog, {
        params: effectAction.params,
        actionName: `${originalActionName}/👉${effectAction.service.constructor.name}/️${effectAction.actionName}`,
      })
    }

    if (reducerAction) {
      logStateAction(this.config.nameForLog, {
        params: reducerAction.params,
        actionName: originalActionName,
        state: reducerAction.nextState,
      })
    }
  }

  private handleAction = ({ effectAction, reducerAction }: Action<State>) => {
    if (effectAction) {
      const { service, actionName, params } = effectAction
      ;(service.getActions() as any)[actionName](params)
    }

    if (reducerAction) {
      this.state.setState(reducerAction.nextState)
    }
  }
}

// function setupEffectActions<State>(
//   effectActions: OriginalEffectActions<State>,
//   state$: Observable<State>,
// ): [Observable<Action<State>>, TriggerActions] {
//   const actions: TriggerActions = {}
//   const effects: Observable<Action<State>>[] = []

//   Object.keys(effectActions).forEach((actionName) => {
//     const payload$ = new Subject<any>()
//     actions[actionName] = (payload: any) => {
//       payload$.next(payload)
//     }

//     //FIXME: how to avoid this recuring boom?
//     const effect$: Observable<EffectAction> = effectActions[actionName](payload$, state$)

//     effects.push(
//       effect$.pipe(
//         map(
//           (effectAction): Action<State> => {
//             return {
//               effectAction,
//               originalActionName: actionName,
//             }
//           },
//         ),
//         catchRxError(),
//       ),
//     )
//   })

//   return [merge(...effects), actions]
// }

function setupReducerActions<State>(
  reducerActions: OriginalReducerActions<State>,
  getState: () => State,
): [Observable<Action<State>>, TriggerActions] {
  const actions: TriggerActions = {}
  const reducers: Observable<Action<State>>[] = []

  Object.keys(reducerActions).forEach((actionName) => {
    const reducer$ = new Subject<Action<State>>()
    reducers.push(reducer$)

    const reducer = reducerActions[actionName]

    actions[actionName] = (params: any) => {
      const nextState = reducer(getState(), params)

      reducer$.next({
        reducerAction: { params, actionName, nextState },
        originalActionName: actionName,
      })
    }
  })

  return [merge(...reducers), actions]
}

function setupImmerReducerActions<State>(
  immerReducerActions: OriginalImmerReducerActions<State>,
  getState: () => State,
): [Observable<Action<State>>, TriggerActions] {
  const actions: TriggerActions = {}
  const immerReducers: Observable<Action<State>>[] = []

  Object.keys(immerReducerActions).forEach((actionName) => {
    const immerReducer$ = new Subject<Action<State>>()
    immerReducers.push(immerReducer$)

    const immerReducer = immerReducerActions[actionName]

    actions[actionName] = (params: any) => {
      const nextState = produce(getState(), (draft) => {
        immerReducer(draft, params)
      })

      immerReducer$.next({
        reducerAction: { params, actionName, nextState },
        originalActionName: actionName,
      })
    }
  })

  return [merge(...immerReducers), actions]
}
