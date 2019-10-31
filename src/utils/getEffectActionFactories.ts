import { Service } from '../service'
import { EffectAction } from '../types'
import { getAllActionNames } from '../decorators'

export function getEffectActionFactories<M extends Service<any>>(target: M): any {
  return getAllActionNames(target).reduce(
    (result: any, name: string) => ({
      ...result,
      [name]: (params: any): EffectAction => ({
        service: target,
        actionName: name,
        params,
      }),
    }),
    {},
  )
}
