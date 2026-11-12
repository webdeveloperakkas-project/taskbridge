/* =======================================
   TASKBRIDGE - DASHBOARD JAVASCRIPT
   Updated Complete Version
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    let supabaseClient = null;
    let currentUser = null;
    let categoryRows = [];
    let postedJobsCache = [];
    let postedSubmissionsCache = [];
    let postedJobsChannel = null;
    let submissionsChannel = null;
    let publicJobsChannel = null;
    let publicJobs = [];
    let walletChannel = null;
    let walletCurrency = "USD";
    let walletAvailableBalance = 0;
    let walletRows = [];
    let walletsByCurrency = new Map();
    let selectedWithdrawCurrency = "";
    let activeWorkerJob = null;
    let activeWorkerSubmission = null;
    let workerJobTimerInterval = null;

    const JOB_COUNTRY_GROUPS = {"Asia":"Afghanistan|Armenia|Azerbaijan|Bahrain|Bangladesh|Bhutan|Brunei|Cambodia|China|Cyprus|Georgia|India|Indonesia|Iran|Iraq|Israel|Japan|Jordan|Kazakhstan|Kuwait|Kyrgyzstan|Laos|Lebanon|Malaysia|Maldives|Mongolia|Myanmar|Nepal|North Korea|Oman|Pakistan|Palestine|Philippines|Qatar|Saudi Arabia|Singapore|South Korea|Sri Lanka|Syria|Taiwan|Tajikistan|Thailand|Timor-Leste|Turkey|Turkmenistan|United Arab Emirates|Uzbekistan|Vietnam|Yemen","Europe":"Albania|Andorra|Austria|Belarus|Belgium|Bosnia and Herzegovina|Bulgaria|Croatia|Czechia|Denmark|Estonia|Finland|France|Germany|Greece|Hungary|Iceland|Ireland|Italy|Kosovo|Latvia|Liechtenstein|Lithuania|Luxembourg|Malta|Moldova|Monaco|Montenegro|Netherlands|North Macedonia|Norway|Poland|Portugal|Romania|Russia|San Marino|Serbia|Slovakia|Slovenia|Spain|Sweden|Switzerland|Ukraine|United Kingdom|Vatican City","Africa":"Algeria|Angola|Benin|Botswana|Burkina Faso|Burundi|Cabo Verde|Cameroon|Central African Republic|Chad|Comoros|Democratic Republic of the Congo|Republic of the Congo|Côte d’Ivoire|Djibouti|Egypt|Equatorial Guinea|Eritrea|Eswatini|Ethiopia|Gabon|Gambia|Ghana|Guinea|Guinea-Bissau|Kenya|Lesotho|Liberia|Libya|Madagascar|Malawi|Mali|Mauritania|Mauritius|Morocco|Mozambique|Namibia|Niger|Nigeria|Rwanda|São Tomé and Príncipe|Senegal|Seychelles|Sierra Leone|Somalia|South Africa|South Sudan|Sudan|Tanzania|Togo|Tunisia|Uganda|Zambia|Zimbabwe","North America":"Antigua and Barbuda|Bahamas|Barbados|Belize|Canada|Costa Rica|Cuba|Dominica|Dominican Republic|El Salvador|Grenada|Guatemala|Haiti|Honduras|Jamaica|Mexico|Nicaragua|Panama|Saint Kitts and Nevis|Saint Lucia|Saint Vincent and the Grenadines|Trinidad and Tobago|United States","South America":"Argentina|Bolivia|Brazil|Chile|Colombia|Ecuador|Guyana|Paraguay|Peru|Suriname|Uruguay|Venezuela","Oceania":"Australia|Fiji|Kiribati|Marshall Islands|Micronesia|Nauru|New Zealand|Palau|Papua New Guinea|Samoa|Solomon Islands|Tonga|Tuvalu|Vanuatu"};
    let currentUserCountry = "";

    // ISO 3166-1 alpha-2 codes used to display the correct country flag emoji.
    const JOB_COUNTRY_CODES = {
        "Afghanistan":"AF","Albania":"AL","Algeria":"DZ","Andorra":"AD","Angola":"AO",
        "Antigua and Barbuda":"AG","Argentina":"AR","Armenia":"AM","Australia":"AU","Austria":"AT",
        "Azerbaijan":"AZ","Bahamas":"BS","Bahrain":"BH","Bangladesh":"BD","Barbados":"BB",
        "Belarus":"BY","Belgium":"BE","Belize":"BZ","Benin":"BJ","Bhutan":"BT","Bolivia":"BO",
        "Bosnia and Herzegovina":"BA","Botswana":"BW","Brazil":"BR","Brunei":"BN","Bulgaria":"BG",
        "Burkina Faso":"BF","Burundi":"BI","Cabo Verde":"CV","Cambodia":"KH","Cameroon":"CM",
        "Canada":"CA","Central African Republic":"CF","Chad":"TD","Chile":"CL","China":"CN",
        "Colombia":"CO","Comoros":"KM","Costa Rica":"CR","Côte d’Ivoire":"CI","Croatia":"HR",
        "Cuba":"CU","Cyprus":"CY","Czechia":"CZ","Democratic Republic of the Congo":"CD",
        "Denmark":"DK","Djibouti":"DJ","Dominica":"DM","Dominican Republic":"DO","Ecuador":"EC",
        "Egypt":"EG","El Salvador":"SV","Equatorial Guinea":"GQ","Eritrea":"ER","Estonia":"EE",
        "Eswatini":"SZ","Ethiopia":"ET","Fiji":"FJ","Finland":"FI","France":"FR","Gabon":"GA",
        "Gambia":"GM","Georgia":"GE","Germany":"DE","Ghana":"GH","Greece":"GR","Grenada":"GD",
        "Guatemala":"GT","Guinea":"GN","Guinea-Bissau":"GW","Guyana":"GY","Haiti":"HT",
        "Honduras":"HN","Hungary":"HU","Iceland":"IS","India":"IN","Indonesia":"ID","Iran":"IR",
        "Iraq":"IQ","Ireland":"IE","Israel":"IL","Italy":"IT","Jamaica":"JM","Japan":"JP",
        "Jordan":"JO","Kazakhstan":"KZ","Kenya":"KE","Kiribati":"KI","Kosovo":"XK","Kuwait":"KW",
        "Kyrgyzstan":"KG","Laos":"LA","Latvia":"LV","Lebanon":"LB","Lesotho":"LS","Liberia":"LR",
        "Libya":"LY","Liechtenstein":"LI","Lithuania":"LT","Luxembourg":"LU","Madagascar":"MG",
        "Malawi":"MW","Malaysia":"MY","Maldives":"MV","Mali":"ML","Malta":"MT","Marshall Islands":"MH",
        "Mauritania":"MR","Mauritius":"MU","Mexico":"MX","Micronesia":"FM","Moldova":"MD","Monaco":"MC",
        "Mongolia":"MN","Montenegro":"ME","Morocco":"MA","Mozambique":"MZ","Myanmar":"MM","Namibia":"NA",
        "Nauru":"NR","Nepal":"NP","Netherlands":"NL","New Zealand":"NZ","Nicaragua":"NI","Niger":"NE",
        "Nigeria":"NG","North Korea":"KP","North Macedonia":"MK","Norway":"NO","Oman":"OM","Pakistan":"PK",
        "Palau":"PW","Palestine":"PS","Panama":"PA","Papua New Guinea":"PG","Paraguay":"PY","Peru":"PE",
        "Philippines":"PH","Poland":"PL","Portugal":"PT","Qatar":"QA","Republic of the Congo":"CG",
        "Romania":"RO","Russia":"RU","Rwanda":"RW","Saint Kitts and Nevis":"KN","Saint Lucia":"LC",
        "Saint Vincent and the Grenadines":"VC","Samoa":"WS","San Marino":"SM","São Tomé and Príncipe":"ST",
        "Saudi Arabia":"SA","Senegal":"SN","Serbia":"RS","Seychelles":"SC","Sierra Leone":"SL",
        "Singapore":"SG","Slovakia":"SK","Slovenia":"SI","Solomon Islands":"SB","Somalia":"SO",
        "South Africa":"ZA","South Korea":"KR","South Sudan":"SS","Spain":"ES","Sri Lanka":"LK",
        "Sudan":"SD","Suriname":"SR","Sweden":"SE","Switzerland":"CH","Syria":"SY","Taiwan":"TW",
        "Tajikistan":"TJ","Tanzania":"TZ","Thailand":"TH","Timor-Leste":"TL","Togo":"TG","Tonga":"TO",
        "Trinidad and Tobago":"TT","Tunisia":"TN","Turkey":"TR","Turkmenistan":"TM","Tuvalu":"TV",
        "Uganda":"UG","Ukraine":"UA","United Arab Emirates":"AE","United Kingdom":"GB",
        "United States":"US","Uruguay":"UY","Uzbekistan":"UZ","Vanuatu":"VU","Vatican City":"VA",
        "Venezuela":"VE","Vietnam":"VN","Yemen":"YE","Zambia":"ZM","Zimbabwe":"ZW"
    };

    function countryFlagEmoji(country) {
        const code = JOB_COUNTRY_CODES[country];
        if (!code) return "🏳️";
        return String.fromCodePoint(...code.toUpperCase().split("").map(char => 127397 + char.charCodeAt(0)));
    }

    function populateJobCountryOptions() {
        const select = document.getElementById("jobTargetCountry");
        if (!select || select.dataset.populated === "true") return;
        const worldwideOption = select.querySelector('option[value="Worldwide"]');
        if (worldwideOption) worldwideOption.textContent = "🌐 Worldwide — All Countries";
        Object.entries(JOB_COUNTRY_GROUPS).forEach(([region, countries]) => {
            const regionOption = document.createElement("option");
            regionOption.value = "region:" + region;
            regionOption.textContent = "🌍 " + region + " Zone — All Countries";
            select.appendChild(regionOption);

            const group = document.createElement("optgroup");
            group.label = region + " Countries";
            countries.split("|").forEach(country => {
                const option = document.createElement("option");
                option.value = country;
                option.textContent = countryFlagEmoji(country) + " " + country;
                group.appendChild(option);
            });
            select.appendChild(group);
        });
        select.dataset.populated = "true";
    }

    function getCountryRegion(country) {
        const normalized = String(country || "").trim().toLocaleLowerCase();
        if (!normalized) return "";
        for (const [region, countries] of Object.entries(JOB_COUNTRY_GROUPS)) {
            if (countries.split("|").some(name => name.toLocaleLowerCase() === normalized)) {
                return region;
            }
        }
        return "";
    }

    function isJobAvailableInCountry(targetCountry, workerCountry) {
        const target = String(targetCountry || "Worldwide").trim();
        if (!target || ["worldwide", "all countries", "all"].includes(target.toLocaleLowerCase())) {
            return true;
        }
        if (target.startsWith("region:")) {
            const targetRegion = target.slice("region:".length).trim().toLocaleLowerCase();
            return getCountryRegion(workerCountry).toLocaleLowerCase() === targetRegion;
        }
        return String(workerCountry || "").trim().toLocaleLowerCase() === target.toLocaleLowerCase();
    }

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
    const profileMenuToggle = document.getElementById("profileMenuToggle");
    const headerProfileMenu = document.getElementById("headerProfileMenu");


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
        if (headerProfileMenu) headerProfileMenu.classList.remove("show");
        if (profileMenuToggle) profileMenuToggle.setAttribute("aria-expanded", "false");

        if (walletBalanceToggle) {
            walletBalanceToggle.setAttribute("aria-expanded", "false");
        }

        if (notificationToggle) {
            notificationToggle.setAttribute("aria-expanded", "false");
        }


    }


    document.addEventListener("click", function (event) {
        const toggle = event.target.closest("#profileMenuToggle");
        if (!toggle || !headerProfileMenu) return;
        event.preventDefault();
        event.stopPropagation();
        const opening = !headerProfileMenu.classList.contains("show");
        closeAllDropdowns();
        if (opening) {
            headerProfileMenu.classList.add("show");
            toggle.setAttribute("aria-expanded", "true");
        }
    }, true);
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeAllDropdowns();
    });

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
        const clickedProfileMenu = headerProfileMenu && headerProfileMenu.contains(event.target);
        const clickedProfileButton = profileMenuToggle && profileMenuToggle.contains(event.target);


        if (
            !clickedWalletMenu &&
            !clickedWalletButton &&
            !clickedNotification &&
            !clickedNotificationButton &&
            !clickedProfileMenu &&
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
        "jobDetailsSection",
        "profileSection",
        "myStatisticsSection",
        "settingsSection",
        "supportSection"

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
        },
        profileSection: {
            title: "Profile",
            subtitle: "Manage your personal details and verification."
        },
        myStatisticsSection: {
            title: "My Statistics",
            subtitle: "Review your work and job-posting history."
        },
        settingsSection: {
            title: "Settings",
            subtitle: "Manage your account and security preferences."
        },
        supportSection: {
            title: "Help & Support",
            subtitle: "Get help from the TaskBridge support team."
        }

    };


    const sectionLinks = document.querySelectorAll(
        ".sidebar-navigation .nav-link[data-section]"
    );

    // Keep an in-dashboard navigation trail for the section Back buttons.
    let sectionNavigationStack = [];

    function addSectionBackButtons() {
        pageSections.forEach(function (sectionId) {
            if (sectionId === "dashboardSection") return;

            const section = document.getElementById(sectionId);
            const heading = section?.querySelector(".section-heading");
            if (!heading || heading.querySelector(".section-back-button")) return;

            const backButton = document.createElement("button");
            backButton.type = "button";
            backButton.className = "section-back-button";
            backButton.setAttribute("aria-label", "Go back to the previous page");
            backButton.innerHTML = '<span aria-hidden="true">←</span><span>Back</span>';
            backButton.addEventListener("click", function () {
                if (sectionNavigationStack.length > 1) {
                    window.history.back();
                } else {
                    showPageSection("dashboardSection");
                }
            });
            heading.insertBefore(backButton, heading.firstChild);
        });
    }

    addSectionBackButtons();


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

                history.pushState({ taskBridgeSection: sectionId }, "", newHash);
                if (sectionNavigationStack[sectionNavigationStack.length - 1] !== sectionId) {
                    sectionNavigationStack.push(sectionId);
                }

            }

        }


        // Close mobile sidebar

        if (window.innerWidth <= 900) {
            closeSidebar();
        }


        // Close dropdowns

        closeAllDropdowns();


        if (sectionId === "myStatisticsSection" && currentUser) {
            loadMyStatistics().catch(error => console.error("Could not load account statistics:", error));
        }

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
            closeAllDropdowns();

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

        const initialSection = pageSections.includes(window.location.hash.replace("#", ""))
            ? window.location.hash.replace("#", "")
            : "dashboardSection";
        sectionNavigationStack = [initialSection];
        history.replaceState({ taskBridgeSection: initialSection }, "", window.location.href);

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
            const previousIndex = sectionNavigationStack.lastIndexOf(hashSection);
            if (previousIndex >= 0) {
                sectionNavigationStack = sectionNavigationStack.slice(0, previousIndex + 1);
            } else {
                sectionNavigationStack.push(hashSection);
            }
            showPageSection(hashSection, false);
        } else {
            sectionNavigationStack = ["dashboardSection"];
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
            selectedFindCategory = button.dataset.category === "all"
                ? "all"
                : normalizeJobCategory(button.dataset.category);
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

    let hasApprovedWebMoneyDeposit = false;

    function currencyForWithdrawMethod(method) {
        return ({
            "bKash": "BDT", "Nagad": "BDT", "Rocket": "BDT",
            "Bank Transfer": "BDT", "Wise": "USD", "WebMoney": "USD",
            "USDT - BEP20": "USDT", "USDT - TRC20": "USDT"
        })[method] || "";
    }

    function updateWithdrawMethodCards() {
        document.querySelectorAll(".withdraw-method-card").forEach(card => {
            const method = card.dataset.withdrawMethod || "";
            const currency = currencyForWithdrawMethod(method);
            const wallet = walletsByCurrency.get(currency);
            const balance = Math.max(0, Number(wallet?.available_balance || 0));
            const methodEligible = method !== "WebMoney" || hasApprovedWebMoneyDeposit;
            card.hidden = !methodEligible || !wallet || balance <= 0;
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

    async function loadMyTotalEarnings() {
        const node = document.getElementById("dashboardTotalEarnings");
        if (!node || !supabaseClient || !currentUser) return;

        const { data, error } = await supabaseClient.from("wallet_transactions")
            .select("amount,currency")
            .eq("user_id", currentUser.id)
            .eq("transaction_type", "worker_reward")
            .eq("direction", "credit")
            .eq("balance_type", "available");
        if (error) throw error;

        const totals = new Map([["USD", 0], ["BDT", 0]]);
        (data || []).forEach(row => {
            const currency = String(row.currency || "").toUpperCase();
            if (!totals.has(currency)) totals.set(currency, 0);
            totals.set(currency, totals.get(currency) + (Number(row.amount) || 0));
        });

        node.replaceChildren();
        totals.forEach((amount, currency) => {
            const line = document.createElement("span");
            line.textContent = currency + " " + amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            node.appendChild(line);
        });
    }

    async function loadMyWallet() {
        const { data, error } = await supabaseClient.from("wallets")
            .select("id,user_id,currency,available_balance,held_balance,updated_at")
            .eq("user_id", currentUser.id)
            .order("currency", { ascending: true });
        if (error) throw error;

        // WebMoney withdrawals are unlocked only after an admin-approved WebMoney deposit.
        const webMoneyDeposit = await supabaseClient.from("deposits")
            .select("id")
            .eq("user_id", currentUser.id)
            .eq("payment_method", "WebMoney")
            .in("status", ["approved", "completed"])
            .limit(1);
        hasApprovedWebMoneyDeposit = !webMoneyDeposit.error &&
            Array.isArray(webMoneyDeposit.data) && webMoneyDeposit.data.length > 0;
        if (webMoneyDeposit.error) {
            console.warn("Could not verify WebMoney deposit eligibility:", webMoneyDeposit.error);
        }

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
        "WebMoney": "USD", "Visa": "USD", "Mastercard": "USD"
    };

    // Public WMZ purse ID only; configure this after verifying the official TaskBridge account.
    // Keep blank until a real receiving purse has been confirmed.
    const WEBMONEY_WMZ_PURSE = "";

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
        } else if (selectedDepositMethod === "WebMoney" && !WEBMONEY_WMZ_PURSE.trim()) {
            depositInstructions.innerHTML = '<strong>WebMoney setup required.</strong><p>WebMoney WMZ has been added as a deposit method, but deposits are not open yet. The verified TaskBridge WMZ receiving purse must be configured before anyone sends money. Do not transfer funds to an unverified account.</p>';
            depositInstructions.hidden = false;
            if (depositSubmitButton) depositSubmitButton.disabled = true;
        } else {
            if (depositSubmitButton) depositSubmitButton.disabled = false;
            const details = depositMethodDetails[selectedDepositMethod];
            if (!details && selectedDepositMethod !== "WebMoney") { depositInstructions.hidden = true; return; }
            const escapeHtml = value => String(value).replace(/[&<>"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
            const lines = selectedDepositMethod === "WebMoney"
                ? ["Currency: USD (WMZ)", "TaskBridge WMZ receiving purse: " + WEBMONEY_WMZ_PURSE, "Reference: TaskBridge deposit + your account ID"]
                : details.lines;
            const title = selectedDepositMethod === "WebMoney" ? "WebMoney WMZ transfer instructions" : details.title;
            depositInstructions.innerHTML = "<strong>" + escapeHtml(title) + "</strong><ul>" +
                lines.map(line => "<li>" + escapeHtml(line) + "</li>").join("") + "</ul>";
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
            if (method === "WebMoney" && !WEBMONEY_WMZ_PURSE.trim()) {
                if (depositMessage) depositMessage.textContent = "WebMoney deposits are not open yet. The verified TaskBridge WMZ receiving purse has not been configured.";
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
        if (window.location.hash === "#myStatisticsSection") loadMyStatistics().catch(error => console.error("Could not load account statistics:", error));
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
                if (depositSubmitButton) {
                    depositSubmitButton.disabled = ["Visa", "Mastercard"].includes(selectedDepositMethod) ||
                        (selectedDepositMethod === "WebMoney" && !WEBMONEY_WMZ_PURSE.trim());
                    depositSubmitButton.textContent = "Submit Deposit Request";
                }
            }
        });
    }

    const withdrawMethodMeta = {
        "bKash": { label: "bKash Account Number", placeholder: "01XXXXXXXXX", hint: "Enter the bKash number registered to receive your payout." },
        "Nagad": { label: "Nagad Account Number", placeholder: "01XXXXXXXXX", hint: "Enter the Nagad number registered to receive your payout." },
        "Rocket": { label: "Rocket Account Number", placeholder: "01XXXXXXXXXX", hint: "Enter the Rocket number registered to receive your payout." },
        "Bank Transfer": { label: "Bank Account Details", placeholder: "Bank name, account name, account number, branch and routing number", hint: "Provide the bank details needed to identify your receiving account." },
        "Wise": { label: "Wise Account Details", placeholder: "Wise email or recipient account details", hint: "Enter the recipient details for your Wise account." },
        "WebMoney": { label: "WebMoney WMZ Purse", placeholder: "Enter your WMZ purse (for example: Z...)", hint: "Enter the WebMoney WMZ purse where you want to receive your USD payout. Withdrawals are available only after an approved WebMoney deposit." },
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
            select.addEventListener("change", updateJobTitleOptions);
            updateJobTitleOptions();
        }
    }

    function updateJobTitleOptions() {
        const categorySelect = document.getElementById("postJobCategory");
        const titleSelect = document.getElementById("jobTitle");
        if (!categorySelect || !titleSelect) return;

        const selectedCategory = categoryRows.find(row => row.id === categorySelect.value);
        titleSelect.replaceChildren();

        if (!selectedCategory) {
            titleSelect.add(new Option("Select a job category first", ""));
            titleSelect.disabled = true;
            return;
        }

        const categoryKey = String(selectedCategory.slug || selectedCategory.name || "")
            .toLowerCase().replace(/[^a-z0-9]/g, "");

        const titleOptionsByCategory = {
            facebook: [
                "Facebook Page Like",
                "Facebook Page Follow",
                "Facebook Post Like",
                "Facebook Post Comment",
                "Facebook Post Share",
                "Facebook Page Review"
            ],
            youtube: [
                "YouTube Video Like",
                "YouTube Channel Subscribe",
                "YouTube Video Comment",
                "YouTube Video View"
            ],
            instagram: [
                "Instagram Account Follow",
                "Instagram Post Like",
                "Instagram Post Comment",
                "Instagram Reel View"
            ],
            tiktok: [
                "TikTok Account Follow",
                "TikTok Video Like",
                "TikTok Video Comment",
                "TikTok Video Share"
            ],
            twitter: [
                "X Account Follow",
                "X Post Like",
                "X Post Repost",
                "X Post Comment"
            ],
            x: [
                "X Account Follow",
                "X Post Like",
                "X Post Repost",
                "X Post Comment"
            ],
            website: [
                "Website Visit",
                "Website Sign Up",
                "Email Submit",
                "Website Feedback"
            ],
            other: [
                "Other Task"
            ]
        };

        const options = titleOptionsByCategory[categoryKey] ||
            (categoryKey.includes("twitter") ? titleOptionsByCategory.twitter :
            categoryKey.includes("website") ? titleOptionsByCategory.website :
            categoryKey.includes("facebook") ? titleOptionsByCategory.facebook :
            categoryKey.includes("youtube") ? titleOptionsByCategory.youtube :
            categoryKey.includes("instagram") ? titleOptionsByCategory.instagram :
            categoryKey.includes("tiktok") ? titleOptionsByCategory.tiktok :
            categoryKey === "other" ? titleOptionsByCategory.other : []);

        titleSelect.add(new Option("Select Job Title", ""));
        options.forEach(title => titleSelect.add(new Option(title, title)));
        titleSelect.disabled = options.length === 0;
        if (!options.length) {
            titleSelect.replaceChildren(new Option("No job titles available for this category", ""));
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

    // Normalize database category slugs/names to the fixed Browse by Category keys.
    // This handles common variants such as "websites", "website_tasks", and "Twitter / X".
    function normalizeJobCategory(value) {
        const key = String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!key) return "other";
        if (key === "fb" || key.includes("facebook")) return "facebook";
        if (key === "yt" || key.includes("youtube")) return "youtube";
        if (key === "ig" || key.includes("instagram")) return "instagram";
        if (key.includes("tiktok")) return "tiktok";
        if (key === "x" || key.includes("twitter")) return "twitter";
        if (key.includes("website") || key === "web" || key === "site") return "website";
        if (key === "other" || key.includes("other")) return "other";
        return key;
    }

    function createJobCell(className, value) {
        const cell = document.createElement("span");
        cell.className = "job-table-cell " + (className || "");
        cell.textContent = value == null || value === "" ? "—" : String(value);
        return cell;
    }

    function stopWorkerJobTimer() {
        if (workerJobTimerInterval) {
            window.clearInterval(workerJobTimerInterval);
            workerJobTimerInterval = null;
        }
    }

    function formatWorkerCountdown(milliseconds) {
        const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return [hours, minutes, seconds].map(value => String(value).padStart(2, "0")).join(":");
    }

    function showWorkerSubmissionMessage(message, type) {
        const node = document.getElementById("workerSubmissionMessage");
        if (!node) return;
        node.textContent = message;
        node.className = "worker-submission-message " + (type || "info");
        node.hidden = false;
    }

    async function expireCurrentWorkerSubmission() {
        stopWorkerJobTimer();
        const form = document.getElementById("workerSubmissionForm");
        const submitButton = document.getElementById("submitWorkerJobButton");
        if (form) form.hidden = true;
        if (submitButton) submitButton.hidden = true;
        const timer = document.getElementById("workerJobCountdown");
        if (timer) timer.textContent = "00:00:00";
        const status = document.getElementById("detailJobStatus");
        if (status) {
            status.textContent = "Expired";
            status.className = "job-status expired";
        }
        showWorkerSubmissionMessage("Time is over. This job has expired and can no longer be submitted.", "error");
        try {
            // Expiry is performed by the server-side function so workers do not
            // need direct permission to change job_submissions into "expired".
            const { error } = await supabaseClient.rpc("expire_submissions");
            if (error) throw error;
        } catch (error) {
            // Do not fall back to a client-side UPDATE: the worker RLS policy
            // intentionally allows only in_progress -> submitted.
            console.error("Could not expire worker submission through the server function:", error);
        }
        window.setTimeout(() => showPageSection("dashboardSection"), 1400);
    }

    function startWorkerJobCountdown(submission) {
        stopWorkerJobTimer();
        const timer = document.getElementById("workerJobCountdown");
        const form = document.getElementById("workerSubmissionForm");
        const submitButton = document.getElementById("submitWorkerJobButton");
        const deadline = new Date(submission.expires_at).getTime();

        const tick = () => {
            const remaining = deadline - Date.now();
            if (timer) timer.textContent = formatWorkerCountdown(remaining);
            if (remaining <= 0) {
                expireCurrentWorkerSubmission();
                return;
            }
            if (form) form.hidden = false;
            if (submitButton) submitButton.hidden = false;
        };
        tick();
        if (deadline > Date.now()) workerJobTimerInterval = window.setInterval(tick, 1000);
    }

    function openJobDetails(jobId, submission) {
        const job = publicJobs.find(item => item.id === jobId) || activeWorkerJob;
        if (!job) return;
        activeWorkerJob = job;
        activeWorkerSubmission = submission || activeWorkerSubmission;
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
            statusNode.textContent = activeWorkerSubmission?.status === "submitted" ? "Submitted" : "In Progress";
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
        const form = document.getElementById("workerSubmissionForm");
        const submitButton = document.getElementById("submitWorkerJobButton");
        const messageNode = document.getElementById("workerSubmissionMessage");
        if (messageNode) messageNode.hidden = true;
        const proofText = document.getElementById("workerProofText");
        const proofUrl = document.getElementById("workerProofFileUrl");
        if (proofText) proofText.value = activeWorkerSubmission?.proof_text || "";
        if (proofUrl) proofUrl.value = activeWorkerSubmission?.proof_file_url || "";
        if (activeWorkerSubmission?.status === "in_progress") {
            if (form) form.hidden = false;
            if (submitButton) submitButton.hidden = false;
            startWorkerJobCountdown(activeWorkerSubmission);
        } else {
            stopWorkerJobTimer();
            if (form) form.hidden = true;
            if (submitButton) submitButton.hidden = true;
            const timer = document.getElementById("workerJobCountdown");
            if (timer) timer.textContent = activeWorkerSubmission?.status === "submitted" ? "Submitted" : "--:--:--";
            if (activeWorkerSubmission?.status === "submitted") {
                showWorkerSubmissionMessage("Job Successfully Submitted. Your submission is waiting for advertiser review.", "success");
            }
        }
        showPageSection("jobDetailsSection");
    }

    async function startWorkerJob(jobId) {
        const job = publicJobs.find(item => item.id === jobId);
        if (!job || !currentUser) return;
        const button = document.querySelector('[data-start-job="' + jobId + '"]');
        if (button) { button.disabled = true; button.textContent = "Starting..."; }
        try {
            const { data: existingRows, error: existingError } = await supabaseClient.from("job_submissions")
                .select("id,job_id,worker_id,status,started_at,expires_at,proof_text,proof_file_url,submitted_at")
                .eq("job_id", jobId)
                .eq("worker_id", currentUser.id)
                .order("created_at", { ascending: false })
                .limit(1);
            if (existingError) throw existingError;
            const existing = existingRows?.[0] || null;
            if (existing?.status === "in_progress") {
                if (new Date(existing.expires_at).getTime() > Date.now()) {
                    openJobDetails(jobId, existing);
                    return;
                }
                const { error: expiryError } = await supabaseClient.rpc("expire_submissions");
                if (expiryError) throw expiryError;
            }
            if (existing && ["submitted", "approved", "completed", "rejected", "revision", "revision_required", "needs_revision"].includes(String(existing.status).toLowerCase())) {
                window.alert("You already submitted this task. Please check My Submitted Jobs for its status.");
                return;
            }

            const startedAt = new Date();
            const durationMinutes = Number(job.duration_minutes);
            if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
                throw new Error("This job has an invalid time limit. Please contact support.");
            }
            const expiresAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
            const { data: submission, error } = await supabaseClient.from("job_submissions")
                .insert({
                    job_id: job.id,
                    worker_id: currentUser.id,
                    status: "in_progress",
                    started_at: startedAt.toISOString(),
                    expires_at: expiresAt.toISOString()
                })
                .select("id,job_id,worker_id,status,started_at,expires_at,proof_text,proof_file_url,submitted_at")
                .single();
            if (error) throw error;
            activeWorkerJob = job;
            activeWorkerSubmission = submission;
            openJobDetails(jobId, submission);
        } catch (error) {
            console.error("Could not start worker job:", error);
            window.alert(error.message || "Could not start this job. Please try again.");
        } finally {
            if (button) { button.disabled = false; button.textContent = "Start Job"; }
        }
    }

    async function submitWorkerJob(event) {
        event.preventDefault();
        if (!activeWorkerSubmission || !currentUser) return;
        const submitButton = document.getElementById("submitWorkerJobButton");
        const proofText = document.getElementById("workerProofText");
        const proofUrl = document.getElementById("workerProofFileUrl");
        const message = document.getElementById("workerSubmissionMessage");
        const proof = proofText?.value.trim() || "";
        const fileUrl = proofUrl?.value.trim() || "";
        if (!proof && !fileUrl) {
            showWorkerSubmissionMessage("Please enter your work proof or a proof file link.", "error");
            return;
        }
        if (new Date(activeWorkerSubmission.expires_at).getTime() <= Date.now()) {
            await expireCurrentWorkerSubmission();
            return;
        }
        if (submitButton) { submitButton.disabled = true; submitButton.textContent = "Submitting..."; }
        if (message) message.hidden = true;
        try {
            // Let the database expire overdue attempts before accepting a submission.
            const { error: expiryError } = await supabaseClient.rpc("expire_submissions");
            if (expiryError) console.warn("Could not run expiry sweep before submit:", expiryError);
            const submittedAt = new Date().toISOString();
            const { data, error } = await supabaseClient.from("job_submissions")
                .update({
                    proof_text: proof || null,
                    proof_file_url: fileUrl || null,
                    status: "submitted",
                    submitted_at: submittedAt,
                    updated_at: submittedAt
                })
                .eq("id", activeWorkerSubmission.id)
                .eq("worker_id", currentUser.id)
                .eq("status", "in_progress")
                .gt("expires_at", submittedAt)
                .select("id,job_id,worker_id,status,started_at,expires_at,proof_text,proof_file_url,submitted_at")
                .maybeSingle();
            if (error) throw error;
            if (!data) {
                await expireCurrentWorkerSubmission();
                return;
            }
            activeWorkerSubmission = data;
            stopWorkerJobTimer();
            if (submitButton) submitButton.hidden = true;
            const form = document.getElementById("workerSubmissionForm");
            if (form) form.hidden = true;
            const status = document.getElementById("detailJobStatus");
            if (status) { status.textContent = "Submitted"; status.className = "job-status active"; }
            const timer = document.getElementById("workerJobCountdown");
            if (timer) timer.textContent = "Submitted";
            showWorkerSubmissionMessage("Job Successfully Submitted. Your submission is waiting for advertiser review.", "success");
            await loadMySubmissions();
        } catch (error) {
            console.error("Worker job submission failed:", error);
            showWorkerSubmissionMessage(error.message || "Could not submit this job. Please try again.", "error");
        } finally {
            if (submitButton && !submitButton.hidden) {
                submitButton.disabled = false;
                submitButton.textContent = "Submit Job";
            }
        }
    }

    async function restoreActiveWorkerJob() {
        const { data, error } = await supabaseClient.from("job_submissions")
            .select("id,job_id,worker_id,status,started_at,expires_at,proof_text,proof_file_url,submitted_at")
            .eq("worker_id", currentUser.id)
            .eq("status", "in_progress")
            .order("started_at", { ascending: false })
            .limit(1);
        if (error) {
            console.error("Could not restore active worker job:", error);
            return;
        }
        const submission = data?.[0];
        if (!submission) return;
        if (new Date(submission.expires_at).getTime() <= Date.now()) {
            activeWorkerSubmission = submission;
            await expireCurrentWorkerSubmission();
            return;
        }
        let job = publicJobs.find(item => item.id === submission.job_id);
        if (!job) {
            const { data: jobData, error: jobError } = await supabaseClient.from("jobs")
                .select("id,advertiser_id,category_id,title,description,instructions,target_url,proof_requirements,extra_instructions,reward_per_worker,total_slots,duration_minutes,currency,status,created_at,remaining_budget,target_country")
                .eq("id", submission.job_id)
                .maybeSingle();
            if (jobError) {
                console.error("Could not load active worker job details:", jobError);
                return;
            }
            job = jobData;
        }
        if (!job) return;
        activeWorkerJob = job;
        openJobDetails(job.id, submission);
    }

    const workerSubmissionForm = document.getElementById("workerSubmissionForm");
    if (workerSubmissionForm) workerSubmissionForm.addEventListener("submit", submitWorkerJob);


    function renderDashboardRecentJobs(jobs) {
        const list = document.getElementById("dashboardRecentJobsList");
        const empty = document.getElementById("dashboardRecentJobsEmpty");
        if (!list || !empty) return;

        list.replaceChildren();
        const rows = Array.isArray(jobs) ? jobs.slice(0, 20) : [];

        rows.forEach(job => {
            const row = document.createElement("article");
            row.className = "job-table-row job-list-item dashboard-recent-job-row";
            row.dataset.jobId = job.id;
            row.style.setProperty("--job-card-background", "#ffffff");

            const nameCell = document.createElement("div");
            nameCell.className = "job-table-cell job-name-cell";
            const name = document.createElement("span");
            name.className = "job-name-link dashboard-recent-job-name";
            name.textContent = job.title || "Untitled Job";
            nameCell.appendChild(name);
            row.appendChild(nameCell);

            row.appendChild(createJobCell(
                "job-payment-cell",
                formatWalletMoney(job.reward_per_worker, job.currency || "USD")
            ));
            row.appendChild(createJobCell("", formatJobDuration(job.duration_minutes)));
            row.appendChild(createJobCell("job-buyer-pay-time-cell", "—"));
            row.appendChild(createJobCell("job-completed-cell", String(Number(job.total_slots || 0))));

            const actionCell = document.createElement("div");
            actionCell.className = "job-table-cell dashboard-recent-job-action";
            const viewButton = document.createElement("button");
            viewButton.type = "button";
            viewButton.className = "job-view-button";
            viewButton.dataset.startJob = job.id;
            viewButton.textContent = "Start Job";
            actionCell.appendChild(viewButton);
            row.appendChild(actionCell);

            list.appendChild(row);
        });

        empty.hidden = rows.length > 0;
    }

    async function loadFindJobs() {
        const { data, error } = await supabaseClient.from("jobs")
            .select("id,advertiser_id,category_id,title,description,instructions,target_url,proof_requirements,extra_instructions,reward_per_worker,total_slots,duration_minutes,currency,status,created_at,remaining_budget,target_country")
            .eq("status", "active")
            .gt("remaining_budget", 0)
            .order("created_at", { ascending: false });
        if (error) throw error;
        publicJobs = (data || []).filter(job =>
            isJobAvailableInCountry(job.target_country, currentUserCountry)
        );

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
            row.dataset.category = normalizeJobCategory(category?.slug || category?.name);
            row.dataset.reward = String(Number(job.reward_per_worker) || 0);
            row.dataset.date = job.created_at || "";
            row.style.setProperty("--job-card-background", "#ffffff");

            const nameCell = document.createElement("div");
            nameCell.className = "job-table-cell job-name-cell";
            const nameButton = document.createElement("button");
            nameButton.type = "button";
            nameButton.className = "job-name-link";
            nameButton.dataset.startJob = job.id;
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
            viewButton.dataset.startJob = job.id;
            viewButton.textContent = "Start Job";
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
            const trigger = event.target.closest("[data-start-job]");
            if (trigger) startWorkerJob(trigger.dataset.startJob);
        });
    }

    const findJobsList = document.getElementById("jobList");
    if (findJobsList) {
        findJobsList.addEventListener("click", event => {
            const trigger = event.target.closest("[data-start-job]");
            if (trigger) startWorkerJob(trigger.dataset.startJob);
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

    function renderPostedJobReviewPanel(job, submissions) {
        const panel = document.createElement("section");
        panel.className = "posted-job-review-panel";
        panel.dataset.jobId = job.id;

        const heading = document.createElement("div");
        heading.className = "posted-job-review-heading";
        const title = document.createElement("h3");
        title.textContent = "Worker Submissions";
        const summary = document.createElement("span");
        const pendingCount = submissions.filter(item => item.status === "submitted").length;
        const approvedCount = submissions.filter(item => item.status === "approved").length;
        summary.textContent = pendingCount + " pending review · " + approvedCount + " approved";
        heading.append(title, summary);
        panel.appendChild(heading);

        if (!submissions.length) {
            const empty = document.createElement("p");
            empty.className = "posted-job-review-empty";
            empty.textContent = "No workers have started or submitted this job yet.";
            panel.appendChild(empty);
            return panel;
        }

        submissions.forEach(submission => {
            const card = document.createElement("article");
            card.className = "posted-submission-card";
            const top = document.createElement("div");
            top.className = "posted-submission-top";
            const worker = document.createElement("strong");
            worker.textContent = "Worker " + String(submission.worker_id || "").slice(0, 8);
            const status = document.createElement("span");
            status.className = "posted-submission-status " +
                (submission.status === "submitted" ? "pending" :
                 submission.status === "approved" ? "approved" :
                 submission.status === "rejected" ? "rejected" : "other");
            status.textContent = String(submission.status || "unknown").replaceAll("_", " ");
            top.append(worker, status);
            card.appendChild(top);

            const submittedAt = document.createElement("p");
            submittedAt.className = "posted-submission-date";
            submittedAt.textContent = submission.submitted_at
                ? "Submitted " + new Date(submission.submitted_at).toLocaleString()
                : "Started " + (submission.started_at ? new Date(submission.started_at).toLocaleString() : "—");
            card.appendChild(submittedAt);

            if (submission.proof_text) {
                const proof = document.createElement("p");
                proof.className = "posted-submission-proof";
                proof.textContent = submission.proof_text;
                card.appendChild(proof);
            }
            if (submission.proof_file_url) {
                const link = document.createElement("a");
                link.className = "posted-submission-proof-link";
                link.href = submission.proof_file_url;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = "Open submitted proof";
                card.appendChild(link);
            }
            if (submission.review_note) {
                const note = document.createElement("p");
                note.className = "posted-submission-review-note";
                note.textContent = "Review note: " + submission.review_note;
                card.appendChild(note);
            }

            if (submission.status === "submitted") {
                const actions = document.createElement("div");
                actions.className = "posted-submission-actions";
                const approve = document.createElement("button");
                approve.type = "button";
                approve.className = "posted-submission-approve";
                approve.textContent = "Approve & Pay";
                approve.addEventListener("click", () => reviewPostedSubmission(submission.id, "approve"));
                const reject = document.createElement("button");
                reject.type = "button";
                reject.className = "posted-submission-reject";
                reject.textContent = "Reject";
                reject.addEventListener("click", () => reviewPostedSubmission(submission.id, "reject"));
                actions.append(approve, reject);
                card.appendChild(actions);
            }
            panel.appendChild(card);
        });
        return panel;
    }

    async function reviewPostedSubmission(submissionId, decision) {
        const isApprove = decision === "approve";
        const confirmation = isApprove
            ? "Approve this worker's submission and release the full reward from the job's held balance?"
            : "Reject this worker's submission?";
        if (!window.confirm(confirmation)) return;

        let reviewNote = null;
        if (!isApprove) {
            reviewNote = window.prompt("Optional rejection reason for the worker:", "The submitted proof does not meet the job requirements.");
            if (reviewNote === null) return;
            reviewNote = reviewNote.trim() || "The submitted proof does not meet the job requirements.";
        }

        const rpcName = isApprove ? "approve_submission" : "reject_submission";
        const { error } = await supabaseClient.rpc(rpcName, {
            p_submission_id: submissionId,
            p_review_note: reviewNote
        });
        if (error) {
            console.error("Submission review failed:", error);
            window.alert(error.message || "Could not review this submission. Please try again.");
            return;
        }

        await Promise.all([
            loadMyPostedJobs(),
            loadMyWallet(),
            loadMyTotalEarnings()
        ]);
        window.alert(isApprove
            ? "Submission approved. The worker's full reward has been credited."
            : "Submission rejected. The worker has been notified through the submission status.");
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

            const jobSubmissions = postedSubmissionsCache.filter(item => item.job_id === job.id);
            const approvedCount = jobSubmissions.filter(item => item.status === "approved").length;
            const pendingCount = jobSubmissions.filter(item => item.status === "submitted").length;

            const name = document.createElement("span");
            name.className = "job-table-cell job-name-cell";
            name.textContent = (category?.name || "Uncategorized") + " · " + (job.title || "Untitled Job");
            name.title = [name.textContent, job.admin_review_note || ""].filter(Boolean).join(" — ");
            row.appendChild(name);

            row.appendChild(createJobCell("job-payment-cell", formatWalletMoney(job.reward_per_worker, job.currency || "USD")));

            const completed = document.createElement("span");
            // Completed counts only submissions that the advertiser has approved and paid.
            // Pending submissions are counted separately in the Review action.
            completed.className = "job-table-cell job-completed-cell " + (approvedCount > 0 ? "has-approved" : "");
            completed.textContent = approvedCount + " / " + Number(job.total_slots || 0);
            completed.title = approvedCount + " approved and paid · " + pendingCount + " awaiting review";
            row.appendChild(completed);

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

            const actions = document.createElement("div");
            actions.className = "posted-job-actions";
            const edit = document.createElement("button");
            edit.type = "button";
            edit.className = "job-view-button posted-job-edit-button";
            edit.textContent = "Edit";
            edit.setAttribute("aria-label", "Edit " + (job.title || "job"));
            edit.addEventListener("click", () => openPostedJobEditor(job.id, row));
            actions.appendChild(edit);
            row.appendChild(actions);

            const reviewCell = document.createElement("div");
            reviewCell.className = "posted-job-review-cell";
            const review = document.createElement("button");
            review.type = "button";
            review.className = "posted-job-review-button";
            review.innerHTML = '<strong>' + pendingCount + '</strong><span>' +
                (pendingCount === 1 ? 'Submitted' : 'Submitted') + '</span>';
            review.setAttribute("aria-label", "Review " + pendingCount + " submitted jobs for " + (job.title || "job"));
            review.addEventListener("click", () => {
                const existingPanel = row.nextElementSibling;
                if (existingPanel?.classList.contains("posted-job-review-panel")) {
                    existingPanel.hidden = !existingPanel.hidden;
                    return;
                }
                const panel = renderPostedJobReviewPanel(job, jobSubmissions);
                row.insertAdjacentElement("afterend", panel);
            });
            reviewCell.appendChild(review);
            row.appendChild(reviewCell);

            list.appendChild(row);
        });
        applyPostedJobStatusFilter();
    }

    function applyPostedJobStatusFilter() {
        const list = document.getElementById("postedJobsList");
        const activeTab = document.querySelector("#myPostedJobsSection .job-tab.active");
        const selected = activeTab?.dataset.status || "all";
        if (!list) return;
        list.querySelectorAll(".job-list-item").forEach(card => {
            card.hidden = selected !== "all" && card.dataset.status !== selected;
        });
    }

    function openPostedJobEditor(jobId, row) {
        const job = postedJobsCache.find(item => item.id === jobId);
        if (!job) return;
        const existing = row.nextElementSibling;
        if (existing?.classList.contains("posted-job-edit-panel")) {
            existing.remove();
            return;
        }
        document.querySelectorAll("#postedJobsList .posted-job-edit-panel").forEach(panel => panel.remove());
        const panel = document.createElement("section");
        panel.className = "posted-job-edit-panel";
        panel.setAttribute("aria-label", "Edit posted job details");

        const form = document.createElement("form");
        form.className = "posted-job-edit-form";
        form.addEventListener("submit", async event => {
            event.preventDefault();
            await savePostedJobChanges(job, form, panel);
        });

        const heading = document.createElement("div");
        heading.className = "posted-job-edit-heading";
        const title = document.createElement("h2");
        title.textContent = "Edit Posted Job";
        const close = document.createElement("button");
        close.type = "button";
        close.className = "posted-job-edit-close";
        close.textContent = "×";
        close.setAttribute("aria-label", "Close editor");
        close.addEventListener("click", () => panel.remove());
        heading.append(title, close);
        form.appendChild(heading);

        const info = document.createElement("p");
        info.className = "posted-job-edit-note";
        info.textContent = "Job details are shown below. Reward per worker cannot be reduced or changed. You can only increase the worker count.";
        form.appendChild(info);

        const grid = document.createElement("div");
        grid.className = "posted-job-edit-grid";
        const addReadOnly = (labelText, value, multiline = false) => {
            const wrap = document.createElement("label");
            wrap.className = "posted-job-edit-field" + (multiline ? " full" : "");
            const label = document.createElement("span");
            label.textContent = labelText;
            const control = multiline ? document.createElement("textarea") : document.createElement("input");
            if (multiline) control.rows = 3;
            else control.type = "text";
            control.value = value == null || value === "" ? "—" : String(value);
            control.readOnly = true;
            wrap.append(label, control);
            grid.appendChild(wrap);
        };
        const category = getJobCategory(job);
        addReadOnly("Category", category?.name || "Uncategorized");
        addReadOnly("Job title", job.title);
        addReadOnly("Reward per worker", formatWalletMoney(job.reward_per_worker, job.currency || "USD"));
        addReadOnly("Job duration", formatJobDuration(job.duration_minutes));
        addReadOnly("Description", job.description, true);
        addReadOnly("Proof requirements", job.proof_requirements, true);
        form.appendChild(grid);

        const currentSlots = Math.max(0, Number(job.total_slots) || 0);
        const canIncrease = ["active", "paused"].includes(String(job.status || "").toLowerCase());
        const slotsLabel = document.createElement("label");
        slotsLabel.className = "posted-job-edit-field";
        const slotsCaption = document.createElement("span");
        slotsCaption.textContent = "Total workers (can only increase)";
        const slotsInput = document.createElement("input");
        slotsInput.type = "number";
        slotsInput.min = String(currentSlots);
        slotsInput.step = "1";
        slotsInput.required = true;
        slotsInput.value = String(currentSlots);
        slotsInput.disabled = !canIncrease;
        slotsLabel.append(slotsCaption, slotsInput);
        form.appendChild(slotsLabel);

        const statusLabel = document.createElement("label");
        statusLabel.className = "posted-job-edit-field";
        const statusCaption = document.createElement("span");
        statusCaption.textContent = "Job status";
        const statusSelect = document.createElement("select");
        const normalizedStatus = String(job.status || "").toLowerCase();
        const statusOptions = canIncrease
            ? ["active", "paused", "completed", "rejected"]
            : [normalizedStatus];
        statusOptions.forEach(value => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value.replaceAll("_", " ").replace(/^./, c => c.toUpperCase());
            statusSelect.appendChild(option);
        });
        statusSelect.value = normalizedStatus;
        statusSelect.disabled = !canIncrease;
        statusLabel.append(statusCaption, statusSelect);
        form.appendChild(statusLabel);

        if (!canIncrease) {
            const lockNote = document.createElement("p");
            lockNote.className = "posted-job-edit-note";
            lockNote.textContent = normalizedStatus === "pending_review" || normalizedStatus === "pending"
                ? "This job must be approved by an administrator before it can be activated or expanded."
                : "This job is not editable because it is not active or paused.";
            form.appendChild(lockNote);
        }

        const cost = document.createElement("div");
        cost.className = "posted-job-edit-cost";
        const rewardLine = document.createElement("p");
        const feeLine = document.createElement("p");
        const totalLine = document.createElement("strong");
        cost.append(rewardLine, feeLine, totalLine);
        form.appendChild(cost);

        const message = document.createElement("p");
        message.className = "posted-job-edit-message";
        message.setAttribute("role", "status");
        form.appendChild(message);

        const actions = document.createElement("div");
        actions.className = "posted-job-edit-actions";
        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.className = "secondary-button";
        cancel.textContent = "Cancel";
        cancel.addEventListener("click", () => panel.remove());
        const save = document.createElement("button");
        save.type = "submit";
        save.className = "primary-button";
        save.textContent = "Save Changes";
        save.disabled = !canIncrease;
        actions.append(cancel, save);
        form.appendChild(actions);
        panel.appendChild(form);
        row.insertAdjacentElement("afterend", panel);

        const updateEstimate = () => {
            const newSlots = Number.parseInt(slotsInput.value, 10);
            const extraSlots = Number.isInteger(newSlots) && newSlots > currentSlots ? newSlots - currentSlots : 0;
            const extraReward = extraSlots * (Number(job.reward_per_worker) || 0);
            const extraFee = Math.round(extraReward * 15) / 100;
            rewardLine.textContent = "Additional worker rewards: " + formatWalletMoney(extraReward, job.currency || "USD");
            feeLine.textContent = "Additional 15% platform fee: " + formatWalletMoney(extraFee, job.currency || "USD");
            totalLine.textContent = "Additional payment (no color fee): " + formatWalletMoney(extraReward + extraFee, job.currency || "USD");
        };
        slotsInput.addEventListener("input", updateEstimate);
        updateEstimate();
        panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    async function savePostedJobChanges(job, form, panel) {
        const slotsInput = form.querySelector('input[type="number"]');
        const statusSelect = form.querySelector("select");
        const save = form.querySelector('button[type="submit"]');
        const message = form.querySelector(".posted-job-edit-message");
        const oldSlots = Number(job.total_slots) || 0;
        const newSlots = Number.parseInt(slotsInput?.value, 10);
        const newStatus = statusSelect?.value || job.status;
        if (!Number.isInteger(newSlots) || newSlots < oldSlots) {
            message.textContent = "Worker count cannot be reduced.";
            message.dataset.type = "error";
            return;
        }
        if (newSlots === oldSlots && newStatus === job.status) {
            panel.remove();
            return;
        }
        if (!["active", "paused"].includes(String(job.status || "").toLowerCase())) {
            message.textContent = "Only administrator-approved active or paused jobs can be edited.";
            message.dataset.type = "error";
            return;
        }
        save.disabled = true;
        save.textContent = "Saving...";
        message.textContent = "";
        try {
            const { error } = await supabaseClient.rpc("update_advertiser_job_with_funding", {
                p_job_id: job.id,
                p_new_total_slots: newSlots,
                p_new_status: newStatus
            });
            if (error) throw error;
            await Promise.all([loadMyPostedJobs(), loadMyWallet(), loadFindJobs()]);
            panel.remove();
        } catch (error) {
            console.error("Posted job update failed:", error);
            message.textContent = error.message || "Could not update this job.";
            message.dataset.type = "error";
        } finally {
            save.disabled = false;
            save.textContent = "Save Changes";
        }
    }

    function renderDashboardMyRecentPostedJobs(jobs) {
        const list = document.getElementById("dashboardMyRecentPostedJobsList");
        const empty = document.getElementById("dashboardMyRecentPostedJobsEmpty");
        if (!list || !empty) return;

        list.replaceChildren();
        const rows = Array.isArray(jobs) ? jobs.slice(0, 5) : [];
        rows.forEach(job => {
            const category = getJobCategory(job);
            const row = document.createElement("article");
            row.className = "job-table-row dashboard-my-posted-job-row";
            row.style.setProperty("--job-card-background", "#ffffff");

            const title = document.createElement("span");
            title.className = "job-table-cell job-name-cell";
            title.textContent = (category?.name || "Uncategorized") + " · " + (job.title || "Untitled Job");
            row.appendChild(title);
            row.appendChild(createJobCell("job-completed-cell", String(Number(job.total_slots || 0))));
            row.appendChild(createJobCell("job-completed-cell", "—"));

            const status = document.createElement("span");
            const normalized = uiStatus(job.status);
            status.className = "posted-job-status " +
                (normalized === "pending_review" || normalized === "pending" ? "pending" :
                 normalized === "active" ? "active" :
                 normalized === "rejected" ? "rejected" : "other");
            status.textContent = normalized === "pending_review" ? "Pending" :
                String(normalized || "Unknown").replaceAll("_", " ");
            row.appendChild(status);

            const action = document.createElement("button");
            action.type = "button";
            action.className = "job-view-button";
            action.textContent = "Manage";
            action.addEventListener("click", () => {
                document.querySelector('[data-section="myPostedJobsSection"]')?.click();
            });
            row.appendChild(action);
            list.appendChild(row);
        });
        empty.hidden = rows.length > 0;
    }

    async function loadMyStatistics() {
        const statusNode = document.getElementById("statisticsStatus");
        if (!supabaseClient || !currentUser) return;
        if (statusNode) statusNode.textContent = "Loading your statistics...";
        const escapeText = value => String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[char]));
        const dateText = value => {
            if (!value) return "Date unavailable";
            const date = new Date(value);
            return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString();
        };
        const statusText = value => ({
            approved: "Approved", completed: "Completed", submitted: "Pending Review",
            in_progress: "In Progress", rejected: "Rejected", revision: "Revision Required",
            revision_required: "Revision Required", needs_revision: "Revision Required", expired: "Expired"
        }[String(value || "").toLowerCase()] || String(value || "Unknown").replace(/_/g, " "));
        try {
            const [postedResult, workerResult] = await Promise.all([
                supabaseClient.from("jobs").select("id,title,status,created_at,reward_per_worker,currency")
                    .eq("advertiser_id", currentUser.id).order("created_at", { ascending: false }),
                supabaseClient.from("job_submissions").select("id,job_id,status,submitted_at,created_at,started_at")
                    .eq("worker_id", currentUser.id).order("created_at", { ascending: false })
            ]);
            if (postedResult.error) throw postedResult.error;
            if (workerResult.error) throw workerResult.error;
            const posted = postedResult.data || [];
            const work = workerResult.data || [];
            const statuses = work.map(row => String(row.status || "").toLowerCase());
            const completed = statuses.filter(status => status === "approved" || status === "completed").length;
            const submitted = statuses.filter(status => !["in_progress", "expired"].includes(status)).length;
            const pending = statuses.filter(status => status === "submitted").length;
            const active = statuses.filter(status => status === "in_progress").length;
            const rejected = statuses.filter(status => status === "rejected").length;
            const setCount = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = String(value); };
            setCount("statJobsPosted", posted.length);
            setCount("statTasksCompleted", completed);
            setCount("statSubmissions", submitted);
            setCount("statPending", pending);
            setCount("statInProgress", active);
            setCount("statRejected", rejected);

            const jobIds = [...new Set(work.map(row => row.job_id).filter(Boolean))];
            let jobsById = {};
            if (jobIds.length) {
                const { data: linkedJobs, error: linkedError } = await supabaseClient.from("jobs")
                    .select("id,title").in("id", jobIds);
                if (linkedError) throw linkedError;
                jobsById = Object.fromEntries((linkedJobs || []).map(job => [job.id, job]));
            }
            const postedNode = document.getElementById("statisticsPostedJobs");
            const workNode = document.getElementById("statisticsWorkerHistory");
            if (postedNode) postedNode.innerHTML = posted.length ? posted.map(job =>
                '<div class="statistics-history-row"><div><strong>' + escapeText(job.title || "Untitled job") +
                '</strong><small>' + escapeText(dateText(job.created_at)) + '</small></div><span class="statistics-status-pill">' +
                escapeText(statusText(job.status)) + '</span></div>'
            ).join("") : '<p class="statistics-empty">You have not posted any jobs yet.</p>';
            if (workNode) workNode.innerHTML = work.length ? work.map(row => {
                const job = jobsById[row.job_id];
                return '<div class="statistics-history-row"><div><strong>' +
                    escapeText(job?.title || "Task submission") + '</strong><small>' +
                    escapeText(dateText(row.submitted_at || row.created_at || row.started_at)) +
                    '</small></div><span class="statistics-status-pill" data-status="' +
                    escapeText(String(row.status || "").toLowerCase()) + '">' +
                    escapeText(statusText(row.status)) + '</span></div>';
            }).join("") : '<p class="statistics-empty">You have no work history yet.</p>';
            if (statusNode) statusNode.textContent = "Statistics updated from your TaskBridge account.";
        } catch (error) {
            console.error("My Statistics load failed:", error);
            if (statusNode) statusNode.textContent = error.message || "Could not load your account statistics.";
            ["statisticsPostedJobs", "statisticsWorkerHistory"].forEach(id => {
                const node = document.getElementById(id);
                if (node) node.innerHTML = '<p class="statistics-empty">History could not be loaded. Please try again.</p>';
            });
        }
    }

    async function loadMyPostedJobs() {
        const { data, error } = await supabaseClient.from("jobs")
            .select("*")
            .eq("advertiser_id", currentUser.id)
            .order("created_at", { ascending: false });
        if (error) throw error;
        const jobs = data || [];
        postedJobsCache = jobs;

        const jobIds = jobs.map(job => job.id);
        if (jobIds.length) {
            const { data: submissions, error: submissionsError } = await supabaseClient.from("job_submissions")
                .select("id,job_id,worker_id,status,proof_text,proof_file_url,started_at,submitted_at,review_note,created_at")
                .in("job_id", jobIds)
                .order("submitted_at", { ascending: false, nullsFirst: false });
            if (submissionsError) {
                console.error("Could not load advertiser job submissions:", submissionsError);
                postedSubmissionsCache = [];
            } else {
                postedSubmissionsCache = submissions || [];
            }
        } else {
            postedSubmissionsCache = [];
        }

        updatePostedJobStats(jobs);
        const postedCount = document.getElementById("dashboardJobsPosted");
        if (postedCount) postedCount.textContent = String(jobs.length);
        renderPostedJobs(jobs);
        renderDashboardMyRecentPostedJobs(jobs);
    }

    async function loadMySubmissions() {
        // Mark overdue attempts expired before rendering the worker task list.
        const { error: expiryError } = await supabaseClient.rpc("expire_submissions");
        if (expiryError) console.warn("Could not expire overdue worker attempts:", expiryError);
        const { data, error } = await supabaseClient.from("job_submissions")
            .select("id,job_id,worker_id,status,proof_text,proof_file_url,started_at,expires_at,submitted_at,review_note,created_at")
            .eq("worker_id", currentUser.id)
            .order("submitted_at", { ascending: false, nullsFirst: false });
        if (error) {
            console.error("Could not load worker submission history:", error);
            ["workerTotalSubmitted","workerPendingReview","workerApproved","workerRejected","workerRevisionRequired"].forEach(id => {
                const node = document.getElementById(id);
                if (node) node.textContent = "—";
            });
            return;
        }

        // Keep live attempts visible so workers can reopen tasks they have already started.
        // Expired, unsubmitted attempts stay hidden and can be restarted from Find a Job.
        const finalSubmissionStatuses = ["submitted","approved","completed","rejected","revision","revision_required","needs_revision"];
        const submissions = (data || []).filter(item => {
            const status = String(item.status || "").toLowerCase();
            if (status === "in_progress") return new Date(item.expires_at).getTime() > Date.now();
            return finalSubmissionStatuses.includes(status);
        });
        const statuses = submissions.map(item => String(item.status || "").toLowerCase());
        const pending = statuses.filter(status => status === "submitted").length;
        const approved = statuses.filter(status => ["approved","completed"].includes(status)).length;
        const rejected = statuses.filter(status => status === "rejected").length;
        const revision = statuses.filter(status => ["revision","revision_required","needs_revision"].includes(status)).length;

        const counts = {
            workerTotalSubmitted: submissions.filter(item => ["submitted","approved","completed","rejected","revision","revision_required","needs_revision"].includes(String(item.status || "").toLowerCase())).length,
            workerPendingReview: pending,
            workerApproved: approved,
            workerRejected: rejected,
            workerRevisionRequired: revision
        };
        Object.entries(counts).forEach(([id, value]) => {
            const node = document.getElementById(id);
            if (node) node.textContent = String(value);
        });

        const jobIds = [...new Set(submissions.map(item => item.job_id).filter(Boolean))];
        let jobsById = {};
        if (jobIds.length) {
            const { data: jobs, error: jobsError } = await supabaseClient.from("jobs")
                .select("id,title,description,instructions,target_url,proof_requirements,extra_instructions,reward_per_worker,currency,duration_minutes,buyer_payment_days")
                .in("id", jobIds);
            if (jobsError) console.error("Could not load submission job details:", jobsError);
            else jobsById = Object.fromEntries((jobs || []).map(job => [job.id, job]));
        }
        renderWorkerSubmissionHistory(submissions, jobsById);
        const submittedNode = document.getElementById("dashboardJobsSubmitted");
        const completedNode = document.getElementById("dashboardJobsCompleted");
        if (submittedNode) submittedNode.textContent = String(counts.workerTotalSubmitted);
        if (completedNode) completedNode.textContent = String(approved);
    }

    function renderWorkerSubmissionHistory(submissions, jobsById) {
        const container = document.getElementById("workerSubmissionsList");
        const empty = document.getElementById("workerSubmissionsEmpty");
        if (!container || !empty) return;
        container.replaceChildren();
        empty.hidden = submissions.length > 0;

        submissions.forEach(submission => {
            const status = String(submission.status || "unknown").toLowerCase();
            const job = jobsById[submission.job_id] || {};
            const isPaid = ["approved","completed"].includes(status);
            const isRejected = status === "rejected";
            const isPending = status === "submitted";
            const isRevision = ["revision","revision_required","needs_revision"].includes(status);
            const isInProgress = status === "in_progress";
            const filterStatus = isInProgress ? "in_progress" : isPending ? "pending" : isPaid ? "approved" :
                isRevision ? "revision" : status;

            const card = document.createElement("article");
            card.className = "worker-submission-history-card job-list-item";
            card.dataset.status = filterStatus;

            const titleCell = document.createElement("div");
            titleCell.className = "worker-history-cell worker-history-job";
            titleCell.dataset.label = "Job Name";
            const title = document.createElement("strong");
            title.textContent = job.title || "Task submission";
            const jobId = document.createElement("small");
            jobId.textContent = "Job ID: " + submission.job_id;
            titleCell.append(title, jobId);

            const paymentCell = document.createElement("div");
            paymentCell.className = "worker-history-cell worker-history-payment";
            paymentCell.dataset.label = "Payment";
            const payment = document.createElement("strong");
            payment.textContent = formatWalletMoney(job.reward_per_worker || 0, job.currency || "USD");
            paymentCell.appendChild(payment);

            const statusCell = document.createElement("div");
            statusCell.className = "worker-history-cell";
            statusCell.dataset.label = "Status";
            const badge = document.createElement("span");
            badge.className = "worker-submission-history-status " +
                (isPending ? "pending" : isPaid ? "approved" : isRejected ? "rejected" : isRevision ? "revision" : "other");
            badge.textContent = isInProgress ? "In Progress" : isPending ? "Pending Review" : isPaid ? "Paid · Completed" :
                isRejected ? "Rejected" : isRevision ? "Revision Required" : status.replaceAll("_"," ");
            statusCell.appendChild(badge);

            const timingCell = document.createElement("div");
            timingCell.className = "worker-history-cell worker-history-timing";
            timingCell.dataset.label = "Payment Time";
            const timing = document.createElement("strong");
            if (isInProgress) {
                const remaining = Math.max(0, new Date(submission.expires_at).getTime() - Date.now());
                timing.textContent = remaining > 0 ? "Time left: " + formatWorkerCountdown(remaining) : "Expired";
            } else if (isPaid) {
                timing.textContent = "Paid";
            } else if (isRejected) {
                timing.textContent = "Not payable";
            } else if (isRevision) {
                timing.textContent = "Review required";
            } else {
                const submittedAt = submission.submitted_at ? new Date(submission.submitted_at) : null;
                if (submittedAt && !Number.isNaN(submittedAt.getTime())) {
                    const paymentDays = Math.min(15, Math.max(1, Number.parseInt(job.buyer_payment_days, 10) || 7));
                    const deadline = new Date(submittedAt.getTime() + paymentDays * 24 * 60 * 60 * 1000);
                    const remaining = Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
                    timing.textContent = remaining > 0 ? "Within " + remaining + " day(s)" : "Payment deadline reached";
                } else {
                    const paymentDays = Math.min(15, Math.max(1, Number.parseInt(job.buyer_payment_days, 10) || 7));
                    timing.textContent = "Within " + paymentDays + " days";
                }
            }
            timingCell.appendChild(timing);

            const viewCell = document.createElement("div");
            viewCell.className = "worker-history-cell worker-history-view";
            viewCell.dataset.label = "View";
            const viewButton = document.createElement("button");
            viewButton.type = "button";
            viewButton.className = "worker-submission-view-button";
            viewButton.textContent = isInProgress ? "Open Task" : "View";
            viewButton.setAttribute("aria-expanded", "false");
            viewCell.appendChild(viewButton);

            const details = document.createElement("div");
            details.className = "worker-submission-history-details";
            details.hidden = true;
            const detailsHeading = document.createElement("h3");
            detailsHeading.textContent = "Task & Submission Details";
            details.appendChild(detailsHeading);

            const addDetail = (label, value, className) => {
                if (value == null || String(value).trim() === "") return;
                const block = document.createElement("div");
                block.className = "worker-history-detail-block" + (className ? " " + className : "");
                const caption = document.createElement("strong");
                caption.textContent = label;
                const content = document.createElement("p");
                content.textContent = String(value);
                block.append(caption, content);
                details.appendChild(block);
            };
            addDetail("Job ID", submission.job_id);
            addDetail("Submission ID", submission.id);
            addDetail("Job Description", job.description);
            addDetail("Instructions", job.instructions);
            addDetail("Target URL", job.target_url);
            addDetail("Proof Requirements", job.proof_requirements);
            addDetail("Additional Instructions", job.extra_instructions);
            addDetail("Your Submitted Proof", submission.proof_text);
            if (submission.proof_file_url) {
                const proofLink = document.createElement("a");
                proofLink.href = submission.proof_file_url;
                proofLink.target = "_blank";
                proofLink.rel = "noopener noreferrer";
                proofLink.className = "worker-submission-history-proof-link";
                proofLink.textContent = "Open submitted proof file";
                details.appendChild(proofLink);
            }
            addDetail("Submitted At", submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : "—");
            addDetail("Payment / Review Note", submission.review_note, isRejected ? "rejected-note" : "");
            viewButton.addEventListener("click", () => {
                if (isInProgress) {
                    const activeJob = jobsById[submission.job_id];
                    if (!activeJob) {
                        window.alert("Could not load this active task. Please refresh and try again.");
                        return;
                    }
                    activeWorkerJob = activeJob;
                    activeWorkerSubmission = submission;
                    openJobDetails(activeJob.id, submission);
                    return;
                }
                const opening = details.hidden;
                details.hidden = !opening;
                viewButton.textContent = opening ? "Close" : "View";
                viewButton.setAttribute("aria-expanded", opening ? "true" : "false");
            });

            card.append(titleCell, paymentCell, statusCell, timingCell, viewCell, details);
            container.appendChild(card);
        });
        applyWorkerSubmissionFilter();
    }

    function applyWorkerSubmissionFilter() {
        const panel = document.querySelector("#mySubmittedJobsSection .content-panel");
        const activeTab = panel?.querySelector(".job-tab.active");
        const selected = activeTab?.dataset.status || "all";
        panel?.querySelectorAll(".worker-submission-history-card").forEach(card => {
            card.hidden = selected !== "all" && card.dataset.status !== selected;
        });
    }

    async function submitNewJob() {
        const targetCountry = document.getElementById("jobTargetCountry")?.value || "Worldwide";
        const categoryId = document.getElementById("postJobCategory")?.value;
        const title = document.getElementById("jobTitle")?.value.trim();
        const description = document.getElementById("jobDescription")?.value.trim();
        const reward = Number(document.getElementById("workerReward")?.value);
        const slots = Number.parseInt(document.getElementById("workersRequired")?.value, 10);
        const duration = Number.parseInt(document.getElementById("jobDuration")?.value, 10);
        const buyerPaymentDays = Number.parseInt(document.getElementById("buyerPaymentDays")?.value, 10);
        const proofType = document.getElementById("proofType")?.value;
        const proofDetails = document.getElementById("proofInstructions")?.value.trim();

        if (!categoryRows.some(c => c.id === categoryId) || !title || !description ||
            !proofType || !Number.isFinite(reward) || reward <= 0 ||
            !Number.isInteger(slots) || slots <= 0 || !Number.isInteger(duration) || duration <= 0 ||
            !Number.isInteger(buyerPaymentDays) || buyerPaymentDays < 1 || buyerPaymentDays > 15) {
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
                // Keep the legacy database field populated from the single Job Details box.
                p_instructions: description,
                p_target_url: null,
                p_proof_requirements: proofRequirements,
                p_extra_instructions: null,
                p_reward_per_worker: reward,
                p_total_slots: slots,
                p_duration_minutes: duration,
                p_card_color: getSelectedCardColor(),
                p_target_country: targetCountry,
                p_buyer_payment_days: buyerPaymentDays
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
        supabaseClient = window.taskBridgeSupabaseClient || (window.taskBridgeSupabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            auth: { storage: authStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
        }));
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        currentUser = data?.session?.user || null;
        if (!currentUser) { window.location.replace("./login.html"); return; }

        let displayName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || "My Account";
        try {
            const { data: profileDetails, error: profileDetailsError } = await supabaseClient
                .from("user_profile_details").select("full_name,country").eq("user_id", currentUser.id).maybeSingle();
            if (!profileDetailsError && profileDetails?.full_name) displayName = profileDetails.full_name;
            if (!profileDetailsError && profileDetails?.country) {
                currentUserCountry = profileDetails.country;
            } else {
                currentUserCountry = currentUser.user_metadata?.country || "";
            }
        } catch (profileDetailsError) {
            console.warn("Could not load profile display name:", profileDetailsError);
        }
        // Keep the Dashboard account identity and SVG avatar consistent across pages.

        await loadJobCategories();
        await Promise.all([loadMyPostedJobs(), loadFindJobs(), loadMySubmissions(), loadMyTotalEarnings()]);
        await restoreActiveWorkerJob();
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
                loadMyTotalEarnings().catch(err => console.error("Total earnings refresh failed:", err));
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

        submissionsChannel = supabaseClient.channel("worker-submissions-" + currentUser.id)
            .on("postgres_changes", {
                event: "*", schema: "public", table: "job_submissions",
                filter: "worker_id=eq." + currentUser.id
            }, () => loadMySubmissions().catch(err => console.error("Submission stats refresh failed:", err)))
            .subscribe();

        supabaseClient.channel("advertiser-submissions-" + currentUser.id)
            .on("postgres_changes", {
                event: "*", schema: "public", table: "job_submissions"
            }, () => loadMyPostedJobs().catch(err => console.error("Advertiser submissions refresh failed:", err)))
            .subscribe();

        publicJobsChannel = supabaseClient.channel("public-active-jobs")
            .on("postgres_changes", {
                event: "*", schema: "public", table: "jobs"
            }, () => loadFindJobs().catch(err => console.error("Find Jobs realtime refresh failed:", err)))
            .subscribe();
    }

    populateJobCountryOptions();

    // Desktop country picker: render flags in regular HTML and open the menu downward.
    function initializeDesktopCountryPicker() {
        const select = document.getElementById("jobTargetCountry");
        if (!select || select.dataset.customPickerReady === "true") return;

        const picker = document.createElement("div");
        picker.className = "job-country-custom-picker";
        picker.innerHTML = `
            <button type="button" class="job-country-picker-trigger" aria-haspopup="listbox" aria-expanded="false">
                <span class="job-country-picker-value"></span><span class="job-country-picker-chevron" aria-hidden="true">▾</span>
            </button>
            <div class="job-country-picker-menu" role="listbox" hidden></div>
        `;
        select.insertAdjacentElement("afterend", picker);
        select.classList.add("job-country-native-select");
        const trigger = picker.querySelector(".job-country-picker-trigger");
        const valueLabel = picker.querySelector(".job-country-picker-value");
        const menu = picker.querySelector(".job-country-picker-menu");

        function syncValue() {
            const selected = select.options[select.selectedIndex];
            valueLabel.textContent = selected ? selected.textContent : "Choose a country";
            menu.querySelectorAll("[data-country-value]").forEach(item => {
                item.setAttribute("aria-selected", item.dataset.countryValue === select.value ? "true" : "false");
            });
        }

        function closeMenu() {
            menu.hidden = true;
            trigger.setAttribute("aria-expanded", "false");
            picker.classList.remove("is-open");
        }

        function addChoice(option, isGroupHeading) {
            if (isGroupHeading) {
                const heading = document.createElement("div");
                heading.className = "job-country-picker-group";
                heading.textContent = option.label;
                menu.appendChild(heading);
                return;
            }
            const item = document.createElement("button");
            item.type = "button";
            item.className = "job-country-picker-option";
            item.setAttribute("role", "option");
            item.dataset.countryValue = option.value;
            item.textContent = option.textContent;
            item.addEventListener("click", () => {
                select.value = option.value;
                select.dispatchEvent(new Event("change", { bubbles: true }));
                syncValue();
                closeMenu();
            });
            menu.appendChild(item);
        }

        Array.from(select.children).forEach(child => {
            if (child.tagName === "OPTGROUP") {
                addChoice(child, true);
                Array.from(child.children).forEach(option => addChoice(option, false));
            } else if (child.tagName === "OPTION") {
                addChoice(child, false);
            }
        });

        trigger.addEventListener("click", () => {
            const opening = menu.hidden;
            menu.hidden = !opening;
            trigger.setAttribute("aria-expanded", opening ? "true" : "false");
            picker.classList.toggle("is-open", opening);
        });
        trigger.addEventListener("keydown", event => {
            if (event.key === "Escape") closeMenu();
        });
        document.addEventListener("click", event => {
            if (!picker.contains(event.target)) closeMenu();
        });
        select.addEventListener("change", syncValue);
        syncValue();
        select.dataset.customPickerReady = "true";
    }

    initializeDesktopCountryPicker();

    /* =====================================
       DASHBOARD FOOTER INFORMATION PAGES
    ====================================== */
    function initializeFooterInfoPages() {
        const footerLinks = document.querySelectorAll(".dashboard-footer-group-links [data-footer-page]");
        if (!footerLinks.length || document.getElementById("footerInfoOverlay")) return;

        const pageContent = {
            about:{title:"About TaskBridge",html:`<p class="footer-info-eyebrow">ABOUT TASKBRIDGE</p><h2>Small tasks. Real opportunities.</h2><p>TaskBridge is a micro-task marketplace where advertisers publish clearly described tasks and workers find opportunities to earn rewards by completing eligible work.</p><h3>For workers</h3><ul><li>Explore available jobs and choose tasks that match your interests and skills.</li><li>Check the target country, category, reward, instructions and proof requirements before starting.</li><li>Complete the task honestly and submit the requested proof for review.</li><li>Track submission decisions and approved rewards through your dashboard and wallet.</li></ul><h3>Our goal</h3><p>We want task details, submission reviews and wallet activity to be clear and easy to follow for every member.</p>`},
            contact:{title:"Contact Us",html:`<p class="footer-info-eyebrow">WE ARE HERE TO HELP</p><h2>Contact the TaskBridge team</h2><p>Need help with a worker account, a job, a submission or a wallet transaction? Send our support team a clear description so we can understand the issue.</p><h3>What to include</h3><ul><li>Your account email or username (never your password).</li><li>The Job ID or submission reference, if applicable.</li><li>The transaction reference for deposit or withdrawal questions.</li><li>A short explanation and a screenshot when it helps explain the issue.</li></ul><p><a href="./support.html">Open the Help &amp; Support form</a> to contact us.</p><p class="footer-info-note">Never send your password, OTP, card PIN, CVV or recovery codes to anyone.</p>`},
            faq:{title:"Worker Frequently Asked Questions",html:`<p class="footer-info-eyebrow">WORKER QUICK GUIDE</p><h2>Frequently Asked Questions</h2><h3>How do I find a task?</h3><p>Open Find a Job, browse available listings and use the available search or category filters. Check the target country before choosing a job.</p><h3>What should I check before starting?</h3><p>Read the full job description, instructions, time limit, reward and proof requirements. Start only if you can complete the task and meet its conditions.</p><h3>How do I submit completed work?</h3><p>Follow the job's proof requirements, complete the task and submit genuine evidence through the job submission flow.</p><h3>When will my reward be credited?</h3><p>The advertiser has up to 7 days after submission to approve or reject it. If no decision is made within that period, the platform is designed to automatically approve the submission. Approved rewards are credited to your wallet.</p><h3>Where can I check my earnings?</h3><p>Open My Wallet or Transaction History to review available balance and wallet activity.</p><h3>What if a submission or payment seems incorrect?</h3><p>Contact support with the Job ID, submission details or transaction reference so the team can review it.</p><h3>How do I keep my account safe?</h3><p>Use a unique password and never share your password, OTP or recovery codes.</p>`},
            privacy:{title:"Privacy Policy",html:`<p class="footer-info-eyebrow">TASKBRIDGE · YOUR PRIVACY</p><h2>Privacy Policy</h2><p>TaskBridge uses account and activity information to provide marketplace features, support workers and advertisers, maintain wallet records and protect the platform.</p><h3>Information that may be used</h3><ul><li>Account, profile and contact details, including country information.</li><li>Jobs viewed or joined, task submissions and proof provided.</li><li>Support messages, sign-in history and security or verification events.</li><li>Wallet balances, deposits, withdrawals, rewards and transaction references.</li></ul><h3>Why information is used</h3><p>Information may be used to operate accounts, show relevant jobs, review submissions, process wallet activity, respond to support requests, prevent abuse and maintain platform security.</p><h3>Service providers and retention</h3><p>Some information may be processed by service providers that help run the platform, or disclosed when legally required. Records may be retained as needed for service operation, security, disputes and legal obligations.</p><h3>Your choices</h3><p>Keep your profile details accurate and contact support if you have a privacy question or request.</p><p class="footer-info-note">The operator's legal identity, applicable jurisdiction, exact retention periods and final data practices should be confirmed before this draft is treated as a formal legal policy.</p>`},
            terms:{title:"Terms & Conditions",html:`<p class="footer-info-eyebrow">TASKBRIDGE · MEMBER TERMS</p><h2>Terms &amp; Conditions</h2><p>By using TaskBridge, members agree to use the platform honestly, lawfully and respectfully.</p><h3>Worker responsibilities</h3><ul><li>Read each job's description, instructions, eligibility and proof requirements before starting.</li><li>Complete tasks yourself and submit genuine, accurate proof.</li><li>Do not use fake accounts, bots, copied evidence or misleading activity.</li><li>Respect privacy, intellectual property and third-party platform rules.</li></ul><h3>Job reviews and rewards</h3><p>Submissions are reviewed through the platform's approval process. The advertiser has 7 days to approve or reject a submission; where no action is taken within that period, automatic approval may apply under the platform workflow. Rewards are credited according to the recorded approval status.</p><h3>Prohibited activity</h3><p>Fraud, harassment, spam, unauthorized access, manipulation of payments or submissions, and illegal or harmful tasks are not allowed.</p><h3>Account and platform changes</h3><p>Members are responsible for account security. Features and terms may be updated as the service develops.</p><p class="footer-info-note">The operator should confirm its legal identity, governing law, dispute process and final contractual terms before publication as a binding agreement.</p>`},
            cookies:{title:"Cookie Policy",html:`<p class="footer-info-eyebrow">TASKBRIDGE · BROWSER SETTINGS</p><h2>Cookie Policy</h2><p>TaskBridge may use cookies or similar browser storage to keep the website working and remember relevant session or preference information.</p><h3>Essential storage</h3><p>Essential technologies may support sign-in sessions, account security, navigation and core dashboard features.</p><h3>Preferences and diagnostics</h3><p>Where enabled, other technologies may help remember preferences or understand website reliability and usage.</p><h3>Managing cookies</h3><p>You can review or clear cookies and site data through your browser settings. Blocking essential storage may affect sign-in or other platform features.</p><p class="footer-info-note">This draft must be checked against the actual cookies, analytics and third-party scripts used by the live website.</p>`},
            refund:{title:"Refund Policy",html:`<p class="footer-info-eyebrow">TASKBRIDGE · PAYMENT REVIEWS</p><h2>Refund Policy</h2><p>If you believe a deposit, withdrawal, job-funding charge or other wallet transaction is incorrect, contact support and request a review.</p><h3>How to request a review</h3><ul><li>Provide the transaction reference and amount.</li><li>Include the related Job ID when the transaction concerns a job.</li><li>Explain what happened and attach relevant evidence where available.</li></ul><h3>Review process</h3><p>The team may check payment status, job activity, submission or reward records and any fees already applied before determining the available next step.</p><p class="footer-info-note">Refund eligibility, deadlines and outcomes depend on the actual transaction and platform rules. The operator must confirm the final refund conditions before publication.</p>`},
            payment:{title:"Payment Policy",html:`<p class="footer-info-eyebrow">TASKBRIDGE · WALLET &amp; REWARDS</p><h2>Payment Policy</h2><p>Worker rewards and supported wallet transactions are recorded in the TaskBridge wallet. Always review the amount, currency and transaction details shown before confirming a payment action.</p><h3>Worker rewards</h3><p>After you submit completed work, the advertiser can approve or reject it within 7 days. If no decision is recorded within that period, the platform's automatic approval process may approve it. An approved reward is credited to your wallet.</p><h3>Wallet history</h3><p>Use My Wallet and Transaction History to review available balance, reward credits, deposits and withdrawals.</p><h3>Deposit and withdrawal support</h3><p>Processing may depend on the payment method and required verification. If a transaction is delayed or appears incorrect, contact support with its reference.</p><p class="footer-info-note">Supported payment methods, processing times, withdrawal limits and applicable fees should be verified against the live payment setup before this draft is finalized.</p>`},
            help:{title:"Worker Help Center",html:`<p class="footer-info-eyebrow">TASKBRIDGE · WORKER SUPPORT</p><h2>Need help with your tasks?</h2><h3>Finding jobs</h3><p>Open Find a Job and review the job title, category, target country, reward and availability before starting.</p><h3>Completing a task</h3><p>Follow every instruction and time requirement. Make sure your proof is clear, genuine and matches the requested format.</p><h3>Submission review</h3><p>Check your submission status in the dashboard. Advertisers have 7 days to respond; if they do not act within that period, the platform's automatic approval flow applies.</p><h3>Wallet questions</h3><p>Check My Wallet and Transaction History first. Include the transaction reference when contacting support about a missing or delayed credit.</p><h3>Contact support</h3><p><a href="./support.html">Open the Help &amp; Support page</a> to send your question.</p>`},
            responsible:{title:"Responsible Use Policy",html:`<p class="footer-info-eyebrow">TASKBRIDGE · FAIR &amp; SAFE WORK</p><h2>Responsible Use Policy</h2><p>TaskBridge works best when advertisers and workers act honestly, safely and respectfully.</p><h3>For workers</h3><ul><li>Complete tasks genuinely and submit truthful proof.</li><li>Do not create fake accounts, automate prohibited activity or submit copied evidence.</li><li>Do not misrepresent your location or eligibility for a job.</li><li>Never share passwords, OTPs, recovery codes or sensitive account information.</li><li>Respect the privacy, rights and rules of third-party services.</li></ul><h3>For all members</h3><p>Fraud, harassment, discrimination, spam, unauthorized access, payment manipulation and illegal or harmful requests are prohibited. Report suspicious jobs or account activity to support.</p>` }
        };

        const overlay = document.createElement("section");
        overlay.id = "footerInfoOverlay";
        overlay.className = "footer-info-overlay";
        overlay.hidden = true;
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-labelledby", "footerInfoTitle");
        overlay.innerHTML = `
            <div class="footer-info-panel" role="document">
                <div class="footer-info-topbar">
                    <button type="button" class="footer-info-close" id="footerInfoClose"><span aria-hidden="true">←</span> Close</button>
                    <h2 class="footer-info-page-title" id="footerInfoTitle">Information</h2>
                </div>
                <div class="footer-info-content" id="footerInfoContent"></div>
            </div>
        `;
        document.body.appendChild(overlay);
        const closeButton = overlay.querySelector("#footerInfoClose");
        const title = overlay.querySelector("#footerInfoTitle");
        const content = overlay.querySelector("#footerInfoContent");
        let previousFocus = null;

        function closePage() {
            overlay.hidden = true;
            document.body.classList.remove("footer-info-open");
            if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
        }
        function openPage(key, source) {
            const page = pageContent[key];
            if (!page) return;
            previousFocus = source;
            title.textContent = page.title;
            content.innerHTML = page.html;
            overlay.hidden = false;
            document.body.classList.add("footer-info-open");
            closeButton.focus();
            content.scrollTop = 0;
        }

        footerLinks.forEach(link => {
            link.addEventListener("click", event => {
                event.preventDefault();
                openPage(link.dataset.footerPage, link);
            });
        });
        closeButton.addEventListener("click", closePage);
        overlay.addEventListener("click", event => {
            if (event.target === overlay) closePage();
        });
        document.addEventListener("keydown", event => {
            if (event.key === "Escape" && !overlay.hidden) closePage();
        });
    }

    initializeFooterInfoPages();


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
