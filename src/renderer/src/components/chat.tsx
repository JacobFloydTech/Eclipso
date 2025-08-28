import { Message } from '@renderer/env'
import { useEffect, useState } from 'react'

export default function Chat({
  username,
  ownName,
  messages,
  setMessages
}: {
  username: string
  ownName: string
  messages: Array<Message>
  setMessages: React.Dispatch<React.SetStateAction<Array<Message>>>
}): JSX.Element {
  const [message, setMessage] = useState('')

  const [decryptedKey, setDecryptedKey] = useState('')
  const [ws, setWs] = useState<WebSocket | null>(null)
  const getChatKey = async (): Promise<void> => {
    const key = await window.api.getChatAESKey(username, ownName)
    connectToWebsocketServer(key)
    setDecryptedKey(key)
  }
  const getMessages = async (): Promise<void> => {
    const data = await window.api.getMessages(ownName, username)
    setMessages(data)
    setTimeout(() => {
      const container = document.getElementById('messagelist')
      if (container) container.scrollTo({ behavior: 'smooth', top: container.scrollHeight })
    }, 10)
  }
  const connectToWebsocketServer = (key): void => {
    const ws = new WebSocket('http://localhost:8080')
    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ type: 'connect', username: ownName }))
      setWs(ws)
      console.log('WS has connected')
    })
    ws.addEventListener('close', () =>
      ws.send(JSON.stringify({ type: 'disconnect', username: ownName }))
    )
    ws.addEventListener('message', async (event) => {
      const data = JSON.parse(event.data)
      console.log(event.data)
      const iv = data.senderUsername == username ? data.senderIV : data.recieverIV
      const output = await window.api.onMessageDecrypt(iv, data.encryptedMessage, key, ownName)
      if (output == null) return
      setMessages((m) => [...m, { ...data, encryptedMessage: output }])
    })
  }

  const sendMessage = (click: boolean, key?: string): void => {
    const condition = !click ? key === 'Enter' && message.trim() !== '' : message.trim() !== ''
    if (condition) {
      window.api.sendMessage(message, ownName, username, decryptedKey).then((res) => {
        if (res && ws) {
          const { userMessage, encryptedMessage } = res
          setMessages((m) => [...m, userMessage])
          ws.send(JSON.stringify({ ...encryptedMessage, type: 'message' }))
        }
        setMessage('')
      })
    }
  }
  useEffect(() => {
    getMessages()
    getChatKey()
    document.addEventListener('keypress', (e) => {
      if (e.key == 'Enter' && message != '') {
        console.log('Sending  message')
        window.api.sendMessage(message, ownName, username, decryptedKey)
        setMessage('')
      }
    })
  }, [])
  useEffect(() => {
    const container = document.getElementById('messagelist')
    if (container) {
      container.scrollTo({ behavior: 'smooth', top: container.scrollHeight })
    }
  }, [messages])

  return (
    <div className="flex relative bg-[#202024] text-gray-200 w-full overflow-auto flex-col h-full">
      <div id="messagelist" className="flex-1  mr-2 overflow-y-scroll text-white px-2">
        <h2 className="text-center w-full italic mt-12 mb-4 text-gray-500 ">
          Chatting with {username}
        </h2>
        {messages.map((e, i) => (
          <MessageComponent messages={messages} key={i} index={i} username={ownName} message={e} />
        ))}
      </div>
      <div className="p-2 bg-[rgba(100,100,100,0.1)] flex items-center justify-center">
        <div className=" border-gray-700 border-2  flex items-center rounded-xl w-full max-w-2xl px-2">
          <input
            value={message}
            onKeyDown={({ key }) => sendMessage(false, key)}
            onChange={(e) => setMessage(e.target.value)}
            className="bg-transparent flex-1  px-4 py-2 outline-none text-lg"
            placeholder="Send message here"
          />
          <button
            className="bg-[#5765f2] outline-none rounded-md p-1 my-1"
            onClick={() => sendMessage(true)}
          >
            <Enter />
          </button>
        </div>
      </div>
    </div>
  )
}

function MessageComponent({
  index,
  message,
  username,
  messages
}: {
  index: number
  message: Message
  username: string
  messages: Message[]
}): JSX.Element {
  const [time, setTime] = useState('')
  const timeVisible =
    index === 0 ||
    (new Date(messages[index].time).getTime() - new Date(messages[index - 1].time).getTime()) /
      1000 >
      120

  const getHumanDate = (): string => {
    const date = new Date(message.time)
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
    setTime(getHumanDate())
    setInterval(() => {
      setTime(getHumanDate())
    }, 100 * 60)
  }, [])
  return (
    <div
      className={`w-full relative flex m-[4px] ${
        message.receiverUsername == username ? 'justify-start' : 'justify-end'
      } `}
    >
      <div className="max-w-[60%] flex flex-col  ">
        <h1
          className={`relative break-all text-lg 2xl:text-xl w-fit inline-block px-2 py-1 rounded-xl text-black
      ${
        message.receiverUsername === username
          ? 'bg-blue-400 self-start mr-auto' // message from them → left side
          : 'bg-green-400 self-end ml-auto' // message from me → right side
      }`}
        >
          {message.encryptedMessage}
        </h1>

        {timeVisible && <p className="text-[10px] text-gray-500 mt-1">{time}</p>}
      </div>
    </div>
  )
}
function Enter(): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      height={'32'}
      width={'32'}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 7V8.2C20 9.88016 20 10.7202 19.673 11.362C19.3854 11.9265 18.9265 12.3854 18.362 12.673C17.7202 13 16.8802 13 15.2 13H4M4 13L8 9M4 13L8 17"
        stroke="#000000"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </svg>
  )
}
