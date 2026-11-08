
document.addEventListener("DOMContentLoaded", function () {

    // =====================================
    // ELEMENTS
    // =====================================

    const registrationStep = document.getElementById("registrationStep");
    const otpStep = document.getElementById("otpStep");
    const successStep = document.getElementById("successStep");

    const registerForm = document.getElementById("registerForm");
    const otpForm = document.getElementById("otpForm");

    const fullName = document.getElementById("fullName");
    const username = document.getElementById("username");
    const email = document.getElementById("email");
    const country = document.getElementById("country");
    const accountType = document.getElementById("accountType");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");

    const registerButton = document.getElementById("registerButton");
    const verifyOtpButton = document.getElementById("verifyOtpButton");
    const resendOtpButton = document.getElementById("resendOtpButton");

    const otpCode = document.getElementById("otpCode");
    const otpEmail = document.getElementById("otpEmail");

    const registerMessage = document.getElementById("registerMessage");
    const otpMessage = document.getElementById("otpMessage");

    const backToRegisterButton = document.getElementById("backToRegisterButton");

    const currentYear = document.getElementById("current-year");

    // Current year
    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }


    // =====================================
    // HELPER FUNCTIONS
    // =====================================

    function showMessage(element, message, type) {

        if (!element) return;

        element.textContent = message;
        element.className = "form-message " + type;

    }


    function clearMessage(element) {

        if (!element) return;

        element.textContent = "";
        element.className = "form-message";

    }


    function showStep(step) {

        if (!registrationStep || !otpStep || !successStep) {
            return;
        }

        registrationStep.hidden = step !== "registration";
        otpStep.hidden = step !== "otp";
        successStep.hidden = step !== "success";

    }


    function setButtonLoading(button, loading, normalText, loadingText) {

        if (!button) return;

        button.disabled = loading;
        button.textContent = loading ? loadingText : normalText;

    }


    // =====================================
    // TEMPORARY FRONTEND DEMO SETTINGS
    // =====================================

    /*
       IMPORTANT:

       This is only a frontend demonstration.

       No real email OTP is sent here.
       No real account is created here.
       No secure authentication happens here.

       Real OTP and account creation will be
       connected through the backend later.
    */

    let demoOtp = null;

    let registrationData = null;


    // =====================================
    // STEP 1: REGISTRATION FORM
    // =====================================

    if (registerForm) {

        registerForm.addEventListener("submit", function (event) {

            event.preventDefault();

            clearMessage(registerMessage);

            // Browser form validation
            if (!registerForm.checkValidity()) {

                registerForm.reportValidity();
                return;

            }

            // Password confirmation
            if (password.value !== confirmPassword.value) {

                showMessage(
                    registerMessage,
                    "Passwords do not match. Please try again.",
                    "error"
                );

                confirmPassword.focus();
                return;

            }

            // Minimum password length
            if (password.value.length < 8) {

                showMessage(
                    registerMessage,
                    "Password must contain at least 8 characters.",
                    "error"
                );

                return;

            }

            // Save form data temporarily in memory
            registrationData = {

                fullName: fullName.value.trim(),
                username: username.value.trim(),
                email: email.value.trim(),
                country: country.value,
                accountType: accountType.value,

                // Password is NOT saved to browser storage.
                // Backend will handle secure password hashing.

            };


            // Generate a temporary demo OTP
            demoOtp = String(
                Math.floor(100000 + Math.random() * 900000)
            );


            // Display OTP step
            if (otpEmail) {
                otpEmail.textContent = registrationData.email;
            }

            showStep("otp");

            clearMessage(otpMessage);

            otpCode.value = "";

            otpCode.focus();


            /*
              DEMO ONLY:

              The OTP is generated in the browser and
              is NOT sent to the user's email.

              Remove this demo logic when backend is connected.
            */

            console.info(
                "TaskBridge DEMO OTP:",
                demoOtp
            );

        });

    }


    // =====================================
    // STEP 2: OTP VERIFICATION
    // =====================================

    if (otpForm) {

        otpForm.addEventListener("submit", function (event) {

            event.preventDefault();

            clearMessage(otpMessage);

            const enteredOtp = otpCode.value.trim();

            if (!/^[0-9]{6}$/.test(enteredOtp)) {

                showMessage(
                    otpMessage,
                    "Please enter a valid 6-digit OTP.",
                    "error"
                );

                otpCode.focus();
                return;

            }


            setButtonLoading(
                verifyOtpButton,
                true,
                "Confirm & Verify",
                "Verifying..."
            );


            /*
              TEMPORARY DEMO VERIFICATION

              This compares the entered code with a
              browser-generated demo code.

              This is NOT secure and is NOT real email
              verification.

              Backend verification will replace this.
            */

            if (enteredOtp !== demoOtp) {

                showMessage(
                    otpMessage,
                    "Wrong OTP! Please check your code and try again.",
                    "error"
                );

                setButtonLoading(
                    verifyOtpButton,
                    false,
                    "Confirm & Verify",
                    "Verifying..."
                );

                otpCode.focus();
                otpCode.select();

                return;

            }


            // Demo OTP matched
            showMessage(
                otpMessage,
                "OTP verified successfully!",
                "success"
            );


            setTimeout(function () {

                showStep("success");

                /*
                  IMPORTANT:

                  This is only a visual success demonstration.
                  A real account is NOT created yet.

                  Backend account creation and automatic
                  login will be added later.
                */

                setTimeout(function () {

                    window.location.href = "dashboard.html";

                }, 2500);

            }, 500);

        });

    }


    // =====================================
    // RESEND OTP
    // =====================================

    if (resendOtpButton) {

        resendOtpButton.addEventListener("click", function () {

            clearMessage(otpMessage);

            if (!registrationData) {

                showMessage(
                    otpMessage,
                    "Please complete the registration form first.",
                    "error"
                );

                return;

            }


            /*
              TEMPORARY DEMO OTP RESEND

              This generates a new code in the browser.
              No email is actually sent.

              Backend email service will handle this later.
            */

            demoOtp = String(
                Math.floor(100000 + Math.random() * 900000)
            );

            showMessage(
                otpMessage,
                "A new demo OTP has been generated. Check the browser console.",
                "info"
            );

            console.info(
                "TaskBridge NEW DEMO OTP:",
                demoOtp
            );

        });

    }


    // =====================================
    // BACK TO REGISTRATION
    // =====================================

    if (backToRegisterButton) {

        backToRegisterButton.addEventListener("click", function () {

            showStep("registration");

            clearMessage(registerMessage);
            clearMessage(otpMessage);

            if (registerButton) {
                registerButton.disabled = false;
                registerButton.textContent = "Create Account";
            }

        });

    }


    // =====================================
    // OTP INPUT: NUMBERS ONLY
    // =====================================

    if (otpCode) {

        otpCode.addEventListener("input", function () {

            this.value = this.value
                .replace(/[^0-9]/g, "")
                .slice(0, 6);

            clearMessage(otpMessage);

        });

    }


    // =====================================
    // PASSWORD MATCH CHECK
    // =====================================

    if (confirmPassword) {

        confirmPassword.addEventListener("input", function () {

            if (this.value && password.value !== this.value) {

                this.setCustomValidity("Passwords do not match.");

            } else {

                this.setCustomValidity("");

            }

        });

    }


    // =====================================
    // INITIAL PAGE STATE
    // =====================================

    showStep("registration");

    console.log("TaskBridge Registration Frontend Loaded.");

});
