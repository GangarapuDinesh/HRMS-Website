
import { useEffect, useMemo, useState } from 'react'
import {FaCalendarCheck,FaCalendarAlt,FaMoneyBillWave,FaDownload,FaSyncAlt,FaChartPie,FaChartBar,FaWallet} from 'react-icons/fa'
import { ResponsiveContainer,BarChart, Bar,XAxis,YAxis,Tooltip,CartesianGrid,PieChart,Pie,Cell,Legend} from 'recharts'
import { getReportsSummary } from '../../services/reportsService'
import './Reports.css'
const today = new Date()
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const initialStart = formatDate(new Date(today.getFullYear(), today.getMonth(), 1))
const initialEnd = formatDate(today)
const money = value =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(Number(value || 0))
function SummaryCard({ title, value, subtitle, icon: Icon, tone }) {
  return (
    <article className={`report-summary-card ${tone}`}>
      <div className="report-card-top">
        <span className="report-card-icon">
          <Icon />
        </span>
        <span className="report-card-label">{title}</span>
      </div>
      <h2>{value}</h2>
      <p>{subtitle}</p>
    </article>
  )
}

function downloadCsv(filename, rows) {
  const csv = rows.map(row =>
    row.map(value =>
      `"${String(value ?? '').replace(/"/g, '""')}"`
    ).join(',')
  ).join('\r\n')

  const blob = new Blob(['\uFEFF' + csv], {
    type: 'text/csv;charset=utf-8;'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

export default function Reports() {
  const [startDate, setStartDate] = useState(initialStart)
  const [endDate, setEndDate] = useState(initialEnd)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadReports() {
    if (!startDate || !endDate) {
      setError('Please select both dates.')
      return
    }

    if (startDate > endDate) {
      setError('Start date cannot be after end date.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await getReportsSummary(startDate, endDate)
      setReport(data)
    } catch (err) {
      setError(err.message || 'Unable to load reports.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [])

  const attendanceData = useMemo(() => {
    const values = report?.attendance || {}

    return [
      { name: 'Present', value: Number(values.PRESENT || 0) },
      { name: 'Absent', value: Number(values.ABSENT || 0) },
      { name: 'Half day', value: Number(values.HALF_DAY || 0) },
      { name: 'On leave', value: Number(values.ON_LEAVE || 0) }
    ]
  }, [report])

  const leaveData = useMemo(() => {
    const values = report?.leave || {}

    return [
      { name: 'Pending', value: Number(values.PENDING || 0) },
      { name: 'Approved', value: Number(values.APPROVED || 0) },
      { name: 'Rejected', value: Number(values.REJECTED || 0) }
    ]
  }, [report])

  const payrollData = useMemo(() => {
    if (!report) return []

    return [
      { name: 'Basic salary', amount: Number(report.totalBasicSalary || 0) },
      { name: 'Allowances', amount: Number(report.totalAllowances || 0) },
      { name: 'Deductions', amount: Number(report.totalDeductions || 0) },
      { name: 'Net salary', amount: Number(report.totalNetSalary || 0) }
    ]
  }, [report])

  function exportReport() {
    if (!report) return

    const rows = [
      ['HRMS Reports and Analytics'],
      ['Start date', report.startDate],
      ['End date', report.endDate],
      [],
      ['Attendance status', 'Records'],
      ...attendanceData.map(item => [item.name, item.value]),
      ['Total attendance records', report.attendanceRecords],
      [],
      ['Leave status', 'Requests'],
      ...leaveData.map(item => [item.name, item.value]),
      ['Total leave requests', report.leaveRequests],
      [],
      ['Payroll metric', 'Amount (INR)'],
      ['Basic salary', report.totalBasicSalary],
      ['Allowances', report.totalAllowances],
      ['Deductions', report.totalDeductions],
      ['Net salary', report.totalNetSalary],
      ['Payroll records', report.payrollRecords],
      ['Paid payroll records', report.paidPayrollRecords],
      ['Pending payroll records', report.pendingPayrollRecords]
    ]

    downloadCsv(`hrms-report-${startDate}-to-${endDate}.csv`, rows)
  }

  return (
    <main className="reports-page">
      <section className="reports-heading">
        <div>
          <span className="reports-eyebrow">HRMS ANALYTICS</span>
          <h1>Reports & Analytics</h1>
          <p>Monitor attendance, leave requests, and payroll expenditure.</p>
        </div>

        <button
          type="button"
          className="reports-export-button"
          onClick={exportReport}
          disabled={!report || loading}
        >
          <FaDownload />
          Export CSV
        </button>
      </section>

      <section className="reports-filter-panel">
        <div className="reports-filter-title">
          <FaCalendarAlt />
          <span>Report period</span>
        </div>

        <label>
          Start date
          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={event => setStartDate(event.target.value)}
          />
        </label>

        <label>
          End date
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            max={initialEnd}
            onChange={event => setEndDate(event.target.value)}
          />
        </label>

        <button
          type="button"
          className="reports-apply-button"
          onClick={loadReports}
          disabled={loading}
        >
          <FaSyncAlt />
          {loading ? 'Loading...' : 'Apply filters'}
        </button>
      </section>

      {error && (
        <div className="reports-error" role="alert">
          <strong>Unable to load reports</strong>
          <p>{error}</p>
          <button type="button" onClick={loadReports}>Try again</button>
        </div>
      )}

      {loading && !report ? (
        <div className="reports-loading">
          <span className="reports-spinner" />
          Loading your analytics...
        </div>
      ) : report ? (
        <>
          <section className="reports-summary-grid">
            <SummaryCard
              title="Attendance records"
              value={report.attendanceRecords}
              subtitle="Records in the selected period"
              icon={FaCalendarCheck}
              tone="report-blue"
            />

            <SummaryCard
              title="Leave requests"
              value={report.leaveRequests}
              subtitle="Requests overlapping the period"
              icon={FaCalendarAlt}
              tone="report-purple"
            />

            <SummaryCard
              title="Net payroll"
              value={money(report.totalNetSalary)}
              subtitle={`${report.payrollRecords} payroll records`}
              icon={FaMoneyBillWave}
              tone="report-green"
            />

            <SummaryCard
              title="Pending payroll"
              value={report.pendingPayrollRecords}
              subtitle={`${report.paidPayrollRecords} records paid`}
              icon={FaWallet}
              tone="report-orange"
            />
          </section>

          <section className="reports-chart-grid">
            <article className="reports-panel">
              <div className="reports-panel-heading">
                <span className="reports-panel-icon attendance-icon">
                  <FaChartBar />
                </span>
                <div>
                  <h2>Attendance overview</h2>
                  <p>Records grouped by attendance status</p>
                </div>
              </div>

              <div className="reports-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar
                      dataKey="value"
                      name="Records"
                      fill="#4285f4"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="reports-status-list">
                {attendanceData.map(item => (
                  <div className="reports-status-row" key={item.name}>
                    <span>{item.name}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="reports-panel">
              <div className="reports-panel-heading">
                <span className="reports-panel-icon leave-icon">
                  <FaChartPie />
                </span>
                <div>
                  <h2>Leave overview</h2>
                  <p>Requests grouped by current status</p>
                </div>
              </div>

              <div className="reports-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leaveData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={55}
                      paddingAngle={3}
                    >
                      {leaveData.map((item, index) => (
                        <Cell
                          key={item.name}
                          fill={['#f59e0b', '#10b981', '#ef4444'][index]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="reports-status-list">
                {leaveData.map(item => (
                  <div className="reports-status-row" key={item.name}>
                    <span>{item.name}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="reports-panel reports-payroll-panel">
              <div className="reports-panel-heading">
                <span className="reports-panel-icon payroll-icon">
                  <FaMoneyBillWave />
                </span>
                <div>
                  <h2>Payroll breakdown</h2>
                  <p>Totals for salary months in the selected period</p>
                </div>
              </div>

              <div className="reports-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={payrollData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip formatter={value => money(value)} />
                    <Bar
                      dataKey="amount"
                      name="Amount"
                      fill="#14b8a6"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="reports-payroll-details">
                <div>
                  <span>Total deductions</span>
                  <strong>{money(report.totalDeductions)}</strong>
                </div>
                <div>
                  <span>Total allowances</span>
                  <strong>{money(report.totalAllowances)}</strong>
                </div>
                <div>
                  <span>Paid payroll records</span>
                  <strong>{report.paidPayrollRecords}</strong>
                </div>
                <div>
                  <span>Pending payroll records</span>
                  <strong>{report.pendingPayrollRecords}</strong>
                </div>
              </div>
            </article>
          </section>

          <section className="reports-note">
            <strong>Reporting note</strong>
            <p>
              Attendance figures count saved records, not unique employees or
              expected working days. Payroll figures are grouped by salary month,
              and leave requests are included when their dates overlap the
              selected period.
            </p>
          </section>
        </>
      ) : !error ? (
        <div className="reports-empty">No report data is available.</div>
      ) : null}
    </main>
  )
}
