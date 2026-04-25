import { io } from 'socket.io-client'
import { API_BASE_URL } from './api'

export function createSupportSocket(token) {
  return io(API_BASE_URL, {
    transports: ['websocket'],
    auth: {
      token,
    },
  })
}

