let cachedWsUrl = null

class ChatWebSocket {
  constructor() {
    this.ws = null
    this.listeners = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.isConnected = false
    this.isAuthenticated = false
    this.pendingToken = null
    this.pendingMessages = []
    this.configPromise = null
  }

  async fetchWsUrl() {
    if (cachedWsUrl) return cachedWsUrl
    try {
      const base = import.meta.env.VITE_API_URL || ''
      const configUrl = base ? `${base}/app-config` : '/api/app-config'
      const res = await fetch(configUrl, { signal: AbortSignal.timeout(5000) })
      const config = await res.json()
      cachedWsUrl = config.ws_url
      return cachedWsUrl
    } catch {
      const host = window.location.host
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      return `${protocol}//${host}/ws/chat`
    }
  }

  async connect(token) {
    if (this.ws?.readyState === WebSocket.OPEN) return

    this.isAuthenticated = false
    this.pendingToken = token

    const url = await this.fetchWsUrl()
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.reconnectAttempts = 0
      this.ws.send(JSON.stringify({ type: 'auth', token: this.pendingToken }))
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'auth_ok') {
          this.isConnected = true
          this.isAuthenticated = true
          this.emit('connected')
          for (const msg of this.pendingMessages) {
            this.ws.send(JSON.stringify(msg))
          }
          this.pendingMessages = []
          return
        }
        this.emit(data.type, data.data)
      } catch (e) {
        console.error('WS parse error:', e)
      }
    }

    this.ws.onclose = () => {
      this.isConnected = false
      this.isAuthenticated = false
      this.emit('disconnected')
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        setTimeout(() => this.connect(this.pendingToken), 2000 * this.reconnectAttempts)
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
    this.isAuthenticated = false
    this.pendingMessages = []
  }

  send(data) {
    if (!this.isAuthenticated) {
      this.pendingMessages.push(data)
      return
    }
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
