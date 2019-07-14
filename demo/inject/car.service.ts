/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import { Service, Injectable, ImmerReducer, Scope, ScopeTypes, Inject } from '../../src'

import { Engine, LowEngineService, MedianEngineService, HighEngineService } from './engine.service'

interface CarState {
  name: string
}

@Injectable()
export class CarService extends Service<CarState> {
  // default scope is singleton
  @Inject(LowEngineService)
  public engine1!: Service<Engine>

  // define the scope implictly
  @Inject(MedianEngineService)
  @Scope(ScopeTypes.Transient)
  public engine2!: Service<Engine>

  constructor(
    @Inject(HighEngineService)
    @Scope(ScopeTypes.Transient)
    public engine3: Service<Engine>,
  ) {
    super()
  }

  defaultState = {
    name: 'default',
  }

  @ImmerReducer()
  changeName(state: CarState, name: string) {
    state.name = name
  }
}
