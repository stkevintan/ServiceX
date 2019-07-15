import {
  Service,
  Reducer,
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

  @Reducer()
  removeTips(): TipsState {
    return { tips: '' }
  }

  @Reducer()
  setTips(state: TipsState, tips: string): TipsState {
    return { ...state, tips }
  }

  @Reducer()
  addTips(state: TipsState, tips: string): TipsState {
    return { ...state, tips: `${state.tips} ${tips}` }
  }
}

describe('Reducer spec:', () => {
  let tips: Tips
  let actions: ActionMethodOfService<Tips, TipsState>

  beforeEach(() => {
    tips = container.resolveInScope(Tips, ScopeTypes.Transient)
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
