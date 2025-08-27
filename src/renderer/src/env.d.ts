/// <reference types="vite/client" />

export interface User {
  username: string
  password: string
  sentMessages: Message[]
  receivedMessages: Message[]
  friendsSent: Friendship[]
  friendsReceived: Friendship[]
  publicKey: string
  Icon: string
}

export interface Message {
  id: number
  senderUsername: string
  sender?: User
  receiverUsername: string
  receiver?: User
  encryptedMessage: string
  time: Date
  senderIV: string
  recieverIV: string
}

export interface Friendship {
  id?: number
  senderUsername: string
  receiverUsername: string
  sender?: User
  receiver?: User
  createdAt: Date
  accepted: boolean
  Message: Message[]
  senderEncryptedKey: string
  recieverEncryptedKey: string
}

interface ImportMetaEnv {
  readonly VITE_SERVER_ADDRESS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
