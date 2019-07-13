import { Service } from '../service'
import { ActionMethodOfService } from '../types'

export type ServiceResult<M extends Service<S>, S, P = undefined> = [
  Readonly<P extends undefined ? S : P extends (...args: any) => infer R ? R : never>,
  ActionMethodOfService<M, S>,
]

export type ServiceResultWithSelf<M extends Service<S>, S, P = undefined> = [
  Readonly<P extends undefined ? S : P extends (...args: any) => infer R ? R : never>,
  ActionMethodOfService<M, S>,
  M,
]
