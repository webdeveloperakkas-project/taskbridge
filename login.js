
/* =========================================
   TASKBRIDGE LOGIN SYSTEM
   Supabase Authentication
========================================= */

// Supabase Configuration
const SUPABASE_URL = "https://eboagroxkgpplccufpuk.supabase.co";

// এখানে তোমার Supabase Publishable Key বসাবে
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_UKOjnMUUrbVK3a0fruk55Q_Anjk04RA";

// =========================================
// DOM ELEMENTS
// =========================================

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("loginIdentity");
const passwordInput = document.getElementById("loginPassword");
const rememberMeInput = document.getElementById("rememberMe");

const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");

const currentYear = document.getElementById("current-year");


// =========================================
// CURRENT YEAR
// =========================================

if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}


// =========================================
// SUPABASE CLIENT
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
    SUPABASE_PUBLISHABLE_KEY === "YOUR_SUPABASE_PUBLISHABLE_KEY" ||
    !SUPABASE_PUBLISHABLE_KEY
) {
    showMessage(
        "Supabase configuration is missing. Please contact the administrator.",
        "error"
    );

    if (loginButton) {
        loginButton.disabled = true;
    }
}


// =========================================
// MESSAGE SYSTEM
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
// BUTTON LOADING
// =========================================

function setLoading(isLoading) {

    if (!loginButton) return;

    loginButton.disabled = isLoading;

    if (isLoading) {
        loginButton.textContent = "Logging In...";
    } else {
        loginButton.textContent = "Log In";
    }
}


// =========================================
// LOGIN FORM SUBMISSION
// =========================================

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        // Prevent password from appearing in URL
        event.preventDefault();

        hideMessage();

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const rememberMe = rememberMeInput
            ? rememberMeInput.checked
            : true;

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

        if (!window.supabase) {

            showMessage(
                "Supabase is not available. Please refresh the page.",
                "error"
            );

            return;
        }

        if (
            !SUPABASE_PUBLISHABLE_KEY ||
            SUPABASE_PUBLISHABLE_KEY === "YOUR_SUPABASE_PUBLISHABLE_KEY"
        ) {

            showMessage(
                "Supabase Publishable Key is not configured.",
                "error"
            );

            return;
        }

        setLoading(true);

        try {

            // =================================
            // CREATE SUPABASE CLIENT
            // =================================

            const client = window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_PUBLISHABLE_KEY,
                {
                    auth: {
                        persistSession: rememberMe,
                        autoRefreshToken: true,
                        detectSessionInUrl: true,
                        storage: rememberMe
                            ? window.localStorage
                            : window.sessionStorage
                    }
                }
            );


            // =================================
            // SUPABASE EMAIL LOGIN
            // =================================

            const { data, error } = await client.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                throw error;
            }

            if (!data.user) {

                throw new Error(
                    "Unable to verify your account. Please try again."
                );
            }


            // =================================
            // GET USER ID
            // =================================

            const userId = data.user.id;


            // =================================
            // CHECK ADMIN ROLE
            // =================================

            const { data: isAdmin, error: roleError } = await client.rpc(
    "has_role",
    {
        p_user_id: userId,
        p_role: "admin"
    }
);

if (roleError) {
    throw roleError;
}

if (isAdmin === true) {
    window.location.replace("./admin.html");
} else {
    window.location.replace("./dashboard.html");
}

            if (roleError) {

                // Do not silently bypass role verification
                await client.auth.signOut();

                throw new Error(
                    "Login succeeded, but your account role could not be verified. Please contact support."
                );
            }


            // =================================
            // REDIRECT USER
            // =================================

            showMessage(
                "Login successful! Redirecting...",
                "success"
            );

            if (adminRole && adminRole.role === "admin") {

                window.location.replace("./admin.html");

            } else {

                window.location.replace("./dashboard.html");

            }

        } catch (error) {

            console.error("TaskBridge Login Error:", error);

            let errorMessage = "Login failed. Please try again.";

            if (
                error.message &&
                (
                    error.message.toLowerCase().includes("invalid login credentials") ||
                    error.message.toLowerCase().includes("invalid credentials")
                )
            ) {

                errorMessage = "Incorrect email address or password.";

            } else if (
                error.message &&
                error.message.toLowerCase().includes("email not confirmed")
            ) {

                errorMessage = "Please verify your email address before logging in.";

            } else if (error.message) {

                errorMessage = error.message;

            }

            showMessage(errorMessage, "error");

            setLoading(false);

        }

    });

}


// =========================================
// CLEAR ERROR WHEN USER TYPES
// =========================================

if (emailInput) {

    emailInput.addEventListener("input", hideMessage);

}

if (passwordInput) {

    passwordInput.addEventListener("input", hideMessage);

}


