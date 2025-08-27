import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import SearchUsers from './searchUsers'
import Chat from './chat'
import HoverAdd from './hoverAdd'
import { Message } from '@renderer/env'

type ShortFriend = { username: string; publicKey: string; Icon: string }

export default function Homepage({
  setLogin,
  login
}: {
  setLogin: Dispatch<SetStateAction<undefined | null | string>>
  login: string
}): JSX.Element {
  const [messages, setMessages] = useState<Array<Message>>([])
  const [chat, setChat] = useState<null | ShortFriend>(null)
  const [friends, setFriends] = useState<Array<ShortFriend>>([])
  const [icon, setIcon] = useState('')
  const [hoverAdd, setHoverAdd] = useState(false)
  const loadFriends = async (): Promise<void> => {
    const friendships = await window.api.getFriends(login)
    setFriends(friendships)
  }
  const loadImage = async (): Promise<void> => {
    const image = await window.api.getUserImage(login)
    setIcon(image)
  }

  useEffect(() => {
    loadImage()
    loadFriends()
    document.addEventListener('keydown', ({ key }) => {
      if (key == 'Escape') setHoverAdd(false)
    })
  }, [])
  return (
    <div className="w-full grid h-auto lg:grid-cols-[25%_75%] xl:grid-cols-[15%_85%] grid-cols-[30%_70%]">
      <div className="border-r-black border-r-2">
        <div className="flex h-[calc(100vh-10px)] flex-col justify-between">
          <div className="h-auto overflow-y-scroll">
            <h1 className="text-2xl mb-4 m-2 text-center font-semibold">
              <div className="flex w-full justify-center space-x-2 mb-4 items-center">
                <p>Eclipso</p>
                <Lock />
              </div>
              <button
                onClick={() => {
                  setChat(null)
                  setTimeout(() => document.getElementById('searchInput')?.focus())
                }}
                className="rounded-full  text-base border-2 border-white px-2 py-1"
              >
                Add Users
              </button>
              <input
                className="outline-none mt-2 border-b-transparent border-b-2 focus:border-b-gray-100 w-full text-sm 2xl:text-lg px-4 py-2 bg-[rgba(100,100,100,0.2)] "
                placeholder="🔎  Search contacts"
              />
            </h1>
            {friends.map((f, i) => {
              return (
                <FriendComponent
                  chat={chat}
                  setMessages={setMessages}
                  messages={messages}
                  login={login}
                  setChat={setChat}
                  friend={f}
                  key={i}
                />
              )
            })}
          </div>
          <div className="flex justify-center items-center space-x-4">
            <img className="w-4 h-4 md:h-8 md:w-8 xl:h-10 xl:w-10 2xl:w-12 2xl:h-12" src={icon} />
            <h2>{login}</h2>
            <button
              className="z-50 h-14 w-14"
              onClick={() => {
                window.api.logout(login)
                setLogin(null)
              }}
            >
              <Logout />
            </button>
          </div>
        </div>
      </div>
      {chat ? (
        <Chat
          messages={messages}
          setMessages={setMessages}
          ownName={login}
          username={chat.username}
        />
      ) : (
        <SearchUsers username={login} />
      )}
      {hoverAdd && <HoverAdd username={login} />}
    </div>
  )
}

const FriendComponent = ({
  chat,
  friend,
  setChat,
  login,
  messages,
  setMessages
}: {
  chat: ShortFriend | null
  friend: ShortFriend
  setChat: React.Dispatch<React.SetStateAction<ShortFriend | null>>
  login: string
  messages: Array<Message>
  setMessages: React.Dispatch<React.SetStateAction<Array<Message>>>
}): JSX.Element => {
  const [lastMessage, setLastMessage] = useState<Message | null>()
  const getLastMessage = async (): Promise<void> => {
    const response = await window.api.getLastMessage(login, friend.username)
    if (!response) return
    const maxResponse = response.encryptedMessage.substring(0, 15)
    if (response.encryptedMessage.length > 15) {
      response.encryptedMessage = maxResponse + '...'
    } else {
      response.encryptedMessage = maxResponse
    }
    setLastMessage(response)
  }
  const getHumanDate = (t): string => {
    if (!t) return ''
    const date = new Date(t)
    const diffMs = Date.now() - date.getTime() // difference in milliseconds

    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)

    if (diffSeconds < 60) {
      return 'Just now'
    } else if (diffMinutes < 60) {
      const sMinutes = diffMinutes == 1 ? '' : 's'
      return `${diffMinutes} minute${sMinutes} ago`
    } else if (diffHours < 24) {
      const sHours = diffHours == 1 ? '' : 's'
      return `${diffHours} hour${sHours} ago`
    } else {
      return `${date.toLocaleTimeString()} ${date.toLocaleDateString()}`
    }
  }
  useEffect(() => {
    getLastMessage()
  }, [messages, setMessages])
  return (
    <div
      className="text-gray-100 w-full relative  hover:bg-[rgba(255,255,255,0.1)] flex cursor-pointer items-center text-2xl px-2 py-1 "
      onClick={() => {
        setChat(friend)
      }}
    >
      {chat?.publicKey == friend.publicKey && (
        <div className="absolute h-2/3 left-0 top-1/2 -translate-y-1/2 w-1 bg-blue-400 rounded-r-lg" />
      )}
      <img className="rounded-full w-8 h-8 2xl:h-12 2xl:w-12 mr-4" src={`${friend.Icon}`} />
      <div className="w-full">
        <h2 className="text-base 2xl:text-lg">{friend.username}</h2>
        <div className="flex  justify-between items-center">
          <p className="text-sm 2xl:text-base text-gray-400 italic">
            {lastMessage?.encryptedMessage}
          </p>
          <p className="text-[8px] 2xl:text-sm float-right">{getHumanDate(lastMessage?.time)}</p>
        </div>
      </div>
    </div>
  )
}

export function Lock(): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-8 h-8 aspect-square"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
      <g id="SVGRepo_iconCarrier">
        {' '}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M5.25 10.0546V8C5.25 4.27208 8.27208 1.25 12 1.25C15.7279 1.25 18.75 4.27208 18.75 8V10.0546C19.8648 10.1379 20.5907 10.348 21.1213 10.8787C22 11.7574 22 13.1716 22 16C22 18.8284 22 20.2426 21.1213 21.1213C20.2426 22 18.8284 22 16 22H8C5.17157 22 3.75736 22 2.87868 21.1213C2 20.2426 2 18.8284 2 16C2 13.1716 2 11.7574 2.87868 10.8787C3.40931 10.348 4.13525 10.1379 5.25 10.0546ZM6.75 8C6.75 5.10051 9.10051 2.75 12 2.75C14.8995 2.75 17.25 5.10051 17.25 8V10.0036C16.867 10 16.4515 10 16 10H8C7.54849 10 7.13301 10 6.75 10.0036V8Z"
          fill="white"
        ></path>{' '}
      </g>
    </svg>
  )
}

function Logout(): JSX.Element {
  return (
    <svg
      fill="#000000"
      className="w-full h-full border-2 rounded-full border-gray-400"
      version="1.1"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="50 25 350 350"
      enableBackground="new 0 0 500 500"
      xmlSpace="preserve"
    >
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
      <g id="SVGRepo_iconCarrier">
        {' '}
        <g>
          {' '}
          <path d="M250,224c-4.4,0-8,3.6-8,8v24c0,4.4-3.6,8-8,8h-40c-4.4,0-8-3.6-8-8V144c0-4.4,3.6-8,8-8h40c4.4,0,8,3.6,8,8v24 c0,4.4,3.6,8,8,8s8-3.6,8-8v-24c0-13.2-10.8-24-24-24h-40c-13.2,0-24,10.8-24,24v112c0,13.2,10.8,24,24,24h40c13.2,0,24-10.8,24-24 v-24C258,227.6,254.4,224,250,224z"></path>{' '}
          <path d="M328.4,204.8c0.1-0.1,0.2-0.2,0.3-0.3c0,0,0,0,0-0.1c0.1-0.2,0.2-0.4,0.3-0.6c0.1-0.3,0.3-0.5,0.4-0.8 c0.1-0.3,0.2-0.5,0.3-0.8c0.1-0.2,0.2-0.4,0.2-0.7c0.2-1,0.2-2.1,0-3.1c0,0,0,0,0,0c0-0.2-0.1-0.4-0.2-0.7 c-0.1-0.3-0.1-0.5-0.2-0.8c0,0,0,0,0,0c-0.1-0.3-0.3-0.5-0.4-0.8c-0.1-0.2-0.2-0.4-0.3-0.6c-0.3-0.4-0.6-0.9-1-1.2l-32-32 c-3.1-3.1-8.2-3.1-11.3,0c-3.1,3.1-3.1,8.2,0,11.3l18.3,18.3H210c-4.4,0-8,3.6-8,8s3.6,8,8,8h92.7l-18.3,18.3 c-3.1,3.1-3.1,8.2,0,11.3c1.6,1.6,3.6,2.3,5.7,2.3s4.1-0.8,5.7-2.3l32-32c0,0,0,0,0,0C327.9,205.4,328.1,205.1,328.4,204.8z"></path>{' '}
        </g>{' '}
      </g>
    </svg>
  )
}
