import { useEffect, useRef, useState } from 'react'
import './RegisterPage.css'
import { api, clearToken, getToken, setToken } from '../../lib/api'
import { createSupportSocket } from '../../lib/supportSocket'

function RegisterPage() {
  const [mode, setMode] = useState('register')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [postTitle, setPostTitle] = useState('')
  const [postContent, setPostContent] = useState('')
  const [supportText, setSupportText] = useState('')
  const [supportMessages, setSupportMessages] = useState([])
  const [supportConnected, setSupportConnected] = useState(false)
  const [supportTicketStatus, setSupportTicketStatus] = useState('OPEN')
  const [staffTickets, setStaffTickets] = useState([])
  const [activeSupportUserId, setActiveSupportUserId] = useState(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const supportSocketRef = useRef(null)
  const isSupportStaff = user?.role === 'AGENT' || user?.role === 'ADMIN'

  const loadProtectedData = async () => {
    const [meData, postsData] = await Promise.all([api.auth.me(), api.posts.list()])

    setUser(meData.user)
    setPosts(postsData.posts)
  }

  useEffect(() => {
    if (!getToken()) {
      return
    }

    loadProtectedData().catch(() => {
      clearToken()
      setUser(null)
    })
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setStatus('')

    try {
      const data =
        mode === 'register'
          ? await api.auth.register({ username, email, password })
          : await api.auth.login({ email, password })

      setToken(data.token)
      await loadProtectedData()
      setStatus(mode === 'register' ? 'Регистрация успешна' : 'Вход выполнен')
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async (event) => {
    event.preventDefault()
    setStatus('')

    try {
      await api.posts.create({ title: postTitle, content: postContent })
      setPostTitle('')
      setPostContent('')
      await loadProtectedData()
      setStatus('Пост создан')
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleDeletePost = async (id) => {
    try {
      await api.posts.remove(id)
      await loadProtectedData()
      setStatus('Пост удалён')
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleLogout = () => {
    supportSocketRef.current?.disconnect()
    supportSocketRef.current = null
    setSupportConnected(false)
    setSupportMessages([])
    setSupportText('')
    setSupportTicketStatus('OPEN')
    setStaffTickets([])
    setActiveSupportUserId(null)
    clearToken()
    setUser(null)
    setPosts([])
    setStatus('Вы вышли из аккаунта')
  }

  useEffect(() => {
    if (!user) return

    const token = getToken()
    if (!token) return

    const socket = createSupportSocket(token)
    supportSocketRef.current = socket

    socket.on('connect', () => {
      if (isSupportStaff) {
        setSupportConnected(true)
        socket.emit('support:staff:subscribe', (ack) => {
          if (!ack?.ok) return
          setStaffTickets(ack.tickets ?? [])
        })
        return
      }

      socket.emit('support:join', (ack) => {
        if (!ack?.ok) {
          setStatus(ack?.error ?? 'Не удалось подключиться к чату поддержки')
          return
        }
        setSupportMessages(ack.history ?? [])
        setSupportTicketStatus(ack.ticketStatus ?? 'OPEN')
        setActiveSupportUserId(ack.userId)
        setSupportConnected(true)
      })
    })

    socket.on('disconnect', () => {
      setSupportConnected(false)
    })

    socket.on('connect_error', () => {
      setStatus('Ошибка подключения к чату поддержки')
      setSupportConnected(false)
    })

    socket.on('support:message:new', (message) => {
      setSupportMessages((prev) => [...prev, message])
    })

    socket.on('support:ticket:status', (payload) => {
      setSupportTicketStatus(payload?.status ?? 'OPEN')
    })

    socket.on('support:ticket:upsert', (ticket) => {
      setStaffTickets((prev) => {
        const filtered = prev.filter((item) => item.userId !== ticket.userId)
        return [ticket, ...filtered]
      })
    })

    socket.on('support:ticket:closed', ({ userId }) => {
      setStaffTickets((prev) => prev.filter((item) => item.userId !== userId))
      setSupportTicketStatus('CLOSED')
    })

    return () => {
      socket.disconnect()
      supportSocketRef.current = null
      setSupportConnected(false)
    }
  }, [isSupportStaff, user])

  const handleAgentJoin = (userId) => {
    const socket = supportSocketRef.current

    if (!socket || !supportConnected) {
      setStatus('Чат поддержки недоступен')
      return
    }

    socket.emit('support:agent:join', { userId }, (ack) => {
      if (!ack?.ok) {
        setStatus(ack?.error ?? 'Не удалось подключиться к обращению')
        return
      }
      setSupportMessages(ack.history ?? [])
      setSupportTicketStatus(ack.ticketStatus ?? 'OPEN')
      setActiveSupportUserId(ack.userId)
      setStatus(`Открыто обращение пользователя #${ack.userId}`)
    })
  }

  const handleSendSupportMessage = async (event) => {
    event.preventDefault()
    const socket = supportSocketRef.current

    if (!socket || !supportConnected) {
      setStatus('Чат поддержки недоступен')
      return
    }
    if (!activeSupportUserId) {
      setStatus(isSupportStaff ? 'Сначала выберите обращение из списка' : 'Чат поддержки недоступен')
      return
    }
    if (supportTicketStatus === 'CLOSED') {
      setStatus('Обращение уже закрыто')
      return
    }

    const text = supportText.trim()
    if (!text) return

    socket.emit('support:message:send', { text }, (ack) => {
      if (!ack?.ok) {
        setStatus(ack?.error ?? 'Не удалось отправить сообщение')
        return
      }

      setSupportText('')
    })
  }

  const handleCloseTicket = () => {
    const socket = supportSocketRef.current
    if (!socket || !supportConnected) {
      setStatus('Чат поддержки недоступен')
      return
    }
    if (!isSupportStaff) {
      setStatus('Пользователь не может закрыть обращение')
      return
    }
    if (!activeSupportUserId) {
      setStatus('Сначала выберите обращение из списка')
      return
    }

    socket.emit('support:ticket:close', { userId: activeSupportUserId }, (ack) => {
      if (!ack?.ok) {
        setStatus(ack?.error ?? 'Не удалось закрыть обращение')
        return
      }
      setSupportTicketStatus('CLOSED')
      setStatus(`Обращение #${activeSupportUserId} закрыто`)
    })
  }

  const handleCreateTicket = () => {
    const socket = supportSocketRef.current
    if (!socket || !supportConnected) {
      setStatus('Чат поддержки недоступен')
      return
    }
    if (isSupportStaff) return

    socket.emit('support:ticket:create', (ack) => {
      if (!ack?.ok) {
        setStatus(ack?.error ?? 'Не удалось создать обращение')
        return
      }

      setSupportMessages(ack.history ?? [])
      setSupportTicketStatus(ack.ticketStatus ?? 'OPEN')
      setActiveSupportUserId(ack.userId)
      setSupportText('')
      setStatus('Новое обращение создано')
    })
  }

  if (user) {
    return (
      <div className="register-page">
        <div className="register-card register-card--wide">
          <div className="register-header register-header--row">
            <div>
              <h1 className="register-title">Личный кабинет</h1>
              <p className="register-subtitle">
                {user.username} ({user.email}) - {user.role}
              </p>
            </div>
            <button type="button" className="register-button register-button--secondary" onClick={handleLogout}>
              Выйти
            </button>
          </div>

          {status ? <p className="register-status">{status}</p> : null}

          <div className="register-grid">
            <section className="register-section">
              <h2 className="register-section-title">Посты</h2>
              {isSupportStaff ? (
                <p className="register-chat-empty">Агенты и админы не могут создавать посты.</p>
              ) : (
                <form className="register-form" onSubmit={handleCreatePost}>
                  <input
                    type="text"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    required
                    className="register-input"
                    placeholder="Заголовок поста"
                  />
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    className="register-input register-textarea"
                    placeholder="Текст поста"
                  />
                  <button type="submit" className="register-button">
                    Создать пост
                  </button>
                </form>
              )}

              <div className="register-list">
                {posts.map((post) => (
                  <article key={post.id} className="register-item">
                    <strong>{post.title}</strong>
                    <p>{post.content || 'Без описания'}</p>
                    <span>Автор: {post.author.username}</span>
                    {post.author.id === user.id ? (
                      <button
                        type="button"
                        className="register-button register-button--danger"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        Удалить
                      </button>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>

            <section className="register-section">
              <h2 className="register-section-title">Чат поддержки</h2>
              <p className="register-chat-status">
                {supportConnected ? 'Подключено к support-сокету' : 'Подключение к поддержке...'}
              </p>
              <p className="register-chat-status">Статус обращения: {supportTicketStatus}</p>
              {!isSupportStaff && supportTicketStatus === 'CLOSED' ? (
                <button
                  type="button"
                  className="register-button register-button--new-ticket"
                  onClick={handleCreateTicket}
                  disabled={!supportConnected}
                >
                  Создать обращение
                </button>
              ) : null}

              {isSupportStaff ? (
                <div className="register-ticket-list">
                  {staffTickets.length === 0 ? (
                    <p className="register-chat-empty">Пока нет новых обращений</p>
                  ) : (
                    staffTickets.map((ticket) => (
                      <button
                        key={ticket.userId}
                        type="button"
                        className={`register-ticket-item ${activeSupportUserId === ticket.userId ? 'register-ticket-item--active' : ''}`}
                        onClick={() => handleAgentJoin(ticket.userId)}
                      >
                        <strong>Обращение #{ticket.userId}</strong>
                        <span>{ticket.lastMessage}</span>
                      </button>
                    ))
                  )}
                </div>
              ) : null}

              <div className="register-chat-list">
                {supportMessages.length === 0 ? (
                  <p className="register-chat-empty">Пока нет сообщений</p>
                ) : (
                  supportMessages.map((message) => (
                    <article
                      key={message.id}
                      className={`register-chat-item register-chat-item--${message.senderType}`}
                    >
                      <strong>{message.senderLabel}</strong>
                      <p>{message.text}</p>
                    </article>
                  ))
                )}
              </div>

              <form className="register-form" onSubmit={handleSendSupportMessage}>
                <textarea
                  value={supportText}
                  onChange={(e) => setSupportText(e.target.value)}
                  className="register-input register-textarea"
                  placeholder={
                    isSupportStaff
                      ? 'Ответ агентa...'
                      : 'Опишите вашу проблему...'
                  }
                  disabled={!supportConnected || !activeSupportUserId || supportTicketStatus === 'CLOSED'}
                />
                <div className="register-actions">
                  <button
                    type="submit"
                    className="register-button"
                    disabled={!supportConnected || !activeSupportUserId || supportTicketStatus === 'CLOSED'}
                  >
                    Отправить
                  </button>
                  {isSupportStaff ? (
                    <button
                      type="button"
                      className="register-button register-button--danger"
                      onClick={handleCloseTicket}
                      disabled={!activeSupportUserId || supportTicketStatus === 'CLOSED'}
                    >
                      Закрыть обращение
                    </button>
                  ) : null}
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-header">
          <h1 className="register-title">
            {mode === 'register' ? 'Регистрация' : 'Вход'}
          </h1>
        </div>

        <div className="register-switcher">
          <button
            type="button"
            className={`register-tab ${mode === 'register' ? 'register-tab--active' : ''}`}
            onClick={() => setMode('register')}
          >
            Register
          </button>
          <button
            type="button"
            className={`register-tab ${mode === 'login' ? 'register-tab--active' : ''}`}
            onClick={() => setMode('login')}
          >
            Login
          </button>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          {mode === 'register' ? (
            <label className="register-label">
              Username
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="register-input"
                placeholder="your_username"
              />
            </label>
          ) : null}

          <label className="register-label">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="register-input"
              placeholder="you@example.com"
            />
          </label>

          <label className="register-label">
            Пароль
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="register-input"
              placeholder="Минимум 6 символов"
              minLength={6}
            />
          </label>

          <button type="submit" className="register-button">
            {loading ? 'Отправка...' : mode === 'register' ? 'Зарегистрироваться' : 'Войти'}
          </button>

          {status ? <p className="register-status">{status}</p> : null}
        </form>
      </div>
    </div>
  )
}

export default RegisterPage


