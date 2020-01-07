import React from 'react'
import ReactDOM from 'react-dom'
import { useService } from '../../src/index'
import { EntryService } from './entry-service'
import './index.less'
import { Entry } from './fetch-entries'

const Entries = ({ entries }: { entries: Entry[] }) => {
  if (entries.length) {
    return (
      <ul className="entries">
        {entries.map((entry) => (
          <li className="entry" key={entry.name}>
            <span>{entry.name}</span>
            <small>{entry.age}</small>
          </li>
        ))}
      </ul>
    )
  }
  return <p className="empty">Nothing found</p>
}

const App = () => {
  const [state, actions] = useService(EntryService, { resetOnUnmount: true })
  React.useEffect(() => {
    // load the entries on component mounted
    actions.loadEntries()
  }, [actions])

  return (
    <>
      <input
        className="search"
        value={state.keyword}
        onChange={(e) => actions.setKeyword(e.target.value)}
        placeholder="Enter keywords to search"
      />
      {state.loading ? <p className="loading">加载中...</p> : <Entries entries={state.entries} />}
      <button onClick={() => actions.reload$()}>刷新</button>
    </>
  )
}

ReactDOM.render(<App />, document.getElementById('app'))
