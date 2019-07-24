import {
  interfaces,
  injectable,
  METADATA_KEY,
  inject,
  tagged,
  LazyServiceIdentifer,
} from 'inversify'
import { container, ScopeType } from './Container'
import { ConstructorOf } from '../types'
import { Service } from '../service'
import { ScopeSymbol, ScopeKeySymbol, Singleton } from '../symbols'

export const Scope = (scope: ScopeType) => {
  return (target: any, key: string, index?: number) => {
    const defineKey = typeof index === 'number' ? `${index}` : key
    Reflect.defineMetadata(ScopeSymbol, scope, target.constructor, defineKey)
  }
}

export const getScope = (target: any, key: string, index?: number) => {
  const defineKey = typeof index === 'number' ? `${index}` : key
  if (Reflect.hasMetadata(ScopeSymbol, target.constructor, defineKey)) {
    return Reflect.getMetadata(ScopeSymbol, target.constructor, defineKey)
  }
  return Singleton
}

const tagScope = (scope: ScopeType) => (target: any, key?: string, index?: number) => {
  if (typeof index !== 'number') {
    tagged(ScopeKeySymbol, scope)(target, key!, undefined)
    return
  }
  // 判重
  const metadata = Reflect.getMetadata(METADATA_KEY.TAGGED, target) || {}
  const taggedList = metadata[index] || []
  if (taggedList.every((tag: any) => tag.key !== ScopeKeySymbol)) {
    tagged(ScopeKeySymbol, scope)(target, undefined as any, index)
  }
}
const injectService = (service: any, target: any, key?: string, index?: number) => {
  if (service.prototype instanceof Service) {
    const scope = getScope(target, key || '', index)
    tagScope(scope)(target, key, index)
    container.registerInScope(service, scope)
  }
}

export const Injectable = <T extends ConstructorOf<Service<any>>>() => (target: T): any => {
  injectable()(target)
  const parameters = Reflect.getMetadata(METADATA_KEY.PARAM_TYPES, target)
  for (let index = 0; index < parameters.length; index++) {
    const parameter = parameters[index]
    // only auto inject service
    injectService(parameter, target, undefined, index)
  }
}

export const Inject = <T extends interfaces.ServiceIdentifier<any> | LazyServiceIdentifer<any>>(
  serviceIdentifier: T,
) => {
  return (target: any, key: string, index?: number) => {
    if (serviceIdentifier instanceof LazyServiceIdentifer) {
      const id = serviceIdentifier.unwrap()
      injectService(id, target, key, index)
    } else {
      injectService(serviceIdentifier, target, key, index)
    }
    inject(serviceIdentifier)(target, key, index)
  }
}
