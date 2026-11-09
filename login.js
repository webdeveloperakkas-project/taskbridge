
/* =========================================
   TASKBRIDGE USER LOGIN SYSTEM
   Supabase Authentication
   USER DASHBOARD ONLY
========================================= */

console.log("TaskBridge User Login System Initialized.");

(() => {
    "use strict";

    // =====================================
    // SUPABASE CONFIGURATION
    // =====================================

    const SUPABASE_URL =
        "https://eboagroxkgpplccufpuk.supabase.co";

    // এখানে তোমার আগের Supabase Publishable Key
    // হুবহু বসাবে। Secret / Service Role Key নয়।
    const SUPABASE_PUBLISHABLE_KEY =
        "sb_publishable_UKOjnMUUrbVK3a0fruk55Q_Anjk04RA";


    // =====================================
    // ELEMENTS
    // =====================================

    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("loginIdentity");
    const passwordInput = document.getElementById("loginPassword");
    const rememberCheckbox = document.getElementById("rememberMe");
    const loginButton = document.getElementById("loginButton");
    const loginMessage = document.getElementById("loginMessage");


    // =====================================
    // MESSAGE HANDLER
    // =====================================

    function showMessage(message, type = "error") {

        if (!loginMessage) {
            console.error(message);
            return;
        }

        loginMessage.textContent = message;
        loginMessage.hidden = false;

        loginMessage.classList.remove(
            "success",
            "error"
        );

        loginMessage.classList.add(type);
    }


    function clearMessage() {

        if (!loginMessage) return;

        loginMessage.textContent = "";
        loginMessage.hidden = true;

        loginMessage.classList.remove(
            "success",
            "error"
        );
    }


    // =====================================
    // BUTTON LOADING
    // =====================================

    function setLoading(isLoading) {

        if (!loginButton) return;

        loginButton.disabled = isLoading;

        if (isLoading) {

            loginButton.dataset.originalText =
                loginButton.textContent;

            loginButton.textContent = "Signing in...";

        } else {

            loginButton.textContent =
                loginButton.dataset.originalText || "Login";
        }
    }


    // =====================================
    // CHECK HTML ELEMENTS
    // =====================================

    if (!loginForm) {
        console.error("Login form not found: #loginForm");
        return;
    }

    if (!emailInput || !passwordInput) {
        console.error("Login email or password input not found.");
        return;
    }


    // =====================================
    // CHECK SUPABASE LIBRARY
    // =====================================

    if (!window.supabase || !window.supabase.createClient) {

        console.error("Supabase JavaScript library not loaded.");

        showMessage(
            "Login system could not initialize. Please refresh the page."
        );

        return;
    }


    // =====================================
    // REMEMBER ME STORAGE
    // =====================================

    const authStorage = {

        getItem(key) {
            return (
                localStorage.getItem(key) ??
                sessionStorage.getItem(key)
            );
        },

        setItem(key, value) {

            if (rememberCheckbox?.checked) {

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


    // =====================================
    // CREATE SUPABASE CLIENT
    // =====================================

    let supabaseClient;

    try {

        if (
            !SUPABASE_PUBLISHABLE_KEY ||
            SUPABASE_PUBLISHABLE_KEY.includes("PASTE_YOUR")
        ) {
            throw new Error("Supabase Publishable Key is missing.");
        }

        supabaseClient = window.supabase.createClient(
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

        showMessage(
            "Login system initialization failed."
        );

        return;
    }


    console.log("TaskBridge Supabase Client Initialized.");


    // =====================================
    // LOGIN FORM SUBMISSION
    // =====================================

    loginForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        console.log("TASKBRIDGE LOGIN FORM SUBMITTED");

        clearMessage();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // ---------------------------------
        // VALIDATION
        // ---------------------------------

        if (!email || !password) {

            showMessage(
                "Please enter your email address and password."
            );

            return;
        }

        if (!emailInput.validity.valid) {

            showMessage(
                "Please enter a valid email address."
            );

            return;
        }


        setLoading(true);

        try {

            // -----------------------------
            // SUPABASE EMAIL/PASSWORD LOGIN
            // -----------------------------

            const { data, error } =
                await supabaseClient.auth.signInWithPassword({

                    email: email,
                    password: password

                });


            if (error) {
                throw error;
            }

            if (!data || !data.user || !data.session) {

                throw new Error(
                    "Login session could not be created."
                );
            }


            console.log(
                "TaskBridge User Login Successful."
            );


            // -----------------------------
            // USER DASHBOARD REDIRECT
            // -----------------------------

            showMessage(
                "Login successful. Opening your dashboard...",
                "success"
            );

            window.location.replace("./dashboard.html");

        } catch (error) {

            console.error("TaskBridge Login Error:", error);

            let message =
                "Login failed. Please try again.";

            if (error.message?.includes("Invalid login credentials")) {

                message =
                    "Incorrect email address or password.";

            } else if (
                error.message?.includes("Email not confirmed")
            ) {

                message =
                    "Please verify your email address before logging in.";

            } else if (
                error.message?.includes("Too many requests")
            ) {

                message =
                    "Too many login attempts. Please try again later.";

            } else if (
                error.message?.includes("Network")
            ) {

                message =
                    "Network error. Please check your internet connection.";
            }

            showMessage(message);

            setLoading(false);
        }

    });


    // =====================================
    // INITIAL SETUP
    // =====================================

    clearMessage();

    console.log("TASKBRIDGE USER LOGIN READY.");

})();
