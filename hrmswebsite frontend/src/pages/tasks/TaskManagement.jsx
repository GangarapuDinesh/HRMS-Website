import { useCallback, useEffect, useState } from "react";
import { CheckCircle2,ClipboardList,Clock3,Plus,RefreshCw,Search,Send,Star,X,AlertCircle} from "lucide-react";
import { getAllTasks,getMyTasks,createTask,updateTaskProgress,reviewTask} from "../../services/taskService";
import "./TaskManagement.css";
function TaskManagement({ user }) {
  const role = String(user?.role || "EMPLOYEE").toUpperCase();
  const isManager = ["ADMIN", "HR_MANAGER", "TEAM_LEADER"].includes(role);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [progress, setProgress] = useState(0);
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [rating, setRating] = useState(5);

  const [form, setForm] = useState({
    employeeId: "",
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: ""
  });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = isManager ? await getAllTasks() : await getMyTasks();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load tasks.");
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      await createTask(Number(form.employeeId), {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        dueDate: form.dueDate || null
      });

      setForm({
        employeeId: "",
        title: "",
        description: "",
        priority: "MEDIUM",
        dueDate: ""
      });
      setShowForm(false);
      setNotice("Task assigned successfully.");
      await loadTasks();
    } catch (err) {
      setError(err.message || "Unable to assign task.");
    } finally {
      setSaving(false);
    }
  };

  const openProgress = (task) => {
    setSelectedTask(task);
    setProgress(task.progress ?? 0);
    setSubmissionNotes(task.submissionNotes || "");
    setReviewFeedback("");
    setRating(5);
    setError("");
    setNotice("");
  };

  const handleProgressSave = async (event) => {
    event.preventDefault();
    if (!selectedTask) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await updateTaskProgress(
        selectedTask.id,
        Number(progress),
        submissionNotes.trim()
      );
      setSelectedTask(null);
      setNotice(Number(progress) === 100
        ? "Task submitted for review."
        : "Task progress updated.");
      await loadTasks();
    } catch (err) {
      setError(err.message || "Unable to update task progress.");
    } finally {
      setSaving(false);
    }
  };

  const handleReview = async (task, decision) => {
    const feedback = reviewFeedback.trim();

    if (decision === "REVISION_REQUESTED" && !feedback) {
      setError("Enter feedback explaining the requested revisions.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await reviewTask(
        task.id,
        decision,
        feedback,
        decision === "APPROVED" ? Number(rating) : null
      );
      setSelectedTask(null);
      setNotice(
        decision === "APPROVED"
          ? "Task approved and rated."
          : "Revision requested successfully."
      );
      await loadTasks();
    } catch (err) {
      setError(err.message || "Unable to review task.");
    } finally {
      setSaving(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const query = search.toLowerCase();
    const matchesSearch =
      String(task.title || "").toLowerCase().includes(query) ||
      String(task.employeeName || "").toLowerCase().includes(query) ||
      String(task.description || "").toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "ALL" || task.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const completedCount = tasks.filter(
    (task) => task.status === "APPROVED"
  ).length;

  const pendingCount = tasks.filter(
    (task) => ["TODO", "IN_PROGRESS", "REVISION_REQUESTED"].includes(task.status)
  ).length;

  const reviewCount = tasks.filter(
    (task) => task.status === "SUBMITTED"
  ).length;

  const statusLabel = (status) => ({
    TODO: "To do",
    IN_PROGRESS: "In progress",
    SUBMITTED: "Awaiting review",
    REVISION_REQUESTED: "Revision requested",
    APPROVED: "Approved",
    BLOCKED: "Blocked"
  }[status] || status || "To do");

  const formatDate = (value) => {
    if (!value) return "No deadline";
    return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <main className="task-page">
      <section className="task-heading">
        <div>
          <span className="task-eyebrow">WORKSPACE / TASKS</span>
          <h1>Task Management</h1>
          <p>
            {isManager
              ? "Assign work, monitor progress, and evaluate completed tasks."
              : "Track your assignments, update your progress, and submit your work."}
          </p>
        </div>

        <div className="task-heading-actions">
          <button className="task-button task-button-secondary" onClick={loadTasks}>
            <RefreshCw size={17} />
            Refresh
          </button>
          {isManager && (
            <button
              className="task-button task-button-primary"
              onClick={() => {
                setError("");
                setShowForm(true);
              }}
            >
              <Plus size={18} />
              Assign task
            </button>
          )}
        </div>
      </section>

      {error && (
        <div className="task-alert task-alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="Dismiss error">
            <X size={17} />
          </button>
        </div>
      )}

      {notice && (
        <div className="task-alert task-alert-success">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss message">
            <X size={17} />
          </button>
        </div>
      )}

      <section className="task-stats">
        <article className="task-stat-card">
          <span className="task-stat-icon task-stat-blue"><ClipboardList size={21} /></span>
          <div>
            <span>Total tasks</span>
            <strong>{tasks.length}</strong>
          </div>
        </article>
        <article className="task-stat-card">
          <span className="task-stat-icon task-stat-orange"><Clock3 size={21} /></span>
          <div>
            <span>In progress</span>
            <strong>{pendingCount}</strong>
          </div>
        </article>
        <article className="task-stat-card">
          <span className="task-stat-icon task-stat-purple"><Send size={21} /></span>
          <div>
            <span>Awaiting review</span>
            <strong>{reviewCount}</strong>
          </div>
        </article>
        <article className="task-stat-card">
          <span className="task-stat-icon task-stat-green"><CheckCircle2 size={21} /></span>
          <div>
            <span>Approved</span>
            <strong>{completedCount}</strong>
          </div>
        </article>
      </section>

      <section className="task-workspace">
        <div className="task-toolbar">
          <div className="task-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks or employees..."
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter tasks by status"
          >
            <option value="ALL">All statuses</option>
            <option value="TODO">To do</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="SUBMITTED">Awaiting review</option>
            <option value="REVISION_REQUESTED">Revision requested</option>
            <option value="APPROVED">Approved</option>
          </select>
        </div>

        {loading ? (
          <div className="task-empty">
            <RefreshCw className="task-loading-icon" size={28} />
            <p>Loading your tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="task-empty">
            <span className="task-empty-icon"><ClipboardList size={30} /></span>
            <h3>No tasks found</h3>
            <p>
              {search || statusFilter !== "ALL"
                ? "Try changing your search or filter."
                : "Tasks will appear here when they are assigned."}
            </p>
          </div>
        ) : (
          <div className="task-table-wrap">
            <table className="task-table">
              <thead>
                <tr>
                  <th>Task</th>
                  {isManager && <th>Employee</th>}
                  <th>Priority</th>
                  <th>Deadline</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <div className="task-title-cell">
                        <strong>{task.title}</strong>
                        <span>{task.description || "No description provided"}</span>
                      </div>
                    </td>
                    {isManager && <td>{task.employeeName || "Employee"}</td>}
                    <td>
                      <span className={`task-priority priority-${String(task.priority || "MEDIUM").toLowerCase()}`}>
                        {task.priority || "MEDIUM"}
                      </span>
                    </td>
                    <td>{formatDate(task.dueDate)}</td>
                    <td>
                      <div className="task-progress-cell">
                        <div className="task-progress-track">
                          <span style={{ width: `${Math.max(0, Math.min(100, task.progress || 0))}%` }} />
                        </div>
                        <small>{task.progress || 0}%</small>
                      </div>
                    </td>
                    <td>
                      <span className={`task-status status-${String(task.status || "TODO").toLowerCase()}`}>
                        {statusLabel(task.status)}
                      </span>
                    </td>
                    <td>
                      {isManager && task.status === "SUBMITTED" ? (
                        <button className="task-row-button" onClick={() => openProgress(task)}>
                          Review
                        </button>
                      ) : !isManager && !["SUBMITTED", "APPROVED"].includes(task.status) ? (
                        <button className="task-row-button" onClick={() => openProgress(task)}>
                          Update
                        </button>
                      ) : (
                        <button className="task-row-button task-row-button-muted" onClick={() => openProgress(task)}>
                          Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <div className="task-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowForm(false);
        }}>
          <section className="task-modal">
            <div className="task-modal-heading">
              <div>
                <span className="task-eyebrow">NEW ASSIGNMENT</span>
                <h2>Assign a task</h2>
              </div>
              <button className="task-icon-button" onClick={() => setShowForm(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="task-form">
              <label>
                Employee ID
                <input
                  name="employeeId"
                  type="number"
                  min="1"
                  value={form.employeeId}
                  onChange={updateForm}
                  placeholder="Enter employee ID"
                  required
                />
              </label>

              <label>
                Task title
                <input
                  name="title"
                  value={form.title}
                  onChange={updateForm}
                  maxLength="200"
                  placeholder="e.g. Prepare monthly report"
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateForm}
                  rows="3"
                  placeholder="Describe the expected work..."
                />
              </label>

              <div className="task-form-grid">
                <label>
                  Priority
                  <select name="priority" value={form.priority} onChange={updateForm}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </label>

                <label>
                  Due date
                  <input
                    name="dueDate"
                    type="date"
                    min={new Date().toLocaleDateString("en-CA")}
                    value={form.dueDate}
                    onChange={updateForm}
                  />
                </label>
              </div>

              <div className="task-modal-actions">
                <button type="button" className="task-button task-button-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="task-button task-button-primary" disabled={saving}>
                  {saving ? "Assigning..." : "Assign task"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selectedTask && (
        <div className="task-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedTask(null);
        }}>
          <section className="task-modal">
            <div className="task-modal-heading">
              <div>
                <span className="task-eyebrow">TASK #{selectedTask.id}</span>
                <h2>{selectedTask.title}</h2>
              </div>
              <button className="task-icon-button" onClick={() => setSelectedTask(null)} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <p className="task-modal-description">
              {selectedTask.description || "No description provided."}
            </p>

            <div className="task-detail-grid">
              <div><span>Assigned to</span><strong>{selectedTask.employeeName}</strong></div>
              <div><span>Due date</span><strong>{formatDate(selectedTask.dueDate)}</strong></div>
              <div><span>Priority</span><strong>{selectedTask.priority}</strong></div>
              <div><span>Status</span><strong>{statusLabel(selectedTask.status)}</strong></div>
            </div>

            {!isManager && !["SUBMITTED", "APPROVED"].includes(selectedTask.status) && (
              <form className="task-form" onSubmit={handleProgressSave}>
                <label>
                  Progress: {progress}%
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progress}
                    onChange={(event) => setProgress(Number(event.target.value))}
                  />
                </label>
                <label>
                  Work notes
                  <textarea
                    rows="3"
                    value={submissionNotes}
                    onChange={(event) => setSubmissionNotes(event.target.value)}
                    placeholder="Describe your progress or completed work..."
                  />
                </label>
                <div className="task-modal-actions">
                  <button type="button" className="task-button task-button-secondary" onClick={() => setSelectedTask(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="task-button task-button-primary" disabled={saving}>
                    {saving ? "Saving..." : progress === 100 ? "Submit for review" : "Save progress"}
                  </button>
                </div>
              </form>
            )}

            {isManager && selectedTask.status === "SUBMITTED" && (
              <div className="task-form">
                <div className="task-submission-notes">
                  <strong>Employee submission</strong>
                  <p>{selectedTask.submissionNotes || "No submission notes provided."}</p>
                </div>
                <label>
                  Review feedback
                  <textarea
                    rows="3"
                    value={reviewFeedback}
                    onChange={(event) => setReviewFeedback(event.target.value)}
                    placeholder="Provide feedback to the employee..."
                  />
                </label>
                <label>
                  Performance rating: {rating}/5
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={rating}
                    onChange={(event) => setRating(Number(event.target.value))}
                  />
                  <span className="task-rating-display"><Star size={16} /> {rating} out of 5</span>
                </label>
                <div className="task-modal-actions task-review-actions">
                  <button
                    type="button"
                    className="task-button task-button-secondary"
                    disabled={saving}
                    onClick={() => handleReview(selectedTask, "REVISION_REQUESTED")}
                  >
                    Request revision
                  </button>
                  <button
                    type="button"
                    className="task-button task-button-primary"
                    disabled={saving}
                    onClick={() => handleReview(selectedTask, "APPROVED")}
                  >
                    <CheckCircle2 size={17} />
                    Approve task
                  </button>
                </div>
              </div>
            )}

            {selectedTask.status === "APPROVED" && (
              <div className="task-review-result">
                <strong><CheckCircle2 size={18} /> Task approved</strong>
                <p>{selectedTask.reviewerFeedback || "No reviewer feedback provided."}</p>
                {selectedTask.performanceRating && (
                  <span><Star size={16} /> Rating: {selectedTask.performanceRating}/5</span>
                )}
              </div>
            )}

            {selectedTask.status === "REVISION_REQUESTED" && (
              <div className="task-review-result">
                <strong>Revision requested</strong>
                <p>{selectedTask.reviewerFeedback || "Please update your task."}</p>
              </div>
            )}

            {isManager && selectedTask.status !== "SUBMITTED" && (
              <div className="task-modal-actions">
                <button className="task-button task-button-secondary" onClick={() => setSelectedTask(null)}>
                  Close
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

export default TaskManagement;
