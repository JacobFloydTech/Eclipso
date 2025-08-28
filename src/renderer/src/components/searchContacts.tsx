import { SearchButton } from './searchUsers'
import type { ShortFriend } from './homepage'
import React, { useEffect, useState } from 'react'

export default function SearchContacts({
  fullFriends,
  setFriends
}: {
  fullFriends: ShortFriend[]
  setFriends: React.Dispatch<React.SetStateAction<ShortFriend[]>>
}): JSX.Element {
  const [query, setQuery] = useState('')
  const filterUsers = async (): Promise<void> => {
    if (!query) {
      setFriends(fullFriends)
      return
    }
    setFriends(() => {
      const newFriends = fullFriends.filter(({ username }) => {
        return username.includes(query)
      })
      return newFriends
    })
  }
  useEffect(() => {
    filterUsers()
  }, [query, setQuery])
  return (
    <div className="flex items-center justify-center px-4 mt-2 w-full bg-[rgba(100,100,100,0.2)]">
      <div className="aspect-square w-6 ">
        <SearchButton />
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="outline-none border-b-transparent w-1/4 flex-grow text-sm 2xl:text-sm p-2 bg-transparent"
        placeholder="Search contacts..."
      />
    </div>
  )
}
