
/* =========================================
   TASKBRIDGE - DASHBOARD JAVASCRIPT
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================
       CURRENT YEAR
    ====================================== */

    const currentYear = document.getElementById("current-year");

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }


    /* =====================================
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


    /* Close sidebar after clicking a navigation link on mobile */

    if (sidebar) {

        const sidebarLinks = sidebar.querySelectorAll(".nav-link");

        sidebarLinks.forEach(function (link) {

            link.addEventListener("click", function () {

                if (window.innerWidth <= 900) {
                    closeSidebar();
                }

            });

        });

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


    /* =====================================
       ACTIVE SIDEBAR LINK
    ====================================== */

    const currentPage = window.location.pathname.split("/").pop();

    const sidebarLinks = document.querySelectorAll(
        ".sidebar-navigation .nav-link"
    );

    sidebarLinks.forEach(function (link) {

        const linkPage = link.getAttribute("href");

        if (linkPage === currentPage) {

            sidebarLinks.forEach(function (item) {
                item.classList.remove("active");
            });

            link.classList.add("active");

        }

    });


    /* =====================================
       DASHBOARD INITIALIZATION
    ====================================== */

    console.log("TaskBridge Dashboard initialized successfully.");

});


/* =====================================
   DASHBOARD PAGE SECTION SWITCHING
===================================== */

const pageSections = [
    "dashboardContent",
    "findJobSection",
    "postJobSection",
    "myPostedJobsSection",
    "mySubmittedJobsSection"
];

const sectionLinks = document.querySelectorAll(
    ".sidebar-navigation .nav-link[data-section]"
);


function showPageSection(sectionId) {

    const targetSection = document.getElementById(sectionId);

    // Section না থাকলে পরিবর্তন করবে না
    if (!targetSection) {
        console.warn("Section not found:", sectionId);
        return;
    }

    // সব Section hide করবে
    pageSections.forEach(function (id) {

        const section = document.getElementById(id);

        if (section) {
            section.classList.remove("active");
            section.hidden = true;
        }

    });

    // নির্বাচিত Section show করবে
    targetSection.hidden = false;
    targetSection.classList.add("active");

    // Sidebar active menu পরিবর্তন
    sectionLinks.forEach(function (link) {

        link.classList.toggle(
            "active",
            link.dataset.section === sectionId
        );

    });

    // URL hash আপডেট
    history.replaceState(null, "", "#" + sectionId);

    // Content-এর শুরুতে নিয়ে যাবে
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// Sidebar menu click
sectionLinks.forEach(function (link) {

    link.addEventListener("click", function (event) {

        event.preventDefault();

        const sectionId = this.dataset.section;

        showPageSection(sectionId);

    });

});


// Initial page load
const initialSection = window.location.hash.replace("#", "");

if (pageSections.includes(initialSection) &&
    document.getElementById(initialSection)) {

    showPageSection(initialSection);

} else {

    showPageSection("dashboardContent");

}

