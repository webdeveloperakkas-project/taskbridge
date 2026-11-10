/* =======================================
   TASKBRIDGE - DASHBOARD JAVASCRIPT
   Updated Complete Version
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    let supabaseClient = null;
    let currentUser = null;
    let categoryRows = [];
    let postedJobsChannel = null;
    let publicJobsChannel = null;
    let publicJobs = [];
    let walletChannel = null;
    let walletCurrency = "USD";
    let walletAvailableBalance = 0;
    let walletRows = [];
    let walletsByCurrency = new Map();
    let selectedWithdrawCurrency = "";

    /* =====================================
       CURRENT YEAR
    ====================================== */

    const currentYear = document.getElementById("current-year");

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }


 /* =================================
       ELEMENTS
    ======================================*/

    const sidebar = document.getElementById("sidebar");
    const menuToggle = document.getElementById("menuToggle");
    const sidebarClose = document.getElementById("sidebarClose");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    const notificationToggle = document.getElementById("notificationToggle");
    const notificationMenu = document.getElementById("notificationMenu");
    const walletBalanceToggle = document.getElementById("walletBalanceToggle");
    const headerWalletMenu = document.getElementById("headerWalletMenu");

    const profileToggle = document.getElementById("profileToggle");
    const profileMenu = document.getElementById("profileMenu");

    const headerTitle = document.querySelector(".header-welcome h2");
    const headerSubtitle = document.querySelector(".header-welcome p");


    /* =====================================
       MOBILE SIDEBAR
    ====================================== */

    function openSidebar() {

        if (!sidebar) return;

        sidebar.classList.add("open");

        if (sidebarOverlay) {
            sidebarOverlay.classList.add("show");
        }

        if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", "true");
        }

        document.body.style.overflow = "hidden";
    }


    function closeSidebar() {

        if (!sidebar) return;

        sidebar.classList.remove("open");

        if (sidebarOverlay) {
            sidebarOverlay.classList.remove("show");
        }

        if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", "false");
        }

        document.body.style.overflow = "";
    }


    if (menuToggle) {

        menuToggle.addEventListener("click", function () {

            if (sidebar && sidebar.classList.contains("open")) {
                closeSidebar();
            } else {
                openSidebar();
            }

        });

    }


    if (sidebarClose) {
        sidebarClose.addEventListener("click", closeSidebar);
    }


    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", closeSidebar);
    }


    /* =====================================
       DROPDOWN HELPERS
    ====================================== */

    function closeAllDropdowns() {

        if (notificationMenu) {
            notificationMenu.classList.remove("show");
        }
        if (headerWalletMenu) {
            headerWalletMenu.classList.remove("show");
        }

        if (walletBalanceToggle) {
            walletBalanceToggle.setAttribute("aria-expanded", "false");
        }
        if (profileMenu) {
            profileMenu.classList.remove("show");
        }

        if (notificationToggle) {
            notificationToggle.setAttribute("aria-expanded", "false");
        }

        if (profileToggle) {
            profileToggle.setAttribute("aria-expanded", "false");
        }

    }


    /* =====================================
       HEADER WALLET CURRENCY DROPDOWN
    ====================================== */

    if (walletBalanceToggle && headerWalletMenu) {
        walletBalanceToggle.addEventListener("click", function (event) {
            event.stopPropagation();
            const isOpen = headerWalletMenu.classList.contains("show");
            closeAllDropdowns();
            if (!isOpen) {
                headerWalletMenu.classList.add("show");
                walletBalanceToggle.setAttribute("aria-expanded", "true");
            }
        });
    }

    /* =====================================
       NOTIFICATION DROPDOWN
    ====================================== */

    if (notificationToggle && notificationMenu) {

        notificationToggle.addEventListener("click", function (event) {

            event.stopPropagation();

            const isOpen = notificationMenu.classList.contains("show");

            closeAllDropdowns();

            if (!isOpen) {

                notificationMenu.classList.add("show");

                notificationToggle.setAttribute("aria-expanded", "true");

            }

        });

    }


    /* =====================================
       PROFILE DROPDOWN
    ====================================== */

    if (profileToggle && profileMenu) {

        profileToggle.addEventListener("click", function (event) {

            event.stopPropagation();

            const isOpen = profileMenu.classList.contains("show");

            closeAllDropdowns();

            if (!isOpen) {

                profileMenu.classList.add("show");

                profileToggle.setAttribute("aria-expanded", "true");

            }

        });

    }


    /* =====================================
       CLOSE DROPDOWNS ON OUTSIDE CLICK
    ====================================== */

    document.addEventListener("click", function (event) {

        const clickedWalletMenu =
            headerWalletMenu &&
            headerWalletMenu.contains(event.target);

        const clickedWalletButton =
            walletBalanceToggle &&
            walletBalanceToggle.contains(event.target);

        const clickedNotification =
            notificationMenu &&
            notificationMenu.contains(event.target);

        const clickedNotificationButton =
            notificationToggle &&
            notificationToggle.contains(event.target);

        const clickedProfile =
            profileMenu &&
            profileMenu.contains(event.target);

        const clickedProfileButton =
            profileToggle &&
            profileToggle.contains(event.target);


        if (
            !clickedWalletMenu &&
            !clickedWalletButton &&
            !clickedNotification &&
            !clickedNotificationButton &&
            !clickedProfile &&
            !clickedProfileButton
        ) {

            closeAllDropdowns();

        }

    });


    /* =====================================
       DASHBOARD SECTION CONFIGURATION
    ====================================== */

    const pageSections = [

        "dashboardSection",
        "findJobSection",
        "postJobSection",
        "myPostedJobsSection",
        "mySubmittedJobsSection",
        "walletSection",
        "depositSection",
        "withdrawSection",
        "transactionsSection",
        "jobDetailsSection"

    ];


    const sectionTitles = {

        dashboardSection: {
            title: "Dashboard",
            subtitle: "Welcome back! Here's your overview."
        },

        findJobSection: {
            title: "Find a Job",
            subtitle: "Explore available tasks and opportunities."
        },

        postJobSection: {
            title: "Post a Job",
            subtitle: "Create and publish your own tasks."
        },

        myPostedJobsSection: {
            title: "My Posted Jobs",
            subtitle: "Manage your job listings and submissions."
        },

        mySubmittedJobsSection: {
            title: "My Submitted Jobs",
            subtitle: "Track your submitted work and rewards."
        },

        walletSection: {
            title: "My Wallet",
            subtitle: "Manage your available balance and earnings."
        },

        depositSection: {
            title: "Deposit",
            subtitle: "Add funds to your TaskBridge wallet."
        },

        withdrawSection: {
            title: "Withdraw",
            subtitle: "Request a withdrawal of your available balance."
        },

        transactionsSection: {
            title: "Transactions",
            subtitle: "View your wallet transaction history."
        },

        jobDetailsSection: {
            title: "Job Details",
            subtitle: "Review the complete task information before starting."
        }

    };


    const sectionLinks = document.querySelectorAll(
        ".sidebar-navigation .nav-link[data-section]"
    );


    /* =====================================
       SHOW SELECTED SECTION
    ====================================== */

    function showPageSection(sectionId, updateURL = true) {

        const targetSection = document.getElementById(sectionId);

        if (
            !targetSection ||
            !pageSections.includes(sectionId)
        ) {

            console.warn("Dashboard section not found:", sectionId);

            return;

        }


        // Hide all sections

        pageSections.forEach(function (id) {

            const section = document.getElementById(id);

            if (section) {

                section.classList.remove("active");
                section.hidden = true;

            }

        });


        // Show selected section

        targetSection.hidden = false;
        targetSection.classList.add("active");


        // Update sidebar active link

        sectionLinks.forEach(function (link) {

            const isActive = link.dataset.section === sectionId;

            link.classList.toggle("active", isActive);

            if (isActive) {

                link.setAttribute("aria-current", "page");

            } else {

                link.removeAttribute("aria-current");

            }

        });


        // Update header title and subtitle

        if (sectionTitles[sectionId]) {

            if (headerTitle) {
                headerTitle.textContent = sectionTitles[sectionId].title;
            }

            if (headerSubtitle) {
                headerSubtitle.textContent = sectionTitles[sectionId].subtitle;
            }

        }


        // Update browser history

        if (updateURL) {

            const newHash = "#" + sectionId;

            if (window.location.hash !== newHash) {

                history.pushState(null, "", newHash);

            }

        }


        // Close mobile sidebar

        if (window.innerWidth <= 900) {
            closeSidebar();
        }


        // Close dropdowns

        closeAllDropdowns();


        // Scroll to top

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    /* =====================================
       SIDEBAR SECTION CLICK
    ====================================== */

    sectionLinks.forEach(function (link) {

        link.addEventListener("click", function (event) {

            event.preventDefault();

            const sectionId = this.dataset.section;

            showPageSection(sectionId);

        });

    });


    /* =====================================
       CONTENT SECTION BUTTONS
    ====================================== */

    const contentSectionLinks = document.querySelectorAll(
        "[data-open-section]"
    );


    contentSectionLinks.forEach(function (link) {

        link.addEventListener("click", function (event) {

            event.preventDefault();

            const sectionId = this.dataset.openSection;

            showPageSection(sectionId);

        });

    });


    /* =====================================
       INITIAL SECTION
    ====================================== */

    function initializeDashboardSection() {

        const hashSection = window.location.hash.replace("#", "");

        if (
            pageSections.includes(hashSection) &&
            document.getElementById(hashSection)
        ) {

            showPageSection(hashSection, false);

        } else {

            showPageSection("dashboardSection", false);

        }

    }


    initializeDashboardSection();


    /* =====================================
       BROWSER BACK / FORWARD
    ====================================== */

    window.addEventListener("popstate", function () {

        const hashSection = window.location.hash.replace("#", "");

        if (
            pageSections.includes(hashSection) &&
            document.getElementById(hashSection)
        ) {

            showPageSection(hashSection, false);

        } else {

            showPageSection("dashboardSection", false);

        }

    });


    /* =====================================
       JOB BUDGET & CARD COLOR CALCULATOR
    ====================================== */

    const workerReward = document.getElementById("workerReward");
    const workersRequired = document.getElementById("workersRequired");
    const totalJobBudget = document.getElementById("totalJobBudget");
    const cardColorOptions = document.querySelector(".card-color-options");
    const cardColorFees = {
        white: 0,
        blue: 0.10,
        green: 0.10,
        yellow: 0.15,
        orange: 0.15,
        purple: 0.20,
        pink: 0.20
    };
    const platformFeeRateForPreview = 15;

    function getSelectedCardColor() {
        return document.querySelector('input[name="cardColor"]:checked')?.value || "white";
    }

    function calculateJobBudget() {
        const jobBudgetNode = document.getElementById("jobBudgetAmount");
        const platformFeeNode = document.getElementById("platformFeeAmount");
        const colorFeeNode = document.getElementById("cardColorFeeAmount");

        if (!workerReward || !workersRequired || !totalJobBudget ||
            !jobBudgetNode || !platformFeeNode || !colorFeeNode) return;

        const reward = Math.max(0, Number.parseFloat(workerReward.value) || 0);
        const workers = Math.max(0, Number.parseInt(workersRequired.value, 10) || 0);
        const jobBudget = Math.round((reward * workers + Number.EPSILON) * 100) / 100;
        const platformFee = Math.round((jobBudget * platformFeeRateForPreview / 100 + Number.EPSILON) * 100) / 100;
        const colorFee = cardColorFees[getSelectedCardColor()] ?? 0;
        const total = Math.round((jobBudget + platformFee + colorFee + Number.EPSILON) * 100) / 100;
        const money = value => "$" + value.toFixed(2);

        jobBudgetNode.textContent = money(jobBudget);
        platformFeeNode.textContent = money(platformFee);
        colorFeeNode.textContent = money(colorFee);
        totalJobBudget.textContent = money(total);

        document.querySelectorAll(".card-color-option").forEach(option => {
            const input = option.querySelector('input[name="cardColor"]');
            const selected = Boolean(input?.checked);
            option.classList.toggle("selected", selected);
            option.setAttribute("aria-checked", selected ? "true" : "false");
        });
    }

    if (workerReward) workerReward.addEventListener("input", calculateJobBudget);
    if (workersRequired) workersRequired.addEventListener("input", calculateJobBudget);

    if (cardColorOptions) {
        cardColorOptions.addEventListener("change", event => {
            if (event.target.matches('input[name="cardColor"]')) calculateJobBudget();
        });

        // Make the entire color tile reliably selectable, including its preview and fee.
        cardColorOptions.addEventListener("click", event => {
            const option = event.target.closest(".card-color-option");
            const input = option?.querySelector('input[name="cardColor"]');
            if (!input) return;

            if (!input.checked) {
                input.checked = true;
                input.dispatchEvent(new Event("change", { bubbles: true }));
            } else {
                calculateJobBudget();
            }
        });
    }

    calculateJobBudget();


    /* =====================================
       POST JOB FORM
    ====================================== */

    const postJobForm = document.getElementById("postJobForm");

    if (postJobForm) {
        postJobForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            if (postJobForm.reportValidity()) await submitNewJob();
        });
    }


    /* =====================================
       SAVE JOB DRAFT
    ====================================== */

    const saveJobDraft = document.getElementById("saveJobDraft");

    if (saveJobDraft) {
        saveJobDraft.addEventListener("click", function () {
            if (!postJobForm) return;
            try {
                localStorage.setItem("taskbridge_job_draft",
                    JSON.stringify(Object.fromEntries(new FormData(postJobForm).entries())));
                showJobFormMessage("Draft saved in this browser.", "success");
            } catch (error) {
                showJobFormMessage("Could not save this draft in your browser.", "error");
            }
        });
    }


    /* =====================================
       FIND JOB SEARCH AND FILTER
    ====================================== */

    const jobSearchInput = document.getElementById("jobSearchInput");
    const jobCategoryFilter = document.getElementById("jobCategoryFilter");
    const jobSortFilter = document.getElementById("jobSortFilter");


    let selectedFindCategory = "all";

    function filterAvailableJobs() {
        const searchTerm = jobSearchInput ? jobSearchInput.value.trim().toLowerCase() : "";
        document.querySelectorAll("#findJobSection .job-table-row").forEach(card => {
            const title = (card.dataset.title || "").toLowerCase();
            const category = (card.dataset.category || "").toLowerCase();
            const matchesSearch = title.includes(searchTerm);
            const matchesCategory = selectedFindCategory === "all" || category === selectedFindCategory;
            card.hidden = !(matchesSearch && matchesCategory);
        });
        const rows = Array.from(document.querySelectorAll("#findJobSection .job-table-row"));
        const visibleCount = rows.filter(card => !card.hidden).length;
        const countNode = document.getElementById("jobResultsCount");
        if (countNode) countNode.textContent = visibleCount + (visibleCount === 1 ? " Job" : " Jobs");
        const empty = document.getElementById("jobEmptyState");
        if (empty) {
            empty.hidden = visibleCount !== 0;
            const heading = empty.querySelector("h3");
            const message = empty.querySelector("p");
            if (heading) heading.textContent = publicJobs.length ? "No Matching Jobs" : "No Jobs Available Yet";
            if (message) message.textContent = publicJobs.length
                ? "No jobs match your current search or category. Try another filter."
                : "There are currently no approved jobs available. Please check back later.";
        }
    }

    if (jobSearchInput) jobSearchInput.addEventListener("input", filterAvailableJobs);

    document.querySelectorAll("#findJobSection .job-category-item").forEach(button => {
        button.addEventListener("click", () => {
            selectedFindCategory = String(button.dataset.category || "all").toLowerCase();
            document.querySelectorAll("#findJobSection .job-category-item").forEach(item => {
                item.classList.toggle("active", item === button);
            });
            filterAvailableJobs();
        });
    });


    /* =====================================
       FIND JOB SORTING
    ====================================== */

    if (jobSortFilter) {

        jobSortFilter.addEventListener("change", function () {

            const jobContainer = document.querySelector(
                "#findJobSection .job-list"
            );

            if (!jobContainer) return;

            const cards = Array.from(
                jobContainer.querySelectorAll(".job-table-row")
            );

            const sortType = jobSortFilter.value;

            cards.sort(function (a, b) {

                const rewardA = parseFloat(a.dataset.reward) || 0;
                const rewardB = parseFloat(b.dataset.reward) || 0;

                const dateA = new Date(a.dataset.date || 0);
                const dateB = new Date(b.dataset.date || 0);

                if (sortType === "highest") {
                    return rewardB - rewardA;
                }

                if (sortType === "lowest") {
                    return rewardA - rewardB;
                }

                return dateB - dateA;

            });


            cards.forEach(function (card) {
                jobContainer.appendChild(card);
            });

        });

    }


    /* =====================================
       JOB TABS
    ====================================== */

    const jobTabGroups = document.querySelectorAll(".job-tabs");


    jobTabGroups.forEach(function (group) {

        const tabs = group.querySelectorAll(".job-tab");

        tabs.forEach(function (tab) {

            tab.addEventListener("click", function () {

                const selectedStatus = this.dataset.status;


                // Update selected tab

                tabs.forEach(function (item) {

                    item.classList.toggle(
                        "active",
                        item === tab
                    );

                });


                // Filter job cards

                const panel = group.closest(".content-panel");

                if (!panel) return;

                const cards = panel.querySelectorAll(
                    ".job-list-item"
                );

                cards.forEach(function (card) {

                    const cardStatus = card.dataset.status || "";

                    const shouldShow =
                        selectedStatus === "all" ||
                        cardStatus === selectedStatus;

                    card.hidden = !shouldShow;

                });

            });

        });

    });


    /* =====================================
       ESCAPE KEY
    ====================================== */

    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {

            closeSidebar();
            closeAllDropdowns();

        }

    });


    /* =====================================
       WINDOW RESIZE
    ====================================== */

    window.addEventListener("resize", function () {

        if (window.innerWidth > 900) {
            closeSidebar();
        }

    });



    /* SUPABASE AUTHENTICATION AND ADVERTISER JOB DATA */
    const SUPABASE_URL = "https://eboagroxkgpplccufpuk.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_UKOjnMUUrbVK3a0fruk55Q_Anjk04RA";
    const authStorage = {
        getItem(key) { return localStorage.getItem(key) ?? sessionStorage.getItem(key); },
        setItem(key, value) {
            if (localStorage.getItem(key) !== null) localStorage.setItem(key, value);
            else sessionStorage.setItem(key, value);
        },
        removeItem(key) { localStorage.removeItem(key); sessionStorage.removeItem(key); }
    };

    function showJobFormMessage(message, type) {
        if (!postJobForm) return;
        let box = document.getElementById("jobFormMessage");
        if (!box) {
            box = document.createElement("p");
            box.id = "jobFormMessage";
            box.setAttribute("role", "status");
            postJobForm.prepend(box);
        }
        box.textContent = message;
        box.dataset.type = type;
    }

    function formatJobMoney(value) { return "$" + (Number(value) || 0).toFixed(2); }
    function uiStatus(status) { return status === "pending_review" ? "pending" : status; }

    function formatWalletMoney(amount, currency) {
        const value = Number(amount);
        const safeValue = Number.isFinite(value) ? value : 0;
        try {
            return new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: currency || "USD"
            }).format(safeValue);
        } catch (error) {
            return (currency || "USD") + " " + safeValue.toFixed(2);
        }
    }

    function currencyWalletIcon(currency) {
        return ({ BDT: "৳", USD: "$", USDT: "₮" })[currency] || currency;
    }

    function renderHeaderWalletOptions() {
        if (!headerWalletMenu) return;
        const funded = walletRows.filter(wallet => Number(wallet.available_balance) > 0);
        headerWalletMenu.innerHTML = funded.map(wallet => {
            const currency = String(wallet.currency || "").toUpperCase();
            const selected = currency === walletCurrency;
            return '<button type="button" class="wallet-currency-option' +
                (selected ? ' active' : '') + '" data-wallet-currency="' +
                escapeFinanceText(currency) + '">' +
                '<span class="wallet-currency-option-icon">' + escapeFinanceText(currencyWalletIcon(currency)) + '</span>' +
                '<span class="wallet-currency-option-name">' + escapeFinanceText(currency) + '</span>' +
                '<strong>' + escapeFinanceText(formatWalletMoney(wallet.available_balance, currency)) + '</strong>' +
                '</button>';
        }).join("");
        headerWalletMenu.querySelectorAll("[data-wallet-currency]").forEach(option => {
            option.addEventListener("click", () => {
                const wallet = walletsByCurrency.get(option.dataset.walletCurrency);
                if (!wallet || Number(wallet.available_balance) <= 0) return;
                renderWalletBalance(wallet);
                if (headerWalletMenu) headerWalletMenu.classList.remove("show");
                if (walletBalanceToggle) walletBalanceToggle.setAttribute("aria-expanded", "false");
            });
        });
    }

    function renderWalletBalance(wallet) {
        walletCurrency = wallet?.currency || "USD";
        walletAvailableBalance = Math.max(0, Number(wallet?.available_balance ?? 0) || 0);
        const formatted = formatWalletMoney(walletAvailableBalance, walletCurrency);
        ["availableBalanceHeader", "availableBalanceOverview",
            "availableBalanceWallet", "availableBalanceWithdraw"].forEach(id => {
            const node = document.getElementById(id);
            if (node) node.textContent = formatted;
        });
        const selector = document.getElementById("walletCurrencySelector");
        if (selector && wallet && Number(wallet.available_balance) > 0) selector.value = walletCurrency;
        const withdrawAmount = document.getElementById("withdrawAmount");
        if (withdrawAmount) withdrawAmount.max = String(walletAvailableBalance);
        const withdrawLabel = document.querySelector('label[for="withdrawAmount"]');
        if (withdrawLabel) withdrawLabel.textContent = "Withdrawal Amount (" + walletCurrency + ")";
        renderHeaderWalletOptions();
        updateWithdrawMethodCards();
    }

    function currencyForWithdrawMethod(method) {
        return ({
            "bKash": "BDT", "Nagad": "BDT", "Rocket": "BDT",
            "Bank Transfer": "BDT", "Wise": "USD",
            "USDT - BEP20": "USDT", "USDT - TRC20": "USDT"
        })[method] || "";
    }

    function updateWithdrawMethodCards() {
        document.querySelectorAll(".withdraw-method-card").forEach(card => {
            const currency = currencyForWithdrawMethod(card.dataset.withdrawMethod || "");
            const wallet = walletsByCurrency.get(currency);
            const balance = Math.max(0, Number(wallet?.available_balance || 0));
            card.hidden = !wallet || balance <= 0;
            let topline = card.querySelector(".withdraw-card-topline");
            if (!topline) {
                topline = document.createElement("span");
                topline.className = "withdraw-card-topline";
                const brand = card.querySelector(".deposit-brand-mark");
                const balanceNode = document.createElement("small");
                balanceNode.className = "withdraw-card-balance";
                topline.append(balanceNode);
                if (brand) topline.append(brand);
                card.insertBefore(topline, card.firstChild);
            }
            const balanceNode = topline.querySelector(".withdraw-card-balance");
            if (balanceNode) balanceNode.textContent = formatWalletMoney(balance, currency);
        });
    }

    function escapeFinanceText(value) {
        return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
    }

    function formatFinanceDate(value) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
    }

    async function loadHeaderNotifications() {
        if (!supabaseClient || !currentUser) return;
        const list = document.getElementById("headerNotificationList");
        const badge = document.getElementById("notificationIndicator");
        const { data, error } = await supabaseClient.from("notifications")
            .select("id,title,message,notification_type,is_read,created_at")
            .eq("user_id", currentUser.id).order("created_at", { ascending: false }).limit(10);
        if (error) throw error;
        const rows = data || [];
        if (list) list.innerHTML = rows.length ? rows.map(item =>
            '<div class="notification-item' + (item.is_read ? '' : ' unread') + '">' +
            '<strong>' + escapeFinanceText(item.title) + '</strong>' +
            '<p>' + escapeFinanceText(item.message) + '</p>' +
            '<small>' + escapeFinanceText(formatFinanceDate(item.created_at)) + '</small></div>'
        ).join("") : '<p class="notification-item">No notifications yet.</p>';
        const unread = rows.filter(item => !item.is_read).length;
        if (badge) { badge.textContent = String(unread); badge.hidden = unread === 0; }
    }

    let activeTransactionHistoryFilter = "deposit";

    function paymentMethodMark(method) {
        const raw = String(method || "").trim();
        const key = raw.toLowerCase().replace(/[\s_-]+/g, "");
        if (key === "postjob" || key === "jobpost" || key === "jobfunding") {
            return '<span class="history-method history-method-postjob" title="Post Job" aria-label="Post Job">' +
                '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7V5.8A2.8 2.8 0 0 1 10.8 3h2.4A2.8 2.8 0 0 1 16 5.8V7"/><rect x="2.5" y="7" width="19" height="14" rx="3"/><path d="M2.8 12h18.4M9.5 12v2.2h5V12"/></svg><span>Post Job</span></span>';
        }
        const brands = {
            bkash: { label: "bKash", className: "bkash" },
            nagad: { label: "NAGAD", className: "nagad" },
            rocket: { label: "ROCKET", className: "rocket" },
            visa: { label: "VISA", className: "visa" },
            mastercard: { label: '<span class="history-mastercard-circles" aria-hidden="true"><i></i><i></i></span>', className: "mastercard" },
            wise: { label: "Wise", className: "wise" },
            banktransfer: { label: '<span class="history-bank-symbol" aria-hidden="true">▤</span><span>Bank</span>', className: "banktransfer" },
            usdttrc20: { label: "₮ USDT", className: "usdt" },
            usdtbep20: { label: "₮ USDT", className: "usdt" }
        };
        const brand = brands[key];
        if (!brand) return '<span class="history-method history-method-unknown" title="' +
            escapeFinanceText(raw || "Payment method not specified") + '">—</span>';
        return '<span class="history-method history-method-' + brand.className + '" title="' +
            escapeFinanceText(raw) + '" aria-label="' + escapeFinanceText(raw) + '">' + brand.label + '</span>';
    }

    async function loadTransactionHistory(filter = activeTransactionHistoryFilter) {
        if (!supabaseClient || !currentUser) return;
        activeTransactionHistoryFilter = filter === "withdraw" ? "withdraw" : "deposit";
        const body = document.getElementById("transactionHistoryBody");
        if (!body) return;

        const [depositResult, withdrawalResult, walletResult] = await Promise.all([
            supabaseClient.from("deposits")
                .select("id,amount,currency,payment_method,transaction_reference,status,created_at")
                .eq("user_id", currentUser.id).order("created_at", { ascending: false }).limit(100),
            supabaseClient.from("withdrawals")
                .select("id,amount,currency,payment_method,status,created_at")
                .eq("user_id", currentUser.id).order("created_at", { ascending: false }).limit(100),
            supabaseClient.from("wallet_transactions")
                .select("id,transaction_type,direction,balance_type,amount,currency,description,reference_type,reference_id,created_at")
                .eq("user_id", currentUser.id).order("created_at", { ascending: false }).limit(100)
        ]);
        if (depositResult.error) throw depositResult.error;
        if (withdrawalResult.error) throw withdrawalResult.error;
        if (walletResult.error) throw walletResult.error;

        const depositRows = depositResult.data || [];
        const withdrawalRows = withdrawalResult.data || [];
        const methodByRequestId = new Map();
        const transactionIdByRequestId = new Map();
        depositRows.forEach(row => {
            methodByRequestId.set(row.id, row.payment_method || "");
            transactionIdByRequestId.set(row.id, row.transaction_reference || "—");
        });
        withdrawalRows.forEach(row => methodByRequestId.set(row.id, row.payment_method || ""));

        const deposits = depositRows
            .filter(row => String(row.status).toLowerCase() !== "approved")
            .map(row => ({
                id: row.id, type: "Deposit", method: row.payment_method,
                transactionId: row.transaction_reference || "—", amount: Number(row.amount),
                currency: row.currency || "USD", status: row.status, created_at: row.created_at,
                direction: "in"
            }));

        const withdrawals = withdrawalRows.map(row => ({
            id: row.id, type: "Withdraw", method: row.payment_method,
            transactionId: "—", amount: Number(row.amount), currency: row.currency || "USD",
            status: row.status, created_at: row.created_at, direction: "out"
        }));

        const requestIds = new Set([...deposits, ...withdrawals].map(row => row.id));
        const walletRows = (walletResult.data || []).map(row => {
            const transactionLabel = String(row.transaction_type || "").toLowerCase();
            const descriptionLabel = String(row.description || "").toLowerCase();
            const text = transactionLabel + " " + descriptionLabel + " " + String(row.reference_type || "").toLowerCase();
            const direction = String(row.direction || "").toLowerCase();
            const isJobPost = text.includes("job") &&
                (text.includes("post") || text.includes("fund") || text.includes("creat") || text.includes("advertis"));
            const type = isJobPost ? "Withdraw" :
                text.includes("deposit") ? "Deposit" :
                text.includes("withdraw") ? "Withdraw" :
                (direction === "out" || direction === "debit" ? "Withdraw" :
                direction === "in" || direction === "credit" ? "Deposit" : "Wallet transaction");
            return {
                id: row.id, referenceId: row.reference_id, type,
                method: isJobPost ? "Post Job" : (methodByRequestId.get(row.reference_id) || ""),
                transactionId: transactionIdByRequestId.get(row.reference_id) || "—",
                amount: Number(row.amount), currency: row.currency || "USD",
                status: "completed", created_at: row.created_at, direction
            };
        }).filter(row => !requestIds.has(row.referenceId));

        const allRows = [...deposits, ...withdrawals, ...walletRows]
            .sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
        const rows = allRows.filter(row =>
            activeTransactionHistoryFilter === "deposit" ? row.type === "Deposit" :
            row.type === "Withdraw"
        ).slice(0,100);

        body.innerHTML = rows.length ? rows.map(row => {
            const negative = row.direction === "out" || row.direction === "debit" || row.type === "Withdraw";
            const amount = (negative ? "−" : "+") + formatWalletMoney(row.amount, row.currency);
            const status = String(row.status || "pending").toLowerCase();
            const label = status === "approved" || status === "completed" ? "Completed" :
                status === "rejected" ? "Rejected" : "Pending";
            return '<tr><td>' + paymentMethodMark(row.method) +
                '</td><td class="history-transaction-id">' + escapeFinanceText(String(row.transactionId || "—")) +
                '</td><td class="payment-cell">' + escapeFinanceText(amount) +
                '</td><td><span class="status-badge ' +
                (label === "Completed" ? "active-status" : label === "Rejected" ? "rejected-status" : "pending-status") +
                '">' + label + '</span></td><td>' + escapeFinanceText(formatFinanceDate(row.created_at)) + '</td></tr>';
        }).join("") : '<tr><td colspan="5" class="empty-state">No ' +
            (activeTransactionHistoryFilter === "deposit" ? "deposit" : "withdrawal") +
            ' transactions yet.</td></tr>';
    }

    document.querySelectorAll("[data-history-filter]").forEach(button => {
        button.addEventListener("click", () => {
            const filter = button.dataset.historyFilter === "withdraw" ? "withdraw" : "deposit";
            document.querySelectorAll("[data-history-filter]").forEach(tab => {
                const selected = tab === button;
                tab.classList.toggle("active", selected);
                tab.setAttribute("aria-selected", selected ? "true" : "false");
            });
            loadTransactionHistory(filter).catch(error =>
                console.error("Transaction history refresh failed:", error)
            );
        });
    });

    async function loadMyWallet() {
        const { data, error } = await supabaseClient.from("wallets")
            .select("id,user_id,currency,available_balance,held_balance,updated_at")
            .eq("user_id", currentUser.id)
            .order("currency", { ascending: true });
        if (error) throw error;
        walletRows = data || [];
        walletsByCurrency = new Map(walletRows.map(wallet => [wallet.currency, wallet]));
        const fundedWallets = walletRows.filter(wallet => Number(wallet.available_balance) > 0);
        const selector = document.getElementById("walletCurrencySelector");
        if (selector) {
            selector.replaceChildren();
            if (!fundedWallets.length) {
                selector.add(new Option("No funded wallets", ""));
                selector.disabled = true;
                renderWalletBalance(null);
                return;
            }
            selector.disabled = false;
            fundedWallets.forEach(wallet => selector.add(new Option(wallet.currency, wallet.currency)));
            const selected = fundedWallets.find(wallet => wallet.currency === walletCurrency) || fundedWallets[0];
            renderWalletBalance(selected);
        } else {
            renderWalletBalance(fundedWallets.find(wallet => wallet.currency === walletCurrency) || fundedWallets[0] || null);
        }
        renderHeaderWalletOptions();
    }


    /* =====================================
       DEPOSIT REQUEST FORM
       Select a visual payment card, then submit a pending request.
    ====================================== */
    const depositForm = document.getElementById("depositForm");
    const depositInstructions = document.getElementById("depositPaymentInstructions");
    const depositDetailsPanel = document.getElementById("depositDetailsPanel");
    const depositSelectedTitle = document.getElementById("depositSelectedTitle");
    const depositMessage = document.getElementById("depositFormMessage");
    const depositSubmitButton = document.getElementById("depositSubmitButton");
    let selectedDepositMethod = "";
    const depositCurrencyByMethod = {
        "bKash": "BDT", "Nagad": "BDT", "Rocket": "BDT",
        "Bank Transfer": "BDT", "Wise (manual transfer)": "USD",
        "Visa": "USD", "Mastercard": "USD"
    };

    const depositMethodDetails = {
        "bKash": { title: "bKash payment details (demo)", lines: ["Account type: Agent / Merchant (replace with your verified account)", "Account number: 01XXXXXXXXX", "Reference: TaskBridge Deposit"] },
        "Nagad": { title: "Nagad payment details (demo)", lines: ["Account type: Merchant (replace with your verified account)", "Account number: 01XXXXXXXXX", "Reference: TaskBridge Deposit"] },
        "Rocket": { title: "Rocket payment details (demo)", lines: ["Account type: Merchant / Agent (replace with your verified account)", "Account number: 01XXXXXXXXXX", "Reference: TaskBridge Deposit"] },
        "Bank Transfer": { title: "Bank transfer details (demo)", lines: ["Bank: Replace with your bank name", "Account name: TaskBridge (replace with verified account name)", "Account number: XXXX-XXXX-XXXX", "Branch: Replace with branch name", "Routing number: XXXXXXXX"] },
        "Wise (manual transfer)": { title: "Wise transfer details (demo)", lines: ["Wise recipient: Replace with your verified Wise business account", "Recipient email / account details: payments@example.com", "Use USD and include your TaskBridge user ID in the reference"] }
    };

    const depositModal = document.getElementById("depositModal");
    const depositModalMark = document.getElementById("depositModalMark");
    const closeDepositModalButton = document.getElementById("closeDepositModal");
    const withdrawModal = document.getElementById("withdrawModal");
    const withdrawModalMark = document.getElementById("withdrawModalMark");
    const withdrawModalTitle = document.getElementById("withdrawModalTitle");
    const withdrawForm = document.getElementById("withdrawForm");
    const withdrawMessage = document.getElementById("withdrawFormMessage");
    const withdrawSubmitButton = document.getElementById("withdrawSubmitButton");
    const withdrawAmountInput = document.getElementById("withdrawAmount");
    const withdrawAccountInput = document.getElementById("withdrawPaymentAccount");
    const withdrawAccountLabel = document.getElementById("withdrawAccountLabel");
    const withdrawAccountHint = document.getElementById("withdrawAccountHint");
    const withdrawModalBalance = document.getElementById("withdrawModalBalance");

    let selectedWithdrawMethod = "";
    const walletCurrencySelector = document.getElementById("walletCurrencySelector");
    if (walletCurrencySelector) walletCurrencySelector.addEventListener("change", () => {
        const wallet = walletsByCurrency.get(walletCurrencySelector.value);
        if (wallet && Number(wallet.available_balance) > 0) renderWalletBalance(wallet);
    });

    function openFinanceModal(modal) {
        if (!modal) return;
        modal.hidden = false;
        document.body.classList.add("finance-modal-open");
        const firstInput = modal.querySelector("input, textarea, button");
        if (firstInput) setTimeout(() => firstInput.focus(), 0);
    }

    function closeFinanceModal(modal) {
        if (!modal) return;
        modal.hidden = true;
        if (!document.querySelector(".finance-modal-backdrop:not([hidden])")) {
            document.body.classList.remove("finance-modal-open");
        }
    }

    function setModalBrand(card, markNode, titleNode, title) {
        const mark = card?.querySelector(".deposit-brand-mark");
        if (mark && markNode) markNode.innerHTML = mark.innerHTML;
        if (titleNode) titleNode.textContent = title || card?.querySelector("strong")?.textContent || "Payment method";
    }

    if (closeDepositModalButton) closeDepositModalButton.addEventListener("click", () => closeFinanceModal(depositModal));
    const closeWithdrawModalButton = document.getElementById("closeWithdrawModal");
    if (closeWithdrawModalButton) closeWithdrawModalButton.addEventListener("click", () => closeFinanceModal(withdrawModal));
    [depositModal, withdrawModal].forEach(modal => {
        if (!modal) return;
        modal.addEventListener("click", event => {
            if (event.target === modal) closeFinanceModal(modal);
        });
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeFinanceModal(depositModal);
            closeFinanceModal(withdrawModal);
        }
    });

    function renderDepositInstructions(method, card) {
        selectedDepositMethod = method || "";
        document.querySelectorAll(".deposit-method-card").forEach(item => {
            const selected = item.dataset.method === selectedDepositMethod;
            item.classList.toggle("active", selected);
            item.setAttribute("aria-pressed", selected ? "true" : "false");
        });
        if (!selectedDepositMethod || !depositDetailsPanel || !depositInstructions) return;
        const depositCurrency = depositCurrencyByMethod[selectedDepositMethod] || "USD";
        const depositAmountLabel = document.querySelector('label[for="depositAmount"]');
        const depositAmountInput = document.getElementById("depositAmount");
        if (depositAmountLabel) depositAmountLabel.textContent = "Deposit Amount (" + depositCurrency + ")";
        if (depositAmountInput) depositAmountInput.placeholder = "Enter amount in " + depositCurrency;
        const chosenCard = card || document.querySelector('.deposit-method-card[data-method="' + CSS.escape(selectedDepositMethod) + '"]');
        setModalBrand(chosenCard, depositModalMark, depositSelectedTitle,
            selectedDepositMethod === "Visa" || selectedDepositMethod === "Mastercard"
                ? selectedDepositMethod + " payment" : (chosenCard?.querySelector("strong")?.textContent || selectedDepositMethod) + " deposit");
        depositDetailsPanel.hidden = false;
        if (["Visa", "Mastercard"].includes(selectedDepositMethod)) {
            depositInstructions.innerHTML = '<strong>Card checkout is not connected yet.</strong><p>Visa/Mastercard payments will be enabled after a supported payment gateway merchant account and hosted checkout are configured. Do not enter card number, expiry date or CVV on this page.</p>';
            depositInstructions.hidden = false;
            if (depositSubmitButton) depositSubmitButton.disabled = true;
        } else {
            if (depositSubmitButton) depositSubmitButton.disabled = false;
            const details = depositMethodDetails[selectedDepositMethod];
            if (!details) { depositInstructions.hidden = true; return; }
            const escapeHtml = value => String(value).replace(/[&<>"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
            depositInstructions.innerHTML = "<strong>" + escapeHtml(details.title) + "</strong><ul>" +
                details.lines.map(line => "<li>" + escapeHtml(line) + "</li>").join("") + "</ul>";
            depositInstructions.hidden = false;
        }
        if (depositMessage) depositMessage.textContent = "";
        openFinanceModal(depositModal);
    }

    document.querySelectorAll(".deposit-method-card").forEach(card => {
        card.addEventListener("click", () => renderDepositInstructions(card.dataset.method, card));
    });

    if (depositForm) {
        depositForm.addEventListener("submit", async function(event) {
            event.preventDefault();
            if (!supabaseClient || !currentUser) { if (depositMessage) depositMessage.textContent = "Please sign in again and retry."; return; }
            if (!depositForm.reportValidity()) return;
            const amount = Number(document.getElementById("depositAmount")?.value);
            const method = selectedDepositMethod;
            const reference = document.getElementById("depositTransactionId")?.value.trim() || "";
            if (!method) { if (depositMessage) depositMessage.textContent = "Please select a payment method first."; return; }
            if (["Visa", "Mastercard"].includes(method)) {
                if (depositMessage) depositMessage.textContent = "Card gateway is not connected yet.";
                return;
            }
            if (!Number.isFinite(amount) || amount < 1 || !reference) return;
            if (depositSubmitButton) { depositSubmitButton.disabled = true; depositSubmitButton.textContent = "Submitting..."; }
            if (depositMessage) depositMessage.textContent = "";
            try {
                const { error } = await supabaseClient.from("deposits").insert({
                    user_id: currentUser.id, amount, currency: depositCurrencyByMethod[method],
                    payment_method: method, transaction_reference: reference, status: "pending"
                });
                if (error) throw error;
                await Promise.all([loadHeaderNotifications(), loadTransactionHistory()]);
                if (depositSubmitButton) depositSubmitButton.textContent = "Request Submitted";
                await new Promise(resolve => setTimeout(resolve, 1200));
                depositForm.reset();
                closeFinanceModal(depositModal);
                selectedDepositMethod = "";
                document.querySelectorAll(".deposit-method-card").forEach(card => {
                    card.classList.remove("active");
                    card.setAttribute("aria-pressed", "false");
                });
                if (depositMessage) depositMessage.textContent = "Deposit request submitted successfully. Your request is pending admin verification.";
            } catch (error) {
                console.error("Deposit request failed:", error);
                if (depositMessage) depositMessage.textContent = error.message || "Could not submit deposit request. Please try again.";
            } finally {
                if (depositSubmitButton) { depositSubmitButton.disabled = ["Visa", "Mastercard"].includes(selectedDepositMethod); depositSubmitButton.textContent = "Submit Deposit Request"; }
            }
        });
    }

    const withdrawMethodMeta = {
        "bKash": { label: "bKash Account Number", placeholder: "01XXXXXXXXX", hint: "Enter the bKash number registered to receive your payout." },
        "Nagad": { label: "Nagad Account Number", placeholder: "01XXXXXXXXX", hint: "Enter the Nagad number registered to receive your payout." },
        "Rocket": { label: "Rocket Account Number", placeholder: "01XXXXXXXXXX", hint: "Enter the Rocket number registered to receive your payout." },
        "Bank Transfer": { label: "Bank Account Details", placeholder: "Bank name, account name, account number, branch and routing number", hint: "Provide the bank details needed to identify your receiving account." },
        "Wise": { label: "Wise Account Details", placeholder: "Wise email or recipient account details", hint: "Enter the recipient details for your Wise account." },
        "USDT - BEP20": { label: "USDT BEP20 Wallet Address", placeholder: "Enter your BNB Smart Chain (BEP20) wallet address", hint: "Only provide a wallet address that supports USDT on BEP20." },
        "USDT - TRC20": { label: "USDT TRC20 Wallet Address", placeholder: "Enter your TRON (TRC20) wallet address", hint: "Only provide a wallet address that supports USDT on TRC20." }
    };

    document.querySelectorAll(".withdraw-method-card").forEach(card => {
        card.addEventListener("click", () => {
            selectedWithdrawMethod = card.dataset.withdrawMethod || "";
            document.querySelectorAll(".withdraw-method-card").forEach(item => item.classList.toggle("active", item === card));
            const meta = withdrawMethodMeta[selectedWithdrawMethod];
            selectedWithdrawCurrency = currencyForWithdrawMethod(selectedWithdrawMethod);
            const selectedWallet = walletsByCurrency.get(selectedWithdrawCurrency);
            if (!meta || !selectedWallet || Number(selectedWallet.available_balance) <= 0) return;
            setModalBrand(card, withdrawModalMark, withdrawModalTitle, selectedWithdrawMethod + " withdrawal");
            if (withdrawAccountLabel) withdrawAccountLabel.textContent = meta.label;
            if (withdrawAccountInput) withdrawAccountInput.placeholder = meta.placeholder;
            if (withdrawAccountHint) withdrawAccountHint.textContent = meta.hint;
            if (withdrawModalBalance) withdrawModalBalance.textContent = formatWalletMoney(selectedWallet.available_balance, selectedWithdrawCurrency);
            if (withdrawAmountInput) {
                withdrawAmountInput.max = String(Number(selectedWallet.available_balance));
                withdrawAmountInput.value = "";
                const amountLabel = document.querySelector('label[for="withdrawAmount"]');
                if (amountLabel) amountLabel.textContent = "Withdrawal Amount (" + selectedWithdrawCurrency + ")";
            }
            if (withdrawMessage) withdrawMessage.textContent = "";
            openFinanceModal(withdrawModal);
        });
    });

    if (withdrawForm) {
        withdrawForm.addEventListener("submit", async event => {
            event.preventDefault();
            if (!supabaseClient || !currentUser) { if (withdrawMessage) withdrawMessage.textContent = "Please sign in again and retry."; return; }
            if (!withdrawForm.reportValidity()) return;
            const amount = Number(withdrawAmountInput?.value);
            const paymentAccount = withdrawAccountInput?.value.trim() || "";
            const selectedWallet = walletsByCurrency.get(selectedWithdrawCurrency);
            const available = Math.max(0, Number(selectedWallet?.available_balance || 0));
            if (!selectedWithdrawMethod) { if (withdrawMessage) withdrawMessage.textContent = "Please select a withdrawal method."; return; }
            if (!Number.isFinite(amount) || amount <= 0 || amount > available || !paymentAccount) {
                if (withdrawMessage) withdrawMessage.textContent = "Enter a valid amount within your available balance and complete the receiving account details.";
                return;
            }
            if (withdrawSubmitButton) { withdrawSubmitButton.disabled = true; withdrawSubmitButton.textContent = "Submitting..."; }
            if (withdrawMessage) withdrawMessage.textContent = "";
            try {
                const { error } = await supabaseClient.rpc("request_withdrawal", {
                    p_amount: amount,
                    p_currency: selectedWithdrawCurrency,
                    p_payment_method: selectedWithdrawMethod,
                    p_payment_account: paymentAccount
                });
                if (error) throw error;
                await loadMyWallet();
                withdrawForm.reset();
                closeFinanceModal(withdrawModal);
                selectedWithdrawMethod = "";
                document.querySelectorAll(".withdraw-method-card").forEach(item => item.classList.remove("active"));
                if (withdrawMessage) withdrawMessage.textContent = "Withdrawal request submitted. It will remain pending until an admin reviews it.";
            } catch (error) {
                console.error("Withdrawal request failed:", error);
                if (withdrawMessage) withdrawMessage.textContent = error.message || "Could not submit withdrawal request. Please try again.";
            } finally {
                if (withdrawSubmitButton) { withdrawSubmitButton.disabled = false; withdrawSubmitButton.textContent = "Submit Withdrawal Request"; }
            }
        });
    }

    async function loadJobCategories() {
        const { data, error } = await supabaseClient.from("job_categories")
            .select("id,name,slug,icon,is_active,display_order")
            .eq("is_active", true).order("display_order", { ascending: true });
        if (error) throw error;
        categoryRows = data || [];
        const select = document.getElementById("postJobCategory");
        if (select) {
            select.replaceChildren(new Option("Select Category", ""));
            categoryRows.forEach(row => select.add(new Option(row.name, row.id)));
        }
    }

    function formatJobDuration(minutes) {
        const value = Math.max(0, Number(minutes) || 0);
        if (value < 60) return value + "m";
        const hours = value / 60;
        return Number.isInteger(hours) ? hours + "h" : hours.toFixed(1) + "h";
    }

    function getJobCategory(job) {
        return categoryRows.find(category => category.id === job.category_id) || null;
    }

    function createJobCell(className, value) {
        const cell = document.createElement("span");
        cell.className = "job-table-cell " + (className || "");
        cell.textContent = value == null || value === "" ? "—" : String(value);
        return cell;
    }

    function openJobDetails(jobId) {
        const job = publicJobs.find(item => item.id === jobId);
        if (!job) return;
        const category = getJobCategory(job);
        const categoryNode = document.getElementById("detailJobCategory");
        const titleNode = document.getElementById("detailJobTitle");
        const subtitleNode = document.getElementById("detailJobSubtitle");
        const statusNode = document.getElementById("detailJobStatus");
        const iconNode = document.getElementById("detailJobIcon");
        if (categoryNode) categoryNode.textContent = category?.name || "Uncategorized";
        if (titleNode) titleNode.textContent = job.title || "Untitled Job";
        if (subtitleNode) subtitleNode.textContent =
            formatWalletMoney(job.reward_per_worker, job.currency || "USD") +
            " per worker · " + Number(job.total_slots || 0) + " total workers · " +
            formatJobDuration(job.duration_minutes);
        if (statusNode) {
            statusNode.textContent = "Active";
            statusNode.className = "job-status active";
        }
        if (iconNode) {
            const iconMap = { facebook: "icon-facebook", youtube: "icon-youtube",
                instagram: "icon-instagram", twitter: "icon-twitter",
                tiktok: "icon-music", website: "icon-globe" };
            iconNode.innerHTML = '<use href="#' + (iconMap[String(category?.slug || "").toLowerCase()] || "icon-grid") + '"></use>';
        }
        const setText = (id, value) => {
            const node = document.getElementById(id);
            if (node) node.textContent = value == null || value === "" ? "—" : String(value);
        };
        setText("detailJobReward", formatWalletMoney(job.reward_per_worker, job.currency || "USD"));
        setText("detailTotalWorkers", Number(job.total_slots || 0));
        setText("detailCompletedWorkers", "—");
        setText("detailAvailableSlots", "—");
        setText("detailJobDescription", job.description);
        setText("detailProofTitle", "Proof Requirements");
        setText("detailProofDescription", job.proof_requirements);
        setText("detailJobExtraInstructions", job.extra_instructions);
        const instructionList = document.getElementById("detailJobInstructions");
        if (instructionList) {
            instructionList.replaceChildren();
            String(job.instructions || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean).forEach(line => {
                const item = document.createElement("li");
                item.textContent = line;
                instructionList.appendChild(item);
            });
            if (!instructionList.children.length) {
                const item = document.createElement("li");
                item.textContent = "No additional step-by-step instructions provided.";
                instructionList.appendChild(item);
            }
        }
        const targetLink = document.getElementById("detailJobTargetLink");
        if (targetLink) {
            if (job.target_url) {
                targetLink.href = job.target_url;
                targetLink.hidden = false;
            } else {
                targetLink.removeAttribute("href");
                targetLink.hidden = true;
            }
        }
        showPageSection("jobDetailsSection");
    }


    function renderDashboardRecentJobs(jobs) {
        const list = document.getElementById("dashboardRecentJobsList");
        const empty = document.getElementById("dashboardRecentJobsEmpty");
        if (!list || !empty) return;
        list.replaceChildren();
        const rows = Array.isArray(jobs) ? jobs.slice(0, 20) : [];
        rows.forEach(job => {
            const category = getJobCategory(job);
            const row = document.createElement("article");
            row.className = "job-table-row job-list-item dashboard-recent-job-row";
            row.dataset.jobId = job.id;
            row.dataset.title = ((category?.name || "") + " " + (job.title || "")).toLowerCase();
            row.dataset.category = String(category?.slug || category?.name || "other").toLowerCase();
            row.dataset.reward = String(Number(job.reward_per_worker) || 0);
            row.dataset.date = job.created_at || "";
            row.style.setProperty("--job-card-background", "#ffffff");

            const nameCell = document.createElement("div");
            nameCell.className = "job-table-cell job-name-cell";
            const nameButton = document.createElement("button");
            nameButton.type = "button";
            nameButton.className = "job-name-link";
            nameButton.dataset.openJob = job.id;
            nameButton.textContent = (category?.name || "Uncategorized") + " · " + (job.title || "Untitled Job");
            nameButton.title = nameButton.textContent;
            nameCell.appendChild(nameButton);
            row.appendChild(nameCell);
            row.appendChild(createJobCell("job-payment-cell", formatWalletMoney(job.reward_per_worker, job.currency || "USD")));
            row.appendChild(createJobCell("job-success-rate", "—"));
            row.appendChild(createJobCell("", formatJobDuration(job.duration_minutes)));
            row.appendChild(createJobCell("job-completed-cell", "— / " + Number(job.total_slots || 0)));

            const actionCell = document.createElement("div");
            actionCell.className = "job-table-cell";
            const viewButton = document.createElement("button");
            viewButton.type = "button";
            viewButton.className = "job-view-button";
            viewButton.dataset.openJob = job.id;
            viewButton.textContent = "View";
            actionCell.appendChild(viewButton);
            row.appendChild(actionCell);
            list.appendChild(row);
        });
        empty.hidden = rows.length > 0;
        filterDashboardRecentJobs();
    }

    let selectedDashboardRecentCategory = "all";

    function filterDashboardRecentJobs() {
        const list = document.getElementById("dashboardRecentJobsList");
        const empty = document.getElementById("dashboardRecentJobsEmpty");
        if (!list || !empty) return;
        const search = (document.getElementById("dashboardRecentSearchInput")?.value || "").trim().toLowerCase();
        const cards = Array.from(list.querySelectorAll(".job-table-row"));
        cards.forEach(card => {
            const matchesSearch = (card.dataset.title || "").includes(search);
            const matchesCategory = selectedDashboardRecentCategory === "all" ||
                (card.dataset.category || "") === selectedDashboardRecentCategory;
            card.hidden = !(matchesSearch && matchesCategory);
        });
        const visible = cards.filter(card => !card.hidden).length;
        const count = document.getElementById("dashboardRecentResultsCount");
        if (count) count.textContent = visible + (visible === 1 ? " Job" : " Jobs");
        empty.hidden = visible > 0;
        const heading = empty.querySelector("h3");
        const message = empty.querySelector("p");
        if (heading) heading.textContent = cards.length ? "No Matching Jobs" : "No Jobs Available Yet";
        if (message) message.textContent = cards.length
            ? "No jobs match your current search or category. Try another filter."
            : "There are currently no approved jobs available. Please check back later.";
    }

    const dashboardRecentSearchInput = document.getElementById("dashboardRecentSearchInput");
    const dashboardRecentSearchButton = document.getElementById("dashboardRecentSearchButton");
    if (dashboardRecentSearchInput) dashboardRecentSearchInput.addEventListener("input", filterDashboardRecentJobs);
    if (dashboardRecentSearchButton) dashboardRecentSearchButton.addEventListener("click", filterDashboardRecentJobs);

    document.querySelectorAll("#dashboardRecentCategoryGrid [data-recent-category]").forEach(button => {
        button.addEventListener("click", () => {
            selectedDashboardRecentCategory = String(button.dataset.recentCategory || "all").toLowerCase();
            document.querySelectorAll("#dashboardRecentCategoryGrid [data-recent-category]").forEach(item => {
                item.classList.toggle("active", item === button);
            });
            filterDashboardRecentJobs();
        });
    });

    const dashboardRecentSortFilter = document.getElementById("dashboardRecentSortFilter");
    if (dashboardRecentSortFilter) {
        dashboardRecentSortFilter.addEventListener("change", () => {
            const list = document.getElementById("dashboardRecentJobsList");
            if (!list) return;
            const cards = Array.from(list.querySelectorAll(".job-table-row"));
            const sortType = dashboardRecentSortFilter.value;
            cards.sort((a, b) => {
                const rewardA = Number(a.dataset.reward) || 0;
                const rewardB = Number(b.dataset.reward) || 0;
                if (sortType === "highest") return rewardB - rewardA;
                if (sortType === "lowest") return rewardA - rewardB;
                return new Date(b.dataset.date || 0) - new Date(a.dataset.date || 0);
            });
            cards.forEach(card => list.appendChild(card));
            filterDashboardRecentJobs();
        });
    }

    async function loadFindJobs() {
        const { data, error } = await supabaseClient.from("jobs")
            .select("id,advertiser_id,category_id,title,description,instructions,target_url,proof_requirements,extra_instructions,reward_per_worker,total_slots,duration_minutes,currency,status,created_at,remaining_budget")
            .eq("status", "active")
            .gt("remaining_budget", 0)
            .order("created_at", { ascending: false });
        if (error) throw error;
        publicJobs = data || [];

        renderDashboardRecentJobs(publicJobs.slice(0, 20));
        const list = document.getElementById("jobList");
        const empty = document.getElementById("jobEmptyState");
        if (!list || !empty) return;
        list.replaceChildren();
        publicJobs.forEach(job => {
            const category = getJobCategory(job);
            const row = document.createElement("article");
            row.className = "job-table-row job-list-item";
            row.dataset.jobId = job.id;
            row.dataset.title = (category?.name || "") + " " + (job.title || "");
            row.dataset.category = String(category?.slug || category?.name || "other").toLowerCase();
            row.dataset.reward = String(Number(job.reward_per_worker) || 0);
            row.dataset.date = job.created_at || "";
            row.style.setProperty("--job-card-background", "#ffffff");

            const nameCell = document.createElement("div");
            nameCell.className = "job-table-cell job-name-cell";
            const nameButton = document.createElement("button");
            nameButton.type = "button";
            nameButton.className = "job-name-link";
            nameButton.dataset.openJob = job.id;
            nameButton.textContent = (category?.name || "Uncategorized") + " · " + (job.title || "Untitled Job");
            nameButton.title = nameButton.textContent;
            nameCell.appendChild(nameButton);

            row.appendChild(nameCell);
            row.appendChild(createJobCell("job-payment-cell", formatWalletMoney(job.reward_per_worker, job.currency || "USD")));
            row.appendChild(createJobCell("job-success-rate", "—"));
            row.appendChild(createJobCell("", formatJobDuration(job.duration_minutes)));
            row.appendChild(createJobCell("job-completed-cell", "— / " + Number(job.total_slots || 0)));

            const actionCell = document.createElement("div");
            actionCell.className = "job-table-cell";
            const viewButton = document.createElement("button");
            viewButton.type = "button";
            viewButton.className = "job-view-button";
            viewButton.dataset.openJob = job.id;
            viewButton.textContent = "View";
            actionCell.appendChild(viewButton);
            row.appendChild(actionCell);
            list.appendChild(row);
        });
        empty.hidden = publicJobs.length !== 0;
        const countNode = document.getElementById("jobResultsCount");
        if (countNode) countNode.textContent = publicJobs.length + (publicJobs.length === 1 ? " Job" : " Jobs");
        const availableCount = document.getElementById("availableJobsCount");
        const totalCount = document.getElementById("totalJobsCount");
        const completedCount = document.getElementById("completedJobsCount");
        if (availableCount) availableCount.textContent = String(publicJobs.length);
        if (totalCount) totalCount.textContent = String(publicJobs.length);
        if (completedCount) completedCount.textContent = "—";
        filterAvailableJobs();
    }

    const dashboardRecentJobsList = document.getElementById("dashboardRecentJobsList");
    if (dashboardRecentJobsList) {
        dashboardRecentJobsList.addEventListener("click", event => {
            const trigger = event.target.closest("[data-open-job]");
            if (trigger) openJobDetails(trigger.dataset.openJob);
        });
    }

    const findJobsList = document.getElementById("jobList");
    if (findJobsList) {
        findJobsList.addEventListener("click", event => {
            const trigger = event.target.closest("[data-open-job]");
            if (trigger) openJobDetails(trigger.dataset.openJob);
        });
    }
    ["backToJobsButton", "detailsBackButton"].forEach(id => {
        const button = document.getElementById(id);
        if (button) button.addEventListener("click", () => showPageSection("findJobSection"));
    });


    function updatePostedJobStats(jobs) {
        const counts = {
            postedTotalCount: jobs.length,
            postedActiveCount: jobs.filter(j => j.status === "active").length,
            postedPendingCount: jobs.filter(j => j.status === "pending_review").length,
            postedCompletedCount: jobs.filter(j => j.status === "completed").length,
            postedRejectedCount: jobs.filter(j => j.status === "rejected").length
        };
        Object.entries(counts).forEach(([id, value]) => {
            const node = document.getElementById(id);
            if (node) node.textContent = String(value);
        });
    }

    function renderPostedJobs(jobs) {
        const list = document.getElementById("postedJobsList");
        const empty = document.getElementById("postedJobsMessage");
        if (!list || !empty) return;
        list.replaceChildren();
        empty.hidden = jobs.length !== 0;
        jobs.forEach(job => {
            const category = getJobCategory(job);
            const row = document.createElement("article");
            row.className = "job-table-row posted-job-table-row job-list-item";
            row.dataset.status = uiStatus(job.status);
            row.style.setProperty("--job-card-background", "#ffffff");

            const name = document.createElement("span");
            name.className = "job-table-cell job-name-cell";
            name.textContent = (category?.name || "Uncategorized") + " · " + (job.title || "Untitled Job");
            name.title = [name.textContent, job.admin_review_note || ""].filter(Boolean).join(" — ");
            row.appendChild(name);

            row.appendChild(createJobCell("job-payment-cell", formatWalletMoney(job.reward_per_worker, job.currency || "USD")));
            row.appendChild(createJobCell("job-completed-cell", "— / " + Number(job.total_slots || 0)));

            const status = document.createElement("span");
            const normalized = uiStatus(job.status);
            status.className = "posted-job-status " +
                (normalized === "pending_review" || normalized === "pending" ? "pending" :
                 normalized === "active" ? "active" :
                 normalized === "rejected" ? "rejected" : "other");
            status.textContent = normalized === "pending_review" ? "Pending" :
                String(normalized || "Unknown").replaceAll("_", " ");
            if (job.status === "rejected") {
                status.title = (job.admin_review_note || "Job rejected") +
                    " · Contact taskbridgesupport@gmail.com for assistance.";
            }
            row.appendChild(status);
            list.appendChild(row);
        });
        const activeTab = document.querySelector("#myPostedJobsSection .job-tab.active");
        const selected = activeTab?.dataset.status || "all";
        list.querySelectorAll(".job-list-item").forEach(card => {
            card.hidden = selected !== "all" && card.dataset.status !== selected;
        });
    }

    async function loadMyPostedJobs() {
        const { data, error } = await supabaseClient.from("jobs")
            .select("id,advertiser_id,category_id,title,reward_per_worker,total_slots,reserved_budget,remaining_budget,status,admin_review_note,created_at,currency,duration_minutes")
            .eq("advertiser_id", currentUser.id)
            .order("created_at", { ascending: false });
        if (error) throw error;
        const jobs = data || [];
        updatePostedJobStats(jobs);
        renderPostedJobs(jobs);
    }

    async function submitNewJob() {
        const categoryId = document.getElementById("postJobCategory")?.value;
        const title = document.getElementById("jobTitle")?.value.trim();
        const description = document.getElementById("jobDescription")?.value.trim();
        const instructions = document.getElementById("jobInstructions")?.value.trim();
        const targetUrl = document.getElementById("targetUrl")?.value.trim();
        const reward = Number(document.getElementById("workerReward")?.value);
        const slots = Number.parseInt(document.getElementById("workersRequired")?.value, 10);
        const duration = Number.parseInt(document.getElementById("jobDuration")?.value, 10);
        const proofType = document.getElementById("proofType")?.value;
        const proofDetails = document.getElementById("proofInstructions")?.value.trim();

        if (!categoryRows.some(c => c.id === categoryId) || !title || !description ||
            !instructions || !proofType || !Number.isFinite(reward) || reward <= 0 ||
            !Number.isInteger(slots) || slots <= 0 || !Number.isInteger(duration) || duration <= 0) {
            showJobFormMessage("Please complete all required fields with valid values.", "error");
            return;
        }
        const proofRequirements = "Proof type: " + proofType +
            (proofDetails ? "\n" + proofDetails : "");
        const submit = postJobForm?.querySelector('button[type="submit"]');
        if (submit) { submit.disabled = true; submit.textContent = "Submitting..."; }
        try {
            const { data, error } = await supabaseClient.rpc("create_job_with_funding", {
                p_category_id: categoryId,
                p_title: title,
                p_description: description,
                p_instructions: instructions,
                p_target_url: targetUrl || null,
                p_proof_requirements: proofRequirements,
                p_extra_instructions: null,
                p_reward_per_worker: reward,
                p_total_slots: slots,
                p_duration_minutes: duration,
                p_card_color: getSelectedCardColor()
            });
            if (error) throw error;
            showJobFormMessage("Job submitted. It is pending admin review. Reference: " + data, "success");
            postJobForm.reset();
            const durationInput = document.getElementById("jobDuration");
            if (durationInput) durationInput.value = "5";
            calculateJobBudget();
            localStorage.removeItem("taskbridge_job_draft");
            await loadMyPostedJobs();
            document.querySelector('[data-section="myPostedJobsSection"]')?.click();
        } catch (error) {
            console.error("Job posting error:", error);
            showJobFormMessage(error.message || "Could not submit job.", "error");
        } finally {
            if (submit) { submit.disabled = false; submit.textContent = "Submit Job"; }
        }
    }

    async function initializeSupabaseDashboard() {
        if (!window.supabase?.createClient) throw new Error("Supabase library did not load.");
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            auth: { storage: authStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
        });
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        currentUser = data?.session?.user || null;
        if (!currentUser) { window.location.replace("./login.html"); return; }

        let displayName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || "My Account";
        try {
            const { data: profileDetails, error: profileDetailsError } = await supabaseClient
                .from("user_profile_details").select("full_name").eq("user_id", currentUser.id).maybeSingle();
            if (!profileDetailsError && profileDetails?.full_name) displayName = profileDetails.full_name;
        } catch (profileDetailsError) {
            console.warn("Could not load profile display name:", profileDetailsError);
        }
        const name = document.querySelector("#profileToggle .profile-info strong");
        const avatar = document.querySelector("#profileToggle .profile-avatar");
        if (name) name.textContent = displayName;
        if (avatar) avatar.textContent = displayName.trim().charAt(0).toUpperCase() || "U";

        await loadJobCategories();
        await Promise.all([loadMyPostedJobs(), loadFindJobs()]);
        await loadMyWallet();
        await Promise.all([loadHeaderNotifications(), loadTransactionHistory()]);

        document.querySelectorAll(".logout-link").forEach(link => {
            link.addEventListener("click", async event => {
                event.preventDefault();
                const { error: signOutError } = await supabaseClient.auth.signOut();
                if (signOutError) { alert(signOutError.message); return; }
                window.location.replace("./login.html");
            });
        });

        supabaseClient.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_OUT" || !session) window.location.replace("./login.html");
        });

        walletChannel = supabaseClient.channel("user-wallet-" + currentUser.id)
            .on("postgres_changes", {
                event: "*", schema: "public", table: "wallets",
                filter: "user_id=eq." + currentUser.id
            }, () => loadMyWallet().catch(err => console.error("Wallet realtime refresh failed:", err)))
            .subscribe();

        supabaseClient.channel("user-finance-updates-" + currentUser.id)
            .on("postgres_changes", { event: "*", schema: "public", table: "deposits", filter: "user_id=eq." + currentUser.id }, () => {
                loadTransactionHistory().catch(err => console.error("Deposit history refresh failed:", err));
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "wallet_transactions", filter: "user_id=eq." + currentUser.id }, () => {
                loadTransactionHistory().catch(err => console.error("Wallet transaction refresh failed:", err));
                loadMyWallet().catch(err => console.error("Wallet refresh failed:", err));
            })
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: "user_id=eq." + currentUser.id }, () => {
                loadHeaderNotifications().catch(err => console.error("Notification refresh failed:", err));
            })
            .subscribe();

        postedJobsChannel = supabaseClient.channel("advertiser-jobs-" + currentUser.id)
            .on("postgres_changes", {
                event: "*", schema: "public", table: "jobs",
                filter: "advertiser_id=eq." + currentUser.id
            }, () => loadMyPostedJobs().catch(err => console.error("Realtime refresh failed:", err)))
            .subscribe();

        publicJobsChannel = supabaseClient.channel("public-active-jobs")
            .on("postgres_changes", {
                event: "*", schema: "public", table: "jobs"
            }, () => loadFindJobs().catch(err => console.error("Find Jobs realtime refresh failed:", err)))
            .subscribe();
    }

    initializeSupabaseDashboard().catch(error => {
        console.error("Supabase dashboard setup failed:", error);
        showJobFormMessage(error.message || "Dashboard data could not be loaded.", "error");
    });

    /* =====================================
       DASHBOARD INITIALIZATION
    ====================================== */

    console.log(
        "TaskBridge Dashboard initialized successfully."
    );

});
