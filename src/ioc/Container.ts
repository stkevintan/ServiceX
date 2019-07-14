import { Container as InversifyContainer, interfaces } from 'inversify'
import { ScopeKeySymbol } from '../symbols'

export const ScopeTypes = {
  Singleton: Symbol('singleton'),
  Transient: Symbol('transient'),
  Request: Symbol('request'),
}

export type ScopeType = symbol | string | number

export default class Container {
  private container: InversifyContainer
  constructor(container?: InversifyContainer) {
    this.container = container || new InversifyContainer()
  }

  bind<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    scope: ScopeType = ScopeTypes.Singleton,
  ): interfaces.BindingWhenOnSyntax<T> {
    const binding = this.container.bind<T>(serviceIdentifier).toSelf()
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

  // bindProvider<T>(
  //   serviceIdentifier: interfaces.ServiceIdentifier<T>,
  //   fn: interfaces.ProviderCreator<T>,
  // ) {
  //   const binding = this.container.bind<T>(serviceIdentifier).toProvider<T>(fn)
  //   return binding
  // }

  unbind(serviceIdentifier: interfaces.ServiceIdentifier<any>) {
    this.container.unbind(serviceIdentifier)
  }

  // get<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>) {
  //   return this.container.get<T>(serviceIdentifier)
  // }

  getTagged<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    key: string | number | symbol,
    value: any,
  ) {
    return this.container.getTagged<T>(serviceIdentifier, key, value)
  }

  isBoundInScope<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>, scope: ScopeType): boolean {
    return this.container.isBoundTagged(serviceIdentifier, ScopeKeySymbol, scope)
  }
  register<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>, scope: ScopeType): void {
    if (!this.isBoundInScope(serviceIdentifier, scope)) {
      this.bind(serviceIdentifier, scope).whenTargetTagged(ScopeKeySymbol, scope)
    }
  }

  resolve<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>, scope: ScopeType): T {
    this.register(serviceIdentifier, scope)
    return this.getTagged(serviceIdentifier, ScopeKeySymbol, scope)
  }
}

export const container = new Container()
