import { Draft } from 'immer'

import {
  Service,
  ImmerReducer,
  Injectable,
  ActionMethodOfService,
  container,
  ScopeTypes,
} from '../../src'

interface TipsState {
  tips: string
}

@Injectable()
class Tips extends Service<TipsState> {
  defaultState = {
    tips: '',
  }

  @ImmerReducer()
  removeTips(state: Draft<TipsState>) {
    state.tips = ''
  }

  @ImmerReducer()
  setTips(state: Draft<TipsState>, tips: string) {
    state.tips = tips
  }

  @ImmerReducer()
  addTips(state: Draft<TipsState>, tips: string) {
    state.tips = `${state.tips} ${tips}`
  }
}

describe('ImmerReducer spec:', () => {
  let tips: Tips
  let actions: ActionMethodOfService<Tips, TipsState>

  beforeEach(() => {
    tips = container.resolve(Tips, ScopeTypes.Transient)
    actions = tips.getActionMethods()
  })

  it('with payload', () => {
    actions.setTips('one')
    expect(tips.getState()).toEqual({ tips: 'one' })
  })

  it('with payload and state', () => {
    actions.setTips('two')
    actions.addTips('three')
    expect(tips.getState()).toEqual({ tips: 'two three' })
  })

  it('without payload and state', () => {
    actions.setTips('one')
    actions.removeTips()
    expect(tips.getState()).toEqual({ tips: '' })
  })
})
