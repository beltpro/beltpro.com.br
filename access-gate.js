/*
 * BELTPRO client access gate
 * ---------------------------------------------------------
 * Place this file at the ROOT of every site/domain that needs
 * to be protected (same folder as your main index.html, and
 * again at the root of the app/PWA if it lives on a different
 * domain or subdomain — browser storage does not share across
 * different origins).
 *
 * Include it near the top of <head> on every page you want
 * gated, before any other script that needs it:
 *   <script src="/access-gate.js"></script>
 *
 * The actual code is no longer checked here — it's verified
 * by the /verify-access endpoint in app.py. This file just
 * calls that endpoint and stores the token it returns.
 */
(function (window) {
  "use strict";

  // >>> SET THIS to your Flask API's base URL (the same one your
  // calculator pages already call for /calculate, /cycles, etc.),
  // e.g. "https://your-app-name.onrender.com" — no trailing slash.
  var API_BASE_URL = "https://spiral-tension-api.onrender.com";

  var STORAGE_KEY = "beltpro_access_token";
  var GATE_PAGE = "/client-access.html";

  function hasAccess() {
    try {
      return !!window.localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return false;
    }
  }

  function grantAccess(token) {
    try {
      window.localStorage.setItem(STORAGE_KEY, token);
    } catch (err) {
      /* localStorage unavailable (e.g. private browsing) - ignore */
    }
  }

  function clearAccess() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      /* ignore */
    }
  }

  function redirectToGate(returnUrl) {
    var target = GATE_PAGE + "?return=" + encodeURIComponent(returnUrl || window.location.href);
    window.location.href = target;
  }

  // Calls app.py to check the code. Resolves true/false — never
  // throws, so callers don't need try/catch.
  function verifyCode(code) {
    return fetch(API_BASE_URL + "/verify-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code })
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return { ok: response.ok, data: data };
        });
      })
      .then(function (result) {
        if (result.ok && result.data && result.data.valid && result.data.token) {
          grantAccess(result.data.token);
          return true;
        }
        return false;
      })
      .catch(function () {
        // Network/API error - treat as not verified rather than
        // throwing, so the page can show a clear error message.
        return false;
      });
  }

  window.BeltproAccess = {
    hasAccess: hasAccess,
    grantAccess: grantAccess,
    clearAccess: clearAccess,
    redirectToGate: redirectToGate,
    verifyCode: verifyCode,
    STORAGE_KEY: STORAGE_KEY
  };
})(window);
