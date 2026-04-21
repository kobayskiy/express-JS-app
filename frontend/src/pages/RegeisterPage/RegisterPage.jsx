import { useEffect, useState } from 'react'
import './RegisterPage.css'
import { apiRequest, clearToken, getToken, setToken } from '../../lib/api'

function RegisterPage() {
  const [mode, setMode] = useState('register')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [messages, setMessages] = useState([])
  const [postTitle, setPostTitle] = useState('')
  const [postContent, setPostContent] = useState('')
  const [messageText, setMessageText] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const loadProtectedData = async () => {
    const [meData, postsData, messagesData] = await Promise.all([
      apiRequest('/auth/me'),
      apiRequest('/posts'),
      apiRequest('/messages'),
    ])

    setUser(meData.user)
    setPosts(postsData.posts)
    setMessages(messagesData.messages)
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
      const path = mode === 'register' ? '/auth/register' : '/auth/login'
      const body =
        mode === 'register'
          ? { username, email, password }
          : { email, password }

      const data = await apiRequest(path, {
        method: 'POST',
        body: JSON.stringify(body),
      })

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
      await apiRequest('/posts', {
        method: 'POST',
        body: JSON.stringify({ title: postTitle, content: postContent }),
      })
      setPostTitle('')
      setPostContent('')
      await loadProtectedData()
      setStatus('Пост создан')
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleCreateMessage = async (event) => {
    event.preventDefault()
    setStatus('')

    try {
      await apiRequest('/messages', {
        method: 'POST',
        body: JSON.stringify({ text: messageText }),
      })
      setMessageText('')
      await loadProtectedData()
      setStatus('Сообщение создано')
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleDeletePost = async (id) => {
    try {
      await apiRequest(`/posts/${id}`, { method: 'DELETE' })
      await loadProtectedData()
      setStatus('Пост удалён')
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleDeleteMessage = async (id) => {
    try {
      await apiRequest(`/messages/${id}`, { method: 'DELETE' })
      await loadProtectedData()
      setStatus('Сообщение удалено')
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleLogout = () => {
    clearToken()
    setUser(null)
    setPosts([])
    setMessages([])
    setStatus('Вы вышли из аккаунта')
  }

  if (user) {
    return (
      <div className="register-page">
        <div className="register-card register-card--wide">
          <div className="register-header register-header--row">
            <div>
              <h1 className="register-title">Личный кабинет</h1>
              <p className="register-subtitle">
                {user.username} ({user.email})
              </p>
            </div>
            <button type="button" className="register-button register-button--secondary" onClick={handleLogout}>
              Выйти
            </button>
          </div>

          {status ? <p className="register-status">{status}</p> : null}

          <div className="register-grid">
            <section className="register-section">
              <h2 className="register-section-title">Создать пост</h2>
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
              <h2 className="register-section-title">Создать сообщение</h2>
              <form className="register-form" onSubmit={handleCreateMessage}>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  required
                  className="register-input register-textarea"
                  placeholder="Текст сообщения"
                />
                <button type="submit" className="register-button">
                  Создать сообщение
                </button>
              </form>

              <div className="register-list">
                {messages.map((message) => (
                  <article key={message.id} className="register-item">
                    <p>{message.text}</p>
                    <span>Автор: {message.author.username}</span>
                    {message.author.id === user.id ? (
                      <button
                        type="button"
                        className="register-button register-button--danger"
                        onClick={() => handleDeleteMessage(message.id)}
                      >
                        Удалить
                      </button>
                    ) : null}
                  </article>
                ))}
              </div>
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


