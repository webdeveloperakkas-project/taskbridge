
/* =========================================
   TASKBRIDGE LOGIN SYSTEM
   Supabase Authentication
   Version 2.0
========================================= */


// =========================================
// 1. SUPABASE CONFIGURATION
// =========================================

const SUPABASE_URL =
    "https://eboagroxkgpplccufpuk.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_UKOjnMUUrbVK3a0fruk55Q_Anjk04RA";


// =========================================
// 2. DOM ELEMENTS
// =========================================

const loginForm = document.getElementById("loginForm");

const emailInput = document.getElementById("loginIdentity");

const passwordInput = document.getElementById("loginPassword");

const rememberMeInput = document.getElementById("rememberMe");

const loginButton = document.getElementById("loginButton");

const loginMessage = document.getElementById("loginMessage");

const currentYear = document.getElementById("current-year");


// =========================================
// 3. CURRENT YEAR
// =========================================

if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}


// =========================================
// 4. MESSAGE SYSTEM
// =========================================

function showMessage(message, type = "error") {

    if (!loginMessage) {
        alert(message);
        return;
    }

    loginMessage.textContent = message;

    loginMessage.className = `login-message ${type}`;

    loginMessage.hidden = false;
}


function hideMessage() {

    if (!loginMessage) return;

    loginMessage.textContent = "";

    loginMessage.hidden = true;
}


// =========================================
// 5. BUTTON LOADING
// =========================================

function setLoading(isLoading) {

    if (!loginButton) return;

    loginButton.disabled = isLoading;

    loginButton.textContent = isLoading
        ? "Logging In..."
        : "Log In";
}


// =========================================
// 6. SUPABASE CONFIGURATION CHECK
// =========================================

if (!window.supabase) {

    showMessage(
        "Supabase library could not be loaded. Please refresh the page.",
        "error"
    );

    if (loginButton) {
        loginButton.disabled = true;
    }

} else if (
    !SUPABASE_PUBLISHABLE_KEY ||
    SUPABASE_PUBLISHABLE_KEY === "YOUR_SUPABASE_PUBLISHABLE_KEY"
) {

    showMessage(
        "Supabase configuration is missing.",
        "error"
    );

    if (loginButton) {
        loginButton.disabled = true;
    }
}


// =========================================
// 7. REMEMBER ME STORAGE
// =========================================

// Save session according to Remember Me selection.
// If unchecked, use sessionStorage.
// If checked, use localStorage.

const authStorage = {

    getItem(key) {

        return (
            window.localStorage.getItem(key) ??
            window.sessionStorage.getItem(key)
        );
    },

    setItem(key, value) {

        const rememberMe = rememberMeInput
            ? rememberMeInput.checked
            : true;

        if (rememberMe) {

            window.localStorage.setItem(key, value);

            window.sessionStorage.removeItem(key);

        } else {

            window.sessionStorage.setItem(key, value);

            window.localStorage.removeItem(key);

        }
    },

    removeItem(key) {

        window.localStorage.removeItem(key);

        window.sessionStorage.removeItem(key);

    }

};


// =========================================
// 8. CREATE SUPABASE CLIENT
// =========================================

let supabaseClient = null;

if (
    window.supabase &&
    SUPABASE_PUBLISHABLE_KEY &&
    SUPABASE_PUBLISHABLE_KEY !== "YOUR_SUPABASE_PUBLISHABLE_KEY"
) {

    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
            auth: {
                storage: authStorage,
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );

}


// =========================================
// 9. LOGIN FORM SUBMISSION
// =========================================

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        // Prevent normal form submission.
        // Password will never be added to the URL.

        event.preventDefault();

        hideMessage();


        // =====================================
        // GET FORM VALUES
        // =====================================

        const email = emailInput
            ? emailInput.value.trim()
            : "";

        const password = passwordInput
            ? passwordInput.value
            : "";


        // =====================================
        // VALIDATION
        // =====================================

        if (!email || !password) {

            showMessage(
                "Please enter your email address and password.",
                "error"
            );

            return;
        }


        if (!supabaseClient) {

            showMessage(
                "Supabase is not configured correctly.",
                "error"
            );

            return;
        }


        setLoading(true);


        try {

            // =================================
            // 10. SUPABASE EMAIL LOGIN
            // =================================

            const { data, error } =
                await supabaseClient.auth.signInWithPassword({

                    email: email,

                    password: password

                });


            if (error) {
                throw error;
            }


            if (!data || !data.user) {

                throw new Error(
                    "Unable to verify your account."
                );

            }


            // =================================
            // 11. GET AUTH USER ID
            // =================================

            const userId = data.user.id;


            if (!userId) {

                throw new Error(
                    "User ID could not be retrieved."
                );

            }


            // =================================
            // 12. VERIFY ADMIN ROLE USING RPC
            // =================================

            const { data: isAdmin, error: roleError } =
                await supabaseClient.rpc(

                    "has_role",

                    {
                        p_user_id: userId,
                        p_role: "admin"
                    }

                );


            if (roleError) {

                console.error(
                    "Admin Role Verification Error:",
                    roleError
                );

                throw new Error(
                    "Login successful, but Admin Role verification failed. Please try again or contact support."
                );

            }


            // =================================
            // 13. LOGIN SUCCESS
            // =================================

            if (isAdmin === true) {

                // ADMIN ACCOUNT

                showMessage(
                    "Admin login successful! Redirecting...",
                    "success"
                );

                window.location.replace("./admin.html");

                return;

            } else if (isAdmin === false) {

                // NORMAL USER ACCOUNT

                showMessage(
                    "Login successful! Redirecting to Dashboard...",
                    "success"
                );

                window.location.replace("./dashboard.html");

                return;

            } else {

                throw new Error(
                    "Unexpected role verification response."
                );

            }


        } catch (error) {

            console.error(
                "TaskBridge Login Error:",
                error
            );


            // =================================
            // 14. ERROR HANDLING
            // =================================

            let errorMessage =
                "Login failed. Please try again.";


            const message = error.message
                ? error.message.toLowerCase()
                : "";


            if (
                message.includes("invalid login credentials") ||
                message.includes("invalid credentials")
            ) {

                errorMessage =
                    "Incorrect email address or password.";

            } else if (
                message.includes("email not confirmed")
            ) {

                errorMessage =
                    "Please verify your email address before logging in.";

            } else if (
                message.includes("failed to fetch")
            ) {

                errorMessage =
                    "Network error. Please check your internet connection.";

            } else if (error.message) {

                errorMessage = error.message;

            }


            showMessage(errorMessage, "error");

            setLoading(false);

        }

    });

}


// =========================================
// 15. CLEAR ERROR WHEN USER TYPES
// =========================================

if (emailInput) {

    emailInput.addEventListener(
        "input",
        hideMessage
    );

}


if (passwordInput) {

    passwordInput.addEventListener(
        "input",
        hideMessage
    );

}


// =========================================
// 16. PREVENT EMPTY FORM SUBMISSION
// =========================================

if (loginForm) {

    loginForm.setAttribute("novalidate", "false");

}


// =========================================
// TASKBRIDGE LOGIN SYSTEM COMPLETE
// =========================================

console.log("TaskBridge Login System Initialized.");


console.log("TASKBRIDGE LOGIN JS LOADED");

document.getElementById("loginForm")?.addEventListener("submit", function () {
    console.log("TASKBRIDGE LOGIN FORM SUBMITTED");
});

// TASKBRIDGE LOGIN FORM DIAGNOSTIC

document.addEventListener("submit", function (event) {

    if (event.target && event.target.id === "loginForm") {

        event.preventDefault();

        console.log("TASKBRIDGE LOGIN FORM SUBMITTED");
        console.log("Form ID:", event.target.id);

    }

}, true);
