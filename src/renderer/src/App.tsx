import { useEffect, useState } from 'react'
import BaseForm from './components/forms'
import Homepage from './components/homepage'

export default function App(): JSX.Element {
  const [login, setLogin] = useState<undefined | null | string>(undefined)

  useEffect(() => {
    const result = window.api.checkLogin()
    setLogin(result)
  }, [])
  if (login === undefined) {
    return <div>Loading....</div>
  }
  return login !== null ? (
    <Homepage login={login} setLogin={setLogin} />
  ) : (
    <div>
      <BaseForm setLogin={setLogin} />
    </div>
  )
}
