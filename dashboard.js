/* ========================================
   TASKBRIDGE - DASHBOARD JAVASCRIPT
   Updated Complete Version
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    let supabaseClient = null;
    let currentUser = null;
    let categoryRows = [];
    let postedJobsChannel = null;
    let walletChannel = null;
    let walletCurrency = "USD";
    let walletAvailableBalance = 0;

    /* =====================================
       CURRENT YEAR
    ====================================== */

    const currentYear = document.getElementById("current-year");

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }


 /* ===================================
       ELEMENTS
    ====================================== */

    const sidebar = document.getElementById("sidebar");
    const menuToggle = document.getElementById("menuToggle");
    const sidebarClose = document.getElementById("sidebarClose");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    const notificationToggle = document.getElementById("notificationToggle");
    const notificationMenu = document.getElementById("notificationMenu");

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
       JOB BUDGET CALCULATOR
    ====================================== */

    const workerReward = document.getElementById("workerReward");
    const workersRequired = document.getElementById("workersRequired");
    const totalJobBudget = document.getElementById("totalJobBudget");


    function calculateJobBudget() {

        if (!workerReward || !workersRequired || !totalJobBudget) {
            return;
        }

        const reward = parseFloat(workerReward.value) || 0;
        const workers = parseInt(workersRequired.value, 10) || 0;

        const total = reward * workers;

        totalJobBudget.textContent = "$" + total.toFixed(2);

    }


    if (workerReward) {

        workerReward.addEventListener(
            "input",
            calculateJobBudget
        );

    }


    if (workersRequired) {

        workersRequired.addEventListener(
            "input",
            calculateJobBudget
        );

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


    function filterAvailableJobs() {

        const searchTerm = jobSearchInput
            ? jobSearchInput.value.trim().toLowerCase()
            : "";

        const selectedCategory = jobCategoryFilter
            ? jobCategoryFilter.value.toLowerCase()
            : "all";


        const jobCards = document.querySelectorAll(
            "#findJobSection .job-card"
        );


        jobCards.forEach(function (card) {

            const title = (
                card.dataset.title ||
                card.textContent
            ).toLowerCase();

            const category = (
                card.dataset.category || ""
            ).toLowerCase();

            const matchesSearch = title.includes(searchTerm);

            const matchesCategory =
                selectedCategory === "all" ||
                category === selectedCategory;

            card.hidden = !(matchesSearch && matchesCategory);

        });

    }


    if (jobSearchInput) {

        jobSearchInput.addEventListener(
            "input",
            filterAvailableJobs
        );

    }


    if (jobCategoryFilter) {

        jobCategoryFilter.addEventListener(
            "change",
            filterAvailableJobs
        );

    }


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
                jobContainer.querySelectorAll(".job-card")
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

    function renderWalletBalance(wallet) {
        walletCurrency = wallet?.currency || "USD";
        walletAvailableBalance = Math.max(0, Number(wallet?.available_balance ?? 0) || 0);
        const formatted = formatWalletMoney(wallet?.available_balance ?? 0, walletCurrency);
        ["availableBalanceHeader", "availableBalanceOverview",
            "availableBalanceWallet", "availableBalanceWithdraw"].forEach(id => {
            const node = document.getElementById(id);
            if (node) node.textContent = formatted;
        });

        const withdrawAmount = document.getElementById("withdrawAmount");
        if (withdrawAmount) {
            withdrawAmount.max = String(Number(wallet?.available_balance ?? 0));
        }
        const withdrawLabel = document.querySelector('label[for="withdrawAmount"]');
        if (withdrawLabel) {
            withdrawLabel.textContent = "Withdrawal Amount (" + walletCurrency + ")";
        }
    }

    async function loadMyWallet() {
        const { data, error } = await supabaseClient.from("wallets")
            .select("id,user_id,currency,available_balance,held_balance,updated_at")
            .eq("user_id", currentUser.id)
            .maybeSingle();
        if (error) throw error;
        if (!data) {
            renderWalletBalance({ currency: "USD", available_balance: 0 });
            console.warn("No wallet row found for the signed-in user.");
            return;
        }
        renderWalletBalance(data);
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

    const depositMethodDetails = {
        "bKash": { title: "bKash payment details (demo)", lines: ["Account type: Agent / Merchant (replace with your verified account)", "Account number: 01XXXXXXXXX", "Reference: TaskBridge Deposit"] },
        "Nagad": { title: "Nagad payment details (demo)", lines: ["Account type: Merchant (replace with your verified account)", "Account number: 01XXXXXXXXX", "Reference: TaskBridge Deposit"] },
        "Rocket": { title: "Rocket payment details (demo)", lines: ["Account type: Merchant / Agent (replace with your verified account)", "Account number: 01XXXXXXXXXX", "Reference: TaskBridge Deposit"] },
        "Bank Transfer": { title: "Bank transfer details (demo)", lines: ["Bank: Replace with your bank name", "Account name: TaskBridge (replace with verified account name)", "Account number: XXXX-XXXX-XXXX", "Branch: Replace with branch name", "Routing number: XXXXXXXX"] },
        "Wise (manual transfer)": { title: "Wise transfer details (demo)", lines: ["Wise recipient: Replace with your verified Wise business account", "Recipient email / account details: payments@example.com", "Use USD and include your TaskBridge user ID in the reference"] },
        "USDT - BEP20": { title: "USDT wallet (BEP20 demo)", lines: ["Network: BNB Smart Chain (BEP20)", "Wallet address: 0xDEMO_REPLACE_WITH_YOUR_BEP20_ADDRESS", "Send USDT on BEP20 network only"] },
        "USDT - TRC20": { title: "USDT wallet (TRC20 demo)", lines: ["Network: TRON (TRC20)", "Wallet address: TDEMO_REPLACE_WITH_YOUR_TRC20_ADDRESS", "Send USDT on TRC20 network only"] }
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
    let selectedDepositMethod = "";
    let selectedWithdrawMethod = "";

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
                    user_id: currentUser.id, amount, currency: "USD",
                    payment_method: method, transaction_reference: reference, status: "pending"
                });
                if (error) throw error;
                depositForm.reset();
                closeFinanceModal(depositModal);
                selectedDepositMethod = "";
                document.querySelectorAll(".deposit-method-card").forEach(card => {
                    card.classList.remove("active");
                    card.setAttribute("aria-pressed", "false");
                });
                if (depositMessage) depositMessage.textContent = "Deposit request submitted. It will remain pending until an admin verifies your transaction.";
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
            if (!meta) return;
            setModalBrand(card, withdrawModalMark, withdrawModalTitle, selectedWithdrawMethod + " withdrawal");
            if (withdrawAccountLabel) withdrawAccountLabel.textContent = meta.label;
            if (withdrawAccountInput) withdrawAccountInput.placeholder = meta.placeholder;
            if (withdrawAccountHint) withdrawAccountHint.textContent = meta.hint;
            if (withdrawModalBalance) withdrawModalBalance.textContent = document.getElementById("availableBalanceWithdraw")?.textContent || formatWalletMoney(0, walletCurrency);
            if (withdrawAmountInput) {
                withdrawAmountInput.max = String(walletAvailableBalance);
                withdrawAmountInput.value = "";
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
            const available = walletAvailableBalance;
            if (!selectedWithdrawMethod) { if (withdrawMessage) withdrawMessage.textContent = "Please select a withdrawal method."; return; }
            if (!Number.isFinite(amount) || amount <= 0 || amount > available || !paymentAccount) {
                if (withdrawMessage) withdrawMessage.textContent = "Enter a valid amount within your available balance and complete the receiving account details.";
                return;
            }
            if (withdrawSubmitButton) { withdrawSubmitButton.disabled = true; withdrawSubmitButton.textContent = "Submitting..."; }
            if (withdrawMessage) withdrawMessage.textContent = "";
            try {
                const { error } = await supabaseClient.from("withdrawals").insert({
                    user_id: currentUser.id,
                    amount,
                    currency: walletCurrency || "USD",
                    payment_method: selectedWithdrawMethod,
                    payment_account: paymentAccount,
                    status: "pending"
                });
                if (error) throw error;
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
            const card = document.createElement("article");
            card.className = "job-list-item";
            card.dataset.status = uiStatus(job.status);
            const category = categoryRows.find(c => c.id === job.category_id);
            const categoryHeading = document.createElement("h3");
            categoryHeading.className = "posted-job-category";

            if (category?.icon) {
                const iconValue = String(category.icon).trim();
                const iconNode = document.createElement(
                    /^(fa[srb]?\s|fa-)/i.test(iconValue) ? "i" : "span"
                );
                if (iconNode.tagName === "I") {
                    iconNode.className = iconValue;
                    iconNode.setAttribute("aria-hidden", "true");
                } else {
                    iconNode.textContent = iconValue;
                    iconNode.setAttribute("aria-hidden", "true");
                }
                categoryHeading.appendChild(iconNode);
            }

            const categoryName = document.createElement("span");
            categoryName.textContent = category?.name || "Uncategorized";
            categoryHeading.appendChild(categoryName);

            const detail = document.createElement("p");
            detail.textContent = formatJobMoney(job.reward_per_worker) + " per worker · " +
                Number(job.total_slots || 0) + " workers";
            const budget = document.createElement("p");
            budget.textContent = "Reserved: " + formatJobMoney(job.reserved_budget) +
                " · Remaining: " + formatJobMoney(job.remaining_budget);
            const status = document.createElement("span");
            status.className = "status-badge";
            status.textContent = String(job.status || "").replaceAll("_", " ");
            const created = document.createElement("small");
            created.textContent = job.created_at ? new Date(job.created_at).toLocaleString() : "";
            card.append(categoryHeading, status, detail, budget, created);
            if (job.admin_review_note) {
                const note = document.createElement("p");
                note.textContent = "Admin note: " + job.admin_review_note;
                card.appendChild(note);
            }
            if (job.status === "rejected") {
                const support = document.createElement("p");
                support.append("Your job was rejected. For assistance, please contact TaskBridge Support: ");
                const email = document.createElement("a");
                email.href = "mailto:taskbridgesupport@gmail.com";
                email.textContent = "taskbridgesupport@gmail.com";
                support.appendChild(email);
                card.appendChild(support);
            }
            list.appendChild(card);
        });
        const activeTab = document.querySelector("#myPostedJobsSection .job-tab.active");
        const selected = activeTab?.dataset.status || "all";
        list.querySelectorAll(".job-list-item").forEach(card => {
            card.hidden = selected !== "all" && card.dataset.status !== selected;
        });
    }

    async function loadMyPostedJobs() {
        const { data, error } = await supabaseClient.from("jobs")
            .select("id,advertiser_id,category_id,title,reward_per_worker,total_slots,reserved_budget,remaining_budget,status,admin_review_note,created_at")
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
                p_duration_minutes: duration
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

        const email = currentUser.email || "Account";
        const name = document.querySelector("#profileToggle .profile-info strong");
        const avatar = document.querySelector("#profileToggle .profile-avatar");
        if (name) name.textContent = email;
        if (avatar) avatar.textContent = email.charAt(0).toUpperCase();

        await loadJobCategories();
        await loadMyPostedJobs();
        await loadMyWallet();

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

        postedJobsChannel = supabaseClient.channel("advertiser-jobs-" + currentUser.id)
            .on("postgres_changes", {
                event: "*", schema: "public", table: "jobs",
                filter: "advertiser_id=eq." + currentUser.id
            }, () => loadMyPostedJobs().catch(err => console.error("Realtime refresh failed:", err)))
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
