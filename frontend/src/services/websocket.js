class ChatWebSocket {
  constructor() {
    this.ws = null
    this.listeners = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.isConnected = false
  }

  connect(token) {
    if (this.ws?.readyState === WebSocket.OPEN) return

    const base = import.meta.env.VITE_API_URL || ''
    const protocol = base.startsWith('https') ? 'wss:' : 'ws:'
    const host = base.replace(/^https?:\/\//, '')
    const url = host ? `${protocol}//${host}/ws/chat?token=${token}` : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/chat?token=${token}`
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.isConnected = true
      this.reconnectAttempts = 0
      this.emit('connected')
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.emit(data.type, data.data)
      } catch (e) {
        console.error('WS parse error:', e)
      }
    }

    this.ws.onclose = () => {
      this.isConnected = false
      this.emit('disconnected')
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        setTimeout(() => this.connect(token), 2000 * this.reconnectAttempts)
      }
    }

    this.ws.onerror = () => {
      this.isConnected = false
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
  }

  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  sendMessage(toUniqueId, content) {
    this.send({ type: 'dm_send', to_unique_id: toUniqueId, content })
  }

  sendCommunityMessage(communityId, content) {
    this.send({ type: 'community_send', community_id: communityId, content })
  }

  sendTyping(chatType, chatId) {
    this.send({ type: 'typing', chat_type: chatType, chat_id: chatId })
  }

  requestHistory(chatType, chatId, page = 1) {
    this.send({ type: 'history', chat_type: chatType, chat_id: chatId, page })
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
    return () => this.off(event, callback)
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      this.listeners.set(event, callbacks.filter(cb => cb !== callback))
    }
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(cb => cb(data))
    }
  }
}

const chatWS = new ChatWebSocket()
export default chatWS
