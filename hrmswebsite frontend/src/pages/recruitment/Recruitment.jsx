
import { useCallback, useEffect, useMemo, useState } from "react";
import {FiBriefcase,FiPlus,FiSearch,FiRefreshCw,FiMapPin,FiCalendar,FiEdit2,FiXCircle,FiTrash2,FiX,FiUsers,FiDollarSign,FiClock,FiCheckCircle,FiFileText,FiSend,FiEye,} from "react-icons/fi";
import recruitmentService from "../../services/recruitmentService";
import "./Recruitment.css";
const EMPTY_FORM = {
  title: "",
  department: "",
  location: "",
  employmentType: "FULL_TIME",
  description: "",
  requiredSkills: "",
  openings: 1,
  minimumSalary: "",
  maximumSalary: "",
  closingDate: "",
};

const APPLICATION_STATUSES = [
  "PENDING",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "REJECTED",
  "HIRED",
];

function normalizeRole(value) {
  return String(value || "EMPLOYEE")
    .replace(/^ROLE_/, "")
    .toUpperCase();
}

function getErrorMessage(error) {
  return error?.message || "Something went wrong. Please try again.";
}

function formatSalary(value) {
  if (value === null || value === undefined || value === "") {
    return "Not specified";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) return String(value);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatEmploymentType(value) {
  return String(value || "NOT SPECIFIED")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-IN");
}

function formatStatus(value) {
  return String(value || "PENDING")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function Recruitment({ user }) {
  const userRole = normalizeRole(user?.role);

  const canManage = ["ADMIN", "HR_MANAGER"].includes(userRole);
  const canDelete = userRole === "ADMIN";

  const canApply = [
    "EMPLOYEE",
    "TEAM_LEADER",
    "TEAMLEADER",
  ].includes(userRole);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Employee / Team Leader application state
  const [myApplications, setMyApplications] = useState([]);
  const [loadingMyApplications, setLoadingMyApplications] = useState(false);
  const [showMyApplications, setShowMyApplications] = useState(false);

  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);

  // Admin / HR Manager applicant state
  const [applicantsModalOpen, setApplicantsModalOpen] = useState(false);
  const [applicantsJob, setApplicantsJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await recruitmentService.getJobs();

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
          ? data.content
          : [];

      setJobs(list);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMyApplications = useCallback(async () => {
    if (!canApply) return;

    setLoadingMyApplications(true);

    try {
      const data = await recruitmentService.getMyApplications();

      setMyApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingMyApplications(false);
    }
  }, [canApply]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    if (canApply) {
      loadMyApplications();
    }
  }, [canApply, loadMyApplications]);

  const appliedJobIds = useMemo(
    () => new Set(myApplications.map((application) => String(application.jobId))),
    [myApplications]
  );

  const departments = useMemo(() => {
    return [
      ...new Set(
        jobs
          .map((job) => job.department?.trim())
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch =
        !query ||
        [
          job.title,
          job.department,
          job.location,
          job.requiredSkills,
          job.description,
        ].some((value) =>
          String(value || "").toLowerCase().includes(query)
        );

      const matchesStatus =
        statusFilter === "ALL" ||
        String(job.status || "").toUpperCase() === statusFilter;

      const matchesDepartment =
        departmentFilter === "ALL" ||
        job.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [jobs, search, statusFilter, departmentFilter]);

  const openJobs = jobs.filter(
    (job) => String(job.status || "").toUpperCase() === "OPEN"
  ).length;

  const closedJobs = jobs.filter(
    (job) => String(job.status || "").toUpperCase() === "CLOSED"
  ).length;

  const totalOpenings = jobs
    .filter((job) => String(job.status || "").toUpperCase() === "OPEN")
    .reduce((total, job) => total + (Number(job.openings) || 0), 0);

  function openCreateModal() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setError("");
    setNotice("");
    setModalOpen(true);
  }

  function openEditModal(job) {
    setEditingId(job.id);

    setForm({
      title: job.title || "",
      department: job.department || "",
      location: job.location || "",
      employmentType: job.employmentType || "FULL_TIME",
      description: job.description || "",
      requiredSkills: job.requiredSkills || "",
      openings: job.openings ?? 1,
      minimumSalary: job.minimumSalary ?? "",
      maximumSalary: job.maximumSalary ?? "",
      closingDate: job.closingDate
        ? String(job.closingDate).slice(0, 10)
        : "",
    });

    setError("");
    setNotice("");
    setModalOpen(true);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const openings = Number(form.openings);

    const minimumSalary =
      form.minimumSalary === "" ? null : Number(form.minimumSalary);

    const maximumSalary =
      form.maximumSalary === "" ? null : Number(form.maximumSalary);

    if (!form.title.trim() || !form.department.trim()) {
      setError("Job title and department are required.");
      return;
    }

    if (!Number.isInteger(openings) || openings < 1) {
      setError("Number of openings must be at least 1.");
      return;
    }

    if (
      minimumSalary !== null &&
      (!Number.isFinite(minimumSalary) || minimumSalary < 0)
    ) {
      setError("Enter a valid minimum salary.");
      return;
    }

    if (
      maximumSalary !== null &&
      (!Number.isFinite(maximumSalary) || maximumSalary < 0)
    ) {
      setError("Enter a valid maximum salary.");
      return;
    }

    if (
      minimumSalary !== null &&
      maximumSalary !== null &&
      minimumSalary > maximumSalary
    ) {
      setError(
        "Maximum salary must be greater than or equal to minimum salary."
      );
      return;
    }

    const payload = {
      title: form.title.trim(),
      department: form.department.trim(),
      location: form.location.trim(),
      employmentType: form.employmentType,
      description: form.description.trim(),
      requiredSkills: form.requiredSkills.trim(),
      openings,
      minimumSalary,
      maximumSalary,
      closingDate: form.closingDate || null,
    };

    setSaving(true);

    try {
      if (editingId !== null) {
        await recruitmentService.updateJob(editingId, payload);
        setNotice("Job opening updated successfully.");
      } else {
        await recruitmentService.createJob(payload);
        setNotice("Job opening created successfully.");
      }

      setModalOpen(false);
      setEditingId(null);
      setForm({ ...EMPTY_FORM });

      await loadJobs();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleCloseJob(job) {
    const confirmed = window.confirm(
      `Close the job opening "${job.title}"?`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await recruitmentService.closeJob(job.id);
      setNotice(`"${job.title}" has been closed.`);
      await loadJobs();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleDeleteJob(job) {
    const confirmed = window.confirm(
      `Permanently delete "${job.title}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await recruitmentService.deleteJob(job.id);
      setNotice(`"${job.title}" was deleted.`);
      await loadJobs();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }
  function openApplyModal(job) {
    setSelectedJob(job);
    setCoverLetter("");
    setError("");
    setNotice("");
    setApplyModalOpen(true);
  }

  async function handleApply(event) {
    event.preventDefault();

    if (!selectedJob) return;

    setError("");
    setNotice("");
    setApplying(true);

    try {
      await recruitmentService.applyForJob(
        selectedJob.id,
        coverLetter.trim()
      );

      setApplyModalOpen(false);
      setNotice(`Your application for "${selectedJob.title}" was submitted.`);
      setSelectedJob(null);
      setCoverLetter("");

      await loadMyApplications();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setApplying(false);
    }
  }
  async function openApplicants(job) {
    setApplicantsJob(job);
    setApplicants([]);
    setApplicantsModalOpen(true);
    setLoadingApplicants(true);
    setError("");

    try {
      const data = await recruitmentService.getApplicants(job.id);
      setApplicants(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingApplicants(false);
    }
  }

  async function handleApplicationStatusChange(applicationId, status) {
    setStatusUpdatingId(applicationId);
    setError("");
    setNotice("");

    try {
      const updated = await recruitmentService.updateApplicationStatus(
        applicationId,
        status
      );

      setApplicants((previous) =>
        previous.map((application) =>
          application.id === applicationId
            ? { ...application, ...updated, status: updated.status || status }
            : application
        )
      );

      setNotice("Application status updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setStatusUpdatingId(null);
    }
  }

  return (
    <div className="recruitment-page">
      <section className="recruitment-heading">
        <div>
          <div className="recruitment-eyebrow">
            <FiBriefcase />
            TALENT ACQUISITION
          </div>

          <h1>Recruitment</h1>
          <p>
            {canManage
              ? "Manage job openings and review candidate applications."
              : "Explore job opportunities and track your applications."}
          </p>
        </div>

        <div className="recruitment-heading-actions">
          <button
            type="button"
            className="recruitment-button recruitment-button-secondary"
            onClick={() => {
              loadJobs();
              if (canApply) loadMyApplications();
            }}
            disabled={loading}
          >
            <FiRefreshCw
              className={loading ? "recruitment-spinning" : ""}
            />
            Refresh
          </button>

          {canApply && (
            <button
              type="button"
              className="recruitment-button recruitment-button-secondary"
              onClick={() => setShowMyApplications((previous) => !previous)}
            >
              <FiFileText />
              {showMyApplications ? "Hide my applications" : "My Applications"}
            </button>
          )}

          {canManage && (
            <button
              type="button"
              className="recruitment-button recruitment-button-primary"
              onClick={openCreateModal}
            >
              <FiPlus />
              Add job opening
            </button>
          )}
        </div>
      </section>

      {notice && (
        <div
          className="recruitment-alert recruitment-alert-success"
          role="status"
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <FiX />
          </button>
        </div>
      )}

      {error && !modalOpen && !applyModalOpen && (
        <div
          className="recruitment-alert recruitment-alert-error"
          role="alert"
        >
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
    
      {canApply && showMyApplications && (
        <section className="recruitment-list-panel">
          <div className="recruitment-list-heading">
            <div>
              <h2>My Applications</h2>
              <p>Track the status of the jobs you have applied for.</p>
            </div>

            <span className="recruitment-count">
              {myApplications.length}{" "}
              {myApplications.length === 1 ? "application" : "applications"}
            </span>
          </div>

          {loadingMyApplications ? (
            <div className="recruitment-empty-state">
              <FiRefreshCw className="recruitment-spinning" />
              <h3>Loading your applications...</h3>
            </div>
          ) : myApplications.length === 0 ? (
            <div className="recruitment-empty-state">
              <FiFileText />
              <h3>You haven't applied for any jobs yet</h3>
              <p>Browse open positions below and select Apply Now.</p>
            </div>
          ) : (
            <div className="recruitment-job-grid">
              {myApplications.map((application) => (
                <article
                  className="recruitment-job-card"
                  key={application.id}
                >
                  <div className="recruitment-job-card-top">
                    <div className="recruitment-job-icon">
                      <FiFileText />
                    </div>

                    <span className="recruitment-status status-open">
                      <span />
                      {formatStatus(application.status)}
                    </span>
                  </div>

                  <h3>{application.jobTitle || "Job application"}</h3>

                  <p className="recruitment-job-department">
                    {application.department || "Department not specified"}
                  </p>

                  <div className="recruitment-job-details">
                    <span>
                      <FiCalendar />
                      Applied: {formatDate(application.appliedAt)}
                    </span>

                    <span>
                      <FiClock />
                      Updated: {formatDate(application.updatedAt)}
                    </span>
                  </div>

                  {application.coverLetter && (
                    <p className="recruitment-job-description">
                      {application.coverLetter}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}
      <section className="recruitment-stats">
        <article className="recruitment-stat-card">
          <span className="recruitment-stat-icon stat-blue">
            <FiBriefcase />
          </span>
          <div>
            <p>Total job posts</p>
            <h2>{loading ? "—" : jobs.length}</h2>
            <span>All published openings</span>
          </div>
        </article>

        <article className="recruitment-stat-card">
          <span className="recruitment-stat-icon stat-green">
            <FiCheckCircle />
          </span>
          <div>
            <p>Open positions</p>
            <h2>{loading ? "—" : openJobs}</h2>
            <span>Currently open job posts</span>
          </div>
        </article>

        <article className="recruitment-stat-card">
          <span className="recruitment-stat-icon stat-purple">
            <FiUsers />
          </span>
          <div>
            <p>Available openings</p>
            <h2>{loading ? "—" : totalOpenings}</h2>
            <span>Positions across open jobs</span>
          </div>
        </article>

        <article className="recruitment-stat-card">
          <span className="recruitment-stat-icon stat-orange">
            <FiXCircle />
          </span>
          <div>
            <p>Closed job posts</p>
            <h2>{loading ? "—" : closedJobs}</h2>
            <span>Job posts no longer open</span>
          </div>
        </article>
      </section>
      <section className="recruitment-list-panel">
        <div className="recruitment-list-heading">
          <div>
            <h2>Job openings</h2>
            <p>
              {canManage
                ? "Search and manage recruitment opportunities."
                : "Explore available positions and apply for jobs that interest you."}
            </p>
          </div>

          <span className="recruitment-count">
            {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"}
          </span>
        </div>

        <div className="recruitment-filters">
          <label className="recruitment-search">
            <FiSearch />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, skill, or location..."
              aria-label="Search job openings"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by job status"
          >
            <option value="ALL">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            aria-label="Filter by department"
          >
            <option value="ALL">All departments</option>
            {departments.map((department) => (
              <option value={department} key={department}>
                {department}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="recruitment-empty-state">
            <FiRefreshCw className="recruitment-spinning" />
            <h3>Loading job openings...</h3>
            <p>Connecting to your recruitment service.</p>
          </div>
        ) : error && jobs.length === 0 ? (
          <div className="recruitment-empty-state">
            <FiBriefcase />
            <h3>Could not load job openings</h3>
            <p>{error}</p>
            <button
              type="button"
              className="recruitment-button recruitment-button-primary"
              onClick={loadJobs}
            >
              Try again
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="recruitment-empty-state">
            <FiBriefcase />
            <h3>
              {jobs.length === 0
                ? "No job openings yet"
                : "No matching job openings"}
            </h3>
            <p>
              {jobs.length === 0
                ? canManage
                  ? "Create your first job opening to get started."
                  : "There are currently no job openings to display."
                : "Try changing your search or filters."}
            </p>

            {canManage && jobs.length === 0 && (
              <button
                type="button"
                className="recruitment-button recruitment-button-primary"
                onClick={openCreateModal}
              >
                <FiPlus />
                Create first job
              </button>
            )}
          </div>
        ) : (
          <div className="recruitment-job-grid">
            {filteredJobs.map((job) => {
              const isOpen =
                String(job.status || "").toUpperCase() === "OPEN";

              const alreadyApplied = appliedJobIds.has(String(job.id));

              return (
                <article className="recruitment-job-card" key={job.id}>
                  <div className="recruitment-job-card-top">
                    <div className="recruitment-job-icon">
                      <FiBriefcase />
                    </div>

                    <span
                      className={`recruitment-status ${
                        isOpen ? "status-open" : "status-closed"
                      }`}
                    >
                      <span />
                      {isOpen ? "Open" : job.status || "Closed"}
                    </span>
                  </div>

                  <h3>{job.title}</h3>

                  <p className="recruitment-job-department">
                    {job.department || "Department not specified"}
                  </p>

                  <div className="recruitment-job-details">
                    <span>
                      <FiMapPin />
                      {job.location || "Location not specified"}
                    </span>

                    <span>
                      <FiClock />
                      {formatEmploymentType(job.employmentType)}
                    </span>

                    <span>
                      <FiUsers />
                      {Number(job.openings) || 0}{" "}
                      {(Number(job.openings) || 0) === 1
                        ? "opening"
                        : "openings"}
                    </span>

                    <span>
                      <FiDollarSign />
                      {formatSalary(job.minimumSalary)}
                      {job.maximumSalary != null &&
                      job.maximumSalary !== ""
                        ? ` – ${formatSalary(job.maximumSalary)}`
                        : ""}
                    </span>

                    {job.closingDate && (
                      <span>
                        <FiCalendar />
                        Closes {formatDate(job.closingDate)}
                      </span>
                    )}
                  </div>

                  {job.requiredSkills && (
                    <div className="recruitment-skills">
                      {String(job.requiredSkills)
                        .split(",")
                        .map((skill) => skill.trim())
                        .filter(Boolean)
                        .slice(0, 6)
                        .map((skill, index) => (
                          <span key={`${skill}-${index}`}>{skill}</span>
                        ))}
                    </div>
                  )}

                  {job.description && (
                    <p className="recruitment-job-description">
                      {job.description}
                    </p>
                  )}
                  {canApply && (
                    <div className="recruitment-job-actions">
                      {isOpen ? (
                        alreadyApplied ? (
                          <button
                            type="button"
                            className="recruitment-action-edit"
                            disabled
                          >
                            <FiCheckCircle />
                            Applied
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="recruitment-button recruitment-button-primary"
                            onClick={() => openApplyModal(job)}
                          >
                            <FiSend />
                            Apply Now
                          </button>
                        )
                      ) : (
                        <span className="recruitment-count">
                          Applications closed
                        </span>
                      )}
                    </div>
                  )}
                  {canManage && (
                    <div className="recruitment-job-actions">
                      <button
                        type="button"
                        className="recruitment-action-edit"
                        onClick={() => openApplicants(job)}
                      >
                        <FiEye />
                        View Applicants
                      </button>

                      <button
                        type="button"
                        className="recruitment-action-edit"
                        onClick={() => openEditModal(job)}
                      >
                        <FiEdit2 />
                        Edit
                      </button>

                      {isOpen && (
                        <button
                          type="button"
                          className="recruitment-action-close"
                          onClick={() => handleCloseJob(job)}
                        >
                          <FiXCircle />
                          Close
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          className="recruitment-action-delete"
                          onClick={() => handleDeleteJob(job)}
                          aria-label={`Delete ${job.title}`}
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
      {modalOpen && (
        <div
          className="recruitment-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              setModalOpen(false);
            }
          }}
        >
          <section
            className="recruitment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recruitment-modal-title"
          >
            <div className="recruitment-modal-heading">
              <div>
                <span className="recruitment-eyebrow">
                  <FiBriefcase />
                  JOB DETAILS
                </span>
                <h2 id="recruitment-modal-title">
                  {editingId !== null
                    ? "Edit job opening"
                    : "Create job opening"}
                </h2>
                <p>
                  Add the information candidates need to understand the role.
                </p>
              </div>

              <button
                type="button"
                className="recruitment-modal-close"
                onClick={() => setModalOpen(false)}
                disabled={saving}
                aria-label="Close form"
              >
                <FiX />
              </button>
            </div>

            {error && (
              <div className="recruitment-alert recruitment-alert-error">
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

            <form className="recruitment-form" onSubmit={handleSubmit}>
              <div className="recruitment-form-grid">
                <label>
                  Job title *
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleFormChange}
                    placeholder="e.g. Java Full Stack Developer"
                    required
                  />
                </label>

                <label>
                  Department *
                  <input
                    name="department"
                    value={form.department}
                    onChange={handleFormChange}
                    placeholder="e.g. IT"
                    required
                  />
                </label>

                <label>
                  Location
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleFormChange}
                    placeholder="e.g. Chennai / Hybrid"
                  />
                </label>

                <label>
                  Employment type
                  <select
                    name="employmentType"
                    value={form.employmentType}
                    onChange={handleFormChange}
                  >
                    <option value="FULL_TIME">Full time</option>
                    <option value="PART_TIME">Part time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="REMOTE">Remote</option>
                  </select>
                </label>

                <label>
                  Number of openings *
                  <input
                    name="openings"
                    type="number"
                    min="1"
                    step="1"
                    value={form.openings}
                    onChange={handleFormChange}
                    required
                  />
                </label>

                <label>
                  Closing date
                  <input
                    name="closingDate"
                    type="date"
                    value={form.closingDate}
                    onChange={handleFormChange}
                  />
                </label>

                <label>
                  Minimum annual salary (₹)
                  <input
                    name="minimumSalary"
                    type="number"
                    min="0"
                    step="1"
                    value={form.minimumSalary}
                    onChange={handleFormChange}
                    placeholder="e.g. 400000"
                  />
                </label>

                <label>
                  Maximum annual salary (₹)
                  <input
                    name="maximumSalary"
                    type="number"
                    min="0"
                    step="1"
                    value={form.maximumSalary}
                    onChange={handleFormChange}
                    placeholder="e.g. 800000"
                  />
                </label>

                <label className="recruitment-form-full">
                  Required skills
                  <input
                    name="requiredSkills"
                    value={form.requiredSkills}
                    onChange={handleFormChange}
                    placeholder="Java, Spring Boot, React, MySQL"
                  />
                </label>

                <label className="recruitment-form-full">
                  Job description
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    rows="5"
                    placeholder="Describe the responsibilities and requirements..."
                  />
                </label>
              </div>

              <div className="recruitment-form-footer">
                <button
                  type="button"
                  className="recruitment-button recruitment-button-secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="recruitment-button recruitment-button-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                      ? "Save changes"
                      : "Create job opening"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {applyModalOpen && selectedJob && (
        <div
          className="recruitment-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !applying
            ) {
              setApplyModalOpen(false);
            }
          }}
        >
          <section
            className="recruitment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="apply-modal-title"
          >
            <div className="recruitment-modal-heading">
              <div>
                <span className="recruitment-eyebrow">
                  <FiSend />
                  JOB APPLICATION
                </span>
                <h2 id="apply-modal-title">Apply for {selectedJob.title}</h2>
                <p>
                  {selectedJob.department} · {selectedJob.location || "Location not specified"}
                </p>
              </div>

              <button
                type="button"
                className="recruitment-modal-close"
                onClick={() => setApplyModalOpen(false)}
                disabled={applying}
                aria-label="Close application form"
              >
                <FiX />
              </button>
            </div>

            {error && (
              <div className="recruitment-alert recruitment-alert-error" role="alert">
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

            <div className="recruitment-form">
              <p>
                Applying as: <strong>{user?.fullName || user?.name || "Logged-in user"}</strong>
              </p>

              <p>
                Email: <strong>{user?.email || "Your registered email"}</strong>
              </p>

              <form onSubmit={handleApply}>
                <label>
                  Cover letter (optional)
                  <textarea
                    value={coverLetter}
                    onChange={(event) => setCoverLetter(event.target.value)}
                    rows="6"
                    maxLength={2000}
                    placeholder="Tell the hiring team why you're interested and what skills you bring..."
                  />
                </label>

                <p>{coverLetter.length}/2000 characters</p>

                <div className="recruitment-form-footer">
                  <button
                    type="button"
                    className="recruitment-button recruitment-button-secondary"
                    onClick={() => setApplyModalOpen(false)}
                    disabled={applying}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="recruitment-button recruitment-button-primary"
                    disabled={applying}
                  >
                    <FiSend />
                    {applying ? "Submitting..." : "Submit application"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      )}
      {applicantsModalOpen && applicantsJob && (
        <div
          className="recruitment-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setApplicantsModalOpen(false);
            }
          }}
        >
          <section
            className="recruitment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="applicants-modal-title"
          >
            <div className="recruitment-modal-heading">
              <div>
                <span className="recruitment-eyebrow">
                  <FiUsers />
                  CANDIDATE MANAGEMENT
                </span>
                <h2 id="applicants-modal-title">Applicants</h2>
                <p>{applicantsJob.title}</p>
              </div>

              <button
                type="button"
                className="recruitment-modal-close"
                onClick={() => setApplicantsModalOpen(false)}
                aria-label="Close applicants"
              >
                <FiX />
              </button>
            </div>

            {error && (
              <div className="recruitment-alert recruitment-alert-error" role="alert">
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

            {loadingApplicants ? (
              <div className="recruitment-empty-state">
                <FiRefreshCw className="recruitment-spinning" />
                <h3>Loading applicants...</h3>
              </div>
            ) : applicants.length === 0 ? (
              <div className="recruitment-empty-state">
                <FiUsers />
                <h3>No applications yet</h3>
                <p>Applicants will appear here after they apply.</p>
              </div>
            ) : (
              <div className="recruitment-job-grid">
                {applicants.map((application) => (
                  <article className="recruitment-job-card" key={application.id}>
                    <div className="recruitment-job-card-top">
                      <div className="recruitment-job-icon">
                        <FiUsers />
                      </div>

                      <span className="recruitment-status status-open">
                        <span />
                        {formatStatus(application.status)}
                      </span>
                    </div>

                    <h3>{application.applicantName || "Applicant"}</h3>

                    <p className="recruitment-job-department">
                      {application.applicantEmail || "Email not available"}
                    </p>

                    <div className="recruitment-job-details">
                      <span>
                        <FiCalendar />
                        Applied: {formatDate(application.appliedAt)}
                      </span>
                    </div>

                    {application.coverLetter && (
                      <p className="recruitment-job-description">
                        {application.coverLetter}
                      </p>
                    )}

                    <label>
                      Application status
                      <select
                        value={application.status || "PENDING"}
                        disabled={statusUpdatingId === application.id}
                        onChange={(event) =>
                          handleApplicationStatusChange(
                            application.id,
                            event.target.value
                          )
                        }
                      >
                        {APPLICATION_STATUSES.map((status) => (
                          <option value={status} key={status}>
                            {formatStatus(status)}
                          </option>
                        ))}
                      </select>
                    </label>

                    {statusUpdatingId === application.id && (
                      <p>Updating status...</p>
                    )}
                  </article>
                ))}
              </div>
            )}

            <div className="recruitment-form-footer">
              <button
                type="button"
                className="recruitment-button recruitment-button-secondary"
                onClick={() => setApplicantsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Recruitment;
