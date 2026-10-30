import { useCallback, useEffect, useRef, useState } from 'react'
import { FiSearch,FiSend,FiMessageCircle,FiUser,FiRefreshCw,FiCheck,FiCheckCircle,FiX,} from 'react-icons/fi'
import { getChatMembers,getConversation,sendChatMessage,connectChat,} from '../../services/chatService'
import './Chat.css'
function getSavedUser() {
  try {
    return JSON.parse(
      sessionStorage.getItem('hrms-user') ||
      localStorage.getItem('hrms-user') ||
      '{}'
    )
  } catch {
    return {}
  }
}

function formatMessageTime(value) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Chat() {
  const currentUser = getSavedUser()
  const currentEmail = (
    currentUser.email ||
    currentUser.username ||
    ''
  ).trim().toLowerCase()

  const [members, setMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [messages, setMessages] = useState([])
  const [search, setSearch] = useState('')
  const [messageText, setMessageText] = useState('')
  const [unreadCounts, setUnreadCounts] = useState({})
  const [connected, setConnected] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [chatToast, setChatToast] = useState(null)

  const messagesEndRef = useRef(null)
  const selectedMemberRef = useRef(null)
  const currentEmailRef = useRef(currentEmail)

  useEffect(() => {
    selectedMemberRef.current = selectedMember
  }, [selectedMember])

  useEffect(() => {
    currentEmailRef.current = currentEmail
  }, [currentEmail])

  useEffect(() => {
    if (!chatToast) return undefined

    const timer = setTimeout(() => {
      setChatToast(null)
    }, 5000)

    return () => clearTimeout(timer)
  }, [chatToast])

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true)
    setError('')

    try {
      const data = await getChatMembers()
      setMembers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Unable to load chat members.')
    } finally {
      setLoadingMembers(false)
    }
  }, [])

  const loadConversation = useCallback(async (member) => {
    if (!member?.email) return

    setLoadingMessages(true)
    setError('')

    try {
      const data = await getConversation(member.email)
      setMessages(Array.isArray(data) ? data : [])

      setUnreadCounts((previous) => ({
        ...previous,
        [member.email.toLowerCase()]: 0,
      }))
    } catch (err) {
      setError(err.message || 'Unable to load this conversation.')
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  useEffect(() => {
    let unsubscribe

    try {
      unsubscribe = connectChat(
        (incomingMessage) => {
          const activeMember = selectedMemberRef.current
          const loggedInEmail = currentEmailRef.current

          const sender = (
            incomingMessage.senderEmail || ''
          ).trim().toLowerCase()

          const recipient = (
            incomingMessage.recipientEmail || ''
          ).trim().toLowerCase()

          if (!loggedInEmail) return

          const belongsToCurrentUser =
            recipient === loggedInEmail ||
            sender === loggedInEmail

          if (!belongsToCurrentUser) return

          const otherEmail =
            sender === loggedInEmail ? recipient : sender

          const isIncoming = sender !== loggedInEmail

          if (isIncoming) {
            const senderMember = members.find(
              (member) =>
                member.email?.trim().toLowerCase() === sender
            )

            setChatToast({
              id: incomingMessage.id || `${sender}-${Date.now()}`,
              title: senderMember?.fullName || sender || 'HRMS Member',
              content: incomingMessage.content || 'You received a message.',
              email: sender,
            })

            if (activeMember?.email?.trim().toLowerCase() !== sender) {
              setUnreadCounts((previous) => ({
                ...previous,
                [sender]: (previous[sender] || 0) + 1,
              }))
            }
          }

          if (activeMember?.email?.trim().toLowerCase() === otherEmail) {
            setMessages((previous) => {
              if (
                previous.some(
                  (message) => message.id === incomingMessage.id
                )
              ) {
                return previous
              }

              return [...previous, incomingMessage]
            })
          }
        },
        setConnected
      )
    } catch (err) {
      setError(err.message || 'Unable to connect to chat.')
    }

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [members])

  useEffect(() => {
    if (selectedMember) {
      loadConversation(selectedMember)
    } else {
      setMessages([])
    }
  }, [selectedMember, loadConversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    })
  }, [messages])

  const filteredMembers = members.filter((member) => {
    const query = search.trim().toLowerCase()

    return (
      member.fullName?.toLowerCase().includes(query) ||
      member.email?.toLowerCase().includes(query) ||
      member.role?.toLowerCase().includes(query)
    )
  })

  async function handleSendMessage(event) {
    event.preventDefault()

    const content = messageText.trim()

    if (!content || !selectedMember || sending) return

    setSending(true)
    setError('')

    try {
      const savedMessage = await sendChatMessage(
        selectedMember.email,
        content
      )

      setMessages((previous) => {
        if (
          previous.some((message) => message.id === savedMessage.id)
        ) {
          return previous
        }

        return [...previous, savedMessage]
      })

      setMessageText('')
    } catch (err) {
      setError(err.message || 'Unable to send your message.')
    } finally {
      setSending(false)
    }
  }

  function selectMember(member) {
    setSelectedMember(member)

    setUnreadCounts((previous) => ({
      ...previous,
      [member.email.toLowerCase()]: 0,
    }))
  }

  function openToastConversation() {
    if (!chatToast?.email) {
      setChatToast(null)
      return
    }

    const member = members.find(
      (item) =>
        item.email?.trim().toLowerCase() === chatToast.email
    )

    if (member) {
      selectMember(member)
    }

    setChatToast(null)
  }

  const totalUnread = Object.values(unreadCounts).reduce(
    (total, count) => total + count,
    0
  )

  return (
    <section className="hrms-chat-page">
      {chatToast && (
        <div
          className="chat-toast"
          role="status"
          aria-live="polite"
          key={chatToast.id}
        >
          <div className="chat-toast-icon">
            <FiMessageCircle />
          </div>

          <button
            type="button"
            className="chat-toast-content"
            onClick={openToastConversation}
            aria-label={`Open conversation with ${chatToast.title}`}
          >
            <strong>New message</strong>
            <span>{chatToast.title}</span>
            <p>{chatToast.content}</p>
          </button>

          <button
            type="button"
            className="chat-toast-close"
            onClick={() => setChatToast(null)}
            aria-label="Dismiss notification"
          >
            <FiX />
          </button>
        </div>
      )}

      <div className="chat-page-heading">
        <div>
          <span className="chat-eyebrow">TEAM COMMUNICATION</span>
          <h1>Messages</h1>
          <p>Connect privately with your HRMS team members.</p>
        </div>

        <div className={`chat-connection ${connected ? 'online' : ''}`}>
          <span className="chat-connection-dot" />
          {connected ? 'Connected' : 'Connecting...'}
        </div>
      </div>

      {error && (
        <div className="chat-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={loadMembers}>
            <FiRefreshCw />
            Retry
          </button>
        </div>
      )}

      <div className="chat-workspace">
        <aside className="chat-sidebar">
          <div className="chat-sidebar-title">
            <div>
              <h2>Team members</h2>
              <span>{members.length} members</span>
            </div>

            {totalUnread > 0 && (
              <span className="chat-total-unread">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </div>

          <label className="chat-search">
            <FiSearch />
            <input
              type="search"
              placeholder="Search people..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <div className="chat-member-list">
            {loadingMembers ? (
              <div className="chat-empty-state">
                <span className="chat-loader" />
                <p>Loading team members...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="chat-empty-state">
                <FiUser />
                <p>No members found.</p>
              </div>
            ) : (
              filteredMembers.map((member) => {
                const email = (member.email || '').toLowerCase()
                const unread = unreadCounts[email] || 0
                const isSelected =
                  selectedMember?.email?.toLowerCase() === email

                return (
                  <button
                    type="button"
                    key={member.id || member.email}
                    className={`chat-member ${isSelected ? 'selected' : ''}`}
                    onClick={() => selectMember(member)}
                  >
                    <span className="chat-avatar">
                      {(member.fullName || member.email || '?')
                        .trim()
                        .charAt(0)
                        .toUpperCase()}
                    </span>

                    <span className="chat-member-details">
                      <span className="chat-member-name">
                        {member.fullName || 'HRMS Member'}
                      </span>
                      <span className="chat-member-role">
                        {(member.role || 'EMPLOYEE').replaceAll('_', ' ')}
                      </span>
                    </span>

                    {unread > 0 && (
                      <span className="chat-unread-badge">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </aside>

        <main className="chat-conversation">
          {!selectedMember ? (
            <div className="chat-welcome">
              <div className="chat-welcome-icon">
                <FiMessageCircle />
              </div>
              <h2>Your team, one conversation away</h2>
              <p>
                Select a member from the list to start a private conversation.
              </p>
            </div>
          ) : (
            <>
              <header className="chat-conversation-header">
                <span className="chat-avatar chat-avatar-large">
                  {(selectedMember.fullName || selectedMember.email || '?')
                    .trim()
                    .charAt(0)
                    .toUpperCase()}
                </span>

                <div className="chat-conversation-person">
                  <h2>{selectedMember.fullName || 'HRMS Member'}</h2>
                  <p>{selectedMember.email}</p>
                  <span className="chat-person-role">
                    {(selectedMember.role || 'EMPLOYEE').replaceAll('_', ' ')}
                  </span>
                </div>
              </header>

              <div className="chat-message-list">
                {loadingMessages ? (
                  <div className="chat-empty-state">
                    <span className="chat-loader" />
                    <p>Loading conversation...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="chat-empty-state chat-no-messages">
                    <FiMessageCircle />
                    <h3>Start the conversation</h3>
                    <p>Send a message to say hello.</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isMine =
                      message.senderEmail?.toLowerCase() === currentEmail

                    return (
                      <div
                        key={message.id}
                        className={`chat-message-row ${isMine ? 'mine' : 'theirs'}`}
                      >
                        <div className="chat-message-bubble">
                          <p>{message.content}</p>

                          <div className="chat-message-meta">
                            <time dateTime={message.sentAt}>
                              {formatMessageTime(message.sentAt)}
                            </time>

                            {isMine && (
                              message.read ? (
                                <FiCheckCircle aria-label="Read" />
                              ) : (
                                <FiCheck aria-label="Sent" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}

                <div ref={messagesEndRef} />
              </div>

              <form
                className="chat-composer"
                onSubmit={handleSendMessage}
              >
                <textarea
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder={`Message ${selectedMember.fullName || 'your teammate'}...`}
                  rows={1}
                  maxLength={5000}
                  aria-label="Write a message"
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault()
                      event.currentTarget.form?.requestSubmit()
                    }
                  }}
                />

                <button
                  type="submit"
                  disabled={!messageText.trim() || sending}
                  aria-label="Send message"
                  title="Send message"
                >
                  {sending ? (
                    <span className="chat-button-loader" />
                  ) : (
                    <FiSend />
                  )}
                </button>
              </form>

              <div className="chat-composer-hint">
                Press Enter to send · Shift + Enter for a new line
              </div>
            </>
          )}
        </main>
      </div>
    </section>
  )
}
