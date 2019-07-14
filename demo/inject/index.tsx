import React from 'react'
import ReactDOM from 'react-dom'
import './index.less'
import { useService, useServiceInstance } from '../../src'
import { CarService } from './car.service'

const Count: React.FC<{}> = () => {
  const [carState, , service] = useService(CarService)
  const [engine1] = useServiceInstance(service.engine1)
  const [engine2] = useServiceInstance(service.engine2)
  const [engine3] = useServiceInstance(service.engine3)

  return (
    <div className="container">
      <div className="car">{carState.name}</div>
      <div className="engine">
        {engine1.name}, speed: {engine1.speed}
      </div>
      <div className="engine">
        {engine2.name}, speed: {engine2.speed}
      </div>
      <div className="engine">
        {engine3.name}, speed: {engine3.speed}
      </div>
    </div>
  )
}

ReactDOM.render(<Count />, document.getElementById('app'))
