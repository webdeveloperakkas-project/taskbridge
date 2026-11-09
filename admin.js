
/* =========================================
   TASKBRIDGE - ADMIN CONTROL PANEL
   ADMIN.JS
========================================= */


/* =========================================
   SUPABASE CONFIGURATION
========================================= */


const SUPABASE_URL =
    "https://eboagroxkgpplccufpuk.supabase.co";


const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_UKOjnMUUrbVK3a0fruk55Q_Anjk04RA";


/* =========================================
   INITIALIZATION
========================================= */

document.addEventListener("DOMContentLoaded", async function () {

    "use strict";

    const $ = (selector) => document.querySelector(selector);

    const $$ = (selector) => document.querySelectorAll(selector);

    const supabaseLibrary = window.supabase;

    let supabaseClient = null;
    let currentAdmin = null;
    let allUsers = [];
    let allJobs = [];
    let allSubmissions = [];
    let allDeposits = [];
    let allWithdrawals = [];
    let realtimeChannel = null;
    let toastTimer = null;


    /* =====================================
       DATABASE TABLE CONFIGURATION
    ====================================== */

    const TABLES = [
        "profiles",
        "user_roles",
        "user_settings",
        "job_categories",
        "jobs",
        "job_submissions",
        "job_reviews",
        "user_reports",
        "wallets",
        "wallet_transactions",
        "deposits",
        "withdrawals",
        "admin_logs",
        "support_tickets",
        "platform_settings",
        "notifications",
        "user_login_history"
    ];


    /* =====================================
       PANEL CONFIGURATION
    ====================================== */

    const panels = {

        overviewPanel: {
            title: "Dashboard Overview",
            subtitle: "Monitor and manage your TaskBridge platform."
        },

        usersPanel: {
            title: "User Management",
            subtitle: "View and manage registered users."
        },

        verificationPanel: {
            title: "Account Verification",
            subtitle: "Review account verification status."
        },

        jobsPanel: {
            title: "Job Management",
            subtitle: "Manage all platform job listings."
        },

        submissionsPanel: {
            title: "Job Submissions",
            subtitle: "Monitor worker submissions."
        },

        depositsPanel: {
            title: "Deposit Management",
            subtitle: "Review incoming deposit requests."
        },

        withdrawalsPanel: {
            title: "Withdrawal Management",
            subtitle: "Review withdrawal requests."
        },

        transactionsPanel: {
            title: "Transactions",
            subtitle: "Monitor wallet transactions."
        },

        reportsPanel: {
            title: "User Reports",
            subtitle: "Review reports submitted by users."
        },

        supportPanel: {
            title: "Support Tickets",
            subtitle: "Manage customer support requests."
        },

        logsPanel: {
            title: "Admin Activity Logs",
            subtitle: "Review administrative activity."
        },

        settingsPanel: {
            title: "Platform Settings",
            subtitle: "Manage platform configuration."
        }

    };


    /* =====================================
       TABLE DISPLAY CONFIGURATION
    ====================================== */

    const tableConfig = {

        transactionsTable: {
            table: "wallet_transactions",
            columns: [
                ["id", "Transaction ID"],
                ["user_id", "User ID"],
                ["type", "Type"],
                ["amount", "Amount"],
                ["description", "Description"],
                ["created_at", "Date"]
            ]
        },

        reportsTable: {
            table: "user_reports",
            columns: [
                ["id", "Report ID"],
                ["reporter_id", "Reporter ID"],
                ["reported_user_id", "Reported User"],
                ["reason", "Reason"],
                ["status", "Status"],
                ["created_at", "Date"]
            ]
        },

        supportTable: {
            table: "support_tickets",
            columns: [
                ["id", "Ticket ID"],
                ["user_id", "User ID"],
                ["subject", "Subject"],
                ["status", "Status"],
                ["priority", "Priority"],
                ["created_at", "Date"]
            ]
        },

        logsTable: {
            table: "admin_logs",
            columns: [
                ["id", "Log ID"],
                ["admin_id", "Admin ID"],
                ["action", "Action"],
                ["target_id", "Target"],
                ["details", "Details"],
                ["created_at", "Date"]
            ]
        }

    };


    /* =====================================
       ELEMENTS
    ====================================== */

    const sidebar = $("#adminSidebar");
    const sidebarToggle = $("#sidebarToggle");
    const sidebarClose = $("#sidebarClose");
    const sidebarOverlay = $("#adminOverlay");

    const pageTitle = $("#pageTitle");
    const pageSubtitle = $("#pageSubtitle");

    const realtimeStatus = $("#realtimeStatus");
    const realtimeStatusText = $("#realtimeStatusText");

    const toast = $("#adminToast");

    const currentYear = $("#adminCurrentYear");

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }


    /* =====================================
       TOAST NOTIFICATION
    ====================================== */

    function showToast(message) {

        if (!toast) return;

        toast.textContent = message;

        toast.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer = setTimeout(function () {
            toast.classList.remove("show");
        }, 3500);

    }


    /* =====================================
       HTML ESCAPING
    ====================================== */

    function escapeHTML(value) {

        return String(value ?? "").replace(
            /[&<>"']/g,
            function (character) {

                const entities = {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#039;"
                };

                return entities[character];

            }
        );

    }


    /* =====================================
       DATE FORMATTING
    ====================================== */

    function formatDate(value) {

        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return escapeHTML(value);
        }

        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });

    }


    /* =====================================
       STATUS BADGE
    ====================================== */

    function statusBadge(value) {

        if (!value) {
            return '<span class="status-badge">Unknown</span>';
        }

        const status = String(value).toLowerCase();

        const allowedClasses = [
            "active",
            "approved",
            "verified",
            "completed",
            "pending",
            "pending_review",
            "unverified",
            "suspended",
            "paused",
            "expired",
            "blocked",
            "rejected",
            "cancelled"
        ];

        const className = allowedClasses.includes(status)
            ? "status-" + status
            : "";

        return `
            <span class="status-badge ${className}">
                ${escapeHTML(status.replaceAll("_", " "))}
            </span>
        `;

    }


    /* =====================================
       SIDEBAR
    ====================================== */

    function openSidebar() {

        if (!sidebar) return;

        sidebar.classList.add("open");

        if (sidebarOverlay) {
            sidebarOverlay.classList.add("show");
        }

    }


    function closeSidebar() {

        if (!sidebar) return;

        sidebar.classList.remove("open");

        if (sidebarOverlay) {
            sidebarOverlay.classList.remove("show");
        }

    }


    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", openSidebar);
    }

    if (sidebarClose) {
        sidebarClose.addEventListener("click", closeSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", closeSidebar);
    }


    /* =====================================
       PANEL SWITCHING
    ====================================== */

    function showPanel(panelId, updateURL = true) {

        if (!panels[panelId]) return;

        const target = document.getElementById(panelId);

        if (!target) return;


        $$(".admin-panel").forEach(function (panel) {
            panel.classList.remove("active");
        });

        target.classList.add("active");


        $$(".admin-nav-link").forEach(function (link) {

            const active = link.dataset.panel === panelId;

            link.classList.toggle("active", active);

        });


        const config = panels[panelId];

        if (pageTitle) {
            pageTitle.textContent = config.title;
        }

        if (pageSubtitle) {
            pageSubtitle.textContent = config.subtitle;
        }


        if (updateURL) {
            history.pushState(null, "", "#" + panelId);
        }

        closeSidebar();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    $$(".admin-nav-link").forEach(function (link) {

        link.addEventListener("click", function (event) {

            event.preventDefault();

            showPanel(this.dataset.panel);

        });

    });


    $$("[data-go-panel]").forEach(function (button) {

        button.addEventListener("click", function () {
            showPanel(this.dataset.goPanel);
        });

    });


    window.addEventListener("popstate", function () {

        const panelId = location.hash.replace("#", "");

        if (panels[panelId]) {
            showPanel(panelId, false);
        } else {
            showPanel("overviewPanel", false);
        }

    });


    const initialPanel = location.hash.replace("#", "");

    showPanel(
        panels[initialPanel] ? initialPanel : "overviewPanel",
        false
    );


    /* =====================================
       MODAL HELPERS
    ====================================== */

    function openModal(modalId) {

        const modal = document.getElementById(modalId);

        if (!modal) return;

        modal.classList.add("show");
        modal.setAttribute("aria-hidden", "false");

    }


    function closeModal(modal) {

        if (!modal) return;

        modal.classList.remove("show");
        modal.setAttribute("aria-hidden", "true");

    }


    $$("[data-close-modal]").forEach(function (button) {

        button.addEventListener("click", function () {

            closeModal(this.closest(".admin-modal"));

        });

    });


    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {

            closeSidebar();

            $$(".admin-modal.show").forEach(function (modal) {
                closeModal(modal);
            });

        }

    });


    /* =====================================
       SUPABASE CONNECTION
    ====================================== */

    if (!supabaseLibrary || !supabaseLibrary.createClient) {

        showToast("Supabase SDK could not be loaded.");

        console.error("Supabase JavaScript SDK not found.");

        return;

    }


    if (
        SUPABASE_URL.includes("YOUR_") ||
        SUPABASE_PUBLISHABLE_KEY.includes("YOUR_")
    ) {

        showToast("Please configure your Supabase URL and Publishable Key.");

        console.error("Supabase configuration is incomplete.");

        return;

    }


    try {

        supabaseClient = supabaseLibrary.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        );

    } catch (error) {

        console.error("Supabase initialization error:", error);

        showToast("Could not initialize Supabase.");

        return;

    }


    /* =====================================
       REALTIME CONNECTION STATUS
    ====================================== */

    function setRealtimeStatus(status, message) {

        if (!realtimeStatus) return;

        realtimeStatus.classList.remove(
            "connected",
            "error"
        );

        if (status === "connected") {
            realtimeStatus.classList.add("connected");
        }

        if (status === "error") {
            realtimeStatus.classList.add("error");
        }

        if (realtimeStatusText) {
            realtimeStatusText.textContent = message;
        }

    }


    /* =====================================
       AUTHENTICATION CHECK
    ====================================== */

    async function verifyAdmin() {

        const {
            data: { session },
            error: sessionError
        } = await supabaseClient.auth.getSession();


        if (sessionError) {
            throw sessionError;
        }


        if (!session || !session.user) {

            showToast("Please sign in first.");

            window.location.href = "./login.html";

            return false;

        }


        currentAdmin = session.user;


        // Verify admin role from user_roles

        const { data: roles, error: roleError } =
            await supabaseClient
                .from("user_roles")
                .select("*")
                .eq("user_id", currentAdmin.id);


        if (roleError) {
            throw roleError;
        }


        const isAdmin = (roles || []).some(function (item) {

            return String(item.role).toLowerCase() === "admin";

        });


        if (!isAdmin) {

            showToast("Access denied. Admin permission required.");

            await supabaseClient.auth.signOut();

            window.location.href = "./login.html";

            return false;

        }


        const adminProfile = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", currentAdmin.id)
            .maybeSingle();


        const name =
            adminProfile.data?.full_name ||
            currentAdmin.email ||
            "Administrator";


        if ($("#adminName")) {
            $("#adminName").textContent = name;
        }

        if ($("#headerAdminName")) {
            $("#headerAdminName").textContent = name;
        }

        if ($("#adminRole")) {
            $("#adminRole").textContent = "Admin";
        }


        return true;

    }


    /* =====================================
       DATA FETCH HELPER
    ====================================== */

    async function fetchTable(tableName) {

        const { data, error } = await supabaseClient
            .from(tableName)
            .select("*");

        if (error) {

            console.error(
                "Could not load table:",
                tableName,
                error.message
            );

            return [];

        }

        return data || [];

    }


    /* =====================================
       TABLE CELL FORMATTING
    ====================================== */

    function formatCell(value, key) {

        if (value === null || value === undefined || value === "") {
            return "—";
        }

        if (
            key.includes("created_at") ||
            key.includes("updated_at") ||
            key.includes("_at")
        ) {
            return formatDate(value);
        }

        if (key === "status" ||
            key === "account_status" ||
            key === "verification_status") {

            return statusBadge(value);

        }

        if (typeof value === "object") {

            return escapeHTML(JSON.stringify(value));

        }

        return escapeHTML(value);

    }


    /* =====================================
       GENERIC TABLE RENDERER
    ====================================== */

    function renderGenericTable(elementId, rows, columns) {

        const tbody = document.getElementById(elementId);

        if (!tbody) return;

        if (!rows || rows.length === 0) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="${columns.length}" class="empty-state">
                        No records found.
                    </td>
                </tr>
            `;

            return;

        }


        tbody.innerHTML = rows.map(function (row) {

            return `
                <tr>
                    ${columns.map(function (column) {

                        const key = column[0];

                        return `
                            <td>
                                ${formatCell(row[key], key)}
                            </td>
                        `;

                    }).join("")}
                </tr>
            `;

        }).join("");

    }


    /* =====================================
       USER DETAILS MODAL
    ====================================== */

    function showUserDetails(userId) {

        const user = allUsers.find(function (item) {
            return item.id === userId;
        });

        if (!user) return;


        const content = $("#userDetailsContent");

        if (!content) return;


        const details = [
            ["Full Name", user.full_name],
            ["Email", user.email],
            ["User ID", user.id],
            ["Verification", user.verification_status],
            ["Account Status", user.account_status],
            ["Country", user.country],
            ["Phone", user.phone],
            ["Created At", formatDate(user.created_at)],
            ["Updated At", formatDate(user.updated_at)]
        ];


        content.innerHTML = details.map(function (item) {

            return `
                <div class="detail-row">
                    <span>${escapeHTML(item[0])}</span>
                    <span>${escapeHTML(item[1] || "—")}</span>
                </div>
            `;

        }).join("");


        openModal("userDetailsModal");

    }


    /* =====================================
       USER TABLE
    ====================================== */

    function renderUsers() {

        const tbody = $("#usersTable");

        if (!tbody) return;


        const search = ($("#userSearch")?.value || "")
            .trim()
            .toLowerCase();

        const statusFilter = $("#userStatusFilter")?.value || "all";

        const verificationFilter =
            $("#userVerificationFilter")?.value || "all";


        const filtered = allUsers.filter(function (user) {

            const matchesSearch = [

                user.full_name,
                user.email,
                user.id

            ].some(function (value) {

                return String(value || "")
                    .toLowerCase()
                    .includes(search);

            });


            const matchesStatus =
                statusFilter === "all" ||
                user.account_status === statusFilter;


            const matchesVerification =
                verificationFilter === "all" ||
                user.verification_status === verificationFilter;


            return (
                matchesSearch &&
                matchesStatus &&
                matchesVerification
            );

        });


        if (!filtered.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        No matching users found.
                    </td>
                </tr>
            `;

            return;

        }


        tbody.innerHTML = filtered.map(function (user) {

            const roles = user.userRoles || [];

            const roleNames = roles.length
                ? roles.map(role => role.role).join(", ")
                : "—";

            const initial = (user.full_name || user.email || "U")
                .charAt(0)
                .toUpperCase();


            return `
                <tr>

                    <td>
                        <div class="table-user">

                            <div class="table-user-avatar">
                                ${escapeHTML(initial)}
                            </div>

                            <div>
                                <strong>
                                    ${escapeHTML(user.full_name || "Unnamed User")}
                                </strong>

                                <small>
                                    ${escapeHTML(user.email || "No email")}
                                </small>
                            </div>

                        </div>
                    </td>

                    <td>
                        <span class="user-id">
                            ${escapeHTML(user.id)}
                        </span>
                    </td>

                    <td>${escapeHTML(roleNames)}</td>

                    <td>
                        ${statusBadge(user.verification_status)}
                    </td>

                    <td>
                        ${statusBadge(user.account_status)}
                    </td>

                    <td>${formatDate(user.created_at)}</td>

                    <td>
                        <button type="button"
                            class="action-btn"
                            data-user-details="${escapeHTML(user.id)}">
                            View Details
                        </button>
                    </td>

                </tr>
            `;

        }).join("");

    }


    /* =====================================
       VERIFICATION TABLE
    ====================================== */

    function renderVerification() {

        const tbody = $("#verificationTable");

        if (!tbody) return;


        const pending = allUsers.filter(function (user) {

            return user.verification_status === "unverified";

        });


        if (!pending.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        No unverified accounts found.
                    </td>
                </tr>
            `;

            return;

        }


        tbody.innerHTML = pending.map(function (user) {

            return `
                <tr>

                    <td>
                        ${escapeHTML(user.full_name || "Unnamed User")}
                    </td>

                    <td>
                        <span class="user-id">
                            ${escapeHTML(user.id)}
                        </span>
                    </td>

                    <td>${escapeHTML(user.email || "—")}</td>

                    <td>${formatDate(user.created_at)}</td>

                    <td>
                        <button type="button"
                            class="action-btn"
                            data-user-details="${escapeHTML(user.id)}">
                            View Details
                        </button>
                    </td>

                </tr>
            `;

        }).join("");

    }


    /* =====================================
       JOB TABLE
    ====================================== */

    function renderJobs() {

        const tbody = $("#jobsTable");

        if (!tbody) return;


        const search = ($("#jobSearch")?.value || "")
            .trim()
            .toLowerCase();

        const status = $("#jobStatusFilter")?.value || "all";


        const filtered = allJobs.filter(function (job) {

            const matchesSearch = [

                job.title,
                job.id

            ].some(function (value) {

                return String(value || "")
                    .toLowerCase()
                    .includes(search);

            });


            return (
                matchesSearch &&
                (status === "all" || job.status === status)
            );

        });


        renderGenericTable(
            "jobsTable",
            filtered,
            [
                ["title", "Job Title"],
                ["id", "Job ID"],
                ["advertiser_id", "Advertiser"],
                ["reward_per_worker", "Reward"],
                ["workers_required", "Workers"],
                ["status", "Status"],
                ["created_at", "Created"]
            ]
        );

    }


    /* =====================================
       SUBMISSION TABLE
    ====================================== */

    function renderSubmissions() {

        const status =
            $("#submissionStatusFilter")?.value || "all";

        const filtered = allSubmissions.filter(function (item) {

            return status === "all" || item.status === status;

        });


        renderGenericTable(
            "submissionsTable",
            filtered,
            [
                ["id", "Submission ID"],
                ["job_id", "Job ID"],
                ["worker_id", "Worker ID"],
                ["status", "Status"],
                ["submitted_at", "Submitted"],
                ["created_at", "Created"]
            ]
        );

    }


    /* =====================================
       DEPOSIT TABLE
    ====================================== */

    function renderDeposits() {

        const status = $("#depositStatusFilter")?.value || "all";

        const filtered = allDeposits.filter(function (item) {

            return status === "all" || item.status === status;

        });


        renderGenericTable(
            "depositsTable",
            filtered,
            [
                ["id", "Deposit ID"],
                ["user_id", "User ID"],
                ["amount", "Amount"],
                ["payment_method", "Method"],
                ["status", "Status"],
                ["created_at", "Date"]
            ]
        );

    }


    /* =====================================
       WITHDRAWAL TABLE
    ====================================== */

    function renderWithdrawals() {

        const status =
            $("#withdrawalStatusFilter")?.value || "all";

        const filtered = allWithdrawals.filter(function (item) {

            return status === "all" || item.status === status;

        });


        renderGenericTable(
            "withdrawalsTable",
            filtered,
            [
                ["id", "Withdrawal ID"],
                ["user_id", "User ID"],
                ["amount", "Amount"],
                ["payment_method", "Method"],
                ["status", "Status"],
                ["created_at", "Date"]
            ]
        );

    }


    /* =====================================
       OVERVIEW STATISTICS
    ====================================== */

    function updateOverview(data) {

        const profiles = data.profiles || [];
        const jobs = data.jobs || [];
        const deposits = data.deposits || [];
        const withdrawals = data.withdrawals || [];


        const setText = function (id, value) {

            const element = document.getElementById(id);

            if (element) {
                element.textContent = value;
            }

        };


        setText("totalUsers", profiles.length);


        setText(
            "verifiedUsers",
            profiles.filter(function (user) {
                return user.verification_status === "verified";
            }).length
        );


        setText("totalJobs", jobs.length);


        setText(
            "pendingJobs",
            jobs.filter(function (job) {
                return job.status === "pending_review";
            }).length
        );


        setText(
            "pendingDeposits",
            deposits.filter(function (item) {
                return item.status === "pending";
            }).length
        );


        setText(
            "pendingWithdrawals",
            withdrawals.filter(function (item) {
                return item.status === "pending";
            }).length
        );


        // Recent users

        const recentUsers = [...profiles]
            .sort(function (a, b) {

                return new Date(b.created_at || 0) -
                    new Date(a.created_at || 0);

            })
            .slice(0, 5);


        const recentUsersBody = $("#recentUsersTable");

        if (recentUsersBody) {

            recentUsersBody.innerHTML = recentUsers.length
                ? recentUsers.map(function (user) {

                    return `
                        <tr>

                            <td>
                                <div class="table-user">
                                    <div class="table-user-avatar">
                                        ${escapeHTML(
                                            (user.full_name || "U").charAt(0).toUpperCase()
                                        )}
                                    </div>

                                    <div>
                                        <strong>
                                            ${escapeHTML(user.full_name || "Unnamed User")}
                                        </strong>
                                        <small>
                                            ${escapeHTML(user.email || "—")}
                                        </small>
                                    </div>
                                </div>
                            </td>

                            <td>
                                <span class="user-id">
                                    ${escapeHTML(user.id)}
                                </span>
                            </td>

                            <td>${statusBadge(user.verification_status)}</td>

                            <td>${statusBadge(user.account_status)}</td>

                            <td>${formatDate(user.created_at)}</td>

                        </tr>
                    `;

                }).join("")
                : `
                    <tr>
                        <td colspan="5" class="empty-state">
                            No users found.
                        </td>
                    </tr>
                `;

        }


        // Recent jobs

        const recentJobs = [...jobs]
            .sort(function (a, b) {

                return new Date(b.created_at || 0) -
                    new Date(a.created_at || 0);

            })
            .slice(0, 5);


        const recentJobsBody = $("#recentJobsTable");

        if (recentJobsBody) {

            recentJobsBody.innerHTML = recentJobs.length
                ? recentJobs.map(function (job) {

                    return `
                        <tr>

                            <td>${escapeHTML(job.title || "Untitled Job")}</td>

                            <td>
                                <span class="user-id">
                                    ${escapeHTML(job.advertiser_id || "—")}
                                </span>
                            </td>

                            <td>${escapeHTML(job.total_budget ?? "—")}</td>

                            <td>${statusBadge(job.status)}</td>

                            <td>${formatDate(job.created_at)}</td>

                        </tr>
                    `;

                }).join("")
                : `
                    <tr>
                        <td colspan="5" class="empty-state">
                            No jobs found.
                        </td>
                    </tr>
                `;

        }

    }


    /* =====================================
       LOAD ALL ADMIN DATA
    ====================================== */

    async function loadAdminData() {

        try {

            const results = await Promise.all(
                TABLES.map(table => fetchTable(table))
            );


            const data = {};

            TABLES.forEach(function (table, index) {
                data[table] = results[index];
            });


            allUsers = data.profiles || [];
            allJobs = data.jobs || [];
            allSubmissions = data.job_submissions || [];
            allDeposits = data.deposits || [];
            allWithdrawals = data.withdrawals || [];


            // Attach roles to user profiles

            const roles = data.user_roles || [];

            allUsers = allUsers.map(function (user) {

                return {
                    ...user,

                    userRoles: roles.filter(function (role) {

                        return role.user_id === user.id;

                    })

                };

            });


            updateOverview(data);

            renderUsers();
            renderVerification();
            renderJobs();
            renderSubmissions();
            renderDeposits();
            renderWithdrawals();


            // Generic financial and support tables

            Object.entries(tableConfig).forEach(function (entry) {

                const elementId = entry[0];
                const config = entry[1];

                renderGenericTable(
                    elementId,
                    data[config.table] || [],
                    config.columns
                );

            });


            // Platform settings

            const settingsContainer = $("#platformSettingsContainer");

            if (settingsContainer) {

                const settings = data.platform_settings || [];

                settingsContainer.innerHTML = settings.length
                    ? `
                        <div class="table-responsive">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>Setting</th>
                                        <th>Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${settings.map(function (setting) {

                                        return `
                                            <tr>
                                                <td>
                                                    ${escapeHTML(
                                                        setting.key ??
                                                        setting.name ??
                                                        setting.id
                                                    )}
                                                </td>

                                                <td>
                                                    ${escapeHTML(
                                                        typeof setting.value === "object"
                                                            ? JSON.stringify(setting.value)
                                                            : setting.value ?? "—"
                                                    )}
                                                </td>
                                            </tr>
                                        `;

                                    }).join("")}
                                </tbody>
                            </table>
                        </div>
                    `
                    : '<p class="empty-state">No platform settings found.</p>';

            }


        } catch (error) {

            console.error("Admin data loading error:", error);

            showToast("Some admin data could not be loaded.");

        }

    }


    /* =====================================
       USER TABLE ACTIONS
    ====================================== */

    document.addEventListener("click", function (event) {

        const detailsButton = event.target.closest(
            "[data-user-details]"
        );

        if (detailsButton) {

            showUserDetails(detailsButton.dataset.userDetails);

        }

    });


    /* =====================================
       SEARCH AND FILTER EVENTS
    ====================================== */

    [
        "userSearch",
        "userStatusFilter",
        "userVerificationFilter"
    ].forEach(function (id) {

        const element = document.getElementById(id);

        if (!element) return;

        element.addEventListener("input", renderUsers);
        element.addEventListener("change", renderUsers);

    });


    [
        "jobSearch",
        "jobStatusFilter"
    ].forEach(function (id) {

        const element = document.getElementById(id);

        if (!element) return;

        element.addEventListener("input", renderJobs);
        element.addEventListener("change", renderJobs);

    });


    const submissionFilter = $("#submissionStatusFilter");

    if (submissionFilter) {
        submissionFilter.addEventListener("change", renderSubmissions);
    }


    const depositFilter = $("#depositStatusFilter");

    if (depositFilter) {
        depositFilter.addEventListener("change", renderDeposits);
    }


    const withdrawalFilter = $("#withdrawalStatusFilter");

    if (withdrawalFilter) {
        withdrawalFilter.addEventListener("change", renderWithdrawals);
    }


    /* =====================================
       REFRESH BUTTONS
    ====================================== */

    const refreshButtons = [

        "refreshUsers",
        "refreshJobs",
        "refreshSubmissions",
        "refreshDeposits",
        "refreshWithdrawals"

    ];


    refreshButtons.forEach(function (id) {

        const button = document.getElementById(id);

        if (!button) return;

        button.addEventListener("click", async function () {

            button.disabled = true;

            try {

                await loadAdminData();

                showToast("Data refreshed successfully.");

            } finally {

                button.disabled = false;

            }

        });

    });


    /* =====================================
       REALTIME SUBSCRIPTION
    ====================================== */

    function setupRealtime() {

        if (realtimeChannel) {

            supabaseClient.removeChannel(realtimeChannel);

        }


        setRealtimeStatus("connecting", "Connecting...");


        realtimeChannel = supabaseClient
            .channel("taskbridge-admin-realtime");


        TABLES.forEach(function (table) {

            realtimeChannel.on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: table
                },
                function (payload) {

                    console.log(
                        "Realtime update:",
                        table,
                        payload.eventType
                    );

                    loadAdminData();

                }
            );

        });


        realtimeChannel.subscribe(function (status) {

            if (status === "SUBSCRIBED") {

                setRealtimeStatus("connected", "Realtime Live");

            } else if (
                status === "CHANNEL_ERROR" ||
                status === "TIMED_OUT"
            ) {

                setRealtimeStatus("error", "Realtime Error");

                console.warn(
                    "Realtime subscription issue:",
                    status
                );

            } else {

                setRealtimeStatus("connecting", "Connecting...");

            }

        });

    }


    /* =====================================
       ADMIN SIGN OUT
    ====================================== */

    const logoutButton = $("#adminLogout");

    if (logoutButton) {

        logoutButton.addEventListener("click", async function () {

            const confirmed = window.confirm(
                "Are you sure you want to sign out?"
            );

            if (!confirmed) return;


            const { error } = await supabaseClient.auth.signOut();

            if (error) {

                console.error("Logout error:", error);

                showToast("Could not sign out.");

                return;

            }


            window.location.href = "./login.html";

        });

    }


    /* =====================================
       AUTH STATE CHANGES
    ====================================== */

    supabaseClient.auth.onAuthStateChange(function (event) {

        if (
            event === "SIGNED_OUT" &&
            currentAdmin
        ) {

            window.location.href = "./login.html";

        }

    });


    /* =====================================
       INITIAL ADMIN STARTUP
    ====================================== */

    try {

        const authorized = await verifyAdmin();

        if (!authorized) return;


        await loadAdminData();

        setupRealtime();


        console.log(
            "TaskBridge Admin Control Panel initialized successfully."
        );

        showToast("Admin Control Panel connected.");


    } catch (error) {

        console.error("Admin initialization error:", error);

        setRealtimeStatus("error", "Connection Error");

        showToast(
            error.message ||
            "Admin panel initialization failed."
        );

    }


    /* =====================================
       CLEANUP
    ====================================== */

    window.addEventListener("beforeunload", function () {

        if (realtimeChannel && supabaseClient) {

            supabaseClient.removeChannel(realtimeChannel);

        }

    });

});
