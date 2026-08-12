let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  const button = document.getElementById("installAppButton");
  if (button) button.hidden = false;
});

async function installApp() {
  if (!deferredInstallPrompt) return;

  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;

  deferredInstallPrompt = null;

  const button = document.getElementById("installAppButton");
  if (button) button.hidden = true;
}

function updateConnectionStatus() {
  const banner = document.getElementById("offlineBanner");

  if (!banner) return;

  banner.classList.toggle("show", !navigator.onLine);
}

window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);
window.addEventListener("DOMContentLoaded", updateConnectionStatus);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch((error) =>
        console.error(
          "Service worker registration failed:",
          error
        )
      );
  });
}


// ==========================================================
// BELTPRO CLIENT ACCESS FOR APP CALCULATORS
// ==========================================================

const CLIENT_ACCESS_API =
  "https://spiral-tension-api.onrender.com";

const CLIENT_ACCESS_TOKEN_KEY =
  "beltpro_client_access_token";

let pendingAppCalculatorHref = "";


function appClientAccessMessage(type) {

  const messages = {
    invalid:
      "Invalid Client Access Code.",

    unavailable:
      "Unable to validate access right now. Please try again."
  };

  return messages[type] || messages.unavailable;
}


// ==========================================================
// CHECK EXISTING CLIENT TOKEN
// ==========================================================

async function appHasValidClientAccess() {

  let token = "";

  try {

    token =
      localStorage.getItem(
        CLIENT_ACCESS_TOKEN_KEY
      ) || "";

  } catch (error) {}

  if (!token) return false;

  try {

    const response = await fetch(
      CLIENT_ACCESS_API +
        "/client-access/check",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          token
        })
      }
    );

    if (response.ok) {
      return true;
    }

  } catch (error) {}

  try {

    localStorage.removeItem(
      CLIENT_ACCESS_TOKEN_KEY
    );

  } catch (error) {}

  return false;
}


// ==========================================================
// CREATE DISCLAIMER + CLIENT ACCESS WINDOWS
// ==========================================================

function ensureAppAccessUI() {

  if (
    document.getElementById(
      "appEngineeringDisclaimer"
    )
  ) {
    return;
  }


  const style =
    document.createElement("style");


  style.textContent = `

    .beltpro-access-backdrop {

      position: fixed;
      inset: 0;
      z-index: 10000;

      display: none;

      align-items: center;
      justify-content: center;

      padding: 20px;

      background:
        rgba(2, 8, 23, .76);

      backdrop-filter:
        blur(5px);
    }


    .beltpro-access-backdrop.show {

      display: flex;
    }


    .beltpro-access-dialog {

      width:
        min(100%, 620px);

      max-height:
        calc(100vh - 40px);

      overflow-y: auto;

      padding: 28px;

      background: #fff;

      border:
        1px solid #dbe5ee;

      border-radius: 18px;

      box-shadow:
        0 28px 80px
        rgba(2,8,23,.38);

      color: #1f2937;
    }


    .beltpro-access-dialog h2 {

      margin:
        0 0 10px;

      color: #082f49;
    }


    .beltpro-access-dialog p {

      margin:
        0 0 14px;

      color: #475569;

      line-height: 1.55;
    }


    .beltpro-access-dialog input {

      width: 100%;

      min-height: 48px;

      padding:
        11px 13px;

      border:
        1px solid #cbd5e1;

      border-radius: 9px;

      font: inherit;

      box-sizing:
        border-box;
    }


    .beltpro-access-actions {

      display: flex;

      justify-content:
        flex-end;

      gap: 10px;

      margin-top: 22px;
    }


    .beltpro-access-actions button {

      min-height: 44px;

      padding:
        10px 17px;

      border-radius: 9px;

      border:
        1px solid #dbe5ee;

      font: inherit;

      font-weight: 800;

      cursor: pointer;
    }


    .beltpro-access-cancel {

      background: #fff;

      color: #082f49;
    }


    .beltpro-access-accept {

      background: #38bdf8;

      color: #071625;

      border-color:
        #38bdf8 !important;
    }


    #appClientAccessError {

      display: none;

      margin-top: 10px;

      color: #b91c1c;

      font-weight: 700;
    }


    @media
      (max-width: 520px) {

      .beltpro-access-actions {

        flex-direction:
          column-reverse;
      }

      .beltpro-access-actions button {

        width: 100%;
      }

    }

  `;


  document.head.appendChild(style);


  document.body.insertAdjacentHTML(
    "beforeend",
    `

    <!-- ============================= -->
    <!-- ENGINEERING DISCLAIMER -->
    <!-- ============================= -->

    <div
      class="beltpro-access-backdrop"
      id="appEngineeringDisclaimer"
      role="dialog"
      aria-modal="true"
    >

      <div
        class="beltpro-access-dialog"
      >

        <h2>
          Engineering Disclaimer
        </h2>


        <p>

          The engineering calculators
          provided by BELTPRO are
          intended for preliminary
          engineering estimates and
          reference purposes only.

        </p>


        <p>

          BELTPRO makes no warranty
          regarding the accuracy,
          completeness, or suitability
          of these calculations for
          any specific application.

        </p>


        <p>

          The user assumes full
          responsibility for verifying
          all calculated values before
          using them for design,
          equipment modification,
          procurement, operation,
          maintenance, or safety-related
          decisions.

        </p>


        <p>

          Always verify results against
          equipment specifications,
          manufacturer recommendations,
          and accepted engineering
          practices before
          implementation.

        </p>


        <div
          class="beltpro-access-actions"
        >

          <button
            class="beltpro-access-cancel"
            id="appDisclaimerCancel"
            type="button"
          >
            Cancel
          </button>


          <button
            class="beltpro-access-accept"
            id="appDisclaimerAccept"
            type="button"
          >
            I Understand
          </button>

        </div>

      </div>

    </div>



    <!-- ============================= -->
    <!-- CLIENT ACCESS -->
    <!-- ============================= -->

    <div
      class="beltpro-access-backdrop"
      id="appClientAccessModal"
      role="dialog"
      aria-modal="true"
    >

      <div
        class="beltpro-access-dialog"
      >

        <h2>
          Client Access
        </h2>


        <p>

          Enter the Client Access Code
          provided by BELTPRO.

        </p>


        <label
          for="appClientAccessCode"
          style="
            display:block;
            margin-bottom:7px;
            font-weight:800;
            color:#082f49;
          "
        >
          Client Access Code
        </label>


        <input
          id="appClientAccessCode"
          type="password"
          autocomplete="off"
          spellcheck="false"
          placeholder="••••••••••"
        >


        <p
          id="appClientAccessError"
        ></p>


        <div
          class="beltpro-access-actions"
        >

          <button
            class="beltpro-access-cancel"
            id="appClientAccessCancel"
            type="button"
          >
            Cancel
          </button>


          <button
            class="beltpro-access-accept"
            id="appClientAccessSubmit"
            type="button"
          >
            Access Calculators
          </button>

        </div>

      </div>

    </div>

    `
  );


  const disclaimer =
    document.getElementById(
      "appEngineeringDisclaimer"
    );


  const accessModal =
    document.getElementById(
      "appClientAccessModal"
    );


  // --------------------------------------------------------
  // DISCLAIMER CANCEL
  // --------------------------------------------------------

  document
    .getElementById(
      "appDisclaimerCancel"
    )
    .addEventListener(
      "click",
      () => {

        disclaimer.classList.remove(
          "show"
        );

        pendingAppCalculatorHref = "";

      }
    );


  // --------------------------------------------------------
  // DISCLAIMER ACCEPT
  // --------------------------------------------------------

  document
    .getElementById(
      "appDisclaimerAccept"
    )
    .addEventListener(
      "click",
      async () => {

        disclaimer.classList.remove(
          "show"
        );


        if (
          await appHasValidClientAccess()
        ) {

          openPendingAppCalculator();

        } else {

          openAppClientAccess();

        }

      }
    );


  // --------------------------------------------------------
  // CLIENT ACCESS CANCEL
  // --------------------------------------------------------

  document
    .getElementById(
      "appClientAccessCancel"
    )
    .addEventListener(
      "click",
      () => {

        accessModal.classList.remove(
          "show"
        );

        pendingAppCalculatorHref = "";

      }
    );


  // --------------------------------------------------------
  // CLIENT ACCESS SUBMIT
  // --------------------------------------------------------

  document
    .getElementById(
      "appClientAccessSubmit"
    )
    .addEventListener(
      "click",
      validateAppClientAccess
    );


  // Allow ENTER key
  document
    .getElementById(
      "appClientAccessCode"
    )
    .addEventListener(
      "keydown",
      (event) => {

        if (
          event.key === "Enter"
        ) {

          event.preventDefault();

          validateAppClientAccess();

        }

      }
    );


  // Close disclaimer when clicking background
  disclaimer.addEventListener(
    "click",
    (event) => {

      if (
        event.target === disclaimer
      ) {

        disclaimer.classList.remove(
          "show"
        );

        pendingAppCalculatorHref = "";

      }

    }
  );


  // Close access window when clicking background
  accessModal.addEventListener(
    "click",
    (event) => {

      if (
        event.target === accessModal
      ) {

        accessModal.classList.remove(
          "show"
        );

        pendingAppCalculatorHref = "";

      }

    }
  );
}


// ==========================================================
// OPEN DESTINATION AFTER ACCESS
// ==========================================================

function openPendingAppCalculator() {

  if (
    !pendingAppCalculatorHref
  ) {
    return;
  }


  const href =
    pendingAppCalculatorHref;


  pendingAppCalculatorHref = "";


  // If the user has just unlocked
  // a calculator category, reveal
  // the calculator names instead
  // of navigating somewhere else.

  if (
    href ===
    "__REVEAL_CATEGORY__"
  ) {

    revealProtectedCalculatorContent();

    return;
  }


  window.location.href = href;
}


// ==========================================================
// OPEN CLIENT ACCESS WINDOW
// ==========================================================

function openAppClientAccess() {

  const modal =
    document.getElementById(
      "appClientAccessModal"
    );


  const input =
    document.getElementById(
      "appClientAccessCode"
    );


  const error =
    document.getElementById(
      "appClientAccessError"
    );


  input.value = "";


  error.textContent = "";

  error.style.display =
    "none";


  modal.classList.add(
    "show"
  );


  setTimeout(
    () => input.focus(),
    50
  );
}


// ==========================================================
// VALIDATE CLIENT CODE WITH RENDER
// ==========================================================

async function validateAppClientAccess() {

  const input =
    document.getElementById(
      "appClientAccessCode"
    );


  const error =
    document.getElementById(
      "appClientAccessError"
    );


  const button =
    document.getElementById(
      "appClientAccessSubmit"
    );


  const code =
    input.value;


  if (!code) {

    error.textContent =
      appClientAccessMessage(
        "invalid"
      );

    error.style.display =
      "block";

    return;
  }


  button.disabled = true;

  error.style.display =
    "none";


  try {

    const response =
      await fetch(

        CLIENT_ACCESS_API +
          "/client-access/validate",

        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify({
              code
            })

        }

      );


    const data =
      await response
        .json()
        .catch(
          () => ({})
        );


    if (
      !response.ok ||
      !data.ok ||
      !data.token
    ) {

      error.textContent =
        response.status === 401
          ? appClientAccessMessage(
              "invalid"
            )
          : appClientAccessMessage(
              "unavailable"
            );


      error.style.display =
        "block";


      return;
    }


    try {

      localStorage.setItem(

        CLIENT_ACCESS_TOKEN_KEY,

        data.token

      );

    } catch (
      storageError
    ) {}


    document
      .getElementById(
        "appClientAccessModal"
      )
      .classList.remove(
        "show"
      );


    openPendingAppCalculator();


  } catch (
    requestError
  ) {


    error.textContent =
      appClientAccessMessage(
        "unavailable"
      );


    error.style.display =
      "block";


  } finally {


    button.disabled =
      false;

  }
}


// ==========================================================
// REVEAL CALCULATOR CATEGORY
// ==========================================================

function revealProtectedCalculatorContent() {

  const content =
    document.getElementById(
      "protectedCalculatorContent"
    );


  if (content) {

    content.hidden = false;

  }
}


// ==========================================================
// PROTECT CATEGORY PAGES
// ==========================================================

async function activateAppCalculatorAccess() {

  ensureAppAccessUI();


  const protectedContent =
    document.getElementById(
      "protectedCalculatorContent"
    );


  // --------------------------------------------------------
  // APP HOME PAGE
  //
  // There is no protected calculator
  // list on index.html.
  //
  // Therefore the four categories
  // remain visible normally.
  // --------------------------------------------------------

  if (!protectedContent) {

    return;

  }


  // --------------------------------------------------------
  // CATEGORY PAGE
  //
  // Hide calculator names immediately.
  // --------------------------------------------------------

  protectedContent.hidden =
    true;


  // --------------------------------------------------------
  // If the client already has a valid
  // token, reveal calculator names.
  // --------------------------------------------------------

  if (
    await appHasValidClientAccess()
  ) {

    revealProtectedCalculatorContent();

    return;

  }


  // --------------------------------------------------------
  // No valid client access.
  //
  // First show disclaimer.
  // After acceptance, ask for the
  // Client Access Code.
  // --------------------------------------------------------

  pendingAppCalculatorHref =
    "__REVEAL_CATEGORY__";


  document
    .getElementById(
      "appEngineeringDisclaimer"
    )
    .classList.add(
      "show"
    );
}


// ==========================================================
// START
// ==========================================================

window.addEventListener(
  "DOMContentLoaded",
  activateAppCalculatorAccess
);
