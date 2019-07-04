import { Container as InversifyContainer, interfaces, injectable } from 'inversify'
import { ScopeSymbol } from './symbols'
import { ConstructorOf } from './types'
import { Service } from './service'

export enum ScopeTypes {
  Singleton = 'singleton',
  Transient = 'transient',
  Request = 'request',
}

export default class Container {
  private container: InversifyContainer
  constructor(container?: InversifyContainer) {
    this.container = container || new InversifyContainer()
  }

  bind<T>(
    // serviceIdentifier: interfaces.ServiceIdentifier<T>,
    constructor: { new (...args: []): T },
    scope: ScopeTypes = ScopeTypes.Singleton,
  ): interfaces.BindingWhenOnSyntax<T> {
    const binding = this.container.bind<T>(constructor).toSelf()
    Reflect.defineMetadata(ScopeSymbol, scope, constructor)
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

  bindProvider<T>(constructor: { new (...args: []): T }, fn: interfaces.ProviderCreator<T>) {
    const binding = this.container.bind<T>(constructor).toProvider<T>(fn)
    Reflect.defineMetadata(ScopeSymbol, ScopeTypes.Singleton, constructor)
    return binding
  }

  unbind(serviceIdentifier: interfaces.ServiceIdentifier<any>) {
    Reflect.deleteMetadata(ScopeSymbol, serviceIdentifier)
    this.container.unbind(serviceIdentifier)
  }

  get<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>) {
    return this.container.get<T>(serviceIdentifier)
  }

  getScope<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>): ScopeTypes | undefined {
    return Reflect.getMetadata(ScopeSymbol, serviceIdentifier)
  }
}

export const container = new Container()

export const Injectable = <T extends ConstructorOf<Service<any>>>(scope?: ScopeTypes) => (
  target: T,
): any => {
  const injectableTarget = injectable()(target)
  container.bind<T>(injectableTarget, scope)
}

// export const Inject = <T extends ConstructorOf<Service<S>>, S>(serviceIdentifier: T) => {
//   return (target: any, key: string, index?: number) => {
//     const decoratedInjectNames = Reflect.getMetadata(InjectSymbol, target.constructor) || []
//     Reflect.defineMetadata(InjectSymbol, [...decoratedInjectNames, key], target.constructor)

//     inject(serviceIdentifier)(target, key, index)
//   }
// }

// export function Inject(serviceIdentifier:) {
//   return (target: any, key: string) => {
//       const generatedId = id || keyToId(key);

//       const getter = () => {
//           return container.get(generatedId);
//       };

//       Reflect.deleteProperty[key];
//       Reflect.defineProperty(target, key, {
//           get: getter,
//       });
//   };
// }
