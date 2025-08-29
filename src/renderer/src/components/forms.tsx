import { Dispatch, SetStateAction, useState } from 'react'
import { Lock } from './homepage'
export default function BaseForm({
  setLogin
}: {
  setLogin: Dispatch<SetStateAction<undefined | string | null>>
}): JSX.Element {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const createAccount = (): void => {
    if (!username || !password) return
    window.api
      .createAccount(username, password)
      .then((result) => {
        if (result == 'Created') return setLogin(username)
      })
      .catch(() => {
        setError(true)
      })
  }
  const login = (): void => {
    if (!username || !password) return
    window.api.loginAccount(username, password).then((status) => {
      if (status) {
        setLogin(username)
      }
      setError(true)
    })
  }
  return (
    <div className="overflow-hidden flex justify-center items-center text-white w-full  h-screen">
      <div className="bg-[#323338] w-1/4 z-50 h-auto rounded-2xl p-4 ">
        <div className="flex text-center flex-col">
          <div className="font-bold text-3xl flex items-center justify-center space-x-4">
            <p>Eclipso</p>
            <Lock />
          </div>
          <p className="text-base italic mt-4">Privacy for all</p>
          <div className="flex mt-2 flex-col">
            <div className="text-xs mt-2 text-left">
              {error ? (
                <div className="text-red-400 font-bold">
                  Email - <span className="italic font-normal">Login or password is invalid</span>
                </div>
              ) : (
                <div>
                  Email <span className="text-red-500">*</span>
                </div>
              )}
            </div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              className={`bg-[#28292d] mt-1 h-8 rounded-md w-full ${error ? 'outline outline-solid outline-red-400' : 'outline-blue-500 focus:outline focus:outline-solid'} px-2 py-4 border-[#3e3f44]`}
            />
            <div className="text-xs text-left mt-4">
              {error ? (
                <div className="text-red-400 font-bold">
                  Password -{' '}
                  <span className="italic font-normal">Login or password is invalid</span>
                </div>
              ) : (
                <div>
                  Password <span className="text-red-500">*</span>
                </div>
              )}
            </div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className={`bg-[#28292d] mt-1 h-8 rounded-md w-full ${error ? 'outline outline-solid outline-red-400' : 'outline-blue-500 focus:outline focus:outline-solid'} px-2 py-4 border-[#3e3f44]`}
            />
            <p className="text-left text-blue-300 text-sm mt-2 hover:underline cursor-pointer">
              Forgot your password?
            </p>
            <div className="flex space-x-4">
              <button
                onClick={login}
                className="text-white outline-blue-300 focus:outline focus:outline-solid outline-2 bg-[rgb(255,64,64)] w-full p-2 rounded-md my-2"
              >
                Log In
              </button>
              <button
                onClick={createAccount}
                className="text-white outline-blue-300 focus:outline focus:outline-solid outline-2 bg-[rgb(255,64,64)] w-full p-2 rounded-md my-2"
              >
                Sign Up
              </button>
            </div>
          </div>
          <div></div>
        </div>
      </div>
    </div>
  )
}
