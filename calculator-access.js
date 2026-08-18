// BELTPRO Calculator Direct-Access Protection
// Add this file once to the website root and load it in the <head>
// of every protected calculator page.
//
// The Client Access Code is NOT stored here.
// This script only validates the token issued by the BELTPRO
// Render backend after successful Client Access login.

(function () {
  "use strict";

  const CLIENT_ACCESS_API =
    "https://spiral-tension-api.onrender.com";

  const CLIENT_ACCESS_TOKEN_KEY =
    "beltpro_client_access_token";

  const ACCESS_PAGE = "/";

  const REQUEST_TIMEOUT_MS = 8000;
  const MAX_ATTEMPTS = 2;


  // =========================================================
  // HIDE CALCULATOR IMMEDIATELY
  // =========================================================
  // This prevents the calculator from briefly appearing
  // before Client Access has been verified.

  document.documentElement.style.visibility = "hidden";


  // =========================================================
  // REDIRECT TO BELTPRO HOME PAGE
  // =========================================================

  function redirectToAccess() {

    // Remember which calculator the visitor was trying to open.
    // This can also be used later for automatic return after login.

    try {

      sessionStorage.setItem(
        "beltpro_requested_calculator",
        window.location.pathname +
          window.location.search +
          window.location.hash
      );

    } catch (error) {}


    window.location.replace(ACCESS_PAGE);
  }


  // =========================================================
  // FETCH WITH TIMEOUT AND AUTOMATIC RETRY
  // =========================================================

  async function fetchWithTimeout(
    url,
    options
  ) {

    let lastError = null;


    for (
      let attempt = 0;
      attempt < MAX_ATTEMPTS;
      attempt++
    ) {

      const controller =
        new AbortController();


      const timer =
        window.setTimeout(
          function () {

            controller.abort();

          },
          REQUEST_TIMEOUT_MS
        );


      try {

        const response =
          await fetch(
            url,
            {
              ...options,

              signal:
                controller.signal,

              cache:
                "no-store"
            }
          );


        window.clearTimeout(timer);


        return response;


      } catch (error) {

        window.clearTimeout(timer);

        lastError = error;


        // Retry once after a short delay.

        if (
          attempt <
          MAX_ATTEMPTS - 1
        ) {

          await new Promise(
            function (resolve) {

              window.setTimeout(
                resolve,
                450
              );

            }
          );

        }

      }

    }


    throw (
      lastError ||
      new Error(
        "Unable to verify client access."
      )
    );
  }


  // =========================================================
  // VERIFY CALCULATOR ACCESS
  // =========================================================

  async function verifyCalculatorAccess() {

    let token = "";


    // Get existing BELTPRO Client Access token.

    try {

      token =
        localStorage.getItem(
          CLIENT_ACCESS_TOKEN_KEY
        ) || "";

    } catch (error) {}


    // ---------------------------------------------------------
    // NO TOKEN
    // ---------------------------------------------------------

    if (!token) {

      redirectToAccess();

      return;
    }


    // ---------------------------------------------------------
    // VERIFY TOKEN WITH RENDER
    // ---------------------------------------------------------

    try {

      const response =
        await fetchWithTimeout(

          CLIENT_ACCESS_API +
            "/client-access/check",

          {

            method: "POST",

            headers: {

              "Content-Type":
                "application/json"

            },

            body:
              JSON.stringify({
                token: token
              })

          }

        );


      // -------------------------------------------------------
      // VALID ACCESS
      // -------------------------------------------------------

      if (response.ok) {

        document.documentElement.style.visibility =
          "";

        return;
      }


      // -------------------------------------------------------
      // EXPIRED OR INVALID TOKEN
      // -------------------------------------------------------

      if (
        response.status === 401
      ) {

        try {

          localStorage.removeItem(
            CLIENT_ACCESS_TOKEN_KEY
          );

        } catch (error) {}

      }


      // Any unsuccessful validation redirects
      // the visitor to the BELTPRO homepage.

      redirectToAccess();


    } catch (error) {


      // -------------------------------------------------------
      // RENDER / NETWORK FAILURE
      // -------------------------------------------------------
      //
      // Fail closed:
      // Do not reveal the calculator when access
      // cannot be verified.

      redirectToAccess();

    }

  }


  // =========================================================
  // START ACCESS CHECK
  // =========================================================

  verifyCalculatorAccess();

})();
