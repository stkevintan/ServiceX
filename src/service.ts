import { Store } from './store'
import { ActionOfService, ActionMethodOfService, ConditionPartial } from './types'
import 'reflect-metadata'
import { mapValues } from './utils/helpers'
import { getEffectActionFactories, getOriginalFunctions } from './utils'
import { injectable, postConstruct } from 'inversify'
import { StoreSymbol } from './symbols'

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

  private get store(): Store<State> {
    if (!Reflect.hasMetadata(StoreSymbol, this)) {
      throw new Error(`Store is destroyed or not created at now, ${this.constructor.name}`)
    }
    const store = Reflect.getMetadata(StoreSymbol, this)

    return store
  }

  @postConstruct()
  $initStore() {
    const { effects, reducers, immerReducers, defineActions } = getOriginalFunctions(this)

    Object.assign(this, mapValues(defineActions, ({ observable }) => observable))

    const store = new Store({
      nameForLog: this.constructor.name,
      defaultState: this.defaultState,
      effects,
      reducers,
      immerReducers,
      defineActions,
    })
    Reflect.defineMetadata(StoreSymbol, store, this)
    // remember to enable effects
    this.$awake()
  }

  $sleep() {
    this.store.destroyEffects()
  }

  $awake() {
    this.store.initEffects()
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
    return this.store.state.state$
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
