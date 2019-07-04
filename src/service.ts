import { Observable } from 'rxjs'
import { Store } from './store'
import { ActionOfService } from './types'
import { injectable } from 'inversify'
import 'reflect-metadata'
import { once, mapValues } from './utils/helpers'
import { getEffectActionFactories, getOriginalFunctions } from './utils'

@injectable()
export abstract class Service<State> {
  abstract defaultState: State

  private __store: Store<State> | null | undefined

  destroy() {
    if (this.__store) {
      this.__store.destroy()
    }
    this.__store = undefined
  }

  get store(): Store<State> {
    // return this.getStore()
    if (this.__store === null) {
      throw new Error(
        `Error: store loop created, check the Service ${this.constructor.name} and its effects!`,
      )
    } else if (this.__store === undefined) {
      this.__store = null
      const { effects, reducers, immerReducers, defineActions } = getOriginalFunctions(this)

      Object.assign(this, mapValues(defineActions, ({ observable }) => observable))
      this.__store = new Store({
        nameForLog: this.constructor.name,
        defaultState: this.defaultState,
        effects,
        reducers,
        immerReducers,
        defineActions,
      })
    }
    return this.__store
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
}
