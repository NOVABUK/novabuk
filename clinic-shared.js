// ================================================================
// clinic-shared.js
// Load FIRST on every clinic page.
// Uses the SAME token and user that sign-in.html sets —
// no separate clinic login needed.
// ================================================================

const API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://novabuk-backend.onrender.com/api";

const CLINIC_API = `${API_BASE}/clinic`;
const API_URL = API_BASE;

// Attach to window for global access across all pages
window.API_BASE = API_BASE;
window.API_URL = API_URL;
window.CLINIC_API = CLINIC_API;

// ── STAFF DROPDOWN ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const icon = document.getElementById("staffChip");
  const staffDropdown = document.getElementById("staffDropdown");
  const toggleIcon = document.getElementById("staffIcon");

  if (icon && staffDropdown) {
    icon.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      staffDropdown.classList.toggle("open");

      if (toggleIcon) {
        if (staffDropdown.classList.contains("open")) {
          toggleIcon.classList.remove("fa-angle-down");
          toggleIcon.classList.add("fa-angle-up");
        } else {
          toggleIcon.classList.remove("fa-angle-up");
          toggleIcon.classList.add("fa-angle-down");
        }
      }
    });

    // Close dropdown when clicking anywhere else
    document.addEventListener("click", () => {
      staffDropdown.classList.remove("open");
      if (toggleIcon) {
        toggleIcon.classList.remove("fa-angle-up");
        toggleIcon.classList.add("fa-angle-down");
      }
    });
  }
});

// ── AUTH GUARD ────────────────────────────────────────────────
// Runs immediately on every clinic page load.
// Handles TWO different account shapes stored under "novabuk_user":
//   1. The clinic OWNER — a User document (role: "Doctors"), has an
//      isVerified field (email OTP applies), stores clinicId as a flat
//      string field.
//   2. ClinicStaff — doctors/nurses/receptionists/pharmacists/lab techs
//      added via /clinic-auth/my-staff. NEVER has an isVerified field
//      at all (no OTP flow exists for these accounts — they're
//      activated immediately by whoever added them). Stores clinic as
//      a nested object: { id, name }, not flat clinicId/clinicName.
//
// BUG THIS FIXES: previously this guard checked `!user.isVerified` for
// EVERY account type. Since ClinicStaff objects never have that field,
// `!undefined` is always true — so every single ClinicStaff login was
// being force-redirected to verify-otp.html, which has no way to
// verify a ClinicStaff account in the first place (verify-otp.html
// only knows how to verify User/patient accounts). Right after that,
// the old `user.role !== "Doctors"` check would ALSO have bounced any
// ClinicStaff member (role is lowercase "doctor"/"nurse"/etc, never
// the string "Doctors") to app-home.html — a second, separate bug.
(function clinicAuthGuard() {
  const token =
    localStorage.getItem("novabuk_token") ||
    localStorage.getItem("novabuk_clinic_token");
  const user = JSON.parse(
    localStorage.getItem("novabuk_user") ||
      localStorage.getItem("novabuk_clinic_staff") ||
      "null",
  );

  if (!token || !user) {
    window.location.replace("./sign-in.html");
    return;
  }

  const clinicStaffRoles = ["doctor", "nurse", "receptionist", "pharmacist", "lab_tech", "admin"];
  const isOwnerAccount = user.role === "Doctors";
  const isClinicStaffAccount = clinicStaffRoles.includes(user.role);

  if (isOwnerAccount) {
    // Only the owner's User account goes through email OTP verification.
    if (!user.isVerified) {
      localStorage.setItem("novabuk_verify_email", user.email);
      window.location.replace("./verify-otp.html");
      return;
    }
  } else if (!isClinicStaffAccount) {
    // Not a recognized clinic actor at all (e.g. a plain Patient
    // account landed here somehow) — send them to the patient app.
    window.location.replace("./app-home.html");
    return;
  }
  // isClinicStaffAccount === true: no OTP check, proceed straight through.

  // Fill clinic name — supports BOTH account shapes:
  //   owner:        user.clinicName (flat) / user.clinicId (flat)
  //   ClinicStaff:  user.clinic.name / user.clinic.id (nested)
  function applyClinicName(name) {
    document.querySelectorAll(".clinic-name").forEach((el) => {
      el.textContent = name || "Your Clinic";
    });
  }

  const normalizedClinicId = user.clinicId || user.clinic?.id || user.clinic?._id;
  const normalizedClinicName = user.clinicName || user.clinic?.name;

  if (normalizedClinicName) {
    applyClinicName(normalizedClinicName);
  } else if (normalizedClinicId) {
    // clinicName not available yet — fetch it silently.
    // Uses credentials:"include" so ClinicStaff's cookie auth works
    // here too, not just the owner's Bearer token.
    fetch((window.API_BASE || API_BASE) + "/clinics/my", {
      headers: { Authorization: "Bearer " + token },
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.clinic) {
          const name = data.clinic.name;
          applyClinicName(name);
          // Persist so next page load is instant
          const updated = { ...user, clinicName: name };
          localStorage.setItem("novabuk_user", JSON.stringify(updated));
        }
      })
      .catch(() => {});
  } else {
    // No clinic yet — show placeholder (clinic-register.html will fix this)
    applyClinicName("Your Clinic");
  }

  // Fill .staff-name — the DOCTOR's name (used in the avatar chip, not topbar title)
  document.querySelectorAll(".staff-name").forEach((el) => {
    el.textContent = user.fullName || "";
  });

  // Fill .staff-initial — first letter of doctor's name for avatar circles
  document.querySelectorAll(".staff-initial").forEach((el) => {
    el.textContent = (user.fullName || "D").trim().charAt(0).toUpperCase();
  });

  // ── UPDATE TOPBAR DATE ──────────────────────────────────────
  function updateTopbarDate() {
    const now = new Date();
    const options = { weekday: "short", day: "numeric", month: "short" };
    const text = now.toLocaleDateString("en-NG", options);
    // Use querySelectorAll so BOTH the desktop and mobile-detail copies get filled
    document.querySelectorAll("#topbarDate, .topbar-date").forEach((el) => {
      el.textContent = text;
    });
  }

  // ── UPDATE STAFF AVATAR ─────────────────────────────────────
  function updateStaffAvatar() {
    // Read fresh from localStorage to handle cross-tab sync
    const freshUser = JSON.parse(
      localStorage.getItem("novabuk_user") ||
        localStorage.getItem("novabuk_clinic_staff") ||
        "{}",
    );
    const el =
      document.getElementById("topbarAvatar") ||
      document.getElementById("globalTopbarAvatar");
    if (!el) return;

    if (
      freshUser.avatarUrl &&
      freshUser.avatarUrl !== "null" &&
      freshUser.avatarUrl !== "undefined"
    ) {
      el.innerHTML = `<img src="${freshUser.avatarUrl}" alt="Staff" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" onerror="this.style.display='none'; this.parentElement.textContent='${(freshUser.fullName || "D").trim().charAt(0).toUpperCase()}'">`;
    } else {
      el.textContent = (freshUser.fullName || "D")
        .trim()
        .charAt(0)
        .toUpperCase();
    }
  }

  // Inject Notification Badge CSS
  const style = document.createElement("style");
  style.textContent = `
    .notification-badge {
      position: absolute;
      top: -1px;
      right: -1px;
      width: 10px;
      height: 10px;
      background: #ef4444;
      border: 2px solid #fff;
      border-radius: 50%;
      display: none;
      z-index: 10;
    }
  `;
  document.head.appendChild(style);

  // Run initial updates
  document.addEventListener("DOMContentLoaded", () => {
    updateTopbarDate();
    updateStaffAvatar();
  });

  // Sync avatar if updated in another tab (e.g. Settings)
  window.addEventListener("storage", (e) => {
    if (e.key === "novabuk_user") {
      const updatedUser = JSON.parse(e.newValue || "null");
      if (updatedUser) {
        // Update local user reference for this IIFE
        // We need to re-read it from localStorage because 'user' was const
        const newUser = JSON.parse(
          localStorage.getItem("novabuk_user") || "null",
        );
        if (newUser) {
          // We can't re-assign 'user' if it's const, but we can call updateStaffAvatar
          // and let it re-read from localStorage.
          // Wait, updateStaffAvatar uses 'user' from the outer scope.
          // I should make 'user' a 'let' or have updateStaffAvatar read it fresh.
          updateStaffAvatar();
        }
      }
    }
  });
})();

// ── GLOBAL UI HELPERS ──────────────────────────────────────────
function toggleStaffMenu(event) {
  event.stopPropagation();
  const dropdown = document.getElementById("staffDropdown");
  if (!dropdown) return;
  const isShow = dropdown.classList.contains("show");

  // Close all other dropdowns first if any
  document
    .querySelectorAll(".staff-dropdown")
    .forEach((d) => d.classList.remove("show"));

  if (!isShow) dropdown.classList.add("show");
}

// Close dropdowns on outside click
window.addEventListener("click", () => {
  document
    .querySelectorAll(".staff-dropdown")
    .forEach((d) => d.classList.remove("show"));
});

// ── GET CLINIC ID ─────────────────────────────────────────────
// Returns the clinicId for whoever is logged in — supports BOTH
// account shapes: the owner (User, flat user.clinicId) and
// ClinicStaff (nested user.clinic.id). Previously this only checked
// the flat field, so every ClinicStaff account (nurse, receptionist,
// added doctors) got `null` here — which meant every queue/patient
// fetch silently ran with a missing clinicId and just returned
// nothing, instead of an actual error. That's why the queue showed
// all-zero counts for the nurse account: not "no patients", but
// "no clinicId was ever sent."
function getClinicId() {
  const user = JSON.parse(localStorage.getItem("novabuk_user") || "{}");
  return user.clinicId || user.clinic?.id || user.clinic?._id || null;
}

// ── CLINIC LOGOUT ─────────────────────────────────────────────
// Shows confirmation modal instead of immediate logout.
function clinicLogout() {
  const overlay = document.getElementById("nbLogoutOverlay");
  if (overlay) {
    overlay.classList.add("show");
  } else {
    // Fallback if modal injection failed
    confirmClinicLogout();
  }
}

function closeLogoutModal() {
  const overlay = document.getElementById("nbLogoutOverlay");
  if (overlay) overlay.classList.remove("show");
}

function confirmClinicLogout() {
  localStorage.removeItem("novabuk_token");
  localStorage.removeItem("novabuk_user");
  // The novabuk_recent_patients keys are scoped by clinicId,
  // so they don't need to be manually cleared here unless you want a full wipe.
  window.location.replace("./sign-in.html");
}

// ── AUTHENTICATED FETCH ───────────────────────────────────────
// Use this for all clinic API calls.
// Sends the same Bearer token that patients use — authDoctor
// middleware on the server verifies the role.
async function clinicFetch(url, options = {}) {
  const token =
    localStorage.getItem("novabuk_token") ||
    localStorage.getItem("novabuk_clinic_token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await smartFetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  // 401 = actual session problem (expired/invalid token) — this really
  // does mean "please log in again," so the logout modal is correct.
  if (res.status === 401) {
    clinicLogout();
    throw new Error("Session expired or invalid");
  }

  // 403 = a VALID session that just lacks permission for this specific
  // action (e.g. a receptionist hitting a doctor-only route via
  // requireRole()). This is NOT a session problem — showing the "Log
  // out?" modal here is confusing and wrong. Show a plain toast instead
  // and let the caller decide what to do next.
  if (res.status === 403) {
    let message = "You don't have permission to do that.";
    try {
      const cloned = res.clone();
      const data = await cloned.json();
      if (data?.message) message = data.message;
    } catch (e) {
      // response wasn't JSON — fall back to the generic message above
    }
    if (typeof window.showNetworkToast === "function") {
      window.showNetworkToast(message, false, true);
    }
    throw new Error(message);
  }

  return res;
}

// ── TIME HELPERS ──────────────────────────────────────────────
function formatTime(date) {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function timeAgo(date) {
  if (!date) return "—";
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── AVATAR INITIALS ───────────────────────────────────────────
function avatarInitials(name, size = 40, url = null) {
  if (url) {
    return `<div style="
      width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;
      flex-shrink:0;display:flex;align-items:center;justify-content:center;
      background:#eee;
    ">
      <img src="${url}" alt="${name}" style="width:100%;height:100%;object-fit:cover;">
    </div>`;
  }

  const parts = (name || "?").trim().split(" ");
  const initials =
    parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0][0];
  return `<div style="
    width:${size}px;height:${size}px;background:#d0eff4;color:#0f2027;
    border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-weight:700;font-size:${Math.round(size * 0.38)}px;
    font-family:'Poppins',sans-serif;flex-shrink:0;letter-spacing:-0.5px;
  ">${initials.toUpperCase()}</div>`;
}

// ── STATUS BADGE ──────────────────────────────────────────────
function statusBadge(status) {
  const map = {
    Pending: "background:#fff3cd;color:#856404",
    Confirmed: "background:#d1ecf1;color:#0c5460",
    InProgress: "background:#d4edda;color:#155724",
    Completed: "background:#e2d9f3;color:#6f42c1",
    Cancelled: "background:#f8d7da;color:#721c24",
  };
  const label = status === "InProgress" ? "In Progress" : status;
  return `<span style="display:inline-block;padding:3px 10px;border-radius:20px;
    font-size:10px;font-weight:700;white-space:nowrap;${map[status] || "background:#eee;color:#333"}
  ">${label}</span>`;
}

// ── NOTIFICATIONS ──────────────────────────────────────────────
// Fetches unread count and updates the topbar bell badge.
async function updateNotificationBadge() {
  const badge = document.getElementById("topbarNotificationBadge");
  if (!badge) return;

  try {
    const res = await clinicFetch(`${CLINIC_API}/notifications/unread-count`);
    const data = await res.json();

    if (data.success && data.count > 0) {
      badge.style.display = "block";
    } else {
      badge.style.display = "none";
    }
  } catch (e) {
    // Silent fail
  }
}

// ── INITIALIZATION ──────────────────────────────────────────
function initClinicUI() {
  // 1. Inject Logout Modal
  if (!document.getElementById("nbClinicLogoutModal")) {
    const modal = document.createElement("div");
    modal.id = "nbClinicLogoutModal";
    modal.innerHTML = `
      <div class="nb-logout-overlay" id="nbLogoutOverlay">
        <div class="nb-logout-box">
          <div style="width:60px; height:60px; background:#fff5f5; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; color:#e53e3e; font-size:22px;">
            <i class="fa-solid fa-right-from-bracket"></i>
          </div>
          <h3 style="font-size:18px; font-weight:700; margin-bottom:8px; font-family:'Poppins', sans-serif;">Log out?</h3>
          <p style="font-size:13px; color:#718096; margin-bottom:24px; font-family:'Poppins', sans-serif;">You will need to sign in again to access your clinic portal.</p>
          <div style="display:flex; gap:10px;">
            <button class="btn-cancel-logout" onclick="closeLogoutModal()">Cancel</button>
            <button class="btn-confirm-logout" onclick="confirmClinicLogout()">Yes, Logout</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }

  // 2. Populate Staff Dropdown
  const dropdown = document.getElementById("staffDropdown");
  const user = JSON.parse(localStorage.getItem("novabuk_user") || "{}");
  if (dropdown && user.fullName) {
    const initials = user.fullName.trim().charAt(0).toUpperCase();
    const avatarHtml = user.avatarUrl
      ? `<img src="${user.avatarUrl}" style="width:100%; height:100%; object-fit:cover;">`
      : initials;

    dropdown.innerHTML = `
      <div class="dd-user-block">
        <div class="dd-avatar-sm">${avatarHtml}</div>
        <div class="dd-user-info">
          <div class="dd-name">${user.fullName}</div>
          <div class="dd-email">${user.email || "Clinic Staff"}</div>
        </div>
      </div>
      <div class="dd-divider"></div>
      <div class="staff-dropdown-item" onclick="window.location.href='./clinic-settings.html'">
        <i class="fa-solid fa-gear"></i> Settings
      </div>
      <div class="staff-dropdown-item danger" onclick="clinicLogout()">
        <i class="fa-solid fa-right-from-bracket"></i> Logout
      </div>
    `;
  }

  // 3. Close modal on outside click
  window.addEventListener("click", (e) => {
    const overlay = document.getElementById("nbLogoutOverlay");
    if (e.target === overlay) closeLogoutModal();
  });

  // 4. Update Notifications
  updateNotificationBadge();
}

// Auto-run when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initClinicUI);
} else {
  initClinicUI();
}

// Check notifications every 30 seconds
setInterval(updateNotificationBadge, 30000);

// ── CLINIC NETWORK TOAST ────────────────────────────────────────
// Mirrors the patient-side network toast in script.js.
// Injected here so it works on EVERY clinic page automatically.
// ──────────────────────────────────────────────────────────────
(function initClinicNetworkUI() {
  // 1. Inject the CSS (clinic pages use clinic.css, not styles-app.css)
  if (!document.getElementById("clinicToastStyle")) {
    const style = document.createElement("style");
    style.id = "clinicToastStyle";
    style.textContent = `
      .clinic-network-toast {
        position: fixed;
        top: -60px;
        left: 50%;
        transform: translateX(-50%);
        background: #323232;
        color: white;
        padding: 10px 24px;
        border-radius: 8px;
        font-family: 'Poppins', sans-serif;
        font-size: 13px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.18);
        z-index: 99999;
        transition: top 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        pointer-events: none;
        white-space: nowrap;
      }
      .clinic-network-toast.show { top: 20px; }
      .clinic-network-toast.offline { background: #323232; }
      .clinic-network-toast.online  { background: #2e7d32; }
      .clinic-network-toast.warning { background: #b45309; }
      .clinic-network-toast i { font-size: 15px; }
    `;
    document.head.appendChild(style);
  }

  // 2. Create the toast element (wait for body)
  function createToast() {
    if (document.getElementById("clinicNetworkToast")) return;
    const toast = document.createElement("div");
    toast.id = "clinicNetworkToast";
    toast.className = "clinic-network-toast";
    document.body.appendChild(toast);
    return toast;
  }

  let toastTimeout;

  function showClinicToast(message, isOnline, forceVisible = false) {
    const toast =
      document.getElementById("clinicNetworkToast") || createToast();
    if (!toast) return;

    clearTimeout(toastTimeout);

    let icon, cls;
    if (isOnline === true) {
      icon = "fa-wifi";
      cls = "online";
    } else if (isOnline === "warning") {
      icon = "fa-triangle-exclamation";
      cls = "warning";
    } else {
      icon = "fa-cloud-showers-water";
      cls = "offline";
    }

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    toast.className = `clinic-network-toast show ${cls}`;

    // Every toast auto-hides — forced states (offline / syncing /
    // conflict warnings) just get a bit longer (6s) so there's time to
    // read them, instead of sticking around indefinitely.
    const timeoutMs = forceVisible ? 6000 : 3500;
    toastTimeout = setTimeout(() => {
      // Reset fully, not just "show" — some page-level CSS matches
      // .offline/.online alone (without requiring .show), so leftover
      // state classes can keep the toast visibly pinned even with
      // "show" removed. Wiping back to the base class avoids that.
      toast.className = "clinic-network-toast";
    }, timeoutMs);
  }

  // Expose to window so db.js sync conflict alerts also use this
  window.showNetworkToast = showClinicToast;

  // 3. Flush the outbox when we can. `announce` gates whether this run
  // is allowed to show a toast — background flushes stay silent, only a
  // real connectivity change gets to speak up.
  async function trySync(announce) {
    if (typeof window.getOutboxCount !== "function") return false;
    const count = await window.getOutboxCount();
    if (count > 0 && navigator.onLine) {
      if (announce) showClinicToast(`Syncing ${count} pending item(s)…`, true, true);
      if (typeof window.syncOutbox === "function") await window.syncOutbox();
      return true;
    }
    return false;
  }

  // 4. Toast ONLY on a real connectivity transition — never on a timer,
  // never on window focus, and never just because a new page loaded
  // while everything was fine.
  window.addEventListener("offline", () => {
    showClinicToast("You are offline. Changes will be saved and synced later.", false, true);
  });

  window.addEventListener("online", async () => {
    const hadPending = await trySync(true);
    showClinicToast(hadPending ? "All data synced successfully!" : "Back online.", true, false);
  });

  // 5. Run once DOM is ready — create the toast element, and either
  // announce we're offline right now, or quietly try a sync in case
  // something is already pending (don't make it wait for the next
  // online/focus event).
  function initOnReady() {
    createToast();
    if (!navigator.onLine) {
      showClinicToast("You are offline. Changes will be saved and synced later.", false, true);
    } else {
      trySync(false);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initOnReady);
  } else {
    setTimeout(initOnReady, 50);
  }

  // 6. Keep flushing the outbox in the background so pending items
  // don't just sit there. The "online" event is the primary trigger,
  // but it's known to be unreliable on some mobile browsers/WebViews
  // (reflects "network interface up," not "internet actually
  // reachable," and can be missed or delayed) — this short interval is
  // the catch-up net so staff never have to refresh to see a sync happen.
  setInterval(() => trySync(false), 5000);

  // 7. Quietly retry whenever the window/tab regains focus or comes back
  // to the foreground — "focus" alone can miss mobile/PWA app-switching,
  // so visibilitychange backs it up.
  window.addEventListener("focus", () => trySync(false));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") trySync(false);
  });
})();
// ── REGISTER SERVICE WORKER FOR CLINIC PAGES ──────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) =>
        console.log("[Service Worker] Registered on clinic page!", reg),
      )
      .catch((err) =>
        console.log("[Service Worker] Clinic registration failed:", err),
      );
  });
}