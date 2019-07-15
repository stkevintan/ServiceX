import { container } from '../../src'

const ConfigKey = Symbol('key')
interface Config {
  id: number
  name: string
}

describe('container spec:', () => {
  // const testModule = Test.createTestingModule().compile()
  beforeEach(() => container.unbindAll())

  it('should get the binded value', () => {
    container.bind<Config>(ConfigKey).toConstantValue({ id: 1, name: 'topic1' })
    expect(container.get(ConfigKey)).toEqual({ id: 1, name: 'topic1' })
    expect(container.getAll(ConfigKey)).toEqual([{ id: 1, name: 'topic1' }])
    expect(container.isBound(ConfigKey)).toBeTruthy()
  })
  it('should unbind work', () => {
    container.bind<Config>(ConfigKey).toConstantValue({ id: 1, name: 'topic1' })
    expect(container.get(ConfigKey)).toEqual({ id: 1, name: 'topic1' })
    container.unbind(ConfigKey)
    expect(() => container.get(ConfigKey)).toThrow(Error)
    expect(container.isBound(ConfigKey)).toBeFalsy()
  })
  it('should get named binded value', () => {
    container
      .bind<Config>(ConfigKey)
      .toConstantValue({ id: 1, name: 'topic1' })
      .whenTargetNamed('A')
    container
      .bind<Config>(ConfigKey)
      .toConstantValue({ id: 2, name: 'topic2' })
      .whenTargetNamed('B')
    expect(container.isBound(ConfigKey)).toBeTruthy()
    expect(container.isBoundNamed(ConfigKey, 'A')).toBeTruthy()
    expect(container.isBoundNamed(ConfigKey, 'B')).toBeTruthy()
    expect(() => container.get(ConfigKey)).toThrow(Error)
    expect(container.getNamed(ConfigKey, 'A')).toEqual({ id: 1, name: 'topic1' })
    expect(container.getNamed(ConfigKey, 'B')).toEqual({ id: 2, name: 'topic2' })
  })

  it('should get tagged binded value', () => {
    container
      .bind<Config>(ConfigKey)
      .toConstantValue({ id: 1, name: 'topic1' })
      .whenTargetTagged('key1', 'A')
    container
      .bind<Config>(ConfigKey)
      .toConstantValue({ id: 2, name: 'topic2' })
      .whenTargetTagged('key1', 'B')

    expect(container.isBound(ConfigKey)).toBeTruthy()
    expect(container.isBoundTagged(ConfigKey, 'key1', 'A')).toBeTruthy()
    expect(container.isBoundTagged(ConfigKey, 'key1', 'B')).toBeTruthy()

    expect(() => container.get(ConfigKey)).toThrow(Error)
    expect(container.getTagged(ConfigKey, 'key1', 'A')).toEqual({ id: 1, name: 'topic1' })
    expect(container.getTagged(ConfigKey, 'key1', 'B')).toEqual({ id: 2, name: 'topic2' })
  })

  it('should getAll return array', () => {
    container
      .bind<Config>(ConfigKey)
      .toConstantValue({ id: 1, name: 'topic1' })
      .whenTargetTagged('key1', 'A')
    container
      .bind<Config>(ConfigKey)
      .toConstantValue({ id: 2, name: 'topic2' })
      .whenTargetTagged('key1', 'A')

    expect(container.getAllTagged(ConfigKey, 'key1', 'A')).toEqual([
      { id: 1, name: 'topic1' },
      { id: 2, name: 'topic2' },
    ])
  })
})
