import { useCallback, useEffect, useState } from "react";
import { FiDollarSign,FiUsers,FiCheckCircle,FiClock,FiPlus,FiRefreshCw,FiSearch,FiCheck,FiX,FiCalendar,FiCreditCard,FiDownload,} from "react-icons/fi";
import payrollService from "../../services/payrollService";
import "./PayrollManagement.css";
const createInitialForm = () => ({
  employeeId: "",
  salaryMonth: String(new Date().getMonth() + 1),
  salaryYear: String(new Date().getFullYear()),
  basicSalary: "",
  allowances: "0",
  deductions: "0",
});
const currency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
const formatMonth = (month, year) => {
  if (!month || !year) return "—";
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
    "en-IN",
    {
      month: "long",
      year: "numeric",
    }
  );
};
const getErrorMessage = (error) => {
  const message = error?.message || "Something went wrong.";
  try {
    const parsed = JSON.parse(message);
    return parsed.message || parsed.error || message;
  } catch {
    return message;
  }
};
const getRole = (user) =>
  String(
    user?.role ||
      user?.userRole ||
      user?.authority ||
      sessionStorage.getItem("hrms-role") ||
      localStorage.getItem("hrms-role") ||
      ""
  )
    .replace(/^ROLE_/, "")
    .toUpperCase();
const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.employees)) return data.employees;
  return [];
};
export default function PayrollManagement({ user }) {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    paid: 0,
  });
  const [form, setForm] = useState(createInitialForm);
  const [filters, setFilters] = useState({
    status: "",
    month: "",
    year: "",
  });
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const role = getRole(user);
  const isHR = ["ADMIN", "HR_MANAGER"].includes(role);
  const loadEmployees = useCallback(async () => {
    if (!isHR) return;
    setEmployeesLoading(true);
    try {
      const data = await payrollService.getEmployees();
      setEmployees(normalizeList(data));
    } catch (err) {
      setError(`Unable to load employees: ${getErrorMessage(err)}`);
    } finally {
      setEmployeesLoading(false);
    }
  }, [isHR]);
  const loadPayrolls = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let records;
      if (!isHR) {
        records = await payrollService.getMy();
      } else if (filters.month && filters.year) {
        records = await payrollService.getByMonth(
          filters.month,
          filters.year
        );
        if (filters.status) {
          records = records.filter(
            (item) => item.paymentStatus === filters.status
          );
        }
      } else if (filters.month || filters.year) {
        records = await payrollService.getAll();
        records = records.filter((item) => {
          const monthMatches =
            !filters.month ||
            Number(item.salaryMonth) === Number(filters.month);
          const yearMatches =
            !filters.year ||
            Number(item.salaryYear) === Number(filters.year);

          const statusMatches =
            !filters.status || item.paymentStatus === filters.status;

          return monthMatches && yearMatches && statusMatches;
        });
      } else if (filters.status) {
        records = await payrollService.getByStatus(filters.status);
      } else {
        records = await payrollService.getAll();
      }

      const list = normalizeList(records);
      setPayrolls(list);

      if (isHR) {
        const counts = await payrollService.getSummary();

        setSummary({
          total: Number(counts?.total || 0),
          pending: Number(counts?.pending || 0),
          paid: Number(counts?.paid || 0),
        });
      } else {
        setSummary({
          total: list.length,
          pending: list.filter(
            (item) => item.paymentStatus === "PENDING"
          ).length,
          paid: list.filter(
            (item) => item.paymentStatus === "PAID"
          ).length,
        });
      }
    } catch (err) {
      setPayrolls([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters, isHR]);

  useEffect(() => {
    loadPayrolls();
  }, [loadPayrolls]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const updateForm = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const createPayroll = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const basicSalary = Number(form.basicSalary);
    const allowances = Number(form.allowances || 0);
    const deductions = Number(form.deductions || 0);

    if (!form.employeeId) {
      setError("Please select an employee.");
      setSaving(false);
      return;
    }

    if (
      !Number.isFinite(basicSalary) ||
      !Number.isFinite(allowances) ||
      !Number.isFinite(deductions) ||
      basicSalary <= 0 ||
      allowances < 0 ||
      deductions < 0
    ) {
      setError("Enter valid salary amounts. Basic salary must be greater than zero.");
      setSaving(false);
      return;
    }

    if (basicSalary + allowances < deductions) {
      setError("Deductions cannot exceed the total salary.");
      setSaving(false);
      return;
    }

    try {
      await payrollService.create({
        employeeId: Number(form.employeeId),
        salaryMonth: Number(form.salaryMonth),
        salaryYear: Number(form.salaryYear),
        basicSalary,
        allowances,
        deductions,
      });

      setMessage("Payroll record created successfully.");
      setForm(createInitialForm());
      setShowForm(false);
      await loadPayrolls();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const updatePaymentStatus = async (payroll) => {
    const nextStatus =
      payroll.paymentStatus === "PAID" ? "PENDING" : "PAID";

    if (
      !window.confirm(
        `Change payroll #${payroll.id} to ${nextStatus}?`
      )
    ) {
      return;
    }

    setUpdatingId(payroll.id);
    setError("");
    setMessage("");

    try {
      if (nextStatus === "PAID") {
        await payrollService.markAsPaid(payroll.id);
      } else {
        await payrollService.markAsPending(payroll.id);
      }

      setMessage(`Payment status updated to ${nextStatus}.`);
      await loadPayrolls();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const exportPayrolls = () => {
    const headings = [
      "Payroll ID",
      "Employee",
      "Employee ID",
      "Month",
      "Basic Salary",
      "Allowances",
      "Deductions",
      "Net Salary",
      "Payment Status",
    ];

    const rows = payrolls.map((payroll) => [
      payroll.id,
      payroll.employee?.fullName || "",
      payroll.employee?.id || payroll.employeeId || "",
      formatMonth(payroll.salaryMonth, payroll.salaryYear),
      payroll.basicSalary,
      payroll.allowances,
      payroll.deductions,
      payroll.netSalary,
      payroll.paymentStatus,
    ]);

    const escapeCsv = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [headings, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "hrms-payroll.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const normalizedSearch = search.trim().toLowerCase();

  const visiblePayrolls = payrolls.filter((payroll) => {
    const employeeName = payroll.employee?.fullName || "";
    const employeeId =
      payroll.employee?.id || payroll.employeeId || "";

    return (
      String(employeeName).toLowerCase().includes(normalizedSearch) ||
      String(employeeId).toLowerCase().includes(normalizedSearch) ||
      String(payroll.id).toLowerCase().includes(normalizedSearch)
    );
  });

  const totalNetSalary = visiblePayrolls.reduce(
    (total, payroll) => total + Number(payroll.netSalary || 0),
    0
  );

  const pendingCount = isHR
    ? summary.pending
    : payrolls.filter((item) => item.paymentStatus === "PENDING").length;

  const paidCount = isHR
    ? summary.paid
    : payrolls.filter((item) => item.paymentStatus === "PAID").length;

  return (
    <div className="payroll-page">
      <section className="payroll-hero">
        <div className="payroll-hero-content">
          <span className="payroll-eyebrow">
            <FiCreditCard /> PAYROLL CENTER
          </span>
          <h1>{isHR ? "Payroll Management" : "My Payslips"}</h1>
          <p>
            {isHR
              ? "Manage employee salaries, generate monthly payroll, and track payments."
              : "View your salary records and monthly payment status."}
          </p>
        </div>

        <div className="payroll-hero-icon">
          <FiDollarSign />
        </div>
      </section>

      {error && (
        <div className="payroll-alert payroll-alert-error" role="alert">
          <FiX />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>
            Dismiss
          </button>
        </div>
      )}

      {message && (
        <div className="payroll-alert payroll-alert-success" role="status">
          <FiCheckCircle />
          <span>{message}</span>
          <button type="button" onClick={() => setMessage("")}>
            Dismiss
          </button>
        </div>
      )}

      <section className="payroll-stat-grid">
        <article className="payroll-stat-card">
          <div className="payroll-stat-icon payroll-purple">
            <FiUsers />
          </div>
          <div>
            <p>{isHR ? "Payroll Records" : "My Records"}</p>
            <h2>{isHR ? summary.total : payrolls.length}</h2>
            <span>Available salary records</span>
          </div>
        </article>

        <article className="payroll-stat-card">
          <div className="payroll-stat-icon payroll-orange">
            <FiClock />
          </div>
          <div>
            <p>Pending Payments</p>
            <h2>{pendingCount}</h2>
            <span>Awaiting payment</span>
          </div>
        </article>

        <article className="payroll-stat-card">
          <div className="payroll-stat-icon payroll-green">
            <FiCheckCircle />
          </div>
          <div>
            <p>Paid Records</p>
            <h2>{paidCount}</h2>
            <span>Payments completed</span>
          </div>
        </article>

        <article className="payroll-stat-card">
          <div className="payroll-stat-icon payroll-blue">
            <FiDollarSign />
          </div>
          <div>
            <p>{isHR ? "Filtered Net Payroll" : "Total Net Salary"}</p>
            <h2 className="payroll-amount">{currency(totalNetSalary)}</h2>
            <span>Based on displayed records</span>
          </div>
        </article>
      </section>

      <section className="payroll-records-panel">
        <div className="payroll-panel-header">
          <div>
            <h2>{isHR ? "Salary Records" : "Salary History"}</h2>
            <p>Review salary details and payment information.</p>
          </div>

          <div className="payroll-header-actions">
            <button
              type="button"
              className="payroll-secondary-btn"
              onClick={loadPayrolls}
              disabled={loading}
            >
              <FiRefreshCw /> Refresh
            </button>

            {isHR && (
              <>
                <button
                  type="button"
                  className="payroll-secondary-btn"
                  onClick={exportPayrolls}
                  disabled={!payrolls.length}
                >
                  <FiDownload /> Export CSV
                </button>

                <button
                  type="button"
                  className="payroll-primary-btn"
                  onClick={() => setShowForm((previous) => !previous)}
                >
                  {showForm ? <FiX /> : <FiPlus />}
                  {showForm ? "Close Form" : "Generate Payroll"}
                </button>
              </>
            )}
          </div>
        </div>

        {showForm && isHR && (
          <form className="payroll-create-form" onSubmit={createPayroll}>
            <div className="payroll-form-heading">
              <div>
                <h3>Generate Salary Record</h3>
                <p>Choose an employee and enter the salary details.</p>
              </div>
              <FiDollarSign />
            </div>

            <div className="payroll-form-grid">
              <label>
                Select Employee
                <select
                  name="employeeId"
                  value={form.employeeId}
                  onChange={updateForm}
                  required
                  disabled={employeesLoading}
                >
                  <option value="">
                    {employeesLoading
                      ? "Loading employees..."
                      : employees.length
                        ? "Select an employee"
                        : "No employees available"}
                  </option>

                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.fullName || employee.name || `Employee #${employee.id}`}
                      {" (ID: "}
                      {employee.id}
                      {")"}
                    </option>
                  ))}
                </select>
                {!employeesLoading && employees.length === 0 && (
                  <span>No employee records were returned by the API.</span>
                )}
              </label>

              <label>
                Salary Month
                <select
                  name="salaryMonth"
                  value={form.salaryMonth}
                  onChange={updateForm}
                  required
                >
                  {Array.from({ length: 12 }, (_, index) => (
                    <option key={index + 1} value={index + 1}>
                      {new Date(2026, index, 1).toLocaleDateString("en-IN", {
                        month: "long",
                      })}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Salary Year
                <input
                  name="salaryYear"
                  type="number"
                  min="2000"
                  max="2100"
                  step="1"
                  value={form.salaryYear}
                  onChange={updateForm}
                  required
                />
              </label>

              <label>
                Basic Salary (₹)
                <input
                  name="basicSalary"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.basicSalary}
                  onChange={updateForm}
                  placeholder="e.g. 30000"
                  required
                />
              </label>

              <label>
                Allowances (₹)
                <input
                  name="allowances"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.allowances}
                  onChange={updateForm}
                  required
                />
              </label>

              <label>
                Deductions (₹)
                <input
                  name="deductions"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.deductions}
                  onChange={updateForm}
                  required
                />
              </label>
            </div>

            <div className="payroll-net-preview">
              <span>Estimated Net Salary</span>
              <strong>
                {currency(
                  Number(form.basicSalary || 0) +
                    Number(form.allowances || 0) -
                    Number(form.deductions || 0)
                )}
              </strong>
            </div>

            <button
              className="payroll-primary-btn"
              type="submit"
              disabled={saving || employeesLoading || employees.length === 0}
            >
              <FiCheck />
              {saving ? "Generating..." : "Generate Payroll"}
            </button>
          </form>
        )}

        <div className="payroll-filter-row">
          <div className="payroll-search">
            <FiSearch />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee, ID, or payroll..."
            />
          </div>

          {isHR && (
            <div className="payroll-filters">
              <select
                value={filters.status}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    status: event.target.value,
                  }))
                }
                aria-label="Filter by payment status"
              >
                <option value="">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
              </select>

              <select
                value={filters.month}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    month: event.target.value,
                  }))
                }
                aria-label="Filter by month"
              >
                <option value="">All months</option>
                {Array.from({ length: 12 }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    {new Date(2026, index, 1).toLocaleDateString("en-IN", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>

              <select
                value={filters.year}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    year: event.target.value,
                  }))
                }
                aria-label="Filter by year"
              >
                <option value="">All years</option>
                {Array.from({ length: 8 }, (_, index) => {
                  const year = new Date().getFullYear() - index;

                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>

              {(filters.status || filters.month || filters.year) && (
                <button
                  type="button"
                  className="payroll-secondary-btn"
                  onClick={() =>
                    setFilters({
                      status: "",
                      month: "",
                      year: "",
                    })
                  }
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="payroll-empty-state">
            <FiRefreshCw className="payroll-loading-icon" />
            <h3>Loading payroll records</h3>
            <p>Please wait while salary information is retrieved.</p>
          </div>
        ) : visiblePayrolls.length === 0 ? (
          <div className="payroll-empty-state">
            <div className="payroll-empty-icon">
              <FiCalendar />
            </div>
            <h3>No payroll records found</h3>
            <p>
              {isHR
                ? "Generate a salary record or change the filters."
                : "Your salary records will appear here when they are available."}
            </p>
          </div>
        ) : (
          <div className="payroll-table-wrapper">
            <table className="payroll-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Salary Month</th>
                  <th>Basic Salary</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  {isHR && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {visiblePayrolls.map((payroll) => (
                  <tr key={payroll.id}>
                    <td>
                      <div className="payroll-employee-cell">
                        <div className="payroll-avatar">
                          {(payroll.employee?.fullName || "E")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <strong>
                            {payroll.employee?.fullName ||
                              `Employee #${
                                payroll.employee?.id ||
                                payroll.employeeId ||
                                "—"
                              }`}
                          </strong>
                          <span>Payroll #{payroll.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {formatMonth(payroll.salaryMonth, payroll.salaryYear)}
                    </td>
                    <td>{currency(payroll.basicSalary)}</td>
                    <td>{currency(payroll.allowances)}</td>
                    <td>{currency(payroll.deductions)}</td>
                    <td className="payroll-net-value">
                      {currency(payroll.netSalary)}
                    </td>
                    <td>
                      <span
                        className={`payroll-status ${
                          payroll.paymentStatus === "PAID"
                            ? "payroll-status-paid"
                            : "payroll-status-pending"
                        }`}
                      >
                        {payroll.paymentStatus === "PAID" ? (
                          <FiCheckCircle />
                        ) : (
                          <FiClock />
                        )}
                        {payroll.paymentStatus}
                      </span>
                    </td>
                    {isHR && (
                      <td>
                        <button
                          type="button"
                          className={`payroll-action-btn ${
                            payroll.paymentStatus === "PAID"
                              ? "payroll-mark-pending"
                              : "payroll-mark-paid"
                          }`}
                          onClick={() => updatePaymentStatus(payroll)}
                          disabled={updatingId === payroll.id}
                        >
                          {updatingId === payroll.id
                            ? "Updating..."
                            : payroll.paymentStatus === "PAID"
                              ? "Mark Pending"
                              : "Mark Paid"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && visiblePayrolls.length > 0 && (
          <div className="payroll-table-footer">
            <span>
              Showing {visiblePayrolls.length} of {payrolls.length} records
            </span>
            <span>
              <FiDollarSign /> Total displayed: {currency(totalNetSalary)}
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
