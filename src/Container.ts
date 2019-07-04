import { Container as InversifyContainer, interfaces } from 'inversify'
import { ScopeSymbol } from './symbols'

export enum ScopeTypes {
  Singleton = 'singleton',
  Transient = 'transient',
  Request = 'request',
}

export class Container {
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

  unbind(serviceIdentifier: interfaces.ServiceIdentifier<any>) {
    Reflect.deleteMetadata(ScopeSymbol, serviceIdentifier)
    this.container.unbind(serviceIdentifier)
  }
  get<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>) {
    return this.container.get<T>(serviceIdentifier)
  }
}

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
