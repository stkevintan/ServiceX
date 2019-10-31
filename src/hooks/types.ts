import { Service } from '../service'
import { ActionMethodOfService } from '../types'

export type ServiceResult<M extends Service<S>, S, F> = [
  Readonly<F>,
  ActionMethodOfService<M, S>,
  M,
]
