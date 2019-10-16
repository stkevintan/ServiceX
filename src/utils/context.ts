import React from 'react'
import { Service } from '../service'
import { ConstructorOf } from '../types'

const map = new Map<ConstructorOf<Service<any>>, Service<any>>()
export const context = React.createContext(map)
