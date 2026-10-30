import { Client } from '@stomp/stompjs'

const API_URL = 'http://localhost:8080/api/chat'
const WS_URL = 'ws://localhost:8080/ws'

function getToken() {
  return (
    sessionStorage.getItem('hrms-token') ||
    localStorage.getItem('hrms-token') ||
    sessionStorage.getItem('token') ||
    localStorage.getItem('token')
  )
}

async function request(url, options = {}) {
  const token = getToken()

  if (!token) {
    throw new Error('Your session has expired. Please log in again.')
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed with status ${response.status}`
    )
  }

  return data
}

export function getChatMembers() {
  return request(`${API_URL}/members`)
}

export function getConversation(memberEmail) {
  return request(
    `${API_URL}/messages?memberEmail=${encodeURIComponent(memberEmail)}`
  )
}

export function sendChatMessage(recipientEmail, content) {
  return request(`${API_URL}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      recipientEmail,
      content,
    }),
  })
}

export function getUnreadCount(senderEmail) {
  return request(
    `${API_URL}/unread/${encodeURIComponent(senderEmail)}`
  )
}

export function connectChat(onMessage, onConnectionChange) {
  const token = getToken()

  if (!token) {
    throw new Error('Your session has expired. Please log in again.')
  }

  const client = new Client({
    brokerURL: WS_URL,
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    onConnect: () => {
      onConnectionChange?.(true)

      client.subscribe('/user/queue/chat', (frame) => {
        try {
          const message = JSON.parse(frame.body)
          onMessage?.(message)
        } catch {
          console.error('Unable to read incoming chat message.')
        }
      })
    },

    onStompError: (frame) => {
      onConnectionChange?.(false)
      console.error('Chat WebSocket error:', frame.headers?.message)
    },

    onWebSocketClose: () => {
      onConnectionChange?.(false)
    },

    onWebSocketError: () => {
      onConnectionChange?.(false)
    },
  })

  client.activate()

  return () => {
    onConnectionChange?.(false)
    client.deactivate()
  }
}