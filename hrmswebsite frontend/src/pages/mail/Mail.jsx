import { useCallback, useEffect, useState } from 'react'
import { FiMail,FiInbox,FiSend,FiEdit3,FiSearch,FiRefreshCw,FiArrowLeft,FiX,FiCheck,FiClock,FiAlertCircle} from 'react-icons/fi'
import { getInbox,getSentMail,sendMail,markMailAsRead} from '../../services/mailService'
import './Mail.css'
function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}
export default function Mail() {
  const [folder, setFolder] = useState('inbox')
  const [inbox, setInbox] = useState([])
  const [sent, setSent] = useState([])
  const [selectedMail, setSelectedMail] = useState(null)
  const [search, setSearch] = useState('')
  const [composeOpen, setComposeOpen] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadMail = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [inboxData, sentData] = await Promise.all([
        getInbox(),
        getSentMail()
      ])

      setInbox(Array.isArray(inboxData) ? inboxData : [])
      setSent(Array.isArray(sentData) ? sentData : [])
    } catch (err) {
      setError(err.message || 'Unable to load your mail.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMail()
  }, [loadMail])

  const messages = folder === 'inbox' ? inbox : sent
  const unreadCount = inbox.filter(mail => !mail.read).length

  const filteredMessages = messages.filter(mail => {
    const query = search.trim().toLowerCase()

    if (!query) return true

    return [
      mail.subject,
      mail.senderEmail,
      mail.recipientEmail,
      mail.body
    ].some(value => String(value || '').toLowerCase().includes(query))
  })

  async function openMessage(mail) {
    setSelectedMail(mail)
    setNotice('')
    setError('')

    if (folder === 'inbox' && !mail.read) {
      try {
        const updatedMail = await markMailAsRead(mail.id)
        const readMail = { ...mail, ...updatedMail, read: true }

        setInbox(current =>
          current.map(item => item.id === mail.id ? readMail : item)
        )
        setSelectedMail(readMail)
      } catch (err) {
        setError(err.message || 'Unable to mark this message as read.')
      }
    }
  }

  async function handleSend(event) {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!recipientEmail.trim() || !subject.trim() || !body.trim()) {
      setError('Please complete the recipient, subject, and message.')
      return
    }

    setSending(true)

    try {
      await sendMail({
        recipientEmail: recipientEmail.trim(),
        subject: subject.trim(),
        body: body.trim()
      })

      setRecipientEmail('')
      setSubject('')
      setBody('')
      setComposeOpen(false)
      setFolder('sent')
      setSelectedMail(null)
      setNotice('Your message has been sent.')
      await loadMail()
    } catch (err) {
      setError(err.message || 'Unable to send your message.')
    } finally {
      setSending(false)
    }
  }

  function changeFolder(nextFolder) {
    setFolder(nextFolder)
    setSelectedMail(null)
    setSearch('')
    setError('')
    setNotice('')
  }

  return (
    <main className="hrms-mail-page">
      <section className="hrms-mail-heading">
        <div>
          <span className="hrms-mail-eyebrow">WORKPLACE COMMUNICATION</span>
          <h1>HRMS Mail</h1>
          <p>Send messages and manage your workplace conversations.</p>
        </div>

        <button
          type="button"
          className="hrms-mail-compose-button"
          onClick={() => {
            setComposeOpen(true)
            setSelectedMail(null)
            setError('')
            setNotice('')
          }}
        >
          <FiEdit3 />
          Compose mail
        </button>
      </section>

      {notice && (
        <div className="hrms-mail-notice">
          <FiCheck />
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="Dismiss message">
            <FiX />
          </button>
        </div>
      )}

      {error && (
        <div className="hrms-mail-error">
          <FiAlertCircle />
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss error">
            <FiX />
          </button>
        </div>
      )}

      <section className="hrms-mail-layout">
        <aside className="hrms-mail-sidebar">
          <button
            type="button"
            className={`hrms-mail-folder ${folder === 'inbox' ? 'active' : ''}`}
            onClick={() => changeFolder('inbox')}
          >
            <FiInbox />
            <span>Inbox</span>
            {unreadCount > 0 && (
              <span className="hrms-mail-count">{unreadCount}</span>
            )}
          </button>

          <button
            type="button"
            className={`hrms-mail-folder ${folder === 'sent' ? 'active' : ''}`}
            onClick={() => changeFolder('sent')}
          >
            <FiSend />
            <span>Sent</span>
          </button>

          <div className="hrms-mail-sidebar-note">
            <FiMail />
            <span>Your internal HRMS messages are stored in your account inbox.</span>
          </div>
        </aside>

        <section className="hrms-mail-content">
          {composeOpen ? (
            <div className="hrms-mail-compose">
              <div className="hrms-mail-panel-heading">
                <div>
                  <h2>Compose message</h2>
                  <p>Send a message to another HRMS user.</p>
                </div>
                <button
                  type="button"
                  className="hrms-mail-icon-button"
                  onClick={() => setComposeOpen(false)}
                  aria-label="Close compose"
                >
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSend} className="hrms-mail-form">
                <label htmlFor="hrms-mail-recipient">Recipient email</label>
                <input
                  id="hrms-mail-recipient"
                  type="email"
                  value={recipientEmail}
                  onChange={event => setRecipientEmail(event.target.value)}
                  placeholder="employee@company.com"
                  required
                />

                <label htmlFor="hrms-mail-subject">Subject</label>
                <input
                  id="hrms-mail-subject"
                  type="text"
                  value={subject}
                  onChange={event => setSubject(event.target.value)}
                  placeholder="Enter a subject"
                  maxLength={200}
                  required
                />

                <label htmlFor="hrms-mail-body">Message</label>
                <textarea
                  id="hrms-mail-body"
                  value={body}
                  onChange={event => setBody(event.target.value)}
                  placeholder="Write your message here..."
                  rows={9}
                  required
                />

                <div className="hrms-mail-form-actions">
                  <button
                    type="button"
                    className="hrms-mail-cancel-button"
                    onClick={() => setComposeOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="hrms-mail-compose-button"
                    disabled={sending}
                  >
                    <FiSend />
                    {sending ? 'Sending...' : 'Send message'}
                  </button>
                </div>
              </form>
            </div>
          ) : selectedMail ? (
            <article className="hrms-mail-detail">
              <div className="hrms-mail-panel-heading">
                <button
                  type="button"
                  className="hrms-mail-back-button"
                  onClick={() => setSelectedMail(null)}
                >
                  <FiArrowLeft />
                  Back to {folder === 'inbox' ? 'inbox' : 'sent'}
                </button>
                <button
                  type="button"
                  className="hrms-mail-icon-button"
                  onClick={loadMail}
                  aria-label="Refresh mail"
                >
                  <FiRefreshCw />
                </button>
              </div>

              <h2 className="hrms-mail-detail-subject">
                {selectedMail.subject || '(No subject)'}
              </h2>

              <div className="hrms-mail-detail-meta">
                <div className="hrms-mail-avatar">
                  {(folder === 'inbox'
                    ? selectedMail.senderEmail
                    : selectedMail.recipientEmail
                  )?.charAt(0)?.toUpperCase() || 'M'}
                </div>
                <div>
                  <strong>
                    {folder === 'inbox'
                      ? selectedMail.senderEmail
                      : `To: ${selectedMail.recipientEmail}`}
                  </strong>
                  <span>{formatDate(selectedMail.createdAt)}</span>
                </div>
                {selectedMail.read && folder === 'inbox' && (
                  <span className="hrms-mail-read-label">
                    <FiCheck /> Read
                  </span>
                )}
              </div>

              <div className="hrms-mail-message-body">
                {selectedMail.body}
              </div>
            </article>
          ) : (
            <>
              <div className="hrms-mail-panel-heading">
                <div>
                  <h2>{folder === 'inbox' ? 'Inbox' : 'Sent messages'}</h2>
                  <p>
                    {folder === 'inbox'
                      ? `${inbox.length} received message${inbox.length === 1 ? '' : 's'}`
                      : `${sent.length} sent message${sent.length === 1 ? '' : 's'}`}
                  </p>
                </div>
                <button
                  type="button"
                  className="hrms-mail-icon-button"
                  onClick={loadMail}
                  aria-label="Refresh mail"
                  disabled={loading}
                >
                  <FiRefreshCw className={loading ? 'hrms-mail-spinning' : ''} />
                </button>
              </div>

              <div className="hrms-mail-search">
                <FiSearch />
                <input
                  type="search"
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Search messages..."
                  aria-label="Search messages"
                />
              </div>

              {loading ? (
                <div className="hrms-mail-state">
                  <FiRefreshCw className="hrms-mail-spinning" />
                  <p>Loading messages...</p>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="hrms-mail-state">
                  {folder === 'inbox' ? <FiInbox /> : <FiSend />}
                  <h3>{search ? 'No matching messages' : 'No messages yet'}</h3>
                  <p>
                    {search
                      ? 'Try another search term.'
                      : folder === 'inbox'
                        ? 'Messages sent to you will appear here.'
                        : 'Messages you send will appear here.'}
                  </p>
                </div>
              ) : (
                <div className="hrms-mail-list">
                  {filteredMessages.map(mail => (
                    <button
                      type="button"
                      key={mail.id}
                      className={`hrms-mail-row ${folder === 'inbox' && !mail.read ? 'unread' : ''}`}
                      onClick={() => openMessage(mail)}
                    >
                      <div className="hrms-mail-avatar">
                        {(folder === 'inbox'
                          ? mail.senderEmail
                          : mail.recipientEmail
                        )?.charAt(0)?.toUpperCase() || 'M'}
                      </div>

                      <div className="hrms-mail-row-main">
                        <div className="hrms-mail-row-top">
                          <strong>
                            {folder === 'inbox'
                              ? mail.senderEmail
                              : `To: ${mail.recipientEmail}`}
                          </strong>
                          <span className="hrms-mail-row-date">
                            <FiClock />
                            {formatDate(mail.createdAt)}
                          </span>
                        </div>
                        <span className="hrms-mail-row-subject">
                          {mail.subject || '(No subject)'}
                        </span>
                        <span className="hrms-mail-row-preview">
                          {mail.body || ''}
                        </span>
                      </div>

                      {folder === 'inbox' && !mail.read && (
                        <span className="hrms-mail-unread-dot" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </section>
    </main>
  )
}
