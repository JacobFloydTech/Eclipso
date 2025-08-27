import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import forge from 'node-forge'
import { homedir } from 'os'
import fs from 'node:fs'
const rsa = forge.pki.rsa
import dotenv from 'dotenv'
import type { Message } from '@prisma/client'
import { Friendship, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
dotenv.config()
const home = homedir()
// Custom APIs for renderer
const api = {
  user: '',
  createUserDatabase: async (
    username: string,
    password: string,
    publicKey: string
  ): Promise<boolean> => {
    const existingUser = await prisma.user.findUnique({ where: { username } })
    if (existingUser) return false
    const newUser = await prisma.user.create({ data: { username, password, publicKey } })
    return newUser !== null
  },
  createAccount: (username: string, password: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const baseFolderPath = `${home}/anonchatapp`
      if (!fs.existsSync(baseFolderPath)) {
        fs.mkdirSync(baseFolderPath, { recursive: true })
      }
      if (fs.existsSync(`${home}/anonchatapp/${username}.json`)) reject('User exists')
      rsa.generateKeyPair({ bits: 2048, workers: -1 }, (error, kp) => {
        if (error) return reject('Error')
        const publicKey = forge.pki.publicKeyToPem(kp.publicKey)
        const privateKey = forge.pki.privateKeyToPem(kp.privateKey)
        api.createUserDatabase(username, password, publicKey).then((result) => {
          if (result) {
            fs.writeFileSync(
              `${home}/anonchatapp/${username}.json`,
              JSON.stringify({ publicKey, privateKey, login: true }),
              'utf-8'
            )
            resolve('Created')
          } else {
            reject('User exists')
          }
        })
      })
    })
  },
  loginDatabase: async (username: string, password: string): Promise<boolean> => {
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) return false
    if (user.password != password) return false
    return true
  },
  loginAccount: async (username: string, password: string): Promise<boolean> => {
    const path = `${home}/anonchatapp/${username}.json`
    const result = await api.loginDatabase(username, password)
    if (!result) return false
    const data = JSON.parse(fs.readFileSync(path, { encoding: 'utf-8' }))
    data.login = true
    api.user = username
    fs.writeFileSync(path, JSON.stringify(data), 'utf-8')
    return true
  },
  checkLogin: (): null | string => {
    try {
      const files = fs.readdirSync(`${home}/anonchatapp`)
      for (let i = 0; i < files.length; i++) {
        const data = JSON.parse(
          fs.readFileSync(`${home}/anonchatapp/${files[i]}`, { encoding: 'utf-8' })
        )
        if (data.login) {
          return files[i].split('.')[0]!
        }
      }
      return null
    } catch (error) {
      return null
    }
  },
  logout: (username: string): void => {
    try {
      const path = `${home}/anonchatapp/${username}.json`
      const data = JSON.parse(fs.readFileSync(path, { encoding: 'utf-8' }))
      data.login = false
      fs.writeFileSync(path, JSON.stringify(data))
    } catch (error) {
      return
    }
  },
  saveKeyLocally: (username: string, friend: string, key: string): void => {
    const path = `${home}/anonchatapp/${username}.json`
    const data = JSON.parse(fs.readFileSync(path, { encoding: 'utf-8' }))
    if (!data.friendships) {
      data.friendships = { [friend]: key }
    } else {
      data.friendships[friend] = key
    }
    fs.writeFileSync(path, JSON.stringify(data), { encoding: 'utf-8' })
  },
  getFriends: async (username: string): Promise<Array<any>> => {
    const users = (
      await prisma.friendship.findMany({
        where: {
          accepted: true,
          OR: [{ senderUsername: username }, { receiverUsername: username }]
        },
        select: {
          sender: { select: { username: true, publicKey: true, Icon: true } },
          receiver: { select: { username: true, publicKey: true, Icon: true } }
        }
      })
    ).map((f) => (f.receiver.username == username ? f.sender : f.receiver))
    console.log(users)
    return users
  },
  getPrivateKey: (): string => {
    const path = `${home}/anonchatapp/${api.user}.json`
    const data = JSON.parse(fs.readFileSync(path, { encoding: 'utf-8' }))
    return data.privateKey
  },
  getPrivateKeyUser: (username: string): string => {
    const path = `${home}/anonchatapp/${username}.json`
    const data = JSON.parse(fs.readFileSync(path, { encoding: 'utf-8' }))
    return data.privateKey
  },
  getUserImage: async (username: string): Promise<string> => {
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      return process.env['DEFAULT_ICON'] as string
    } else {
      return user.Icon as string
    }
  },
  getMessages: async (ownName: string, username: string): Promise<any[]> => {
    try {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { receiverUsername: ownName, senderUsername: username },
            { senderUsername: ownName, receiverUsername: username }
          ]
        },
        include: {
          Message: true,
          sender: { select: { Icon: true } },
          receiver: { select: { Icon: true } }
        }
      })

      if (!friendship) return []
      const messages = friendship.Message
      const pk = forge.pki.privateKeyFromPem(api.getPrivateKeyUser(ownName))
      const aesKey = forge.util.decode64(await api.getChatAESKey(username, ownName))
      const dMessages = messages.map((m) => {
        const iv = username == m.senderUsername ? m.senderIV : m.recieverIV
        const ivBytes = pk.decrypt(forge.util.decode64(iv))

        const encryptedBytes = forge.util.decode64(m.encryptedMessage)
        const decipher = forge.cipher.createDecipher('AES-CBC', aesKey)
        decipher.start({ iv: ivBytes })
        decipher.update(forge.util.createBuffer(encryptedBytes))
        decipher.finish()
        const output = decipher.output.toString()
        return {
          ...m,
          encryptedMessage: output,
          sender: friendship.sender,
          reciever: friendship.receiver
        }
      })
      console.log(dMessages[0])
      return dMessages
    } catch (error) {
      console.log(error)
      return []
    }
  },

  onMessageDecrypt: async (
    iv: string,
    message: string,
    aesKey: string,
    username: string
  ): Promise<string | null> => {
    try {
      const rawKey = forge.util.decode64(aesKey)

      const pk = forge.pki.privateKeyFromPem(await api.getPrivateKeyUser(username))

      const ivDecoded = forge.util.decode64(iv)
      const ivBytes = pk.decrypt(ivDecoded)
      console.log('Decrypted iv')
      const encryptedMessageBytes = forge.util.decode64(message)

      const decipher = forge.cipher.createDecipher('AES-CBC', rawKey)
      decipher.start({ iv: ivBytes })
      decipher.update(forge.util.createBuffer(encryptedMessageBytes))
      const success = decipher.finish()
      if (!success) throw new Error('Decryption failed')

      return decipher.output.toString()
    } catch (error) {
      console.error(error)
      return null
    }
  },
  searchUsers: async (
    query: string,
    username: string,
    doesNotExist?: boolean
  ): Promise<Array<any>> => {
    if (doesNotExist) {
      const users = await prisma.user.findMany({
        where: {
          username: {
            contains: query,
            not: username
          },
          AND: [
            {
              friendsReceived: {
                none: {
                  senderUsername: username
                }
              }
            },
            {
              friendsSent: {
                none: {
                  receiverUsername: username
                }
              }
            }
          ]
        }
      })

      return users
    } else {
      const users = await prisma.user.findMany({
        where: {
          username: {
            contains: query,
            not: { contains: username }
          }
        }
      })
      return users
    }
  },
  addFriend: async (sender: string, reciever: string): Promise<boolean> => {
    try {
      const senderPK = await prisma.user.findUnique({
        where: { username: sender },
        select: { publicKey: true }
      })
      const recieverPK = await prisma.user.findUnique({
        where: { username: reciever },
        select: { publicKey: true }
      })
      if (!senderPK || !recieverPK) return false
      const rpk = forge.pki.publicKeyFromPem(recieverPK.publicKey)
      const spk = forge.pki.publicKeyFromPem(senderPK.publicKey)
      const key = forge.random.getBytesSync(16)
      console.log(key)
      const senderEncryptedKey = forge.util.encode64(spk.encrypt(key))
      const recieverEncryptedKey = forge.util.encode64(rpk.encrypt(key))

      await prisma.friendship.create({
        data: {
          senderUsername: sender,
          receiverUsername: reciever,
          senderEncryptedKey,
          recieverEncryptedKey
        }
      })
      return true
    } catch (error) {
      return false
    }
  },
  checkFriendRequest: async (
    senderUsername: string,
    receiverUsername: string
  ): Promise<null | Friendship> => {
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderUsername: senderUsername, receiverUsername: receiverUsername },
          { senderUsername: receiverUsername, receiverUsername: senderUsername }
        ]
      }
    })
    return existingFriendship
  },
  removeFriend: async (senderUsername: string, receiverUsername: string): Promise<boolean> => {
    try {
      const f = await prisma.friendship.findFirst({
        where: {
          OR: [
            { senderUsername, receiverUsername },
            { senderUsername: receiverUsername, receiverUsername: senderUsername }
          ]
        },
        select: { id: true }
      })
      if (!f) throw new Error('Friendship not found')
      await prisma.message.deleteMany({
        where: { friendshipID: f.id }
      })
      await prisma.friendship.delete({
        where: { id: f.id }
      })
      return true
    } catch (error) {
      console.log(error)
      return false
    }
  },
  acceptFriendRequest: async (
    senderUsername: string,
    receiverUsername: string
  ): Promise<boolean> => {
    try {
      await prisma.friendship.updateMany({
        where: {
          OR: [
            { senderUsername, receiverUsername },
            { senderUsername: receiverUsername, receiverUsername: senderUsername }
          ]
        },
        data: { accepted: true }
      })
      return true
    } catch (error) {
      return false
    }
  },
  getChatAESKey: async (username, ownName): Promise<string> => {
    const privateKey = api.getPrivateKeyUser(ownName)
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderUsername: username, receiverUsername: ownName },
          { senderUsername: ownName, receiverUsername: username }
        ]
      }
    })
    if (!friendship) return ''
    const pk = forge.pki.privateKeyFromPem(privateKey)
    const key =
      friendship.senderUsername == ownName
        ? friendship.senderEncryptedKey
        : friendship.recieverEncryptedKey
    const plainAESkey = pk.decrypt(forge.util.decode64(key))
    const base64AES = forge.util.encode64(plainAESkey)

    return base64AES
  },
  sendMessage: async (
    message: string,
    ownName: string,
    username: string,
    aesKey: string
  ): Promise<any | null> => {
    try {
      const cipher = forge.cipher.createCipher('AES-CBC', forge.util.decode64(aesKey))
      const iv = forge.random.getBytesSync(16)
      cipher.start({ iv })
      cipher.update(forge.util.createBuffer(message))
      cipher.finish()
      const result = forge.util.encode64(cipher.output.getBytes())
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { senderUsername: username, receiverUsername: ownName },
            { receiverUsername: username, senderUsername: ownName }
          ]
        },
        include: {
          sender: true,
          receiver: true
        }
      })
      if (!friendship) return null
      const senderPK = forge.pki.publicKeyFromPem(
        friendship.sender.username == ownName
          ? friendship.receiver.publicKey
          : friendship.sender.publicKey
      )
      const recieverPK = forge.pki.publicKeyFromPem(
        friendship.receiver.username == username
          ? friendship.sender.publicKey
          : friendship.receiver.publicKey
      )

      const senderIV = forge.util.encode64(senderPK.encrypt(iv))
      const recieverIV = forge.util.encode64(recieverPK.encrypt(iv))
      const newMessage = {
        friendshipID: friendship.id,
        senderUsername: ownName,
        receiverUsername: username,
        encryptedMessage: result,
        senderIV,
        recieverIV,
        time: new Date()
      }

      return {
        userMessage: {
          ...newMessage,
          encryptedMessage: message
        },
        encryptedMessage: newMessage
      }
    } catch (error) {
      console.error(error)
      return null
    }
  },
  getLastMessage: async (username: string, friend: string): Promise<null | Message> => {
    const decryptedAESkey = await api.getChatAESKey(friend, username)
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderUsername: username, receiverUsername: friend },
          { senderUsername: friend, receiverUsername: username }
        ]
      },
      select: { Message: true }
    })
    const lastMessage = friendship?.Message.pop()

    console.log('LAST MESSAGE' + lastMessage?.encryptedMessage)
    if (!lastMessage) return null
    const iv =
      username != lastMessage.senderUsername ? lastMessage.senderIV : lastMessage.recieverIV
    const decryptedMessage = await api.onMessageDecrypt(
      iv,
      lastMessage.encryptedMessage,
      decryptedAESkey,
      username
    )
    if (!decryptedMessage) return null
    return { ...lastMessage, encryptedMessage: decryptedMessage }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
