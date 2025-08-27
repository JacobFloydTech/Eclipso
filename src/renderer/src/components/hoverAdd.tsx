import { User } from '@renderer/env'
import { useEffect, useState } from 'react'

export default function HoverAdd({ username }: { username: string }): JSX.Element {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<User[]>([])

  const searchUsers = async (): Promise<void> => {
    if (!search) {
      setResults([])
      return
    }
    const users = await window.api.searchUsers(search, username, true)
    setResults(users)
  }
  useEffect(() => {
    searchUsers()
  }, [search, setSearch])
  return (
    <div
      className=" top-0 left-0 absolute z-50 w-full h-full flex items-center
     justify-center backdrop-blur-md"
    >
      <div className="bg-gray-600 h-1/2  w-1/2  absolute top-1/2 left-1/2 transform p-4  -translate-x-1/2 -translate-y-2/3  border-white rounded-xl border-4 flex flex-col">
        <h1 className="text-6xl p-4 text-center">Add someone new</h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-xl outline-none p-2 my-4 w-2/3 mx-auto"
          placeholder="Enter username here"
        />
        {results.map((user, i) => {
          return (
            <div className="flex mx-auto space-x-2 justify-center items-center" key={i}>
              <img className="w-12 h-12" src={user.Icon} />
              <p>{user.username}</p>
              <button className="bg-green-600 border-2 border-black px-4 py-2 rounded-2xl">
                Add
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
