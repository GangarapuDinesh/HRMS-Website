
import { useCallback, useEffect, useState } from "react";
import {
  FiGrid,
  FiUsers,
  FiClock,
  FiCalendar,
  FiDollarSign,
  FiBriefcase,
  FiTrendingUp,
  FiFileText,
  FiSettings,
  FiBell,
  FiSearch,
  FiSun,
  FiMoon,
  FiLogOut,
  FiArrowUpRight,
  FiCheckCircle,
  FiPlus,
  FiMenu,
  FiX,
  FiActivity,
  FiClipboard,
  FiMail,
  FiMessageCircle,
  FiInfo,
  FiUser,
  FiLogIn,
  FiRefreshCw,
} from "react-icons/fi";

import Employees from "../employees/Employees";
import Attendance from "../attendance/Attendance";
import LeaveManagement from "../leave/LeaveManagement";
import PayrollManagement from "../payroll/PayrollManagement";
import Recruitment from "../recruitment/Recruitment";
import EmployeeDocuments from "../documents/EmployeeDocuments";
import PerformanceManagement from "../performance/PerformanceManagement";
import TaskManagement from "../tasks/TaskManagement";
import Mail from "../mail/Mail";
import Chat from "../chat/Chat";
import Reports from "../reports/Reports";
import Settings from "../settings/Settings";
import RealtimeNotifications from "../../components/notifications/RealtimeNotifications";
import attendanceService from "../../services/attendanceService";
import "./Dashboard.css";

const API_BASE = "http://localhost:8080/api";
const API_ORIGIN = "http://localhost:8080";

const navigation = [
  { label: "Overview", icon: FiGrid },
  { label: "Employees", icon: FiUsers },
  { label: "Employee Documents", icon: FiFileText },
  { label: "Attendance", icon: FiClock },
  { label: "Leave Management", icon: FiCalendar },
  { label: "Tasks", icon: FiClipboard },
  { label: "Mail", icon: FiMail },
  { label: "Chat", icon: FiMessageCircle },
  { label: "Payroll", icon: FiDollarSign },
  { label: "Recruitment", icon: FiBriefcase },
  { label: "Performance", icon: FiTrendingUp },
  { label: "Reports", icon: FiFileText },
  { label: "Settings", icon: FiSettings },
];

function normalizeRole(value) {
  return String(value || "EMPLOYEE")
    .replace(/^ROLE_/i, "")
    .trim()
    .replace(/[\s-]+/g, "_")
    .toUpperCase();
}

function getToken() {
  return (
    sessionStorage.getItem("hrms-token") ||
    localStorage.getItem("hrms-token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("token")
  );
}

function getHeaders() {
  const token = getToken();

  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchApi(url, options = {}) {
  const token = getToken();

  if (!token) {
    throw new Error("Your session is missing. Please log in again.");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  const responseText = await response.text();
  let data = null;

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }
  }

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.message ||
          data?.detail ||
          data?.error ||
          data?.title ||
          `Request failed with status ${response.status}`;

    if (response.status === 401) {
      throw new Error(
        "Authentication failed. Please log out and log in again."
      );
    }

    if (response.status === 403) {
      throw new Error(
        "You do not have permission to access this information."
      );
    }

    throw new Error(message);
  }

  return data;
}

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.employees)) return data.employees;
  if (Array.isArray(data?.records)) return data.records;

  return [];
}

function getTodayString() {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

function getNotificationIcon(type) {
  const value = String(type || "").toLowerCase();

  if (value.includes("mail") || value.includes("email")) {
    return <FiMail />;
  }

  if (value.includes("chat") || value.includes("message")) {
    return <FiMessageCircle />;
  }

  return <FiInfo />;
}

function formatNotificationDate(dateValue) {
  if (!dateValue) return "Just now";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPayroll(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "string" && !Number.isFinite(Number(value))) {
    return value;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function getNotificationId(notification) {
  return String(
    notification.id ??
      `${notification.type || "notification"}-${notification.title || ""}-${notification.message || ""}-${notification.receivedAt || ""}`
  );
}

function getProfilePhotoUrl(photo) {
  if (!photo || typeof photo !== "string") {
    return "";
  }

  const value = photo.trim();

  if (!value) {
    return "";
  }

  if (
    value.startsWith("data:") ||
    value.startsWith("blob:") ||
    value.startsWith("https://") ||
    value.startsWith("http://")
  ) {
    return value;
  }

  if (value.startsWith("//")) {
    return `${window.location.protocol}${value}`;
  }

  if (value.startsWith("/")) {
    return `${API_ORIGIN}${value}`;
  }

  if (value.startsWith("uploads/") || value.startsWith("images/")) {
    return `${API_ORIGIN}/${value}`;
  }

  return value;
}

function ProfileAvatar({ name, photo, className = "" }) {
  const [imageFailed, setImageFailed] = useState(false);
  const photoUrl = getProfilePhotoUrl(photo);
  const initial = String(name || "U").trim().charAt(0).toUpperCase() || "U";

  useEffect(() => {
    setImageFailed(false);
  }, [photoUrl]);

  if (photoUrl && !imageFailed) {
    return (
      <img
        src={photoUrl}
        alt={`${name || "User"} profile`}
        className={`${className} profile-avatar-image`}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return <span className={className}>{initial}</span>;
}

function Dashboard({ user, onLogout }) {
  const [activePage, setActivePage] = useState("Overview");
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [profileUpdates, setProfileUpdates] = useState({});
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const [resolvedEmployeeId, setResolvedEmployeeId] = useState(
    user?.employeeId ?? user?.employee?.id ?? user?.employeeRecordId ?? null
  );

  const [employeeIdLoading, setEmployeeIdLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceActionLoading, setAttendanceActionLoading] = useState("");
  const [attendanceMessage, setAttendanceMessage] = useState("");

  const [stats, setStats] = useState({
    employees: "—",
    present: "—",
    leaveRequests: "—",
    payroll: "—",
  });

  const displayName =
    profileUpdates.fullName?.trim() ||
    user?.fullName?.trim() ||
    "User";

  const displayEmail =
    profileUpdates.email ||
    user?.email ||
    "No email available";

  const displayPhoto =
    profileUpdates.profilePhoto ??
    user?.profilePhoto ??
    user?.profilePicture ??
    user?.photoUrl ??
    "";

  const firstName = displayName.split(/\s+/)[0];
  const normalizedRole = normalizeRole(user?.role);

  const role = normalizedRole
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const canViewAll = ["ADMIN", "HR", "HR_MANAGER"].includes(normalizedRole);

  const isSelfServiceRole = ["EMPLOYEE", "TEAM_LEADER"].includes(
    normalizedRole
  );

  const handleProfileUpdated = useCallback((updatedProfile) => {
    if (!updatedProfile) return;

    setProfileUpdates((current) => ({
      ...current,
      ...updatedProfile,
    }));
  }, []);

  const handleIncomingNotification = useCallback((notification) => {
    if (!notification || typeof notification !== "object") return;

    const id = getNotificationId(notification);

    setNotifications((current) => {
      const existing = current.find(
        (item) => getNotificationId(item) === id
      );

      if (existing) {
        return current.map((item) =>
          getNotificationId(item) === id
            ? {
                ...item,
                ...notification,
                id,
                read: item.read,
              }
            : item
        );
      }

      return [
        ...current,
        {
          ...notification,
          id,
          read: Boolean(notification.read),
          receivedAt:
            notification.receivedAt || new Date().toISOString(),
        },
      ].slice(-50);
    });
  }, []);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const markNotificationAsRead = useCallback((id) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const selectPage = useCallback(
    (label) => {
      if (label === "Reports" && !canViewAll) {
        setNotice(
          "You do not have permission to view organization-wide HR reports."
        );
        return;
      }

      setActivePage(label);
      setSidebarOpen(false);
      setNotificationsOpen(false);
      setProfileMenuOpen(false);
      setNotice("");
      setWorkspaceSearch("");
    },
    [canViewAll]
  );

  const loadDashboardStats = useCallback(async () => {
    if (!getToken()) {
      setStats({
        employees: "—",
        present: "—",
        leaveRequests: "—",
        payroll: "—",
      });

      setStatsLoading(false);
      setNotice("Your session is missing. Please log in again.");
      return;
    }

    if (!canViewAll) {
      setStats({
        employees: "—",
        present: "—",
        leaveRequests: "—",
        payroll: "—",
      });

      setStatsLoading(false);
      return;
    }

    setStatsLoading(true);

    try {
      const results = await Promise.allSettled([
        fetchApi(`${API_BASE}/employees`),
        fetchApi(`${API_BASE}/attendance`),
        fetchApi(`${API_BASE}/leaves?status=PENDING`),
        fetchApi(`${API_BASE}/payroll/summary`),
      ]);

      const [
        employeesResult,
        attendanceResult,
        leavesResult,
        payrollResult,
      ] = results;

      const employees =
        employeesResult.status === "fulfilled"
          ? getList(employeesResult.value)
          : [];

      const attendance =
        attendanceResult.status === "fulfilled"
          ? getList(attendanceResult.value)
          : [];

      const leaves =
        leavesResult.status === "fulfilled"
          ? getList(leavesResult.value)
          : [];

      const payrollData =
        payrollResult.status === "fulfilled"
          ? payrollResult.value
          : null;

      const todayString = getTodayString();

      const presentToday = attendance.filter((record) => {
        const attendanceDate = String(
          record.attendanceDate || record.date || ""
        ).slice(0, 10);

        return (
          attendanceDate === todayString &&
          String(record.status || "").toUpperCase() === "PRESENT"
        );
      }).length;

      setStats({
        employees:
          employeesResult.status === "fulfilled"
            ? employees.length
            : "—",
        present:
          attendanceResult.status === "fulfilled"
            ? presentToday
            : "—",
        leaveRequests:
          leavesResult.status === "fulfilled"
            ? leaves.length
            : "—",
        payroll:
          payrollResult.status === "fulfilled"
            ? formatPayroll(
                payrollData?.total ??
                  payrollData?.totalPayroll ??
                  payrollData?.amount
              )
            : "—",
      });

      const failures = results.filter(
        (result) => result.status === "rejected"
      );

      if (failures.length > 0) {
        const authenticationFailure = failures.some((result) =>
          /authentication|log in again|session is missing/i.test(
            result.reason?.message || ""
          )
        );

        setNotice(
          authenticationFailure
            ? "Your session may have expired. Please log in again."
            : "Some dashboard statistics could not be loaded. Check your backend connection and permissions."
        );
      }
    } catch (error) {
      setNotice(error.message || "Unable to load dashboard statistics.");
    } finally {
      setStatsLoading(false);
    }
  }, [canViewAll]);

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  useEffect(() => {
    let cancelled = false;

    async function resolveEmployeeId() {
      const suppliedId =
        user?.employeeId ??
        user?.employee?.id ??
        user?.employeeRecordId ??
        null;

      if (
        suppliedId !== null &&
        suppliedId !== undefined &&
        suppliedId !== ""
      ) {
        setResolvedEmployeeId(suppliedId);
        setEmployeeIdLoading(false);
        return;
      }

      setResolvedEmployeeId(null);

      if (!getToken()) {
        setEmployeeIdLoading(false);
        return;
      }

      if (!isSelfServiceRole && !canViewAll) {
        setEmployeeIdLoading(false);
        return;
      }

      setEmployeeIdLoading(true);

      try {
        let employeeId = null;

        if (isSelfServiceRole) {
          const result = await attendanceService.getMyEmployee();

          employeeId =
            result?.employeeId ??
            result?.employee?.id ??
            result?.id ??
            null;
        } else if (canViewAll && user?.email) {
          const result = await fetchApi(`${API_BASE}/employees`);
          const employees = getList(result);

          const matchingEmployee = employees.find(
            (employee) =>
              String(employee.email || "").trim().toLowerCase() ===
              String(user.email).trim().toLowerCase()
          );

          employeeId = matchingEmployee?.id ?? null;
        }

        if (cancelled) return;

        setResolvedEmployeeId(employeeId);

        if (employeeId == null) {
          setNotice(
            "No linked employee record was found. Ask an administrator to link your login account to an employee record."
          );
        }
      } catch (error) {
        if (!cancelled) {
          setResolvedEmployeeId(null);
          setNotice(`Unable to find your employee record: ${error.message}`);
        }
      } finally {
        if (!cancelled) {
          setEmployeeIdLoading(false);
        }
      }
    }

    resolveEmployeeId();

    return () => {
      cancelled = true;
    };
  }, [
    user?.employeeId,
    user?.employee?.id,
    user?.employeeRecordId,
    user?.email,
    isSelfServiceRole,
    canViewAll,
  ]);

  function handleWorkspaceSearch(event) {
    setWorkspaceSearch(event.target.value);
    setNotice("");
  }

  function openMatchingPage() {
    const value = workspaceSearch.trim().toLowerCase();

    if (!value) return;

    const matchingPage = navigation.find((item) =>
      item.label.toLowerCase().includes(value)
    );

    if (!matchingPage) {
      setNotice("No matching workspace module found.");
      return;
    }

    selectPage(matchingPage.label);
  }

  const summaryCards = [
    {
      title: "Total Employees",
      value: stats.employees,
      note: "Employee records",
      icon: FiUsers,
      color: "blue",
    },
    {
      title: "Present Today",
      value: stats.present,
      note: "Attendance records",
      icon: FiCheckCircle,
      color: "green",
    },
    {
      title: "Leave Requests",
      value: stats.leaveRequests,
      note: "Pending approvals",
      icon: FiCalendar,
      color: "orange",
    },
    {
      title: "Monthly Payroll",
      value: stats.payroll,
      note: "Payroll records",
      icon: FiDollarSign,
      color: "purple",
    },
  ];

  async function refreshTodayAttendance() {
    if (resolvedEmployeeId == null || resolvedEmployeeId === "") {
      setAttendanceMessage(
        employeeIdLoading
          ? "Finding your employee record..."
          : "No linked employee record was found."
      );
      return;
    }

    setAttendanceLoading(true);
    setAttendanceMessage("");

    try {
      const data = await attendanceService.getByEmployee(
        String(resolvedEmployeeId)
      );

      const records = getList(data);
      const today = getTodayString();

      const record = records.find(
        (item) =>
          String(item.attendanceDate || item.date || "").slice(0, 10) ===
          today
      );

      setTodayAttendance(record || null);
    } catch (error) {
      setAttendanceMessage(
        error.message || "Unable to refresh today's attendance."
      );
    } finally {
      setAttendanceLoading(false);
    }
  }

  async function handleOverviewAttendance(action) {
    if (resolvedEmployeeId == null || resolvedEmployeeId === "") {
      setAttendanceMessage("Your employee record is not available.");
      return;
    }

    setAttendanceActionLoading(action);
    setAttendanceMessage("");

    try {
      if (action === "check-in") {
        await attendanceService.checkIn(String(resolvedEmployeeId));
      } else {
        await attendanceService.checkOut(String(resolvedEmployeeId));
      }

      setAttendanceMessage(
        action === "check-in"
          ? "Clock In recorded successfully."
          : "Clock Out recorded successfully."
      );

      await refreshTodayAttendance();
      loadDashboardStats();
    } catch (error) {
      setAttendanceMessage(
        error.message || "Unable to update attendance."
      );
    } finally {
      setAttendanceActionLoading("");
    }
  }

  useEffect(() => {
    if (activePage === "Overview" && resolvedEmployeeId != null) {
      refreshTodayAttendance();
    }
  }, [activePage, resolvedEmployeeId]);

  function renderOverview() {
    return (
      <>
        <section className="welcome-section">
          <div>
            <div className="welcome-kicker">
              <span className="welcome-kicker-dot" />
              YOUR PEOPLE WORKSPACE
            </div>

            <h1>Good to see you, {firstName}</h1>

            <p>Here’s an overview of your HR workspace.</p>
          </div>

          <div className="welcome-date">
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

        {notice && (
          <div className="dashboard-notice" role="status">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
            >
              <FiX />
            </button>
          </div>
        )}

        <section className="overview-clock-panel">
          <div className="overview-clock-heading">
            <div>
              <span className="overview-clock-eyebrow">
                <FiClock /> DAILY ATTENDANCE
              </span>

              <h2>Manage your workday</h2>

              <p>
                Clock in when you start and clock out when you finish.
              </p>
            </div>

            <span className="overview-clock-status">
              <span
                className={
                  todayAttendance?.checkIn && !todayAttendance?.checkOut
                    ? "overview-status-dot is-active"
                    : "overview-status-dot"
                }
              />

              {todayAttendance?.checkIn && !todayAttendance?.checkOut
                ? "Currently working"
                : todayAttendance?.checkOut
                  ? "Workday completed"
                  : "Not clocked in"}
            </span>
          </div>

          <div className="overview-clock-actions">
            <button
              type="button"
              className="overview-clock-action clock-in-action"
              onClick={() => handleOverviewAttendance("check-in")}
              disabled={
                attendanceLoading ||
                Boolean(attendanceActionLoading) ||
                employeeIdLoading ||
                resolvedEmployeeId == null ||
                Boolean(todayAttendance?.checkIn)
              }
            >
              <span className="overview-clock-action-icon">
                <FiLogIn />
              </span>

              <span className="overview-clock-action-text">
                <strong>
                  {attendanceActionLoading === "check-in"
                    ? "Clocking In..."
                    : "Clock In"}
                </strong>
                <small>Start your workday</small>
              </span>
            </button>

            <button
              type="button"
              className="overview-clock-action clock-out-action"
              onClick={() => handleOverviewAttendance("check-out")}
              disabled={
                attendanceLoading ||
                Boolean(attendanceActionLoading) ||
                employeeIdLoading ||
                resolvedEmployeeId == null ||
                !todayAttendance?.checkIn ||
                Boolean(todayAttendance?.checkOut)
              }
            >
              <span className="overview-clock-action-icon">
                <FiLogOut />
              </span>

              <span className="overview-clock-action-text">
                <strong>
                  {attendanceActionLoading === "check-out"
                    ? "Clocking Out..."
                    : "Clock Out"}
                </strong>
                <small>Finish your workday</small>
              </span>
            </button>
          </div>

          {attendanceMessage && (
            <p className="overview-clock-message" role="status">
              {attendanceMessage}
            </p>
          )}

          <div className="overview-clock-refresh">
            <button
              type="button"
              onClick={refreshTodayAttendance}
              disabled={
                attendanceLoading ||
                Boolean(attendanceActionLoading) ||
                employeeIdLoading ||
                resolvedEmployeeId == null
              }
            >
              <FiRefreshCw
                className={
                  attendanceLoading ? "overview-refresh-spinning" : ""
                }
              />

              {attendanceLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </section>

        <section className="summary-section">
          <div className="section-heading">
            <div>
              <h2>Workspace overview</h2>
              <p>Your key HR metrics at a glance</p>
            </div>

            <span className="overview-badge">
              {statsLoading ? "LOADING DATA" : "LIVE DATA"}
            </span>
          </div>

          <div className="summary-grid">
            {summaryCards.map(
              ({ title, value, note, icon: Icon, color }) => (
                <article className="summary-card" key={title}>
                  <div className="summary-card-top">
                    <div className={`summary-icon ${color}`}>
                      <Icon />
                    </div>

                    <span className="summary-card-arrow">
                      <FiArrowUpRight />
                    </span>
                  </div>

                  <p className="summary-title">{title}</p>
                  <h3>{value}</h3>
                  <p className="summary-note">{note}</p>
                </article>
              )
            )}
          </div>
        </section>

        <section className="dashboard-bottom-grid">
          <article className="panel-card quick-actions-panel">
            <div className="panel-heading">
              <div>
                <h2>Quick actions</h2>
                <p>Shortcuts for your daily work</p>
              </div>

              <FiPlus className="panel-heading-icon" />
            </div>

            <div className="quick-actions-grid">
              {[
                {
                  label: "Employees",
                  description: "People records",
                  icon: FiUsers,
                  color: "action-blue",
                },
                {
                  label: "Employee Documents",
                  description: "Manage employee files",
                  icon: FiFileText,
                  color: "action-purple",
                },
                {
                  label: "Attendance",
                  description: "Workday tracking",
                  icon: FiClock,
                  color: "action-green",
                },
                {
                  label: "Leave Management",
                  title: "Request leave",
                  description: "Leave management",
                  icon: FiCalendar,
                  color: "action-orange",
                },
                {
                  label: "Tasks",
                  title: "Task Management",
                  description: "Assigned tasks and progress",
                  icon: FiClipboard,
                  color: "action-blue",
                },
                {
                  label: "Mail",
                  title: "HRMS Mail",
                  description: "Inbox and compose messages",
                  icon: FiMail,
                  color: "action-purple",
                },
                {
                  label: "Chat",
                  title: "Team Chat",
                  description: "Private, real-time conversations",
                  icon: FiMessageCircle,
                  color: "action-blue",
                },
                {
                  label: "Payroll",
                  description: "Salary information",
                  icon: FiDollarSign,
                  color: "action-purple",
                },
                {
                  label: "Recruitment",
                  description: "Manage job openings",
                  icon: FiBriefcase,
                  color: "action-blue",
                },
                ...(canViewAll
                  ? [
                      {
                        label: "Reports",
                        title: "Reports & Analytics",
                        description: "HR metrics and summaries",
                        icon: FiTrendingUp,
                        color: "action-green",
                      },
                    ]
                  : []),
                {
                  label: "Settings",
                  description: "Manage your profile",
                  icon: FiSettings,
                  color: "action-purple",
                },
              ].map((action) => {
                const Icon = action.icon;

                return (
                  <button
                    type="button"
                    key={action.label}
                    onClick={() => selectPage(action.label)}
                  >
                    <span className={`quick-action-icon ${action.color}`}>
                      <Icon />
                    </span>

                    <span>
                      <strong>{action.title || action.label}</strong>
                      <small>{action.description}</small>
                    </span>

                    <FiArrowUpRight className="quick-arrow" />
                  </button>
                );
              })}
            </div>
          </article>

          <article className="panel-card account-panel">
            <div className="panel-heading">
              <div>
                <h2>Account overview</h2>
                <p>Your signed-in profile</p>
              </div>

              <div className="account-status-icon">
                <FiCheckCircle />
              </div>
            </div>

            <button
              type="button"
              className="account-profile account-profile-button"
              onClick={() => selectPage("Settings")}
            >
              <ProfileAvatar
                name={displayName}
                photo={displayPhoto}
                className="account-avatar"
              />

              <div>
                <h3>{displayName}</h3>
                <p>{displayEmail}</p>
              </div>

              <FiArrowUpRight />
            </button>

            <div className="account-detail-row">
              <span>Account role</span>
              <strong>{role}</strong>
            </div>

            <div className="account-detail-row">
              <span>Authentication</span>
              <strong className="secure-status">
                <FiCheckCircle /> Signed in
              </strong>
            </div>

            <button
              type="button"
              className="account-logout-button"
              onClick={onLogout}
            >
              <FiLogOut /> Log out of your account
            </button>
          </article>
        </section>

        <footer className="dashboard-footer">
          <span>
            © {new Date().getFullYear()} HRFlow · Human Resource Management
          </span>

          <span>
            <FiCheckCircle /> Secure workspace
          </span>
        </footer>
      </>
    );
  }

  function renderActivePage() {
    switch (activePage) {
      case "Overview":
        return renderOverview();

      case "Employees":
        return <Employees />;

      case "Employee Documents":
        if (employeeIdLoading) {
          return (
            <section className="welcome-section">
              <div>
                <h1>Employee Documents</h1>
                <p>Finding your employee record...</p>
              </div>
            </section>
          );
        }

        if (resolvedEmployeeId == null) {
          return (
            <section className="welcome-section">
              <div>
                <h1>Employee record not found</h1>
                <p>
                  Your login account does not currently have a linked employee
                  ID. Ask an administrator to link your employee record.
                </p>

                <button
                  type="button"
                  className="hero-button"
                  onClick={() => selectPage("Overview")}
                >
                  Back to Overview <FiArrowUpRight />
                </button>
              </div>
            </section>
          );
        }

        return (
          <EmployeeDocuments
            employeeId={resolvedEmployeeId}
            onBack={() => selectPage("Overview")}
          />
        );

      case "Attendance":
        return <Attendance />;

      case "Leave Management":
        return <LeaveManagement user={user} />;

      case "Tasks":
        return <TaskManagement user={user} />;

      case "Mail":
        return <Mail />;

      case "Chat":
        return <Chat />;

      case "Payroll":
        return <PayrollManagement user={user} />;

      case "Recruitment":
        return <Recruitment user={user} />;

      case "Performance":
        return <PerformanceManagement />;

      case "Reports":
        if (!canViewAll) {
          return (
            <section className="welcome-section">
              <div>
                <div className="welcome-kicker">
                  <span className="welcome-kicker-dot" />
                  HR WORKSPACE
                </div>

                <h1>Reports & Analytics</h1>
                <p>
                  You do not have permission to view organization-wide HR
                  reports. Please contact your HR administrator.
                </p>

                <button
                  type="button"
                  className="hero-button"
                  onClick={() => selectPage("Overview")}
                >
                  Back to Overview <FiArrowUpRight />
                </button>
              </div>
            </section>
          );
        }

        return <Reports />;

      case "Settings":
        return <Settings onProfileUpdated={handleProfileUpdated} />;

      default:
        return (
          <section className="welcome-section">
            <div>
              <div className="welcome-kicker">
                <span className="welcome-kicker-dot" />
                HR WORKSPACE
              </div>

              <h1>{activePage}</h1>
              <p>This module is not connected yet.</p>

              <button
                type="button"
                className="hero-button"
                onClick={() => selectPage("Overview")}
              >
                Back to Overview <FiArrowUpRight />
              </button>
            </div>
          </section>
        );
    }
  }

  return (
    <div className={`dashboard-shell ${darkMode ? "dark-theme" : ""}`}>
      <RealtimeNotifications onNotification={handleIncomingNotification} />

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`dashboard-sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="dashboard-brand">
          <div className="dashboard-brand-icon">H</div>

          <div>
            <h2>
              HR<span>Flow</span>
            </h2>
            <p>PEOPLE MANAGEMENT</p>
          </div>

          <button
            type="button"
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <FiX />
          </button>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>

        <nav className="dashboard-navigation">
          {navigation.map(({ label, icon: Icon }) => {
            if (label === "Reports" && !canViewAll) return null;

            return (
              <button
                type="button"
                key={label}
                className={`nav-item ${
                  activePage === label ? "nav-active" : ""
                }`}
                onClick={() => selectPage(label)}
              >
                <Icon />
                <span>{label}</span>
                {activePage === label && <span className="nav-dot" />}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-help-card">
          <div className="help-icon">
            <FiActivity />
          </div>

          <h3>Your HR workspace</h3>
          <p>Manage people and daily HR activities from one place.</p>
        </div>

        <button
          type="button"
          className="sidebar-logout"
          onClick={onLogout}
        >
          <FiLogOut />
          <span>Log out</span>
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <FiMenu />
            </button>

            <div className="breadcrumb">
              <span>Workspace</span>
              <span className="breadcrumb-separator">/</span>
              <strong>{activePage}</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <label className="dashboard-search">
              <FiSearch />

              <input
                type="search"
                placeholder="Search workspace..."
                aria-label="Search workspace"
                value={workspaceSearch}
                onChange={handleWorkspaceSearch}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    openMatchingPage();
                  }
                }}
              />

              <span className="search-shortcut">HR</span>
            </label>

            <button
              type="button"
              className="icon-action"
              aria-label="Toggle theme"
              title="Toggle light and dark theme"
              onClick={() => setDarkMode((value) => !value)}
            >
              {darkMode ? <FiSun /> : <FiMoon />}
            </button>

            <div className="notification-container">
              <button
                type="button"
                className="icon-action notification-action"
                aria-label={`Notifications, ${unreadCount} unread`}
                title="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => {
                  setNotificationsOpen((value) => !value);
                  setProfileMenuOpen(false);
                }}
              >
                <FiBell />

                {unreadCount > 0 && (
                  <span className="notification-count">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  className="dashboard-notification-panel"
                  role="region"
                  aria-label="Notifications"
                >
                  <div className="dashboard-notification-panel-header">
                    <div>
                      <strong>Notifications</strong>
                      <small>
                        {unreadCount} unread notification
                        {unreadCount === 1 ? "" : "s"}
                      </small>
                    </div>

                    <button
                      type="button"
                      aria-label="Close notifications"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      <FiX />
                    </button>
                  </div>

                  {notifications.length > 0 && (
                    <div className="notification-panel-actions">
                      <button
                        type="button"
                        onClick={markAllNotificationsAsRead}
                        disabled={unreadCount === 0}
                      >
                        Mark all as read
                      </button>

                      <button
                        type="button"
                        onClick={clearNotifications}
                      >
                        Clear all
                      </button>
                    </div>
                  )}

                  <div className="dashboard-notification-items">
                    {notifications.length === 0 ? (
                      <div className="notification-empty-state">
                        <FiBell />
                        <strong>You're all caught up!</strong>
                        <p>New HRMS notifications will appear here.</p>
                      </div>
                    ) : (
                      [...notifications].reverse().map((notification) => (
                        <button
                          type="button"
                          key={notification.id}
                          className={`dashboard-notification-item ${
                            notification.read
                              ? "notification-read"
                              : "notification-unread"
                          }`}
                          onClick={() =>
                            markNotificationAsRead(notification.id)
                          }
                        >
                          <span className="notification-item-icon">
                            {getNotificationIcon(notification.type)}
                          </span>

                          <span className="notification-item-content">
                            <strong>
                              {notification.title || "HRMS Notification"}
                            </strong>

                            <span>
                              {notification.message ||
                                "You have a new notification."}
                            </span>

                            {notification.senderEmail && (
                              <small>
                                From: {notification.senderEmail}
                              </small>
                            )}

                            <small>
                              {formatNotificationDate(
                                notification.receivedAt
                              )}
                            </small>
                          </span>

                          {!notification.read && (
                            <span className="notification-unread-dot" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="topbar-divider" />

            <div className="topbar-profile-container">
              <button
                type="button"
                className={`topbar-profile ${
                  activePage === "Settings" ? "topbar-profile-active" : ""
                }`}
                onClick={() => {
                  setProfileMenuOpen((value) => !value);
                  setNotificationsOpen(false);
                }}
                aria-label="Open profile menu"
                aria-expanded={profileMenuOpen}
                title="View profile"
              >
                <ProfileAvatar
                  name={displayName}
                  photo={displayPhoto}
                  className="topbar-profile-avatar"
                />

                <span className="topbar-profile-details">
                  <strong>{displayName}</strong>
                  <small>{role}</small>
                </span>
              </button>

              {profileMenuOpen && (
                <div className="topbar-profile-menu">
                  <div className="topbar-profile-menu-header">
                    <ProfileAvatar
                      name={displayName}
                      photo={displayPhoto}
                      className="topbar-profile-avatar"
                    />

                    <span>
                      <strong>{displayName}</strong>
                      <small>{displayEmail}</small>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => selectPage("Settings")}
                  >
                    <FiUser />
                    My profile
                  </button>

                  <button
                    type="button"
                    onClick={() => selectPage("Settings")}
                  >
                    <FiSettings />
                    Account settings
                  </button>

                  <button
                    type="button"
                    className="topbar-profile-logout"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onLogout?.();
                    }}
                  >
                    <FiLogOut />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div
          className="dashboard-content"
          key={activePage}
          data-active-page={activePage}
        >
          {renderActivePage()}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
