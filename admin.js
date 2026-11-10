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
    let allCategories = [];
    let allSubmissions = [];
    let selectedJobId = null;
    let allDeposits = [];
    let allWithdrawals = [];
    let allWallets = [];
    let allFeeLedger = [];
    let feeLedgerLoadError = null;
    let realtimeChannel = null;
    let toastTimer = null;
    let buyerSearchQuery = "";
    let expandedLoginUserId = null;
    let loginActivitySearchResults = null;
    let loginActivitySearchRequest = 0;
    const loginHistoryPages = new Map();
    const LOGIN_HISTORY_PAGE_SIZE = 20;


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
        "administration_fee_ledger",
        "notifications"
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

        buyerManagementPanel: {
            title: "Buyer Management",
            subtitle: "Review buyer job statistics and wallet balances."
        },

        loginActivityPanel: {
            title: "Login Activity",
            subtitle: "Review user sign-in history and device information."
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

        walletsPanel: {
            title: "Wallet Management",
            subtitle: "View user wallet balances and account details."
        },

        administrationAccountPanel: {
            title: "Administration Account",
            subtitle: "Review job administration fees, color fees, refunds and earned revenue."
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


    // Match login.js storage: support both Remember Me
    // (localStorage) and temporary sessions (sessionStorage).
    const authStorage = {
        getItem(key) {
            return (
                localStorage.getItem(key) ??
                sessionStorage.getItem(key)
            );
        },

        setItem(key, value) {
            if (localStorage.getItem(key) !== null) {
                localStorage.setItem(key, value);
                sessionStorage.removeItem(key);
            } else {
                sessionStorage.setItem(key, value);
                localStorage.removeItem(key);
            }
        },

        removeItem(key) {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        }
    };

    try {

        supabaseClient = supabaseLibrary.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY,
            {
                auth: {
                    storage: authStorage,
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true
                }
            }
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

            console.error(
                "Admin authentication diagnostic: no Supabase session found.",
                {
                    page: window.location.href,
                    origin: window.location.origin,
                    hasLocalStorage: Boolean(localStorage.getItem(
                        "sb-eboagroxkgpplccufpuk-auth-token"
                    )),
                    hasSessionStorage: Boolean(sessionStorage.getItem(
                        "sb-eboagroxkgpplccufpuk-auth-token"
                    ))
                }
            );

            window.location.replace("./admin-login.html");
            return false;

        }


        currentAdmin = session.user;


        // Use the database's canonical admin check.
        // This keeps the frontend authorization decision aligned with
        // the SECURITY DEFINER checks used by protected database functions.
        const { data: isAdmin, error: adminCheckError } =
            await supabaseClient.rpc("is_admin");


        if (adminCheckError) {
            console.error("Admin role verification failed:", adminCheckError);
            throw adminCheckError;
        }


        if (isAdmin !== true) {

            console.warn(
                "Admin access denied by public.is_admin() for authenticated user:",
                currentAdmin.id,
                "Returned value:",
                isAdmin
            );

            showToast("Admin permission required. Please sign in through Admin Login.");

            await supabaseClient.auth.signOut();
            window.location.replace("./admin-login.html");
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

            if (tableName === "administration_fee_ledger") {
                feeLedgerLoadError = error.message;
            }

            return [];

        }

        if (tableName === "administration_fee_ledger") {
            feeLedgerLoadError = null;
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
       TRANSACTION TABLE
    ====================================== */

    function paymentMethodLogo(method) {
        const value = String(method || "").toLowerCase().replace(/[\\s_-]+/g, "");
        const logos = {
            bkash: '<span class="payment-logo payment-logo-bkash" title="bKash" aria-label="bKash">b</span>',
            nagad: '<span class="payment-logo payment-logo-nagad" title="Nagad" aria-label="Nagad">n</span>',
            rocket: '<span class="payment-logo payment-logo-rocket" title="Rocket" aria-label="Rocket">✦</span>',
            visa: '<span class="payment-logo payment-logo-visa" title="Visa" aria-label="Visa">V</span>',
            mastercard: '<span class="payment-logo payment-logo-mastercard" title="Mastercard" aria-label="Mastercard"><i></i><i></i></span>',
            wise: '<span class="payment-logo payment-logo-wise" title="Wise" aria-label="Wise">W</span>',
            banktransfer: '<span class="payment-logo payment-logo-bank" title="Bank Transfer" aria-label="Bank Transfer">▤</span>',
            usdttrc20: '<span class="payment-logo payment-logo-usdt" title="USDT TRC20" aria-label="USDT TRC20">₮</span>',
            usdtbep20: '<span class="payment-logo payment-logo-usdt" title="USDT BEP20" aria-label="USDT BEP20">₮</span>'
        };
        return logos[value] || '<span class="payment-logo payment-logo-default" title="Payment method" aria-label="Payment method">↔</span>';
    }

    function renderTransactions(data) {
        const tbody = $("#transactionsTable");
        if (!tbody) return;

        const deposits = (data.deposits || []).map(item => ({
            id: item.id,
            user_id: item.user_id,
            category: "deposit",
            payment_method: item.payment_method,
            payment_transaction_id: item.transaction_reference,
            amount: item.amount,
            currency: item.currency || "USD",
            status: item.status,
            description: item.review_note || "Deposit request",
            created_at: item.created_at
        }));

        const withdrawals = (data.withdrawals || []).map(item => ({
            id: item.id,
            user_id: item.user_id,
            category: "withdraw",
            payment_method: item.payment_method,
            payment_transaction_id: "",
            amount: item.amount,
            currency: item.currency || "USD",
            status: item.status,
            description: item.admin_note || "Withdrawal request",
            created_at: item.created_at
        }));

        const requestIds = new Set([...deposits, ...withdrawals].map(item => item.id));
        const ledger = (data.wallet_transactions || [])
            .filter(item => !requestIds.has(item.reference_id))
            .map(item => ({
                id: item.id,
                user_id: item.user_id,
                category: String(item.transaction_type || "transaction").toLowerCase().includes("withdraw")
                    ? "withdraw" : String(item.transaction_type || "").toLowerCase().includes("deposit")
                        ? "deposit" : "other",
                payment_method: "",
                amount: item.amount,
                currency: item.currency || "USD",
                status: "completed",
                description: item.description || item.transaction_type || "Wallet transaction",
                created_at: item.created_at
            }));

        const rows = [...deposits, ...withdrawals, ...ledger]
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No transactions found.</td></tr>';
            return;
        }

        tbody.innerHTML = rows.map(item => {
            const typeLabel = item.category === "deposit" ? "Deposit"
                : item.category === "withdraw" ? "Withdraw" : "Other";
            const typeClass = item.category === "deposit" ? "transaction-type-deposit"
                : item.category === "withdraw" ? "transaction-type-withdraw" : "transaction-type-other";
            const amount = Number(item.amount || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2, maximumFractionDigits: 2
            });
            return `
                <tr>
                    <td><span class="user-id transaction-user-id">${escapeHTML(item.user_id || "—")}</span></td>
                    <td><span class="transaction-type-badge ${typeClass}">${typeLabel}</span></td>
                    <td><span class="user-id transaction-id">${escapeHTML(item.id || "—")}</span></td>
                    <td class="transaction-method-cell">
                        ${paymentMethodLogo(item.payment_method)}
                        ${item.payment_transaction_id ? '<small class="payment-transaction-id">Txn: ' + escapeHTML(item.payment_transaction_id) + '</small>' : ''}
                    </td>
                    <td><strong>${amount} ${escapeHTML(item.currency)}</strong></td>
                    <td>${escapeHTML(item.description || "—")}</td>
                    <td>${formatDate(item.created_at)}</td>
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
       LOGIN ACTIVITY
    ====================================== */

    function renderLoginActivityUsers() {
        const tbody = $("#loginActivityUsersTable");
        if (!tbody) return;

        const filteredUsers = loginActivitySearchResults === null
            ? allUsers
            : loginActivitySearchResults;

        if (!filteredUsers.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No matching users found.</td></tr>';
            return;
        }

        tbody.innerHTML = filteredUsers.map(user => {
            const userId = escapeHTML(user.id);
            const isExpanded = expandedLoginUserId === user.id;
            const initial = (user.full_name || user.email || "U").charAt(0).toUpperCase();
            return `
                <tr class="login-user-row">
                    <td>
                        <div class="table-user">
                            <div class="table-user-avatar">${escapeHTML(initial)}</div>
                            <div><strong>${escapeHTML(user.full_name || "Unnamed User")}</strong></div>
                        </div>
                    </td>
                    <td><span class="user-id">${userId}</span></td>
                    <td>${escapeHTML(user.email || "—")}</td>
                    <td>
                        <button type="button" class="action-btn login-details-btn"
                            data-login-details="${userId}" aria-expanded="${isExpanded}">
                            ${isExpanded ? "Hide Details" : "Details"}
                        </button>
                    </td>
                </tr>
                ${isExpanded ? `
                    <tr class="login-history-expanded-row">
                        <td colspan="4">
                            <div class="login-history-panel" id="loginHistoryPanel-${userId}">
                                <div class="login-history-heading">
                                    <div><strong>Login History</strong><span>Latest 100 records · 20 per page</span></div>
                                    <span class="login-history-loading">Loading...</span>
                                </div>
                            </div>
                        </td>
                    </tr>
                ` : ""}
            `;
        }).join("");

        if (expandedLoginUserId) {
            const selectedUser = filteredUsers.find(user => user.id === expandedLoginUserId);
            if (selectedUser) loadUserLoginHistory(selectedUser);
        }
    }

    async function loadUserLoginHistory(user) {
        const panel = document.getElementById("loginHistoryPanel-" + user.id);
        if (!panel) return;

        const page = loginHistoryPages.get(user.id) || 1;
        const from = (page - 1) * LOGIN_HISTORY_PAGE_SIZE;
        const to = from + LOGIN_HISTORY_PAGE_SIZE - 1;

        panel.innerHTML = `
            <div class="login-history-heading">
                <div><strong>${escapeHTML(user.full_name || user.email || "User")} — Login History</strong>
                <span>Page ${page} · Latest 100 records</span></div>
                <span class="login-history-loading">Loading records...</span>
            </div>
        `;

        try {
            const { data, error, count } = await supabaseClient
                .from("user_login_history")
                .select("id, ip_address, device_type, browser, operating_system, user_agent, device_timezone, login_at, logout_at, created_at", { count: "exact" })
                .eq("user_id", user.id)
                .order("login_at", { ascending: false })
                .range(from, to);

            if (error) throw error;

            const records = data || [];
            const total = Math.min(count || 0, 100);
            const totalPages = Math.max(1, Math.ceil(total / LOGIN_HISTORY_PAGE_SIZE));

            if (!records.length) {
                panel.innerHTML = `
                    <div class="login-history-heading">
                        <div><strong>${escapeHTML(user.full_name || user.email || "User")} — Login History</strong>
                        <span>0 records</span></div>
                    </div>
                    <p class="login-history-empty">No login records found for this user.</p>
                `;
                return;
            }

            panel.innerHTML = `
                <div class="login-history-heading">
                    <div>
                        <strong>${escapeHTML(user.full_name || user.email || "User")} — Login History</strong>
                        <span>${total} saved records · Page ${page} of ${totalPages}</span>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="admin-table login-history-table">
                        <thead><tr>
                            <th>Login Time (UTC)</th><th>Logout Time (UTC)</th><th>IP Address</th>
                            <th>Device</th><th>Browser</th><th>Operating System</th>
                            <th>Device Timezone</th><th>User Agent</th><th>Record ID</th>
                        </tr></thead>
                        <tbody>
                            ${records.map(record => `
                                <tr>
                                    <td>${escapeHTML(new Date(record.login_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "medium", timeZone: "UTC" }))}</td>
                                    <td>${record.logout_at ? escapeHTML(new Date(record.logout_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "medium", timeZone: "UTC" })) : "—"}</td>
                                    <td><span class="user-id">${escapeHTML(record.ip_address || "Unavailable")}</span></td>
                                    <td>${escapeHTML(record.device_type || "Unknown")}</td>
                                    <td>${escapeHTML(record.browser || "Unknown")}</td>
                                    <td>${escapeHTML(record.operating_system || "Unknown")}</td>
                                    <td>${escapeHTML(record.device_timezone || "Unknown")}</td>
                                    <td><span class="login-user-agent">${escapeHTML(record.user_agent || "Unavailable")}</span></td>
                                    <td><span class="user-id">${escapeHTML(record.id)}</span></td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
                <div class="login-history-pagination">
                    <span>Showing ${from + 1}–${Math.min(from + records.length, total)} of ${total}</span>
                    <div>
                        <button type="button" class="secondary-btn" data-login-page="${page - 1}" data-login-user="${escapeHTML(user.id)}" ${page <= 1 ? "disabled" : ""}>Previous</button>
                        <button type="button" class="secondary-btn" data-login-page="${page + 1}" data-login-user="${escapeHTML(user.id)}" ${page >= totalPages ? "disabled" : ""}>Next</button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error("Could not load user login history:", error);
            panel.innerHTML = '<p class="login-history-error">Could not load login history. Check the admin permissions and database policy.</p>';
        }
    }

    document.addEventListener("click", function(event) {
        const detailsButton = event.target.closest("[data-login-details]");
        if (detailsButton) {
            const userId = detailsButton.dataset.loginDetails;
            expandedLoginUserId = expandedLoginUserId === userId ? null : userId;
            if (expandedLoginUserId) loginHistoryPages.set(userId, 1);
            renderLoginActivityUsers();
            return;
        }

        const pageButton = event.target.closest("[data-login-page]");
        if (pageButton && !pageButton.disabled) {
            const userId = pageButton.dataset.loginUser;
            const nextPage = Number(pageButton.dataset.loginPage);
            loginHistoryPages.set(userId, nextPage);
            const userPool = loginActivitySearchResults === null ? allUsers : loginActivitySearchResults;
            const user = userPool.find(item => item.id === userId);
            if (user) loadUserLoginHistory(user);
        }
    });

    const loginActivitySearch = $("#loginActivitySearch");
    const loginActivitySearchButton = $("#loginActivitySearchButton");

    async function searchLoginActivityUsers() {
        const query = (loginActivitySearch?.value || "").trim();
        const requestId = ++loginActivitySearchRequest;

        if (!query) {
            loginActivitySearchResults = null;
            expandedLoginUserId = null;
            renderLoginActivityUsers();
            return;
        }

        const tbody = $("#loginActivityUsersTable");
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Searching users...</td></tr>';
        }

        try {
            const pattern = `%${query}%`;
            const searches = await Promise.all([
                supabaseClient.from("profiles").select("*").ilike("email", pattern).limit(50),
                supabaseClient.from("profiles").select("*").ilike("full_name", pattern).limit(50)
            ]);

            if (requestId !== loginActivitySearchRequest) return;

            const failedSearch = searches.find(result => result.error);
            if (failedSearch) throw failedSearch.error;

            const uniqueUsers = new Map();
            searches.forEach(result => (result.data || []).forEach(user => {
                uniqueUsers.set(user.id, user);
            }));

            loginActivitySearchResults = Array.from(uniqueUsers.values());
            if (expandedLoginUserId && !uniqueUsers.has(expandedLoginUserId)) {
                expandedLoginUserId = null;
            }

            renderLoginActivityUsers();
        } catch (error) {
            console.error("Login Activity user search failed:", error);
            if (requestId === loginActivitySearchRequest && tbody) {
                tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Could not search users. Check the admin profile permissions.</td></tr>';
            }
        }
    }

    if (loginActivitySearchButton) {
        loginActivitySearchButton.addEventListener("click", searchLoginActivityUsers);
    }

    if (loginActivitySearch) {
        loginActivitySearch.addEventListener("keydown", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                searchLoginActivityUsers();
            }
        });
    }

    const refreshLoginActivity = $("#refreshLoginActivity");
    if (refreshLoginActivity) refreshLoginActivity.addEventListener("click", async function() {
        refreshLoginActivity.disabled = true;
        try {
            await loadAdminData();
            if ((loginActivitySearch?.value || "").trim()) {
                await searchLoginActivityUsers();
            } else {
                loginActivitySearchResults = null;
                renderLoginActivityUsers();
            }
            showToast("Login Activity refreshed.");
        } finally {
            refreshLoginActivity.disabled = false;
        }
    });


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

        const search = ($("#jobSearch")?.value || "").trim().toLowerCase();
        const status = $("#jobStatusFilter")?.value || "all";

        const filtered = allJobs.filter(function (job) {
            const matchesSearch = [job.title, job.id, job.advertiser_id]
                .some(value => String(value || "").toLowerCase().includes(search));
            return matchesSearch && (status === "all" || job.status === status);
        });

        if (!filtered.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No matching jobs found.</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(function (job) {
            return `
                <tr>
                    <td>${escapeHTML(job.title || "Untitled Job")}</td>
                    <td><small class="user-id">${escapeHTML(job.id)}</small></td>
                    <td><small class="user-id">${escapeHTML(job.advertiser_id || "—")}</small></td>
                    <td>${escapeHTML(job.reward_per_worker ?? "—")} ${escapeHTML(job.currency || "USD")}</td>
                    <td>${escapeHTML(job.total_slots ?? "—")}</td>
                    <td>${statusBadge(job.status)}</td>
                    <td>
                        <button type="button" class="action-btn"
                            data-job-details="${escapeHTML(job.id)}">View Details</button>
                    </td>
                </tr>
            `;
        }).join("");

    }


    /* =====================================
       JOB DETAILS AND ADMIN REVIEW
    ====================================== */

    function showJobDetails(jobId) {

        const job = allJobs.find(item => item.id === jobId);
        const content = $("#jobDetailsContent");
        const noteInput = $("#jobReviewNote");
        const actions = $("#jobReviewActions");
        if (!job || !content) return;

        selectedJobId = job.id;
        if (noteInput) noteInput.value = job.admin_review_note || "";

        const category = allCategories.find(item => item.id === job.category_id);
        const advertiser = allUsers.find(item => item.id === job.advertiser_id);
        const details = [
            ["Job Title", job.title],
            ["Job ID", job.id],
            ["Advertiser", advertiser?.full_name || advertiser?.email || job.advertiser_id],
            ["Advertiser ID", job.advertiser_id],
            ["Category", category?.name || job.category_id],
            ["Description", job.description],
            ["Instructions", job.instructions],
            ["Target URL", job.target_url],
            ["Proof Requirements", job.proof_requirements],
            ["Extra Instructions", job.extra_instructions],
            ["Reward per Worker", job.reward_per_worker == null ? null : job.reward_per_worker + " " + (job.currency || "USD")],
            ["Total Workers", job.total_slots],
            ["Duration (minutes)", job.duration_minutes],
            ["Platform Fee Rate (%)", job.platform_fee_rate],
            ["Reward Budget", job.reward_budget],
            ["Platform Fee Budget", job.platform_fee_budget],
            ["Reserved Budget", job.reserved_budget],
            ["Remaining Budget", job.remaining_budget],
            ["Status", job.status],
            ["Created At", job.created_at ? new Date(job.created_at).toLocaleString() : null],
            ["Last Updated", job.updated_at ? new Date(job.updated_at).toLocaleString() : null],
            ["Reviewed By", job.admin_reviewed_by],
            ["Reviewed At", job.admin_reviewed_at ? new Date(job.admin_reviewed_at).toLocaleString() : null],
            ["Previous Admin Note", job.admin_review_note]
        ];

        content.innerHTML = details.map(([label, value]) => `
            <div class="detail-row">
                <span>${escapeHTML(label)}</span>
                <span style="white-space:pre-wrap;overflow-wrap:anywhere">${escapeHTML(value ?? "—")}</span>
            </div>
        `).join("");

        if (actions) {
            const canReview = job.status === "pending_review" || job.status === "active";
            actions.hidden = !canReview;
            const approveButton = actions.querySelector('[data-job-review="approve"]');
            const rejectButton = actions.querySelector('[data-job-review="reject"]');
            const noteLabel = actions.querySelector('label[for="jobReviewNote"]');
            if (approveButton) approveButton.hidden = job.status !== "pending_review";
            if (rejectButton) rejectButton.textContent = job.status === "active"
                ? "Reject Approved Job" : "Reject Job";
            if (noteLabel) noteLabel.textContent = job.status === "active"
                ? "Admin Rejection Reason (required)" : "Admin Review Note";
        }
        openModal("jobDetailsModal");
    }


    async function reviewJob(decision, button) {

        const job = allJobs.find(item => item.id === selectedJobId);
        const canApprove = job?.status === "pending_review";
        const canReject = job?.status === "pending_review" || job?.status === "active";
        if (!job || (decision === "approve" && !canApprove) || (decision === "reject" && !canReject)) {
            showToast("This job status has changed. Refreshing...");
            closeModal($("#jobDetailsModal"));
            await loadAdminData();
            return;
        }

        const note = ($("#jobReviewNote")?.value || "").trim();
        if (decision === "reject" && !note) {
            showToast("Please enter a reason before rejecting this job.");
            $("#jobReviewNote")?.focus();
            return;
        }

        const rejectingApprovedJob = decision === "reject" && job.status === "active";
        const confirmed = window.confirm(
            decision === "approve"
                ? "Approve this job? It will become active and its reserved budget will remain held."
                : rejectingApprovedJob
                    ? "Reject this already-approved job? The remaining held budget will be refunded. Any worker submissions currently in progress or submitted will be cancelled. Completed work and payouts will not be reversed."
                    : "Reject this pending job? Its remaining held budget will be refunded to the advertiser."
        );
        if (!confirmed) return;

        if (button) button.disabled = true;

        try {
            const functionName = decision === "approve"
                ? "approve_job"
                : rejectingApprovedJob
                    ? "admin_reject_approved_job"
                    : "reject_job";
            const { error } = await supabaseClient.rpc(functionName, {
                p_job_id: job.id,
                p_admin_note: note || null
            });
            if (error) throw error;

            showToast(decision === "approve"
                ? "Job approved and activated."
                : rejectingApprovedJob
                    ? "Approved job rejected; remaining held budget refunded."
                    : "Job rejected and remaining held budget refunded.");

            closeModal($("#jobDetailsModal"));
            selectedJobId = null;
            await loadAdminData();

        } catch (error) {
            console.error("Job review failed:", error);
            showToast(error.message || "Could not review this job.");
            await loadAdminData();
        } finally {
            if (button) button.disabled = false;
        }
    }


    document.addEventListener("click", function (event) {
        const detailsButton = event.target.closest("[data-job-details]");
        if (detailsButton) {
            showJobDetails(detailsButton.dataset.jobDetails);
            return;
        }

        const reviewButton = event.target.closest("[data-job-review]");
        if (reviewButton) {
            reviewJob(reviewButton.dataset.jobReview, reviewButton);
        }
    });


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
       DEPOSIT TABLE AND REVIEW ACTIONS
    ====================================== */

    function safeHttpURL(value) {

        if (!value) return "";

        try {
            const url = new URL(String(value));
            return ["http:", "https:"].includes(url.protocol)
                ? url.href
                : "";
        } catch (error) {
            return "";
        }

    }


    function renderDeposits() {

        const tbody = $("#depositsTable");
        if (!tbody) return;

        const status = $("#depositStatusFilter")?.value || "all";
        const filtered = allDeposits.filter(function (item) {
            return status === "all" || item.status === status;
        });

        if (!filtered.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">No deposit requests found.</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map(function (item) {

            const proofURL = safeHttpURL(item.proof_file_url);
            const reference = item.transaction_reference
                ? `<div><small>Reference: ${escapeHTML(item.transaction_reference)}</small></div>`
                : "";
            const proof = proofURL
                ? `<div><a href="${escapeHTML(proofURL)}" target="_blank" rel="noopener noreferrer">View payment proof</a></div>`
                : (item.proof_file_url
                    ? '<div><small>Proof URL unavailable</small></div>'
                    : '<div><small>No proof uploaded</small></div>');
            const methodDetails = `
                <strong>${escapeHTML(item.payment_method || "—")}</strong>
                ${reference}
                ${proof}
            `;
            const isPending = String(item.status).toLowerCase() === "pending";
            const actions = isPending
                ? `
                    <div class="table-actions">
                        <button type="button" class="success-btn"
                            data-deposit-action="approve"
                            data-deposit-id="${escapeHTML(item.id)}">Approve</button>
                        <button type="button" class="danger-btn"
                            data-deposit-action="reject"
                            data-deposit-id="${escapeHTML(item.id)}">Reject</button>
                    </div>
                `
                : escapeHTML(item.review_note || "Reviewed");

            return `
                <tr>
                    <td><small>${escapeHTML(item.id)}</small></td>
                    <td><small>${escapeHTML(item.user_id)}</small></td>
                    <td>${escapeHTML(item.amount)} ${escapeHTML(item.currency || "USD")}</td>
                    <td>${methodDetails}</td>
                    <td>${statusBadge(item.status)}</td>
                    <td>${formatDate(item.created_at)}</td>
                    <td>${actions}</td>
                </tr>
            `;

        }).join("");

    }


    async function reviewDeposit(depositId, approve, button) {

        const deposit = allDeposits.find(function (item) {
            return item.id === depositId;
        });

        if (!deposit || String(deposit.status).toLowerCase() !== "pending") {
            showToast("This deposit is no longer pending. Refreshing list...");
            await loadAdminData();
            return;
        }

        const decision = approve ? "approve" : "reject";
        const confirmation = window.confirm(
            `Are you sure you want to ${decision} this deposit of ${deposit.amount} ${deposit.currency || "USD"}?`
        );

        if (!confirmation) return;

        const reviewNote = window.prompt(
            "Optional review note (leave blank if none):",
            ""
        );

        if (reviewNote === null) return;

        if (button) button.disabled = true;

        try {

            const { error } = await supabaseClient.rpc("process_deposit", {
                p_deposit_id: depositId,
                p_approve: approve,
                p_review_note: reviewNote.trim() || null
            });

            if (error) throw error;

            showToast(
                approve
                    ? "Deposit approved and wallet credited."
                    : "Deposit rejected successfully."
            );

            await loadAdminData();

        } catch (error) {

            console.error("Deposit review failed:", error);
            showToast(error.message || "Could not process deposit.");
            await loadAdminData();

        } finally {

            if (button) button.disabled = false;

        }

    }


    document.addEventListener("click", function (event) {

        const actionButton = event.target.closest("[data-deposit-action]");
        if (!actionButton) return;

        const depositId = actionButton.dataset.depositId;
        const approve = actionButton.dataset.depositAction === "approve";

        reviewDeposit(depositId, approve, actionButton);

    });


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
       WALLET MANAGEMENT
    ====================================== */

    function renderWallets() {
        const tbody = $("#walletsTable");
        if (!tbody) return;

        const search = ($("#walletSearch")?.value || "").trim().toLowerCase();
        const usersById = new Map(allUsers.map(user => [user.id, user]));
        const filtered = allWallets.filter(wallet => {
            const user = usersById.get(wallet.user_id) || {};
            return [
                user.full_name,
                user.email,
                wallet.user_id,
                wallet.currency
            ].some(value => String(value || "").toLowerCase().includes(search));
        });

        const totals = allWallets.reduce((acc, wallet) => {
            const currency = String(wallet.currency || "USD").toUpperCase();
            if (!acc[currency]) acc[currency] = { available: 0, held: 0, pending: 0 };
            acc[currency].available += Number(wallet.available_balance || 0);
            acc[currency].held += Number(wallet.held_balance || 0);
            return acc;
        }, {});

        // Pending balance means deposit requests awaiting admin review.
        // Withdrawal requests remain managed in the separate Withdrawals section.
        (allDeposits || []).filter(deposit =>
            String(deposit.status || "").toLowerCase() === "pending"
        ).forEach(deposit => {
            const currency = String(deposit.currency || "USD").toUpperCase();
            if (!totals[currency]) totals[currency] = { available: 0, held: 0, pending: 0 };
            totals[currency].pending += Number(deposit.amount || 0);
        });

        const formatTotals = key => Object.entries(totals).length
            ? Object.entries(totals).map(([currency, values]) =>
                currency + " " + values[key].toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })
            ).join(" · ")
            : "0.00";

        $("#walletCount").textContent = String(allWallets.length);
        $("#walletAvailableTotal").textContent = formatTotals("available");
        $("#walletPendingTotal").textContent = formatTotals("pending");
        $("#walletHeldTotal").textContent = formatTotals("held");

        if (!filtered.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        ${allWallets.length ? "No wallets match your search." : "No wallet records found."}
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map(wallet => {
            const user = usersById.get(wallet.user_id) || {};
            const name = user.full_name || "Unknown User";
            const email = user.email || "No email available";
            const currency = String(wallet.currency || "USD").toUpperCase();
            const amount = value => Number(value || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

            return `
                <tr>
                    <td>
                        <div class="table-user">
                            <div class="table-user-avatar">${escapeHTML(name.charAt(0).toUpperCase())}</div>
                            <div>
                                <strong>${escapeHTML(name)}</strong>
                                <small>${escapeHTML(email)}</small>
                            </div>
                        </div>
                    </td>
                    <td><span class="user-id">${escapeHTML(wallet.user_id || "—")}</span></td>
                    <td>${escapeHTML((user.userRoles || []).map(role => role.role).join(", ") || "—")}</td>
                    <td>${escapeHTML(currency)}</td>
                    <td><strong class="wallet-available">${escapeHTML(amount(wallet.available_balance))}</strong></td>
                    <td><strong>${escapeHTML(amount(wallet.held_balance))}</strong></td>
                    <td>${formatDate(wallet.updated_at)}</td>
                </tr>
            `;
        }).join("");
    }


    /* =====================================
       BUYER MANAGEMENT
    ====================================== */

    function renderBuyerManagement() {
        const container = $("#buyerManagementList");
        if (!container) return;
        const amount = value => Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const state = job => String(job.status || "").toLowerCase();
        const running = job => ["active", "running"].includes(state(job));
        const pending = job => ["pending", "pending_review"].includes(state(job));
        const completed = job => state(job) === "completed";
        const closed = job => ["cancelled", "canceled", "closed", "rejected", "expired"].includes(state(job));
        const grouped = new Map();
        allJobs.forEach(job => {
            if (!job.advertiser_id) return;
            if (!grouped.has(job.advertiser_id)) grouped.set(job.advertiser_id, []);
            grouped.get(job.advertiser_id).push(job);
        });
        const buyers = Array.from(grouped.entries()).map(([id, jobs]) => {
            const profile = allUsers.find(user => user.id === id) || {};
            const balances = {};
            allWallets.filter(wallet => wallet.user_id === id).forEach(wallet => {
                const currency = String(wallet.currency || "USD").toUpperCase();
                if (!balances[currency]) balances[currency] = { available: 0, held: 0 };
                balances[currency].available += Number(wallet.available_balance || 0);
                balances[currency].held += Number(wallet.held_balance || 0);
            });
            const categories = {};
            jobs.forEach(job => {
                const category = allCategories.find(item => item.id === job.category_id);
                const name = category?.name || "Uncategorized";
                categories[name] = (categories[name] || 0) + 1;
            });
            return { id, profile, jobs, balances, categories,
                running: jobs.filter(running).length,
                pending: jobs.filter(pending).length,
                completed: jobs.filter(completed).length,
                closed: jobs.filter(closed).length };
        }).sort((a, b) => {
            const latestA = Math.max(...a.jobs.map(job => new Date(job.created_at || 0).getTime()));
            const latestB = Math.max(...b.jobs.map(job => new Date(job.created_at || 0).getTime()));
            return latestB - latestA;
        });

        const all = allJobs;
        const set = (id,value) => { const el=document.getElementById(id); if(el) el.textContent=String(value); };
        set("buyerTotalCount", buyers.length);
        set("buyerTotalJobs", all.length);
        set("buyerRunningJobs", all.filter(running).length);
        set("buyerPendingJobs", all.filter(pending).length);
        set("buyerCompletedJobs", all.filter(completed).length);
        set("buyerClosedJobs", all.filter(closed).length);

        const search = buyerSearchQuery.toLowerCase();
        const filter = $("#buyerManagementStatus")?.value || "all";
        const filtered = buyers.filter(b => {
            const p = b.profile;
            const searchable = [p.full_name, p.email, b.id].map(value => String(value || "").toLowerCase());
            const match = !search || searchable.some(value => value.includes(search));
            const stateMatch = filter === "all" ||
                (filter === "running" && b.running > 0) ||
                (filter === "pending" && b.pending > 0) ||
                (filter === "completed" && b.completed > 0) ||
                (filter === "closed" && b.closed > 0);
            return match && stateMatch;
        }).sort((a, b) => {
            if (!search) return 0;
            const rank = buyer => {
                const values = [buyer.id, buyer.profile.email, buyer.profile.full_name]
                    .map(value => String(value || "").toLowerCase());
                if (values.some(value => value === search)) return 0;
                if (values.some(value => value.startsWith(search))) return 1;
                return 2;
            };
            return rank(a) - rank(b);
        });
        if (!filtered.length) {
            const emptyMessage = search
                ? "No buyer available. No Buyer found for this User ID or Email."
                : (buyers.length
                    ? "No buyers match the selected activity filter."
                    : "No buyers yet. Users will appear here automatically after posting their first job.");
            container.innerHTML = '<div class="admin-card empty-state buyer-no-results"><strong>' + escapeHTML(emptyMessage) + '</strong></div>';
            return;
        }
        container.innerHTML=filtered.map(b=>{
            const p=b.profile, name=p.full_name||p.email||"Buyer", detailsId="buyerJobs-"+b.id;
            const categoryHtml=Object.entries(b.categories).sort((a,z)=>z[1]-a[1]).map(([n,count])=>'<span class="buyer-category-chip">'+escapeHTML(n)+' <strong>'+count+'</strong></span>').join("");
            const balanceHtml=Object.entries(b.balances).sort(([a],[z])=>a.localeCompare(z)).map(([currency,v])=>'<div class="buyer-balance-currency"><span>'+escapeHTML(currency)+'</span><strong>Available '+amount(v.available)+'</strong><strong>Held '+amount(v.held)+'</strong></div>').join("");
            const rows=b.jobs.slice().sort((a,z)=>new Date(z.created_at||0)-new Date(a.created_at||0)).map(job=>{
                const cat=allCategories.find(x=>x.id===job.category_id);
                const approvedCount = allSubmissions.filter(item => item.job_id === job.id && String(item.status || "").toLowerCase() === "approved").length;
                return '<tr><td>'+escapeHTML(job.title||"Untitled Job")+'<small class="buyer-job-subtext">'+escapeHTML(cat?.name||"Uncategorized")+'</small></td><td>'+statusBadge(job.status)+'</td><td>'+escapeHTML(String(job.total_slots??"—"))+'</td><td>'+approvedCount+'</td><td>'+escapeHTML(String(job.currency||"USD").toUpperCase())+' '+amount(job.remaining_budget??0)+'</td><td>'+formatDate(job.created_at)+'</td></tr>';
            }).join("");
            return '<article class="admin-card buyer-profile-card"><div class="buyer-card-top"><div class="table-user"><div class="table-user-avatar buyer-avatar">'+escapeHTML(name.charAt(0).toUpperCase())+'</div><div><strong>'+escapeHTML(name)+'</strong><small>'+escapeHTML(p.email||b.id)+'</small></div></div><span class="buyer-role-pill">BUYER</span></div>'+
                '<div class="buyer-metric-grid"><div><span>Total Jobs</span><strong>'+b.jobs.length+'</strong></div><div><span>Running</span><strong>'+b.running+'</strong></div><div><span>Completed</span><strong>'+b.completed+'</strong></div><div><span>Pending</span><strong>'+b.pending+'</strong></div><div><span>Closed</span><strong>'+b.closed+'</strong></div></div>'+
                '<div class="buyer-card-lower"><div><span class="buyer-summary-label">JOB CATEGORIES</span><div class="buyer-category-list">'+(categoryHtml||'<span class="buyer-muted">No category data</span>')+'</div></div><div><span class="buyer-summary-label">WALLET BALANCES</span>'+(balanceHtml||'<span class="buyer-muted">No wallet record</span>')+'</div></div>'+
                '<div class="buyer-card-footer"><span class="buyer-id">ID: '+escapeHTML(b.id)+'</span><button type="button" class="buyer-details-btn" data-buyer-details="'+escapeHTML(detailsId)+'">View All Jobs <span>→</span></button></div>'+
                '<div class="buyer-jobs-details" id="'+escapeHTML(detailsId)+'" hidden><div class="buyer-details-heading"><strong>All Jobs by '+escapeHTML(name)+'</strong><span>'+b.jobs.length+' total</span></div><div class="table-responsive"><table class="admin-table buyer-jobs-table"><thead><tr><th>Job / Category</th><th>Status</th><th>Total Slots</th><th>Completed Slots</th><th>Remaining Held</th><th>Posted</th></tr></thead><tbody>'+rows+'</tbody></table></div></div></article>';
        }).join("");
    }


    /* =====================================
       ADMINISTRATION ACCOUNT / FEE LEDGER
    ====================================== */

    function renderAdministrationAccount() {
        const tbody = $("#administrationFeeLedgerTable");
        if (!tbody) return;

        const errorBox = $("#administrationFeeLoadError");
        if (errorBox) {
            errorBox.hidden = !feeLedgerLoadError;
            errorBox.textContent = feeLedgerLoadError
                ? "Could not load the Administration Fee Ledger: " + feeLedgerLoadError
                : "";
        }

        const jobsById = new Map(allJobs.map(job => [job.id, job]));
        const usersById = new Map(allUsers.map(user => [user.id, user]));
        const statusFilter = $("#administrationFeeStatusFilter")?.value || "all";
        const search = ($("#administrationFeeSearch")?.value || "").trim().toLowerCase();
        const amount = value => Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const groupedTotal = (rows, selector) => {
            const totals = {};
            rows.forEach(row => {
                const currency = String(row.currency || "USD").toUpperCase();
                totals[currency] = (totals[currency] || 0) + Number(selector(row) || 0);
            });
            return Object.keys(totals).length
                ? Object.entries(totals).sort(([a], [b]) => a.localeCompare(b)).map(([currency, value]) => currency + " " + amount(value)).join(" · ")
                : "0.00";
        };

        const pendingRows = allFeeLedger.filter(row => String(row.status || "").toLowerCase() === "pending");
        const earnedRows = allFeeLedger.filter(row => String(row.status || "").toLowerCase() === "earned");
        const setText = (id, value) => { const element = document.getElementById(id); if (element) element.textContent = value; };

        setText("adminTotalAdministrationFees", groupedTotal(allFeeLedger, row => row.administration_fee));
        setText("adminTotalColorFees", groupedTotal(allFeeLedger, row => row.color_fee));
        setText("adminTotalRefundableFees", groupedTotal(pendingRows, row => row.total_fee));
        setText("adminTotalEarnedRevenue", groupedTotal(earnedRows, row => row.total_fee));

        const filtered = allFeeLedger.filter(row => {
            const status = String(row.status || "").toLowerCase();
            if (statusFilter !== "all" && status !== statusFilter) return false;
            const job = jobsById.get(row.job_id) || {};
            const buyer = usersById.get(row.advertiser_id) || {};
            const haystack = [job.title, row.job_id, row.advertiser_id, buyer.full_name, buyer.email, job.status, job.card_color, row.status].join(" ").toLowerCase();
            return haystack.includes(search);
        }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        if (!filtered.length) {
            const message = feeLedgerLoadError
                ? "Fee ledger data is unavailable. Check the table Admin SELECT policy and reload."
                : allFeeLedger.length ? "No fee records match your search or status filter." : "No administration fee records found yet.";
            tbody.innerHTML = '<tr><td colspan="9" class="empty-state">' + escapeHTML(message) + '</td></tr>';
            return;
        }

        const colorStyles = { white: ["#ffffff", "#111827"], blue: ["#dbeafe", "#1e3a8a"], green: ["#dcfce7", "#14532d"], yellow: ["#fef3c7", "#78350f"], orange: ["#ffedd5", "#9a3412"], purple: ["#ede9fe", "#4c1d95"], pink: ["#fce7f3", "#831843"] };
        tbody.innerHTML = filtered.map(row => {
            const job = jobsById.get(row.job_id) || {};
            const buyer = usersById.get(row.advertiser_id) || {};
            const currency = String(row.currency || "USD").toUpperCase();
            const color = String(job.card_color || "white").toLowerCase();
            const palette = colorStyles[color] || colorStyles.white;
            const status = String(row.status || "unknown").toLowerCase();
            const statusLabel = status === "pending" ? "Refundable" : status === "earned" ? "Earned" : status === "refunded" ? "Refunded" : status;
            const feeTotal = row.total_fee ?? (Number(row.administration_fee || 0) + Number(row.color_fee || 0));
            return '<tr>' +
                '<td><strong>' + escapeHTML(job.title || ("Job " + String(row.job_id || "").slice(0, 8))) + '</strong><small class="ledger-subtext">' + escapeHTML(String(row.job_id || "")) + '</small></td>' +
                '<td><strong>' + escapeHTML(buyer.full_name || "Unknown Buyer") + '</strong><small class="ledger-subtext">' + escapeHTML(buyer.email || String(row.advertiser_id || "")) + '</small></td>' +
                '<td>' + statusBadge(job.status || "unknown") + '</td>' +
                '<td><span class="ledger-color-chip" style="background:' + palette[0] + ';color:' + palette[1] + '">' + escapeHTML(color) + '</span></td>' +
                '<td>' + escapeHTML(currency + " " + amount(row.administration_fee)) + '</td>' +
                '<td>' + escapeHTML(currency + " " + amount(row.color_fee)) + '</td>' +
                '<td><strong>' + escapeHTML(currency + " " + amount(feeTotal)) + '</strong></td>' +
                '<td><span class="ledger-fee-status ledger-fee-' + escapeHTML(status) + '">' + escapeHTML(statusLabel) + '</span></td>' +
                '<td>' + escapeHTML(formatDate(row.created_at)) + '</td></tr>';
        }).join("");
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
            allCategories = data.job_categories || [];
            allSubmissions = data.job_submissions || [];
            allDeposits = data.deposits || [];
            allWithdrawals = data.withdrawals || [];
            allWallets = data.wallets || [];
            allFeeLedger = data.administration_fee_ledger || [];


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
            renderLoginActivityUsers();
            renderVerification();
            renderBuyerManagement();
            renderJobs();
            renderSubmissions();
            renderDeposits();
            renderWithdrawals();
            renderWallets();
            renderAdministrationAccount();


            // Render deposit/withdraw requests and remaining wallet ledger entries.
            renderTransactions(data);


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


    const walletSearch = $("#walletSearch");
    if (walletSearch) walletSearch.addEventListener("input", renderWallets);

    const buyerSearch = $("#buyerManagementSearch");
    const buyerSearchButton = $("#buyerManagementSearchButton");
    const applyBuyerSearch = () => {
        buyerSearchQuery = (buyerSearch?.value || "").trim();
        renderBuyerManagement();
    };
    if (buyerSearchButton) buyerSearchButton.addEventListener("click", applyBuyerSearch);
    if (buyerSearch) buyerSearch.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            applyBuyerSearch();
        }
    });
    const buyerFilter = $("#buyerManagementStatus");
    if (buyerFilter) buyerFilter.addEventListener("change", renderBuyerManagement);
    document.addEventListener("click", function(event) {
        const button = event.target.closest("[data-buyer-details]");
        if (!button) return;
        const panel = document.getElementById(button.dataset.buyerDetails);
        if (!panel) return;
        panel.hidden = !panel.hidden;
        button.innerHTML = panel.hidden ? 'View All Jobs <span>→</span>' : 'Hide Jobs <span>↑</span>';
    });

    const administrationFeeSearch = $("#administrationFeeSearch");
    if (administrationFeeSearch) administrationFeeSearch.addEventListener("input", renderAdministrationAccount);

    const administrationFeeStatusFilter = $("#administrationFeeStatusFilter");
    if (administrationFeeStatusFilter) administrationFeeStatusFilter.addEventListener("change", renderAdministrationAccount);

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
        "refreshBuyerManagement",
        "refreshJobs",
        "refreshSubmissions",
        "refreshDeposits",
        "refreshWithdrawals",
        "refreshWallets",
        "refreshAdministrationAccount"

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


            window.location.href = "./admin-login.html";

        });

    }


    /* =====================================
       AUTH STATE CHANGES
    ====================================== */

    supabaseClient.auth.onAuthStateChange(function (event) {

        if (event === "SIGNED_OUT" && currentAdmin) {

            console.warn("Supabase reported SIGNED_OUT while Admin Panel was open.");
            showToast("Your login session has ended. Please sign in again.");

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
