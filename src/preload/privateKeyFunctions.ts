import crypto from 'crypto'

export function encryptPrivateKey(
  privateKeyPem: string,
  password: string
): {
  ciphertext: string
  iv: string
  salt: string
  tag: string
} {
  const salt = crypto.randomBytes(16)
  const key = crypto.pbkdf2Sync(password, salt, 100_000, 32, 'sha256') // AES-256
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(privateKeyPem, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    salt: salt.toString('base64'),
    tag: tag.toString('base64')
  }
}

export function decryptPrivateKey(encryptedObj: any, password: string): string {
  const key = crypto.pbkdf2Sync(
    Buffer.from(password),
    Buffer.from(encryptedObj.salt, 'base64'),
    100_000,
    32,
    'sha256'
  )
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(encryptedObj.iv, 'base64')
  )
  decipher.setAuthTag(Buffer.from(encryptedObj.tag, 'base64'))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedObj.ciphertext, 'base64')),
    decipher.final()
  ])
  return decrypted.toString('utf8')
}
