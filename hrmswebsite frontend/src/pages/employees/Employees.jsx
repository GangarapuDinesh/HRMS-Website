import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiUsers,FiSearch,FiPlus,FiRefreshCw,FiEdit2,FiUserX,FiX,FiBriefcase,FiMail,FiPhone,FiCalendar,FiAlertCircle,} from 'react-icons/fi';
import { getEmployees,createEmployee,updateEmployee,deactivateEmployee,} from '../../services/employeeService';
import './Employees.css';
const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  department: '',
  designation: '',
  employmentStatus: 'ACTIVE',
  joiningDate: '',
};
function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getEmployees();
      setEmployees(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.message || 'Could not load employees.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);
  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();
    return employees.filter((employee) => {
      const matchesSearch = [
        employee.fullName,
        employee.email,
        employee.phone,
        employee.department,
        employee.designation,
      ].some((value) => String(value || '').toLowerCase().includes(term));
      const matchesStatus =
        statusFilter === 'ALL' ||
        String(employee.employmentStatus || 'ACTIVE').toUpperCase() ===
          statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [employees, search, statusFilter]);

  function openAddForm() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError('');
    setSuccess('');
    setModalOpen(true);
  }

  function openEditForm(employee) {
    setEditingId(employee.id);
    setForm({
      fullName: employee.fullName || '',
      email: employee.email || '',
      phone: employee.phone || '',
      department: employee.department || '',
      designation: employee.designation || '',
      employmentStatus: employee.employmentStatus || 'ACTIVE',
      joiningDate: employee.joiningDate
        ? String(employee.joiningDate).slice(0, 10)
        : '',
    });
    setError('');
    setSuccess('');
    setModalOpen(true);
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submitForm(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      department: form.department.trim(),
      designation: form.designation.trim(),
      employmentStatus: form.employmentStatus,
      joiningDate: form.joiningDate || null,
    };

    try {
      if (editingId !== null) {
        await updateEmployee(editingId, payload);
        setSuccess('Employee updated successfully.');
      } else {
        await createEmployee(payload);
        setSuccess('Employee added successfully.');
      }
      setModalOpen(false);
      setForm({ ...emptyForm });
      await loadEmployees();
    } catch (err) {
      setError(err.message || 'Could not save the employee.');
    } finally {
      setSaving(false);
    }
  }
  async function handleDeactivate(employee) {
    const confirmed = window.confirm(
      `Deactivate ${employee.fullName}? This will mark the employee as inactive.`
    );
    if (!confirmed) return;
    setError('');
    setSuccess('');
    try {
      await deactivateEmployee(employee.id);
      setSuccess(`${employee.fullName} has been deactivated.`);
      await loadEmployees();
    } catch (err) {
      setError(err.message || 'Could not deactivate employee.');
    }
  }
  const activeCount = employees.filter(
    (employee) =>
      String(employee.employmentStatus || 'ACTIVE').toUpperCase() === 'ACTIVE'
  ).length;
  const inactiveCount = employees.length - activeCount;
  return (
    <div className="employees-page">
      <header className="employees-header">
        <div>
          <div className="employees-eyebrow">
            <FiUsers /> PEOPLE DIRECTORY
          </div>
          <h1>Employee Management</h1>
          <p>Manage employee profiles and keep your people records organized.</p>
        </div>
        <div className="employees-header-actions">
          <button
            className="employee-refresh-button"
            type="button"
            onClick={loadEmployees}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'employee-spinning' : ''} />
            Refresh
          </button>
          <button
            className="employee-add-button"
            type="button"
            onClick={openAddForm}
          >
            <FiPlus /> Add Employee
          </button>
        </div>
      </header>

      {error && !modalOpen && (
        <div className="employee-alert employee-alert-error" role="alert">
          <FiAlertCircle />
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss">
            <FiX />
          </button>
        </div>
      )}

      {success && (
        <div className="employee-alert employee-alert-success" role="status">
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess('')} aria-label="Dismiss">
            <FiX />
          </button>
        </div>
      )}

      <section className="employee-stats">
        <article className="employee-stat-card">
          <div className="employee-stat-icon stat-blue"><FiUsers /></div>
          <div><span>Total employees</span><strong>{employees.length}</strong></div>
        </article>
        <article className="employee-stat-card">
          <div className="employee-stat-icon stat-green"><FiBriefcase /></div>
          <div><span>Active employees</span><strong>{activeCount}</strong></div>
        </article>
        <article className="employee-stat-card">
          <div className="employee-stat-icon stat-orange"><FiUserX /></div>
          <div><span>Inactive employees</span><strong>{inactiveCount}</strong></div>
        </article>
      </section>

      <section className="employee-directory-card">
        <div className="employee-directory-heading">
          <div>
            <h2>Employee directory</h2>
            <p>{filteredEmployees.length} employee record(s) found</p>
          </div>
        </div>

        <div className="employee-filters">
          <label className="employee-search">
            <FiSearch />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, department..."
              aria-label="Search employees"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by employment status"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="employee-empty-state">
            <FiRefreshCw className="employee-spinning" />
            <p>Loading employee records...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="employee-empty-state">
            <div className="employee-empty-icon"><FiUsers /></div>
            <h3>{employees.length === 0 ? 'No employees yet' : 'No matching employees'}</h3>
            <p>
              {employees.length === 0
                ? 'Add your first employee to start building your directory.'
                : 'Try another search term or change the status filter.'}
            </p>
            {employees.length === 0 && (
              <button className="employee-add-button" type="button" onClick={openAddForm}>
                <FiPlus /> Add your first employee
              </button>
            )}
          </div>
        ) : (
          <div className="employee-table-wrap">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Joining date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => {
                  const isActive =
                    String(employee.employmentStatus || 'ACTIVE').toUpperCase() === 'ACTIVE';

                  return (
                    <tr key={employee.id}>
                      <td>
                        <div className="employee-identity">
                          <div className="employee-avatar">
                            {(employee.fullName || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="employee-identity-text">
                            <strong>{employee.fullName || 'Unnamed employee'}</strong>
                            <span><FiMail /> {employee.email}</span>
                            {employee.phone && <span><FiPhone /> {employee.phone}</span>}
                          </div>
                        </div>
                      </td>
                      <td>{employee.department || '—'}</td>
                      <td>{employee.designation || '—'}</td>
                      <td>
                        {employee.joiningDate
                          ? new Date(`${String(employee.joiningDate).slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN')
                          : '—'}
                      </td>
                      <td>
                        <span className={`employee-status ${isActive ? 'status-active' : 'status-inactive'}`}>
                          <span /> {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="employee-row-actions">
                          <button
                            type="button"
                            className="employee-edit-action"
                            title="Edit employee"
                            aria-label={`Edit ${employee.fullName}`}
                            onClick={() => openEditForm(employee)}
                          >
                            <FiEdit2 />
                          </button>
                          {isActive && (
                            <button
                              type="button"
                              className="employee-deactivate-action"
                              title="Deactivate employee"
                              aria-label={`Deactivate ${employee.fullName}`}
                              onClick={() => handleDeactivate(employee)}
                            >
                              <FiUserX />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="employee-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) setModalOpen(false);
        }}>
          <section className="employee-modal" role="dialog" aria-modal="true" aria-labelledby="employee-modal-title">
            <header className="employee-modal-header">
              <div>
                <span className="employees-eyebrow">EMPLOYEE DETAILS</span>
                <h2 id="employee-modal-title">
                  {editingId !== null ? 'Edit employee' : 'Add new employee'}
                </h2>
                <p>Enter the employee information below.</p>
              </div>
              <button type="button" className="employee-modal-close" onClick={() => setModalOpen(false)} disabled={saving} aria-label="Close form">
                <FiX />
              </button>
            </header>

            {error && (
              <div className="employee-alert employee-alert-error" role="alert">
                <FiAlertCircle /><span>{error}</span>
              </div>
            )}

            <form className="employee-form" onSubmit={submitForm}>
              <label>
                Full name *
                <input name="fullName" value={form.fullName} onChange={updateField} required maxLength={120} placeholder="Enter full name" />
              </label>
              <label>
                Email address *
                <input name="email" type="email" value={form.email} onChange={updateField} required maxLength={150} placeholder="employee@company.com" />
              </label>
              <label>
                Phone number
                <input name="phone" type="tel" value={form.phone} onChange={updateField} maxLength={25} placeholder="Enter phone number" />
              </label>
              <label>
                Department
                <input name="department" value={form.department} onChange={updateField} maxLength={100} placeholder="e.g. Engineering" />
              </label>
              <label>
                Designation
                <input name="designation" value={form.designation} onChange={updateField} maxLength={100} placeholder="e.g. Software Developer" />
              </label>
              <label>
                Joining date
                <span className="employee-date-input">
                  <FiCalendar />
                  <input name="joiningDate" type="date" value={form.joiningDate} onChange={updateField} />
                </span>
              </label>
              <label>
                Employment status
                <select name="employmentStatus" value={form.employmentStatus} onChange={updateField}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>

              <div className="employee-form-actions">
                <button type="button" className="employee-cancel-button" onClick={() => setModalOpen(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="employee-add-button" disabled={saving}>
                  {saving ? 'Saving...' : editingId !== null ? 'Save changes' : 'Add employee'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Employees;
