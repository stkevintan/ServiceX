import { Container as InversifyContainer, interfaces, injectable } from 'inversify'
import { ScopeSymbol, InjectSymbol } from './symbols'
import { ConstructorOf } from './types'
import { Service } from './service'
import getDecorators from 'inversify-inject-decorators'

export const ScopeTypes = {
  Singleton: Symbol('singleton'),
  Transient: Symbol('transient'),
  Request: Symbol('request'),
}

export type Scope = symbol | string | number

export default class Container {
  private container: InversifyContainer
  constructor(container?: InversifyContainer) {
    this.container = container || new InversifyContainer()
  }

  getDecorators() {
    return getDecorators(this.container)
  }

  bind<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    // constructor: { new (...args: []): T },
    scope: Scope = ScopeTypes.Singleton,
  ): interfaces.BindingWhenOnSyntax<T> {
    const binding = this.container.bind<T>(serviceIdentifier).toSelf()
    Reflect.defineMetadata(ScopeSymbol, scope, serviceIdentifier)
    switch (scope) {
      default:
      case ScopeTypes.Singleton:
        return binding.inSingletonScope()
      case ScopeTypes.Transient:
        return binding.inTransientScope()
      case ScopeTypes.Request:
        return binding.inRequestScope()
    }
  }

  bindProvider<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    fn: interfaces.ProviderCreator<T>,
  ) {
    const binding = this.container.bind<T>(serviceIdentifier).toProvider<T>(fn)
    Reflect.defineMetadata(ScopeSymbol, ScopeTypes.Singleton, serviceIdentifier)
    return binding
  }

  unbind(serviceIdentifier: interfaces.ServiceIdentifier<any>) {
    Reflect.deleteMetadata(ScopeSymbol, serviceIdentifier)
    this.container.unbind(serviceIdentifier)
  }

  get<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>) {
    return this.container.get<T>(serviceIdentifier)
  }

  getNamed<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>, name: string | number | symbol) {
    return this.container.getNamed<T>(serviceIdentifier, name)
  }

  getScope<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>): Scope | undefined {
    return Reflect.getMetadata(ScopeSymbol, serviceIdentifier)
  }

  register<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>, scope: Scope): void {
    if (!this.container.isBoundNamed(serviceIdentifier, scope)) {
      this.bind(serviceIdentifier, scope).whenTargetNamed(scope)
    }
  }

  resolve<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>, scope: Scope): T {
    this.register(serviceIdentifier, scope)
    return this.getNamed(serviceIdentifier, scope)
  }
}

export const container = new Container()
const { lazyInjectNamed } = container.getDecorators()

export const Injectable = <T extends ConstructorOf<Service<any>>>() => (target: T): any => {
  injectable()(target)
}

export const Inject = <T extends ConstructorOf<Service<any>>>(
  serviceIdentifier: T,
  scope: Scope = ScopeTypes.Singleton,
) => {
  return (target: any, key: string) => {
    const decoratedInjectNames = Reflect.getMetadata(InjectSymbol, target.constructor) || []
    container.register(serviceIdentifier, scope)
    Reflect.defineMetadata(InjectSymbol, [...decoratedInjectNames, key], target.constructor)
    lazyInjectNamed(serviceIdentifier, scope as any)(target, key)
  }
}
