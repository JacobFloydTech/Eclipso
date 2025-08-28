import { useEffect, useState } from 'react'
import type { User } from '@renderer/env'

type friendStatus = 'NA' | 'sent' | 'recieved' | 'accepted' | undefined
export default function SearchUsers({ username }: { username: string }): JSX.Element {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<Array<User>>([])
  async function searchUsers(): Promise<undefined> {
    const users = await window.api.searchUsers(query, username)
    setUsers(users)
  }
  useEffect(() => {
    if (!query) return setUsers([])
    searchUsers()
  }, [query])
  return (
    <div className="w-full relative">
      <div className="w-2/3 left-1/2 -translate-x-1/2 top-[10%] absolute">
        <div className="w-full mb-4 border-b-2 pb-1 flex ">
          <input
            id="searchInput"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="px-2 py-1  w-full text-2xl placeholder:text-gray-300 text-gray-300 outline-none bg-transparent"
          />
          <button onClick={searchUsers} className="p-[5px] h-12  w-12">
            <SearchButton />
          </button>
        </div>
        {users.map((el) => {
          return <User sender={username} key={el.username} user={el} />
        })}
      </div>
    </div>
  )
}

const getTextFromRequestStatus = (s: friendStatus): string => {
  switch (s) {
    case 'NA':
      return 'Send request'
    case 'accepted':
      return 'Remove friend'
    case 'sent':
      return 'Cancel Request'
    default:
      return 'Loading'
  }
}

function User({ sender, user }: { sender: string; user: User }): JSX.Element {
  const [sentRequest, setSentRequest] = useState<friendStatus>(undefined)
  async function addFriend(): Promise<void> {
    window.api.addFriend(sender, user.username).then((res) => {
      if (res) setSentRequest('sent')
    })
  }
  async function checkFriendStatus(): Promise<void> {
    window.api.checkFriendRequest(sender, user.username).then((response) => {
      if (response) {
        if (response.accepted) {
          setSentRequest('accepted')
        } else {
          setSentRequest(response.senderUsername == sender ? 'sent' : 'recieved')
        }
      } else {
        setSentRequest('NA')
      }
    })
  }
  async function removeFriend(): Promise<void> {
    window.api.removeFriend(sender, user.username).then((response) => {
      if (response) setSentRequest('NA')
    })
  }
  async function acceptFriendRequest(): Promise<void> {
    window.api.acceptFriendRequest(sender, user.username).then((response) => {
      if (response) setSentRequest('accepted')
    })
  }

  const getClickFunction = (s: friendStatus): void => {
    if (s == 'NA') addFriend()
    if (s == 'sent' || s == 'accepted') removeFriend()
  }

  useEffect(() => {
    checkFriendStatus()
  }, [])
  return (
    <div className="flex items-center mb-4 rounded-xl  justify-between w-full mx-auto">
      <div className="flex space-x-2 items-center">
        <img className="w-10 xl:w-12 2xl:w-14 aspect-square" src={user.Icon} />
        <h1 className="text-2xl">{user.username}</h1>
      </div>
      {sentRequest == 'recieved' ? (
        <div className="flex">
          <button onClick={acceptFriendRequest} className="friendButtons bg-green-500">
            Accept
          </button>
          <button onClick={removeFriend} className="friendButtons bg-red-500">
            Decline
          </button>
        </div>
      ) : (
        <button
          className="border-2 border-blue-600 px-2 py-4 text-lg 3xl:text-xl rounded-md hover:scale-[1.02] transition-all duration-100"
          onClick={() => getClickFunction(sentRequest)}
        >
          {getTextFromRequestStatus(sentRequest)}
        </button>
      )}
    </div>
  )
}

export function SearchButton(): JSX.Element {
  return (
    <svg
      fill="#4b5563"
      version="1.1"
      id="Capa_1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 488.4 488.4"
      xmlSpace="preserve"
    >
      <path d="M0,203.25c0,112.1,91.2,203.2,203.2,203.2c51.6,0,98.8-19.4,134.7-51.2l129.5,129.5c2.4,2.4,5.5,3.6,8.7,3.6 s6.3-1.2,8.7-3.6c4.8-4.8,4.8-12.5,0-17.3l-129.6-129.5c31.8-35.9,51.2-83,51.2-134.7c0-112.1-91.2-203.2-203.2-203.2 S0,91.15,0,203.25z M381.9,203.25c0,98.5-80.2,178.7-178.7,178.7s-178.7-80.2-178.7-178.7s80.2-178.7,178.7-178.7 S381.9,104.65,381.9,203.25z"></path>{' '}
    </svg>
  )
}
