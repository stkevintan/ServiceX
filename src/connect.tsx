import * as React from 'react'

import { useService, UseServiceOptions } from './hooks'
import { Service } from './service'
import { ActionMethodOfService, ConstructorOf } from './types'

// type ConnectedComponent<P, S, A> = React.FC<Omit<P, keyof S | keyof A>>

// type ConnectComponent<P, S, A> = (Component: React.ComponentType<P>) => ConnectedComponent<P, S, A>

// export interface ComponentConnectedWithService<
//   M extends Service<any>,
//   S = M extends Service<infer SS> ? SS : never,
//   P
// > {
//   (): ConnectComponent<P,{}, {}>

//   <MS>(mapStateToProps: (state: S) => MS): ConnectComponent<MS, {}>

//   <MS, MA>(
//     mapStateToProps: (state: S) => MS,
//     mapActionsToProps: (actions: ActionMethodOfService<M, S>) => MA,
//   ): ConnectComponent<MS, MA>

//   <MA>(
//     mapStateToProps: null,
//     mapActionsToProps: (actions: ActionMethodOfService<M, S>) => MA,
//   ): ConnectComponent<{}, MA>
// }

export function createConnect<M extends Service<any>, S = M extends Service<infer SS> ? SS : never>(
  serviceIdentifier: ConstructorOf<M>,
  options?: UseServiceOptions,
) {
  return function connect<Props, SP = S, AP = ActionMethodOfService<M, S>>(
    Component: React.ComponentType<Props>,
    mapStateToProps?: (state: S) => SP,
    mapActionsToProps?: (actions: ActionMethodOfService<M, S>) => AP,
  ): React.FC<Omit<Props, keyof SP | keyof AP>> {
    return function ConnectedComponent(props) {
      const selector = React.useCallback((state: S) => {
        return mapStateToProps ? mapStateToProps(state) : state
      }, [])
      const [state, actions] = useService(serviceIdentifier, selector, options)
      const mappedAction = React.useMemo(() => {
        return mapActionsToProps ? mapActionsToProps(actions as any) : actions
      }, [actions])

      return <Component {...(state as any)} {...mappedAction} {...props} />
    }
  }
}
