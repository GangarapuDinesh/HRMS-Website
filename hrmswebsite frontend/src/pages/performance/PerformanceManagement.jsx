import { useCallback, useEffect, useMemo, useState } from 'react'
import {FiActivity,FiAlertCircle,FiAward,FiCalendar,FiCheckCircle,FiChevronDown,FiEdit2,FiFileText,FiMessageSquare,FiPlus,FiRefreshCw,FiSearch,FiStar,FiTarget,FiTrash2,FiUser,FiX} from 'react-icons/fi'
import {createPerformanceReview,deletePerformanceReview,getEmployeePerformanceReviews,getPerformanceReviews,updatePerformanceReview} from '../../services/performanceService'
import './PerformanceManagement.css'
const emptyForm = {
  employeeId: '',
  rating: '4',
  strengths: '',
  areasForImprovement: '',
  goals: '',
  feedback: '',
  reviewDate: new Date().toISOString().slice(0, 10),
  status: 'DRAFT'
}
const getUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem('hrms-user') || '{}')
  } catch {
    return {}
  }
}
const getEmployeeId = (review) =>
  review.employeeId ?? review.employee?.id ?? ''
const getEmployeeName = (review) =>
  review.employeeName ?? review.employee?.fullName ?? 'Employee'
const getEmployeeEmail = (review) =>
  review.employeeEmail ?? review.employee?.email ?? ''
const formatDate = (value) => {
  if (!value) return 'Not set'
  const date = new Date(`${value}`.slice(0, 10) + 'T00:00:00')
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}
const statusLabel = (status) => {
  const value = (status || 'DRAFT').toLowerCase()
  return value.charAt(0).toUpperCase() + value.slice(1)
}
function RatingStars({ rating }) {
  return (
    <span className="pm-stars" aria-label={`${rating || 0} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <FiStar
          key={star}
          className={star <= Number(rating) ? 'pm-star-filled' : ''}
        />
      ))}
    </span>
  )
}
function PerformanceManagement() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showForm, setShowForm] = useState(false)
  const [editingReview, setEditingReview] = useState(null)
  const [selectedReview, setSelectedReview] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const user = getUser()
  const userRole = String(user.role || '').replace('ROLE_', '').toUpperCase()
  const employeeId =
    user.employeeId ??
    user.employee?.id ??
    user.employee?.employeeId ??
    user.employeeRecordId ??
    null
  const isEmployee = userRole === 'EMPLOYEE'
  const canManage = ['ADMIN', 'HR_MANAGER'].includes(userRole)
  const canDelete = canManage
  const loadReviews = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      let data
      if (isEmployee) {
        if (!employeeId) {
          throw new Error(
            'Your employee record ID is missing from your login details. Please check the saved HRMS user data.'
          )
        }
        data = await getEmployeePerformanceReviews(employeeId)
      } else {
        data = await getPerformanceReviews()
      }
      setReviews(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Unable to load performance reviews.')
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [isEmployee, employeeId])
  useEffect(() => {
    loadReviews()
  }, [loadReviews])
  const filteredReviews = useMemo(() => {
    const term = search.trim().toLowerCase()

    return reviews.filter((review) => {
      const matchesSearch =
        !term ||
        getEmployeeName(review).toLowerCase().includes(term) ||
        getEmployeeEmail(review).toLowerCase().includes(term) ||
        String(review.reviewerEmail || '').toLowerCase().includes(term) ||
        String(getEmployeeId(review)).includes(term)
      const matchesStatus =
        statusFilter === 'ALL' ||
        String(review.status || 'DRAFT').toUpperCase() === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [reviews, search, statusFilter])
  const averageRating = reviews.length
    ? (
        reviews.reduce((total, review) => total + Number(review.rating || 0), 0) /
        reviews.length
      ).toFixed(1)
    : '0.0'
  const draftCount = reviews.filter(
    (review) => String(review.status).toUpperCase() === 'DRAFT'
  ).length
  const completedCount = reviews.filter(
    (review) => String(review.status).toUpperCase() === 'COMPLETED'
  ).length
  const openCreateForm = () => {
    if (isEmployee || !canManage) return
    setEditingReview(null)
    setForm({
      ...emptyForm,
      reviewDate: new Date().toISOString().slice(0, 10)
    })
    setSelectedReview(null)
    setError('')
    setNotice('')
    setShowForm(true)
  }
  const openEditForm = (review) => {
    if (!canManage) return
    setEditingReview(review)
    setForm({
      employeeId: String(getEmployeeId(review)),
      rating: String(review.rating ?? 4),
      strengths: review.strengths || '',
      areasForImprovement: review.areasForImprovement || '',
      goals: review.goals || '',
      feedback: review.feedback || '',
      reviewDate: String(
        review.reviewDate || new Date().toISOString().slice(0, 10)
      ).slice(0, 10),
      status: String(review.status || 'DRAFT').toUpperCase()
    })
    setSelectedReview(null)
    setError('')
    setNotice('')
    setShowForm(true)
  }
  const closeForm = () => {
    if (saving) return
    setShowForm(false)
    setEditingReview(null)
  }
  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }
  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canManage) {
      setError('You do not have permission to manage performance reviews.')
      return
    }
    setError('')
    setNotice('')
    if (!editingReview && !form.employeeId.trim()) {
      setError('Enter the employee ID for this review.')
      return
    }
    if (!form.reviewDate) {
      setError('Select a review date.')
      return
    }
    const payload = {
      rating: Number(form.rating),
      strengths: form.strengths.trim(),
      areasForImprovement: form.areasForImprovement.trim(),
      goals: form.goals.trim(),
      feedback: form.feedback.trim(),
      reviewDate: form.reviewDate,
      status: form.status
    }
    setSaving(true)
    try {
      if (editingReview) {
        await updatePerformanceReview(editingReview.id, payload)
        setNotice('Performance review updated successfully.')
      } else {
        await createPerformanceReview(Number(form.employeeId), payload)
        setNotice('Performance review created successfully.')
      }
      setShowForm(false)
      setEditingReview(null)
      await loadReviews()
    } catch (err) {
      setError(err.message || 'Unable to save the review.')
    } finally {
      setSaving(false)
    }
  }
  const handleDelete = async (review) => {
    if (!canDelete) return
    const confirmed = window.confirm(
      `Delete the performance review for ${getEmployeeName(review)}? This action cannot be undone.`
    )
    if (!confirmed) return
    setError('')
    setNotice('')
    try {
      await deletePerformanceReview(review.id)
      setSelectedReview(null)
      setNotice('Performance review deleted successfully.')
      await loadReviews()
    } catch (err) {
      setError(err.message || 'Unable to delete the review.')
    }
  }
  return (
    <main className="pm-page">
      <section className="pm-heading">
        <div>
          <div className="pm-eyebrow">
            <FiActivity />
            PEOPLE DEVELOPMENT
          </div>
          <h1>{isEmployee ? 'My Performance' : 'Performance Management'}</h1>
          <p>
            {isEmployee
              ? 'View your performance ratings, feedback, and development goals.'
              : 'Review employee performance, recognize strengths, and plan meaningful goals.'}
          </p>
        </div>
        <div className="pm-heading-actions">
          <button
            type="button"
            className="pm-button pm-button-secondary"
            onClick={loadReviews}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'pm-spin' : ''} />
            Refresh
          </button>
          {!isEmployee && canManage && (
            <button
              type="button"
              className="pm-button pm-button-primary"
              onClick={openCreateForm}
            >
              <FiPlus />
              New review
            </button>
          )}
        </div>
      </section>
      {error && !showForm && (
        <div className="pm-alert pm-alert-error">
          <FiAlertCircle />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Dismiss error"
          >
            <FiX />
          </button>
        </div>
      )}
      {notice && (
        <div className="pm-alert pm-alert-success">
          <FiCheckCircle />
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice('')}
            aria-label="Dismiss message"
          >
            <FiX />
          </button>
        </div>
      )}
      <section className="pm-stat-grid">
        <article className="pm-stat-card">
          <div className="pm-stat-icon pm-icon-blue">
            <FiFileText />
          </div>
          <div>
            <span className="pm-stat-label">Total reviews</span>
            <strong>{reviews.length}</strong>
            <small>{isEmployee ? 'Your recorded reviews' : 'All recorded reviews'}</small>
          </div>
        </article>
        <article className="pm-stat-card">
          <div className="pm-stat-icon pm-icon-purple">
            <FiAward />
          </div>
          <div>
            <span className="pm-stat-label">Average rating</span>
            <strong>
              {averageRating}
              <span className="pm-stat-outof"> / 5</span>
            </strong>
            <small>Across available reviews</small>
          </div>
        </article>
        <article className="pm-stat-card">
          <div className="pm-stat-icon pm-icon-orange">
            <FiActivity />
          </div>
          <div>
            <span className="pm-stat-label">Draft reviews</span>
            <strong>{draftCount}</strong>
            <small>Still in preparation</small>
          </div>
        </article>
        <article className="pm-stat-card">
          <div className="pm-stat-icon pm-icon-green">
            <FiCheckCircle />
          </div>
          <div>
            <span className="pm-stat-label">Completed</span>
            <strong>{completedCount}</strong>
            <small>Completed reviews</small>
          </div>
        </article>
      </section>
      <section className="pm-content-card">
        <div className="pm-list-heading">
          <div>
            <h2>{isEmployee ? 'My performance reviews' : 'Employee reviews'}</h2>
            <p>
              {isEmployee
                ? 'Review your ratings, feedback, and development goals.'
                : 'Manage ratings, feedback, and development goals.'}
            </p>
          </div>
          <span className="pm-result-count">
            {filteredReviews.length}{' '}
            {filteredReviews.length === 1 ? 'review' : 'reviews'}
          </span>
        </div>
        <div className="pm-toolbar">
          <label className="pm-search">
            <FiSearch />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={isEmployee ? 'Search your reviews...' : 'Search employee, email, or ID...'}
              aria-label="Search performance reviews"
            />
          </label>
          <label className="pm-filter">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by review status"
            >
              <option value="ALL">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <FiChevronDown />
          </label>
        </div>
        {loading ? (
          <div className="pm-state">
            <span className="pm-loader" />
            <strong>Loading performance reviews...</strong>
            <p>Please wait while we connect to your HRMS backend.</p>
          </div>
        ) : error && reviews.length === 0 ? (
          <div className="pm-state">
            <div className="pm-empty-icon">
              <FiAlertCircle />
            </div>
            <strong>Unable to load reviews</strong>
            <p>{error}</p>
            <button
              type="button"
              className="pm-button pm-button-secondary"
              onClick={loadReviews}
            >
              <FiRefreshCw />
              Try again
            </button>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="pm-state">
            <div className="pm-empty-icon">
              <FiFileText />
            </div>
            <strong>{reviews.length ? 'No matching reviews' : 'No reviews yet'}</strong>
            <p>
              {reviews.length
                ? 'Try another search term or status filter.'
                : isEmployee
                  ? 'No performance reviews have been recorded for your employee account yet.'
                  : 'Create your first performance review to get started.'}
            </p>
            {!isEmployee && canManage && !reviews.length && (
              <button
                type="button"
                className="pm-button pm-button-primary"
                onClick={openCreateForm}
              >
                <FiPlus />
                Create first review
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="pm-table-wrap">
              <table className="pm-table">
                <thead>
                  <tr>
                    <th>{isEmployee ? 'Review' : 'Employee'}</th>
                    <th>Rating</th>
                    <th>Review date</th>
                    <th>Status</th>
                    {!isEmployee && <th>Reviewer</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReviews.map((review) => (
                    <tr key={review.id}>
                      <td>
                        <button
                          type="button"
                          className="pm-employee-cell"
                          onClick={() => setSelectedReview(review)}
                        >
                          <span className="pm-avatar">
                            {getEmployeeName(review).trim().charAt(0).toUpperCase()}
                          </span>
                          <span className="pm-employee-info">
                            <strong>
                              {isEmployee ? 'My review' : getEmployeeName(review)}
                            </strong>
                            <small>
                              {isEmployee
                                ? `Review ID: ${review.id}`
                                : getEmployeeEmail(review) ||
                                  `Employee ID: ${getEmployeeId(review) || '—'}`}
                            </small>
                          </span>
                        </button>
                      </td>
                      <td>
                        <div className="pm-rating-cell">
                          <RatingStars rating={review.rating} />
                          <strong>{review.rating ?? '—'}/5</strong>
                        </div>
                      </td>
                      <td>
                        <span className="pm-date-cell">
                          <FiCalendar />
                          {formatDate(review.reviewDate)}
                        </span>
                      </td>
                      <td>
                        <span className={`pm-status pm-status-${String(review.status || 'DRAFT').toLowerCase()}`}>
                          <span />
                          {statusLabel(review.status)}
                        </span>
                      </td>
                      {!isEmployee && (
                        <td className="pm-reviewer">
                          {review.reviewerEmail || '—'}
                        </td>
                      )}
                      <td>
                        <div className="pm-row-actions">
                          <button
                            type="button"
                            className="pm-icon-button"
                            title="View review"
                            aria-label="View review"
                            onClick={() => setSelectedReview(review)}
                          >
                            <FiMessageSquare />
                          </button>

                          {canManage && (
                            <button
                              type="button"
                              className="pm-icon-button"
                              title="Edit review"
                              aria-label="Edit review"
                              onClick={() => openEditForm(review)}
                            >
                              <FiEdit2 />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              className="pm-icon-button pm-delete-button"
                              title="Delete review"
                              aria-label="Delete review"
                              onClick={() => handleDelete(review)}
                            >
                              <FiTrash2 />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pm-mobile-reviews">
              {filteredReviews.map((review) => (
                <article className="pm-mobile-review" key={review.id}>
                  <div className="pm-mobile-review-top">
                    <span className="pm-avatar">
                      {getEmployeeName(review).trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="pm-employee-info">
                      <strong>{isEmployee ? 'My review' : getEmployeeName(review)}</strong>
                      <small>
                        {isEmployee
                          ? `Review ID: ${review.id}`
                          : getEmployeeEmail(review) ||
                            `Employee ID: ${getEmployeeId(review) || '—'}`}
                      </small>
                    </div>
                    <span className={`pm-status pm-status-${String(review.status || 'DRAFT').toLowerCase()}`}>
                      <span />
                      {statusLabel(review.status)}
                    </span>
                  </div>

                  <div className="pm-mobile-review-meta">
                    <span>
                      <FiCalendar /> {formatDate(review.reviewDate)}
                    </span>
                    <span>
                      <FiStar /> {review.rating ?? '—'}/5
                    </span>
                  </div>

                  <div className="pm-mobile-actions">
                    <button
                      type="button"
                      className="pm-button pm-button-secondary"
                      onClick={() => setSelectedReview(review)}
                    >
                      View
                    </button>

                    {canManage && (
                      <button
                        type="button"
                        className="pm-button pm-button-secondary"
                        onClick={() => openEditForm(review)}
                      >
                        <FiEdit2 /> Edit
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        className="pm-button pm-button-danger"
                        onClick={() => handleDelete(review)}
                      >
                        <FiTrash2 /> Delete
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {showForm && (
        <div
          className="pm-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm()
          }}
        >
          <section
            className="pm-modal pm-review-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pm-form-title"
          >
            <div className="pm-modal-heading">
              <div>
                <span className="pm-modal-kicker">
                  {editingReview ? 'UPDATE REVIEW' : 'EMPLOYEE DEVELOPMENT'}
                </span>
                <h2 id="pm-form-title">
                  {editingReview ? 'Edit performance review' : 'Create performance review'}
                </h2>
                <p>Record achievements, feedback, and next steps.</p>
              </div>
              <button
                type="button"
                className="pm-close-button"
                onClick={closeForm}
                aria-label="Close form"
              >
                <FiX />
              </button>
            </div>

            {error && (
              <div className="pm-alert pm-alert-error">
                <FiAlertCircle />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="pm-form-grid">
                {!editingReview && (
                  <label className="pm-field pm-field-full">
                    <span>Employee ID <i>*</i></span>
                    <input
                      type="number"
                      name="employeeId"
                      min="1"
                      value={form.employeeId}
                      onChange={updateField}
                      placeholder="Enter the ID from the Employees module"
                      required
                    />
                    <small>Use the employee record ID, not the login user ID.</small>
                  </label>
                )}

                <label className="pm-field">
                  <span>Performance rating <i>*</i></span>
                  <select
                    name="rating"
                    value={form.rating}
                    onChange={updateField}
                    required
                  >
                    <option value="5">5 — Outstanding</option>
                    <option value="4">4 — Exceeds expectations</option>
                    <option value="3">3 — Meets expectations</option>
                    <option value="2">2 — Needs improvement</option>
                    <option value="1">1 — Unsatisfactory</option>
                  </select>
                </label>

                <label className="pm-field">
                  <span>Review date <i>*</i></span>
                  <input
                    type="date"
                    name="reviewDate"
                    value={form.reviewDate}
                    onChange={updateField}
                    required
                  />
                </label>

                <label className="pm-field pm-field-full">
                  <span>Strengths</span>
                  <textarea
                    name="strengths"
                    value={form.strengths}
                    onChange={updateField}
                    rows="3"
                    maxLength="2000"
                    placeholder="What does the employee do well?"
                  />
                </label>

                <label className="pm-field pm-field-full">
                  <span>Areas for improvement</span>
                  <textarea
                    name="areasForImprovement"
                    value={form.areasForImprovement}
                    onChange={updateField}
                    rows="3"
                    maxLength="2000"
                    placeholder="What skills or areas need more development?"
                  />
                </label>

                <label className="pm-field pm-field-full">
                  <span>Goals and action plan</span>
                  <textarea
                    name="goals"
                    value={form.goals}
                    onChange={updateField}
                    rows="3"
                    maxLength="2000"
                    placeholder="Define measurable goals for the next review period."
                  />
                </label>

                <label className="pm-field pm-field-full">
                  <span>Manager feedback</span>
                  <textarea
                    name="feedback"
                    value={form.feedback}
                    onChange={updateField}
                    rows="4"
                    maxLength="3000"
                    placeholder="Enter overall feedback for this review."
                  />
                </label>

                <label className="pm-field pm-field-full">
                  <span>Review status</span>
                  <select
                    name="status"
                    value={form.status}
                    onChange={updateField}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </label>
              </div>

              <div className="pm-modal-footer">
                <button
                  type="button"
                  className="pm-button pm-button-secondary"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pm-button pm-button-primary"
                  disabled={saving}
                >
                  {saving ? <FiRefreshCw className="pm-spin" /> : <FiCheckCircle />}
                  {saving
                    ? 'Saving...'
                    : editingReview
                      ? 'Save changes'
                      : 'Create review'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selectedReview && (
        <div
          className="pm-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedReview(null)
          }}
        >
          <section
            className="pm-modal pm-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pm-details-title"
          >
            <div className="pm-modal-heading">
              <div>
                <span className="pm-modal-kicker">PERFORMANCE REVIEW</span>
                <h2 id="pm-details-title">
                  {isEmployee ? 'My performance review' : getEmployeeName(selectedReview)}
                </h2>
                <p>
                  {isEmployee
                    ? 'Your performance feedback and development details'
                    : getEmployeeEmail(selectedReview) ||
                      `Employee ID: ${getEmployeeId(selectedReview) || '—'}`}
                </p>
              </div>
              <button
                type="button"
                className="pm-close-button"
                onClick={() => setSelectedReview(null)}
                aria-label="Close details"
              >
                <FiX />
              </button>
            </div>

            <div className="pm-detail-rating">
              <div className="pm-detail-rating-icon">
                <FiAward />
              </div>
              <div>
                <span>Overall rating</span>
                <div className="pm-detail-rating-value">
                  <strong>
                    {selectedReview.rating ?? '—'}
                    <small>/5</small>
                  </strong>
                  <RatingStars rating={selectedReview.rating} />
                </div>
              </div>
              <span className={`pm-status pm-status-${String(selectedReview.status || 'DRAFT').toLowerCase()}`}>
                <span />
                {statusLabel(selectedReview.status)}
              </span>
            </div>

            <div className="pm-detail-meta">
              <div>
                <FiCalendar />
                <span>
                  Review date
                  <strong>{formatDate(selectedReview.reviewDate)}</strong>
                </span>
              </div>
              <div>
                <FiUser />
                <span>
                  Reviewer
                  <strong>{selectedReview.reviewerEmail || 'Not specified'}</strong>
                </span>
              </div>
            </div>

            <div className="pm-detail-sections">
              <section>
                <h3><FiAward /> Strengths</h3>
                <p>{selectedReview.strengths || 'No strengths recorded.'}</p>
              </section>
              <section>
                <h3><FiActivity /> Areas for improvement</h3>
                <p>{selectedReview.areasForImprovement || 'No improvement areas recorded.'}</p>
              </section>
              <section>
                <h3><FiTarget /> Goals and action plan</h3>
                <p>{selectedReview.goals || 'No goals recorded.'}</p>
              </section>
              <section>
                <h3><FiMessageSquare /> Manager feedback</h3>
                <p>{selectedReview.feedback || 'No feedback recorded.'}</p>
              </section>
            </div>

            <div className="pm-modal-footer">
              {canDelete && (
                <button
                  type="button"
                  className="pm-button pm-button-danger"
                  onClick={() => handleDelete(selectedReview)}
                >
                  <FiTrash2 /> Delete
                </button>
              )}
              <button
                type="button"
                className="pm-button pm-button-secondary"
                onClick={() => setSelectedReview(null)}
              >
                Close
              </button>
              {canManage && (
                <button
                  type="button"
                  className="pm-button pm-button-primary"
                  onClick={() => openEditForm(selectedReview)}
                >
                  <FiEdit2 /> Edit review
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default PerformanceManagement