import { Store } from './store'
import { ActionOfService, ActionMethodOfService, ConditionPartial } from './types'
import 'reflect-metadata'
import { mapValues } from './utils/helpers'
import { getEffectActionFactories, getOriginalFunctions } from './utils'
import { injectable, postConstruct } from 'inversify'
import { StoreSymbol } from './symbols'
import { filter } from 'rxjs/operators'

@injectable()
export abstract class Service<State> {
  abstract defaultState: State

  actions<M extends Service<any>>(
    this: M,
  ): M extends Service<infer SS> ? ActionOfService<M, SS> : never {
    return getEffectActionFactories(this)
  }

  destroy() {
    if (this.store) {
      this.store.destroy()
      Reflect.deleteMetadata(StoreSymbol, this)
    }
  }

  private active = true

  private get store(): Store<State> {
    if (!Reflect.hasMetadata(StoreSymbol, this)) {
      throw new Error(`Store is destroyed or not created at now, ${this.constructor.name}`)
      // this.initStore()
    }
    const store = Reflect.getMetadata(StoreSymbol, this)

    // if (store === null) {
    //   throw new Error(
    //     `Error: store loop created, check the Service ${this.constructor.name} and its effects!`,
    //   )
    // }
    return store
  }

  @postConstruct()
  $initStore() {
    const { effects, reducers, immerReducers, defineActions } = getOriginalFunctions(this)

    Object.assign(this, mapValues(defineActions, ({ observable }) => observable))

    this.active = true

    Object.entries(this).forEach(([key, value]) => {
      if (value instanceof Service) {
        //prevent all the injected state$, when current service is inactive
        ;(this as any)[key] = {
          ...value,
          getState$: () => value.getState$().pipe(filter(() => this.active)),
        }
      }
    })

    // Reflect.defineMetadata(StoreSymbol, null, this)
    Reflect.defineMetadata(
      StoreSymbol,
      new Store({
        nameForLog: this.constructor.name,
        defaultState: this.defaultState,
        effects,
        reducers,
        immerReducers,
        defineActions,
      }),
      this,
    )
  }

  $sleep() {
    this.active = false
  }

  $awake() {
    this.active = true
  }

  // TODO: set this to extract loading State logical
  // public loading: { [key in keyof State]?: boolean } = {}

  $setState<T extends boolean>(patchState: ConditionPartial<T, State>, replace?: T): void {
    if (replace === true) {
      this.store.state.setState(patchState as State)
    }
    const state = this.getState()
    this.store.state.setState(Object.assign({}, state, patchState))
  }

  getState() {
    return this.store.state.getState()
  }

  getState$() {
    return this.store.state.state$.pipe(filter(() => this.active))
  }

  // a: <M extends Service<State>>(
  //   this: M,
  // ) => M extends Service<infer S> ? ActionOfService<M, S> : never = once(() => {
  //   // if (!Reflect.hasMetadata(StoreSymbol, this)) {
  //   //   this.initStore()
  //   //   // throw new Error('Error: store is not init')
  //   // }
  //   return getEffectActionFactories(this) as any
  // })

  getActions<M extends Service<State>>(this: M): ActionMethodOfService<M, State> {
    return this.store.triggerActions as any
  }
}
