import { Service, Injectable } from '../src'

export interface Engine {
  name: string
  speed: number
}

@Injectable()
export class LowEngineService extends Service<Engine> {
  defaultState = {
    name: 'low-engine',
    speed: 1,
  }
}

@Injectable()
export class MedianEngineService extends Service<Engine> {
  defaultState = {
    name: 'median-engine',
    speed: 2,
  }
}
@Injectable()
export class HighEngineService extends Service<Engine> {
  defaultState = {
    name: 'high-engine',
    speed: 3,
  }
}
