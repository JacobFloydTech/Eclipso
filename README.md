# Eclipso

#### An end to end encryption open source application built using React, TypeScript, Prisma/SQL, WebSockets, Express, and Electron to bind it all together.

## How it works:

When you create an account, on your side you create and save a RSA pair to your hard drive. When you send a freind request to another user, you generate an AES-128 bit key that is then encrypted using the other user's Public Key, allowing for it to be sent across. The key is also encrypted using your own public key and both of these encrypted keys are stored in your friendship, as having the plain text AES key on your computer is a security risk. This AES key is then used for every message between the two users.

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```
