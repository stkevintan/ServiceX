import { Observable } from 'rxjs'
import { Draft } from 'immer'

import { defineActionSymbols, effectSymbols, reducerSymbols, immerReducerSymbols } from '../symbols'
import { EffectAction, TriggerActions } from '../types'
import { createActionDecorator } from './actionRelated'

export * from './actionRelated'

interface DecoratorReturnType<V> {
  (target: any, propertyKey: string, descriptor: { value?: V }): void
}

export const ImmerReducer: <S = any>() => DecoratorReturnType<
  (state: Draft<S>, params: any) => undefined | void
> = createActionDecorator(immerReducerSymbols)

export const Reducer: <S = any>() => DecoratorReturnType<
  (state: S, params: any) => S
> = createActionDecorator(reducerSymbols)

export const Effect: <A = any, S = any>() => DecoratorReturnType<
  (
    action: Observable<A>,
    state$: Observable<S>,
    actions: TriggerActions,
  ) => Observable<EffectAction>
> = createActionDecorator(effectSymbols)

export const DefineAction = createActionDecorator(defineActionSymbols)
