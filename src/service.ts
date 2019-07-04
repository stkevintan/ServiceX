import { Observable } from 'rxjs'
import { Store } from './store'
import { ActionOfService, ActionMethodOfService } from './types'
import 'reflect-metadata'
import { once, mapValues } from './utils/helpers'
import { getEffectActionFactories, getOriginalFunctions } from './utils'
import { injectable, postConstruct } from 'inversify'

@injectable()
export abstract class Service<State> {
  abstract defaultState: State

  private _store: undefined | null | Store<State>

  destroy() {
    if (this.store) {
      this.store.destroy()
    }
  }

  private get store(): Store<State> {
    // return this.getStore()
    if (this._store === null) {
      throw new Error(
        `Error: store loop created, check the Service ${this.constructor.name} and its effects!`,
      )
      // } else if (this._store === undefined) {
      //   this._store = null
    }
    if (this._store === undefined) {
      throw new Error('Error: store is not initialed')
    }
    return this._store
  }

  @postConstruct()
  initStore() {
    const { effects, reducers, immerReducers, defineActions } = getOriginalFunctions(this)

    Object.assign(this, mapValues(defineActions, ({ observable }) => observable))
    this._store = null
    this._store = new Store({
      nameForLog: this.constructor.name,
      defaultState: this.defaultState,
      effects,
      reducers,
      immerReducers,
      defineActions,
    })
  }
  // TODO: set this to extract loading State logical
  // public loading: { [key in keyof State]?: boolean } = {}

  getState<M extends Service<State>>(this: M): M extends Service<infer S> ? Readonly<S> : never {
    return this.store.state.getState() as any
  }

  getState$<M extends Service<State>>(
    this: M,
  ): M extends Service<infer S> ? Observable<Readonly<S>> : never {
    return this.store.state.state$ as any
  }

  getActions: <M extends Service<State>>(
    this: M,
  ) => M extends Service<infer S> ? ActionOfService<M, S> : never = once(() => {
    return getEffectActionFactories(this) as any
  })

  getActionMethods<M extends Service<State>>(
    this: M,
  ): M extends Service<infer S> ? ActionMethodOfService<M, S> : never {
    return this.store.triggerActions as any
  }
}
