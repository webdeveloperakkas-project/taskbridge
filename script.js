
/* =========================================
   TASKBRIDGE - MAIN JAVASCRIPT
   Public Homepage Interactions
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================
       01. AUTOMATIC FOOTER YEAR
    ===================================== */

    const currentYear = document.getElementById("current-year");

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }


    /* =====================================
       02. MOBILE NAVIGATION
    ===================================== */

    const menuToggle = document.getElementById("mobileMenuToggle");
    const navigation = document.getElementById("mainNavigation");

    function closeMobileMenu() {

        if (!menuToggle || !navigation) return;

        menuToggle.classList.remove("active");
        navigation.classList.remove("active");

        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation menu");

    }


    if (menuToggle && navigation) {

        // Open and close menu

        menuToggle.addEventListener("click", function () {

            const isOpen = navigation.classList.toggle("active");

            menuToggle.classList.toggle("active", isOpen);

            menuToggle.setAttribute("aria-expanded", String(isOpen));

            menuToggle.setAttribute(
                "aria-label",
                isOpen ? "Close navigation menu" : "Open navigation menu"
            );

        });


        // Close menu after clicking a navigation link

        const navigationLinks = navigation.querySelectorAll("a");

        navigationLinks.forEach(function (link) {

            link.addEventListener("click", function () {

                closeMobileMenu();

            });

        });


        // Close menu when clicking outside

        document.addEventListener("click", function (event) {

            const clickedInsideMenu = navigation.contains(event.target);
            const clickedToggle = menuToggle.contains(event.target);

            if (!clickedInsideMenu && !clickedToggle) {
                closeMobileMenu();
            }

        });


        // Close menu using Escape key

        document.addEventListener("keydown", function (event) {

            if (event.key === "Escape") {
                closeMobileMenu();
            }

        });


        // Close menu when switching to desktop screen

        window.addEventListener("resize", function () {

            if (window.innerWidth > 768) {
                closeMobileMenu();
            }

        });

    }


    /* =====================================
       03. HEADER SCROLL EFFECT
    ===================================== */

    const header = document.querySelector(".site-header");

    function updateHeader() {

        if (!header) return;

        if (window.scrollY > 30) {

            header.classList.add("scrolled");

        } else {

            header.classList.remove("scrolled");

        }

    }

    window.addEventListener("scroll", updateHeader, {
        passive: true
    });

    updateHeader();


    /* =====================================
       04. SMOOTH INTERNAL NAVIGATION
    ===================================== */

    const internalLinks = document.querySelectorAll(
        'a[href^="#"]'
    );

    internalLinks.forEach(function (link) {

        link.addEventListener("click", function (event) {

            const targetId = link.getAttribute("href");

            if (!targetId || targetId === "#") return;

            const targetElement = document.querySelector(targetId);

            if (targetElement) {

                event.preventDefault();

                targetElement.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        });

    });


    /* =====================================
       05. CURRENT YEAR AND INITIALIZATION
    ===================================== */

    console.log("TaskBridge Homepage Initialized");

});
