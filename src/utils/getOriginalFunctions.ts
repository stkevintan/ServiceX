import { Subject } from 'rxjs'
import { pick, mapValues } from './helpers'

import {
  OriginalDefineActions,
  OriginalEffectActions,
  OriginalReducerActions,
  OriginalImmerReducerActions,
} from '../types'
import { Service } from '../service'
import { getActionNames } from '../decorators'
import { effectSymbols, reducerSymbols, immerReducerSymbols, defineActionSymbols } from '../symbols'

const getOriginalFunctionNames = (service: Service<any>) => ({
  effects: getActionNames(effectSymbols, service.constructor),
  reducers: getActionNames(reducerSymbols, service.constructor),
  defineActions: getActionNames(defineActionSymbols, service.constructor),
  immerReducers: getActionNames(immerReducerSymbols, service.constructor),
})

const transformDefineActions = (actionNames: string[]): OriginalDefineActions => {
  const result: OriginalDefineActions = {}

  actionNames.forEach((actionName) => {
    const actions$ = new Subject<any>()

    result[actionName] = {
      observable: actions$.asObservable(),
      next: (params: any) => actions$.next(params),
    }
  })

  return result
}

export const getOriginalFunctions = (service: Service<any>) => {
  const { effects, reducers, immerReducers, defineActions } = getOriginalFunctionNames(service)

  return {
    effects: mapValues(pick(service, effects), (func: Function) =>
      func.bind(service),
    ) as OriginalEffectActions<any>,
    reducers: mapValues(pick(service, reducers), (func: Function) =>
      func.bind(service),
    ) as OriginalReducerActions<any>,
    immerReducers: mapValues(pick(service, immerReducers), (func: Function) =>
      func.bind(service),
    ) as OriginalImmerReducerActions<any>,
    defineActions: transformDefineActions(defineActions),
  }
}
