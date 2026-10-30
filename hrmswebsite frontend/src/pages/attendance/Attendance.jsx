import { useCallback, useEffect, useState } from "react";
import {FiCalendar,FiClock,FiLogIn,FiLogOut,FiRefreshCw,FiSearch,FiCheckCircle,} from "react-icons/fi";
import attendanceService from "../../services/attendanceService";
import "./Attendance.css";
function getToday() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
function formatDate(value) {
  if (!value) return "—";
  return new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}
function formatTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function getWorkingMinutes(record) {
  if (!record?.checkIn) return 0;
  const start = new Date(record.checkIn).getTime();
  const end = record.checkOut
    ? new Date(record.checkOut).getTime()
    : Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return 0;
  }
  return Math.floor((end - start) / 60000);
}
function formatDuration(minutes) {
  if (minutes <= 0) return "0h 0m";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
function readUser() {
  try {
    return JSON.parse(sessionStorage.getItem("hrms-user") || "{}");
  } catch {
    return {};
  }
}
function getErrorMessage(error, fallback) {
  return error?.message || fallback;
}
export default function Attendance() {
  const [user] = useState(readUser);
  const [employeeId, setEmployeeId] = useState(
    String(user.employeeId || "")
  );
  const [identityLoading, setIdentityLoading] = useState(() => {
    const currentRole = String(user.role || "")
      .replace(/^ROLE_/, "")
      .toUpperCase();
    return currentRole === "EMPLOYEE" || currentRole === "TEAM_LEADER";
  });
  const [records, setRecords] = useState([]);
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState(getToday());
  const [presentDays, setPresentDays] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const role = String(user.role || "")
    .replace(/^ROLE_/, "")
    .toUpperCase();
  const canViewAll = role === "ADMIN" || role === "HR_MANAGER";
  const isSelfServiceRole =
    role === "EMPLOYEE" || role === "TEAM_LEADER";
  const effectiveEmployeeId = employeeId.trim();
  useEffect(() => {
    if (!isSelfServiceRole) {
      setIdentityLoading(false);
      return;
    }
    let cancelled = false;
    async function resolveEmployee() {
      setIdentityLoading(true);
      setError("");
      try {
        const result = await attendanceService.getMyEmployee();
        if (cancelled) return;
        if (!result?.employeeId) {
          throw new Error("No employee record was returned for your login account. Contact HR.");
        }
        const id = String(result.employeeId);
        setEmployeeId(id);
        sessionStorage.setItem(
          "hrms-user",
          JSON.stringify({
            ...user,
            employeeId: result.employeeId,
            email: result.email || user.email,
          })
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            getErrorMessage(err,"Unable to identify your employee record."));
        }
      } finally {
        if (!cancelled) {
          setIdentityLoading(false);
        }
      }
    }
    resolveEmployee();
    return () => {
      cancelled = true;
    };
  }, [isSelfServiceRole, user]);
  const loadAttendanceFor = useCallback(
    async (id) => {
      if (isSelfServiceRole && !id) return;
      setLoading(true);
      setError("");
      try {
        let data;
        if (canViewAll && !id) {
          data = await attendanceService.getAll();
        } else if (id) {
          data = await attendanceService.getByEmployee(id);
        } else {
          setRecords([]);
          setPresentDays(null);
          return;
        }
        setRecords(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(getErrorMessage(err, "Unable to load attendance."));
      } finally {
        setLoading(false);
      }
    },
    [canViewAll, isSelfServiceRole]
  );
  const loadAttendance = useCallback(() => {
    return loadAttendanceFor(effectiveEmployeeId);
  }, [effectiveEmployeeId, loadAttendanceFor]);
  const loadPresentDays = useCallback(async () => {
    if (!effectiveEmployeeId) {
      setPresentDays(null);
      return;
    }
    try {
      const total = await attendanceService.getPresentDays(
        effectiveEmployeeId
      );
      setPresentDays(
        typeof total === "number"
          ? total
          : Number(total?.presentDays ?? total?.count ?? 0)
      );
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load present days."));
    }
  }, [effectiveEmployeeId]);
  useEffect(() => {
    if (identityLoading) return;
    if (isSelfServiceRole && !effectiveEmployeeId) return;
    if (canViewAll || effectiveEmployeeId) {
      loadAttendance();
      if (effectiveEmployeeId) {
        loadPresentDays();
      }
    }
  }, [
    identityLoading,
    isSelfServiceRole,
    canViewAll,
    effectiveEmployeeId,
    loadAttendance,
    loadPresentDays,
  ]);
  async function searchEmployee() {
    const id = employeeId.trim();
    if (!id && !canViewAll) {
      setError("Enter an employee ID to search attendance.");
      return;
    }
    setMessage("");
    await loadAttendanceFor(id);
  }
  async function loadDateRange() {
    if (!effectiveEmployeeId) {
      setError(
        isSelfServiceRole
          ? "Your employee record could not be resolved. Contact HR."
          : "Enter an employee ID to search attendance."
      );
      return;
    }
    if (startDate > endDate) {
      setError("Start date must be before or equal to end date.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const data = await attendanceService.getByRange(
        effectiveEmployeeId,
        startDate,
        endDate
      );
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to load the selected date range.")
      );
    } finally {
      setLoading(false);
    }
  }
  async function handleAttendanceAction(action) {
    if (!effectiveEmployeeId) {
      setError(
        isSelfServiceRole
          ? "Your employee record could not be resolved. Contact HR."
          : "Enter an employee ID first."
      );
      return;
    }
    setActionLoading(action);
    setError("");
    setMessage("");
    try {
      if (action === "check-in") {
        await attendanceService.checkIn(effectiveEmployeeId);
        setMessage("Check-in recorded successfully.");
      } else {
        await attendanceService.checkOut(effectiveEmployeeId);
        setMessage("Check-out recorded successfully.");
      }
      await loadAttendanceFor(effectiveEmployeeId);
      await loadPresentDays();
    } catch (err) {
      setError(getErrorMessage(err, "Attendance action failed."));
    } finally {
      setActionLoading("");
    }
  }
  const today = getToday();
  const todayRecord = records.find(
    (record) =>
      String(record.attendanceDate || "").slice(0, 10) === today &&
      (!effectiveEmployeeId ||
        String(record.employeeId) === effectiveEmployeeId));
  const checkedInToday = Boolean(todayRecord?.checkIn);
  const checkedOutToday = Boolean(todayRecord?.checkOut);
  const workingMinutes = getWorkingMinutes(todayRecord);
  const canCheckIn = !checkedInToday && !actionLoading && !loading && !identityLoading;
  const canCheckOut = checkedInToday && !checkedOutToday && !actionLoading && !loading && !identityLoading;
  return (
    <main className="attendance-page">
      <section className="attendance-heading">
        <div>
          <span className="attendance-eyebrow">TIME & PRESENCE</span>
          <h1>Attendance</h1>
          <p>Manage check-ins, check-outs, and attendance history.</p>
        </div>
        <div className="attendance-today">
          <FiCalendar />
          <span>
            {new Date().toLocaleDateString("en-IN", {
              weekday: "short",
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </section>
      {error && (
        <div className="attendance-alert attendance-alert-error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="attendance-alert attendance-alert-success" role="status">
          {message}
        </div>
      )}
      <section className="attendance-summary">
        <article className="attendance-stat">
          <div className="attendance-stat-icon purple">
            <FiCalendar />
          </div>
          <div>
            <span>Records loaded</span>
            <strong>{records.length}</strong>
          </div>
        </article>
        <article className="attendance-stat">
          <div className="attendance-stat-icon green">
            <FiCheckCircle />
          </div>
          <div>
            <span>Present days</span>
            <strong>{presentDays === null ? "—" : presentDays}</strong>
          </div>
        </article>
        <article className="attendance-stat">
          <div className="attendance-stat-icon blue">
            <FiClock />
          </div>
          <div>
            <span>Today's working time</span>
            <strong>{formatDuration(workingMinutes)}</strong>
          </div>
        </article>
      </section>
      <section className="attendance-panel">
        <div className="attendance-panel-heading">
          <div>
            <h2>Attendance actions</h2>
            <p>
              {isSelfServiceRole
                ? "Record your own attendance."
                : "Use an employee ID to manage or view attendance."}
            </p>
          </div>
        </div>
        {!isSelfServiceRole && (
          <>
            <label className="attendance-label" htmlFor="attendance-employee-id">
              Employee ID
            </label>
            <div className="attendance-search-row">
              <input
                id="attendance-employee-id"
                type="number"
                min="1"
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
                placeholder="Enter employee ID"
              />
              <button
                type="button"
                className="attendance-button secondary"
                onClick={searchEmployee}
                disabled={loading || identityLoading}
              >
                <FiSearch /> Search
              </button>
            </div>
          </>
        )}
        {isSelfServiceRole && identityLoading && (
          <p>Finding your employee record...</p>
        )}
        <div className="attendance-today-status">
          <span className="attendance-status-icon">
            {checkedOutToday ? <FiCheckCircle /> : <FiClock />}
          </span>
          <div>
            <strong>
              {checkedOutToday
                ? "Attendance completed"
                : checkedInToday
                  ? "You are checked in"
                  : "Not checked in yet"}
            </strong>
            <p>
              Check-in: {formatTime(todayRecord?.checkIn)} · Check-out:{" "}
              {formatTime(todayRecord?.checkOut)}
            </p>
          </div>
        </div>
        <div className="attendance-actions">
          <button
            type="button"
            className="attendance-button primary"
            onClick={() => handleAttendanceAction("check-in")}
            disabled={!canCheckIn || !effectiveEmployeeId}
          >
            <FiLogIn />
            {actionLoading === "check-in" ? "Checking in..." : "Check in"}
          </button>
          <button
            type="button"
            className="attendance-button dark"
            onClick={() => handleAttendanceAction("check-out")}
            disabled={!canCheckOut || !effectiveEmployeeId}
          >
            <FiLogOut />
            {actionLoading === "check-out" ? "Checking out..." : "Check out"}
          </button>
          <button
            type="button"
            className="attendance-button secondary"
            onClick={loadPresentDays}
            disabled={loading || identityLoading || !effectiveEmployeeId}
          >
            <FiRefreshCw /> Refresh present days
          </button>
        </div>
      </section>
      <section className="attendance-panel">
        <div className="attendance-panel-heading">
          <div>
            <h2>Filter attendance</h2>
            <p>Find attendance records within a date range.</p>
          </div>
        </div>
        <div className="attendance-filter-grid">
          <div>
            <label className="attendance-label" htmlFor="attendance-start-date">
              Start date
            </label>
            <input
              id="attendance-start-date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
          <div>
            <label className="attendance-label" htmlFor="attendance-end-date">
              End date
            </label>
            <input
              id="attendance-end-date"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
          <button
            type="button"
            className="attendance-button primary attendance-filter-button"
            onClick={loadDateRange}
            disabled={loading || identityLoading || !effectiveEmployeeId}
          >
            <FiSearch /> Apply filter
          </button>
        </div>
      </section>
      <section className="attendance-panel attendance-table-panel">
        <div className="attendance-panel-heading">
          <div>
            <h2>Attendance history</h2>
            <p>
              {canViewAll
                ? "All employee attendance records or selected employee records"
                : "Your attendance records"}
            </p>
          </div>
          <button
            type="button"
            className="attendance-button secondary"
            onClick={loadAttendance}
            disabled={loading || identityLoading}
          >
            <FiRefreshCw /> {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
        <div className="attendance-table-wrap">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Date</th>
                <th>Check in</th>
                <th>Check out</th>
                <th>Working time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>EMP-{String(record.employeeId).padStart(3, "0")}</td>
                  <td>{formatDate(record.attendanceDate)}</td>
                  <td>{formatTime(record.checkIn)}</td>
                  <td>{formatTime(record.checkOut)}</td>
                  <td>
                    {record.checkIn
                      ? formatDuration(getWorkingMinutes(record))
                      : "—"}
                  </td>
                  <td>
                    <span
                      className={`attendance-status ${String(
                        record.status || ""
                      )
                        .toLowerCase()
                        .replaceAll("-", "_")}`}
                    >
                      {String(record.status || "—").replaceAll("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && records.length === 0 && (
                <tr>
                  <td colSpan="6" className="attendance-empty">
                    {identityLoading
                      ? "Finding your employee record..."
                      : "No attendance records to display."}
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan="6" className="attendance-empty">
                    Loading attendance records...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
