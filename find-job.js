
/* ==========================================
   TASKBRIDGE - FIND A JOB
   JavaScript
========================================== */

document.addEventListener("DOMContentLoaded", function () {

    // ======================================
    // DOM ELEMENTS
    // ======================================

    const jobList = document.getElementById("jobList");
    const jobEmptyState = document.getElementById("jobEmptyState");

    const searchForm = document.getElementById("jobSearchForm");
    const searchInput = document.getElementById("jobSearchInput");

    const categoryList = document.getElementById("categoryList");
    const sortSelect = document.getElementById("jobSort");

    const resultCount = document.getElementById("jobResultCount");

    const availableJobsElement = document.getElementById("availableJobs");
    const completedJobsElement = document.getElementById("completedJobs");
    const totalJobsElement = document.getElementById("totalJobs");

    const jobDetailsModal = document.getElementById("jobDetailsModal");
    const closeJobModalButton = document.getElementById("closeJobModal");

    const modalJobTitle = document.getElementById("modalJobTitle");
    const modalJobCategory = document.getElementById("modalJobCategory");
    const modalJobReward = document.getElementById("modalJobReward");
    const modalJobSlots = document.getElementById("modalJobSlots");
    const modalJobCompleted = document.getElementById("modalJobCompleted");
    const modalJobDescription = document.getElementById("modalJobDescription");
    const modalJobTarget = document.getElementById("modalJobTarget");
    const applyJobButton = document.getElementById("applyJobButton");


    // ======================================
    // JOB DATA
    // ======================================

    // Supabase connection হলে এখানে
    // database থেকে real jobs load হবে.

    let jobs = [];

    let selectedCategory = "all";
    let searchKeyword = "";
    let selectedSort = "newest";
    let selectedJobId = null;


    // ======================================
    // JOB STATISTICS
    // ======================================

    function updateJobStatistics() {

        const availableJobs = jobs.filter(function (job) {
            return job.status === "active";
        }).length;

        const completedJobs = jobs.reduce(function (total, job) {
            return total + Number(job.completedSlots || 0);
        }, 0);

        const totalJobs = jobs.length;

        availableJobsElement.textContent = availableJobs;
        completedJobsElement.textContent = completedJobs;
        totalJobsElement.textContent = totalJobs;

    }


    // ======================================
    // FILTER JOBS
    // ======================================

    function getFilteredJobs() {

        let filteredJobs = [...jobs];

        // CATEGORY FILTER

        if (selectedCategory !== "all") {

            filteredJobs = filteredJobs.filter(function (job) {

                return job.category.toLowerCase() ===
                    selectedCategory.toLowerCase();

            });

        }

        // SEARCH FILTER

        if (searchKeyword.trim() !== "") {

            filteredJobs = filteredJobs.filter(function (job) {

                const searchableText = (
                    job.title + " " +
                    job.category + " " +
                    job.description
                ).toLowerCase();

                return searchableText.includes(
                    searchKeyword.toLowerCase()
                );

            });

        }

        // SORTING

        if (selectedSort === "newest") {

            filteredJobs.sort(function (a, b) {

                return new Date(b.createdAt) - new Date(a.createdAt);

            });

        }

        else if (selectedSort === "reward-high") {

            filteredJobs.sort(function (a, b) {

                return Number(b.reward) - Number(a.reward);

            });

        }

        else if (selectedSort === "reward-low") {

            filteredJobs.sort(function (a, b) {

                return Number(a.reward) - Number(b.reward);

            });

        }

        return filteredJobs;

    }


    // ======================================
    // RENDER JOB CARDS
    // ======================================

    function renderJobs() {

        const filteredJobs = getFilteredJobs();

        jobList.innerHTML = "";

        resultCount.textContent =
            filteredJobs.length + " jobs found";

        if (filteredJobs.length === 0) {

            jobEmptyState.style.display = "block";

            if (jobs.length === 0) {

                jobEmptyState.querySelector("h3").textContent =
                    "No Jobs Available";

                jobEmptyState.querySelector("p").textContent =
                    "There are currently no published jobs. Please check again later.";

            } else {

                jobEmptyState.querySelector("h3").textContent =
                    "No Matching Jobs";

                jobEmptyState.querySelector("p").textContent =
                    "Try another keyword or select a different category.";

            }

            return;

        }

        jobEmptyState.style.display = "none";

        filteredJobs.forEach(function (job) {

            const jobCard = document.createElement("article");

            jobCard.className = "job-card";

            const header = document.createElement("div");
            header.className = "job-card-header";

            const titleArea = document.createElement("div");

            const title = document.createElement("h3");
            title.textContent = job.title;

            const category = document.createElement("span");
            category.className = "job-category-badge";
            category.textContent = job.category;

            titleArea.appendChild(title);
            titleArea.appendChild(category);

            const reward = document.createElement("div");
            reward.className = "job-reward";
            reward.textContent = formatReward(job.reward, job.currency);

            header.appendChild(titleArea);
            header.appendChild(reward);

            const description = document.createElement("p");
            description.className = "job-description";
            description.textContent = job.description;

            const info = document.createElement("div");
            info.className = "job-card-info";

            const availableSlots = document.createElement("span");
            availableSlots.textContent =
                "Available Slots: " + getAvailableSlots(job);

            const completedSlots = document.createElement("span");
            completedSlots.textContent =
                "Completed Slots: " + Number(job.completedSlots || 0);

            info.appendChild(availableSlots);
            info.appendChild(completedSlots);

            const actions = document.createElement("div");
            actions.className = "job-card-actions";

            const detailsButton = document.createElement("button");
            detailsButton.type = "button";
            detailsButton.className = "view-details-btn";
            detailsButton.textContent = "View Details";

            detailsButton.addEventListener("click", function () {
                openJobDetails(job.id);
            });

            const applyButton = document.createElement("button");
            applyButton.type = "button";
            applyButton.className = "apply-job-btn";
            applyButton.textContent = "Apply Now";

            applyButton.addEventListener("click", function () {
                openJobDetails(job.id);
            });

            actions.appendChild(detailsButton);
            actions.appendChild(applyButton);

            jobCard.appendChild(header);
            jobCard.appendChild(description);
            jobCard.appendChild(info);
            jobCard.appendChild(actions);

            jobList.appendChild(jobCard);

        });

    }


    // ======================================
    // FORMAT REWARD
    // ======================================

    function formatReward(amount, currency) {

        const value = Number(amount || 0);

        return (currency || "USD") + " " + value.toFixed(2);

    }


    // ======================================
    // AVAILABLE SLOTS
    // ======================================

    function getAvailableSlots(job) {

        const total = Number(job.totalSlots || 0);
        const completed = Number(job.completedSlots || 0);

        return Math.max(0, total - completed);

    }


    // ======================================
    // OPEN JOB DETAILS
    // ======================================

    function openJobDetails(jobId) {

        const job = jobs.find(function (item) {

            return String(item.id) === String(jobId);

        });

        if (!job) return;

        selectedJobId = job.id;

        modalJobTitle.textContent = job.title;
        modalJobCategory.textContent = job.category;

        modalJobReward.textContent =
            formatReward(job.reward, job.currency);

        modalJobSlots.textContent = getAvailableSlots(job);

        modalJobCompleted.textContent =
            Number(job.completedSlots || 0);

        modalJobDescription.textContent =
            job.instructions || job.description || "No instructions available.";

        if (job.targetUrl) {

            try {

                const targetUrl = new URL(job.targetUrl);

                if (
                    targetUrl.protocol === "https:" ||
                    targetUrl.protocol === "http:"
                ) {

                    modalJobTarget.href = targetUrl.href;
                    modalJobTarget.hidden = false;

                } else {

                    modalJobTarget.removeAttribute("href");
                    modalJobTarget.hidden = true;

                }

            } catch (error) {

                modalJobTarget.removeAttribute("href");
                modalJobTarget.hidden = true;

            }

        } else {

            modalJobTarget.removeAttribute("href");
            modalJobTarget.hidden = true;

        }

        jobDetailsModal.hidden = false;

    }


    // ======================================
    // CLOSE JOB DETAILS
    // ======================================

    function closeJobDetails() {

        jobDetailsModal.hidden = true;

        selectedJobId = null;

    }

    closeJobModalButton.addEventListener("click", closeJobDetails);

    jobDetailsModal.addEventListener("click", function (event) {

        if (event.target === jobDetailsModal) {

            closeJobDetails();

        }

    });

    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape" && !jobDetailsModal.hidden) {

            closeJobDetails();

        }

    });


    // ======================================
    // SEARCH FORM
    // ======================================

    searchForm.addEventListener("submit", function (event) {

        event.preventDefault();

        searchKeyword = searchInput.value.trim();

        renderJobs();

    });

    searchInput.addEventListener("input", function () {

        searchKeyword = searchInput.value.trim();

        renderJobs();

    });


    // ======================================
    // CATEGORY FILTER
    // ======================================

    categoryList.addEventListener("click", function (event) {

        const button = event.target.closest(".category-button");

        if (!button) return;

        document.querySelectorAll(".category-button").forEach(
            function (categoryButton) {

                categoryButton.classList.remove("active");

            }
        );

        button.classList.add("active");

        selectedCategory = button.dataset.category;

        renderJobs();

    });


    // ======================================
    // SORT JOBS
    // ======================================

    sortSelect.addEventListener("change", function () {

        selectedSort = sortSelect.value;

        renderJobs();

    });


    // ======================================
    // APPLY FOR JOB
    // ======================================

    applyJobButton.addEventListener("click", function () {

        if (!selectedJobId) return;

        const job = jobs.find(function (item) {

            return String(item.id) === String(selectedJobId);

        });

        if (!job) return;

        if (job.status !== "active") {

            alert("This job is not currently available.");

            return;

        }

        if (getAvailableSlots(job) <= 0) {

            alert("Sorry, all available slots have been filled.");

            return;

        }

        alert(
            "Job application will be available after TaskBridge account and database connection is completed."
        );

    });


    // ======================================
    // LOAD JOB DATA
    // ======================================

    function loadJobs() {

        /*
            FUTURE SUPABASE INTEGRATION:

            1. Fetch approved and active jobs.
            2. Load real job details.
            3. Exclude jobs posted by the logged-in user.
            4. Apply country eligibility rules.
            5. Apply worker eligibility and slot limits.
            6. Render database results.

            Until Supabase is connected,
            no sample or fake jobs are displayed.
        */

        jobs = [];

        updateJobStatistics();

        renderJobs();

    }


    // ======================================
    // INITIALIZE PAGE
    // ======================================

    loadJobs();


    // ======================================
    // SIDEBAR TOGGLE
    // ======================================

    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebar = document.querySelector(".sidebar");

    if (sidebarToggle && sidebar) {

        sidebarToggle.addEventListener("click", function () {

            sidebar.classList.toggle("active");

        });

    }

});
