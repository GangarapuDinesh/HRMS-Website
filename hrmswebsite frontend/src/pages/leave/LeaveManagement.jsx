import { useCallback, useEffect, useState } from "react";
import { FiCalendar,FiCheckCircle,FiClock,FiXCircle,FiPlus,FiRefreshCw,FiCheck,FiX,FiFileText,} from "react-icons/fi";
import leaveService from "../../services/leaveService";
import "./LeaveManagement.css";
const initialForm = {
  leaveType: "CASUAL",
  startDate: "",
  endDate: "",
  reason: "",
};
function readStoredUser() {
  const keys = ["hrms-user", "user"];
  for (const storage of [sessionStorage, localStorage]) {
    for (const key of keys) {
      const value = storage.getItem(key);
     if (!value) continue;
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      } catch {
        continue;
      }
    }
  }
  return {};
}
function normalizeRole(value) {
  return String(value || "")
    .trim()
    .replace(/^ROLE_/i, "")
    .toUpperCase();
}
function getCurrentRole(user) {
  const storedUser = readStoredUser();
 return normalizeRole(
    user?.role ||
      user?.authorities?.[0]?.authority ||
      storedUser?.role ||
      storedUser?.authorities?.[0]?.authority ||
      sessionStorage.getItem("hrms-role") ||
      localStorage.getItem("hrms-role") ||
      "EMPLOYEE"
  );
}

function formatDate(value) {
  if (!value) return "—";

  const dateValue =
    String(value).length === 10 ? `${value}T00:00:00` : value;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getEmployeeName(leave) {
  return leave.employee?.fullName || leave.employee?.name || "Employee";
}

function getEmployeeEmail(leave) {
  return leave.employee?.email || "";
}

function getErrorMessage(error) {
  const message = error?.message || "Something went wrong.";

  try {
    const parsed = JSON.parse(message);
    return parsed.detail || parsed.message || message;
  } catch {
    return message;
  }
}

function getTodayString() {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function LeaveManagement({ user }) {
  const [form, setForm] = useState(initialForm);
  const [leaves, setLeaves] = useState([]);
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewComments, setReviewComments] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const role = getCurrentRole(user);
  const isHR = ["ADMIN", "HR_MANAGER"].includes(role);
  const today = getTodayString();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (isHR) {
        const data = await leaveService.getAllLeaves(
          filter === "ALL" ? undefined : filter
        );

        setLeaves(Array.isArray(data) ? data : []);
      } else {
        const [leaveResult, countResult] = await Promise.allSettled([
          leaveService.getMyLeaves(),
          leaveService.getMyLeaveCounts(),
        ]);

        if (leaveResult.status === "rejected") {
          throw leaveResult.reason;
        }

        setLeaves(
          Array.isArray(leaveResult.value) ? leaveResult.value : []
        );

        if (countResult.status === "fulfilled") {
          setCounts({
            pending: countResult.value?.pending ?? 0,
            approved: countResult.value?.approved ?? 0,
            rejected: countResult.value?.rejected ?? 0,
          });
        } else {
          const myLeaves = Array.isArray(leaveResult.value)
            ? leaveResult.value
            : [];

          setCounts({
            pending: myLeaves.filter(
              (leave) => leave.status === "PENDING"
            ).length,
            approved: myLeaves.filter(
              (leave) => leave.status === "APPROVED"
            ).length,
            rejected: myLeaves.filter(
              (leave) => leave.status === "REJECTED"
            ).length,
          });
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filter, isHR]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "startDate" && previous.endDate && value > previous.endDate
        ? { endDate: "" }
        : {}),
    }));
  };

  const handleApply = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      setError("Please complete all required leave details.");
      return;
    }

    if (form.startDate < today) {
      setError("Start date cannot be in the past.");
      return;
    }

    if (form.endDate < form.startDate) {
      setError("End date cannot be before the start date.");
      return;
    }

    setSubmitting(true);

    try {
      await leaveService.applyForLeave({
        ...form,
        reason: form.reason.trim(),
      });

      setForm(initialForm);
      setSuccess("Your leave application was submitted successfully.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (id, decision) => {
    setError("");
    setSuccess("");
    setReviewingId(id);

    try {
      await leaveService.reviewLeave(
        id,
        decision,
        reviewComments[id] || ""
      );

      setSuccess(
        decision === "APPROVED"
          ? "Leave request approved successfully."
          : "Leave request rejected successfully."
      );

      setReviewComments((previous) => {
        const next = { ...previous };
        delete next[id];
        return next;
      });

      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReviewingId(null);
    }
  };

  const totalLeaves = leaves.length;

  const pendingLeaves = isHR
    ? leaves.filter((leave) => leave.status === "PENDING").length
    : counts.pending;

  const approvedLeaves = isHR
    ? leaves.filter((leave) => leave.status === "APPROVED").length
    : counts.approved;

  const rejectedLeaves = isHR
    ? leaves.filter((leave) => leave.status === "REJECTED").length
    : counts.rejected;

  return (
    <main className="leave-page">
      <section className="leave-header">
        <div>
          <span className="leave-eyebrow">PEOPLE OPERATIONS</span>
          <h1>Leave Management</h1>
          <p>
            {isHR
              ? "Manage employee leave applications and review requests."
              : "Apply for leave, track your requests, and view approval status."}
          </p>
        </div>

        <button
          type="button"
          className="leave-refresh-button"
          onClick={loadData}
          disabled={loading}
        >
          <FiRefreshCw className={loading ? "leave-spinning" : ""} />
          Refresh
        </button>
      </section>

      {error && (
        <div className="leave-alert leave-alert-error" role="alert">
          <FiXCircle />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <FiX />
          </button>
        </div>
      )}

      {success && (
        <div className="leave-alert leave-alert-success" role="status">
          <FiCheckCircle />
          <span>{success}</span>
          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success"
          >
            <FiX />
          </button>
        </div>
      )}

      <section className="leave-stats">
        <article className="leave-stat-card">
          <div className="leave-stat-icon leave-icon-blue">
            <FiFileText />
          </div>
          <div>
            <span>{isHR ? "Displayed Requests" : "My Requests"}</span>
            <strong>{totalLeaves}</strong>
          </div>
        </article>

        <article className="leave-stat-card">
          <div className="leave-stat-icon leave-icon-orange">
            <FiClock />
          </div>
          <div>
            <span>Pending</span>
            <strong>{pendingLeaves}</strong>
          </div>
        </article>

        <article className="leave-stat-card">
          <div className="leave-stat-icon leave-icon-green">
            <FiCheckCircle />
          </div>
          <div>
            <span>Approved</span>
            <strong>{approvedLeaves}</strong>
          </div>
        </article>

        <article className="leave-stat-card">
          <div className="leave-stat-icon leave-icon-red">
            <FiXCircle />
          </div>
          <div>
            <span>Rejected</span>
            <strong>{rejectedLeaves}</strong>
          </div>
        </article>
      </section>

      {!isHR && (
        <section className="leave-panel leave-application-panel">
          <div className="leave-section-heading">
            <div className="leave-heading-icon">
              <FiPlus />
            </div>
            <div>
              <h2>Apply for Leave</h2>
              <p>Fill in your leave details below.</p>
            </div>
          </div>

          <form className="leave-form" onSubmit={handleApply}>
            <div className="leave-form-grid">
              <label className="leave-field">
                <span>Leave Type</span>
                <select
                  name="leaveType"
                  value={form.leaveType}
                  onChange={handleFormChange}
                  required
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="ANNUAL">Annual Leave</option>
                  <option value="PERSONAL">Personal Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                  <option value="MATERNITY">Maternity Leave</option>
                  <option value="PATERNITY">Paternity Leave</option>
                </select>
              </label>

              <label className="leave-field">
                <span>Start Date</span>
                <input
                  type="date"
                  name="startDate"
                  min={today}
                  value={form.startDate}
                  onChange={handleFormChange}
                  required
                />
              </label>

              <label className="leave-field">
                <span>End Date</span>
                <input
                  type="date"
                  name="endDate"
                  min={form.startDate || today}
                  value={form.endDate}
                  onChange={handleFormChange}
                  required
                />
              </label>

              <label className="leave-field leave-reason-field">
                <span>Reason for Leave</span>
                <textarea
                  name="reason"
                  value={form.reason}
                  onChange={handleFormChange}
                  placeholder="Explain why you need leave..."
                  rows={3}
                  maxLength={1000}
                  required
                />
              </label>
            </div>

            {form.startDate &&
              form.endDate &&
              form.endDate >= form.startDate && (
                <p className="leave-duration">
                  <FiCalendar />
                  Requested duration:{" "}
                  <strong>
                    {Math.round(
                      (new Date(`${form.endDate}T00:00:00`) -
                        new Date(`${form.startDate}T00:00:00`)) /
                        86400000
                    ) + 1}{" "}
                    calendar day(s)
                  </strong>
                </p>
              )}

            <div className="leave-form-actions">
              <button
                type="button"
                className="leave-secondary-button"
                onClick={() => setForm(initialForm)}
                disabled={submitting}
              >
                Clear
              </button>

              <button
                type="submit"
                className="leave-primary-button"
                disabled={submitting}
              >
                <FiPlus />
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="leave-panel leave-history-panel">
        <div className="leave-history-header">
          <div className="leave-section-heading">
            <div className="leave-heading-icon">
              <FiCalendar />
            </div>
            <div>
              <h2>{isHR ? "Employee Leave Requests" : "My Leave History"}</h2>
              <p>
                {isHR
                  ? "Review and process submitted leave applications."
                  : "Track your submitted leave applications."}
              </p>
            </div>
          </div>

          {isHR && (
            <select
              className="leave-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filter leave requests by status"
            >
              <option value="ALL">All Requests</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          )}
        </div>

        {loading ? (
          <div className="leave-empty-state">
            <FiRefreshCw className="leave-spinning" />
            <p>Loading leave requests...</p>
          </div>
        ) : leaves.length === 0 ? (
          <div className="leave-empty-state">
            <div className="leave-empty-icon">
              <FiCalendar />
            </div>
            <h3>No leave requests found</h3>
            <p>
              {isHR
                ? "No applications match the selected filter."
                : "Your leave applications will appear here after you submit one."}
            </p>
          </div>
        ) : (
          <div className="leave-table-wrapper">
            <table className="leave-table">
              <thead>
                <tr>
                  {isHR && <th>Employee</th>}
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  {isHR && <th>Review</th>}
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave.id}>
                    {isHR && (
                      <td>
                        <div className="leave-employee-cell">
                          <strong>{getEmployeeName(leave)}</strong>
                          <span>{getEmployeeEmail(leave)}</span>
                        </div>
                      </td>
                    )}

                    <td>
                      <span className="leave-type-label">
                        {String(leave.leaveType || "—").replaceAll("_", " ")}
                      </span>
                    </td>

                    <td>
                      <div className="leave-date-cell">
                        <span>{formatDate(leave.startDate)}</span>
                        <span>to {formatDate(leave.endDate)}</span>
                      </div>
                    </td>

                    <td>
                      <strong>{leave.totalDays ?? "—"}</strong>
                    </td>

                    <td>
                      <span
                        className="leave-reason-text"
                        title={leave.reason || ""}
                      >
                        {leave.reason || "—"}
                      </span>
                      {leave.reviewComment && (
                        <span className="leave-review-comment">
                          Review: {leave.reviewComment}
                        </span>
                      )}
                    </td>

                    <td>
                      <span
                        className={`leave-status leave-status-${String(
                          leave.status || "PENDING"
                        ).toLowerCase()}`}
                      >
                        {leave.status === "APPROVED" && <FiCheckCircle />}
                        {leave.status === "REJECTED" && <FiXCircle />}
                        {leave.status === "PENDING" && <FiClock />}
                        {leave.status || "PENDING"}
                      </span>
                    </td>

                    {isHR && (
                      <td>
                        {leave.status === "PENDING" ? (
                          <div className="leave-review-actions">
                            <input
                              type="text"
                              value={reviewComments[leave.id] || ""}
                              onChange={(event) =>
                                setReviewComments((previous) => ({
                                  ...previous,
                                  [leave.id]: event.target.value,
                                }))
                              }
                              placeholder="Optional comment"
                              aria-label={`Review comment for request ${leave.id}`}
                            />

                            <div className="leave-review-buttons">
                              <button
                                type="button"
                                className="leave-approve-button"
                                disabled={reviewingId === leave.id}
                                onClick={() =>
                                  handleReview(leave.id, "APPROVED")
                                }
                                title="Approve leave"
                              >
                                <FiCheck />
                                Approve
                              </button>

                              <button
                                type="button"
                                className="leave-reject-button"
                                disabled={reviewingId === leave.id}
                                onClick={() =>
                                  handleReview(leave.id, "REJECTED")
                                }
                                title="Reject leave"
                              >
                                <FiX />
                                Reject
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="leave-reviewed-label">
                            {leave.reviewedBy
                              ? `Reviewed by ${leave.reviewedBy}`
                              : "Reviewed"}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
