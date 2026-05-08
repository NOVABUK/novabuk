// ================================================================
// clinic-shared.js
// Load FIRST on every clinic page.
// Uses the SAME token and user that sign-in.html sets —
// no separate clinic login needed.
// ================================================================

const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5000/api"
  : "https://novabuk-backend.onrender.com/api";

const CLINIC_API = `${API_BASE}/clinic`;
const API_URL    = API_BASE;

// Attach to window for global access across all pages
window.API_BASE   = API_BASE;
window.API_URL    = API_URL;
window.CLINIC_API = CLINIC_API;

// ── STAFF DROPDOWN ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const icon = document.getElementById('staffChip');
  const staffDropdown = document.getElementById('staffDropdown');
  const toggleIcon = document.getElementById('staffIcon');

  if (icon && staffDropdown) {
    icon.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      staffDropdown.classList.toggle('open');

      if (toggleIcon) {
        if (staffDropdown.classList.contains('open')) {
          toggleIcon.classList.remove('fa-angle-down');
          toggleIcon.classList.add('fa-angle-up');
        } else {
          toggleIcon.classList.remove('fa-angle-up');
          toggleIcon.classList.add('fa-angle-down');
        }
      }
    });

    // Close dropdown when clicking anywhere else
    document.addEventListener("click", () => {
      staffDropdown.classList.remove("open");
      if (toggleIcon) {
        toggleIcon.classList.remove('fa-angle-up');
        toggleIcon.classList.add('fa-angle-down');
      }
    });
  }
});



// ── AUTH GUARD ────────────────────────────────────────────────
// Runs immediately on every clinic page load.
// Checks: 1) logged in at all  2) role is Doctors
(function clinicAuthGuard() {
  const token = localStorage.getItem("novabuk_token") || localStorage.getItem("novabuk_clinic_token");
  const user  = JSON.parse(localStorage.getItem("novabuk_user") || localStorage.getItem("novabuk_clinic_staff") || "null");

  if (!token || !user) {
    window.location.replace("./sign-in.html");
    return;
  }

  // If not verified, force them to the OTP page
  if (!user.isVerified) {
    localStorage.setItem("novabuk_verify_email", user.email);
    window.location.replace("./verify-otp.html");
    return;
  }

  if (user.role !== "Doctors") {
    window.location.replace("./app-home.html");
    return;
  }

  // Fill clinic name — use clinicName from localStorage.
  // If missing (older account), fetch from API and update localStorage.
  function applyClinicName(name) {
    document.querySelectorAll(".clinic-name").forEach(el => {
      el.textContent = name || "Your Clinic";
    });
  }

  if (user.clinicName) {
    applyClinicName(user.clinicName);
  } else if (user.clinicId) {
    // clinicName not in localStorage yet — fetch it silently
    fetch(
      (window.API_BASE || API_BASE) + "/clinics/my",
      { headers: { Authorization: "Bearer " + token }, credentials: "include" }
    )
      .then(r => r.json())
      .then(data => {
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
  document.querySelectorAll(".staff-name").forEach(el => {
    el.textContent = user.fullName || "";
  });

  // Fill .staff-initial — first letter of doctor's name for avatar circles
  document.querySelectorAll(".staff-initial").forEach(el => {
    el.textContent = (user.fullName || "D").trim().charAt(0).toUpperCase();
  });

  // ── UPDATE TOPBAR DATE ──────────────────────────────────────
  function updateTopbarDate() {
    const now = new Date();
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    const text = now.toLocaleDateString('en-NG', options);
    // Use querySelectorAll so BOTH the desktop and mobile-detail copies get filled
    document.querySelectorAll("#topbarDate, .topbar-date").forEach(el => {
      el.textContent = text;
    });
  }
  
  // ── UPDATE STAFF AVATAR ─────────────────────────────────────
  function updateStaffAvatar() {
    // Read fresh from localStorage to handle cross-tab sync
    const freshUser = JSON.parse(localStorage.getItem("novabuk_user") || localStorage.getItem("novabuk_clinic_staff") || "{}");
    const el = document.getElementById("topbarAvatar") || document.getElementById("globalTopbarAvatar");
    if (!el) return;
    
    if (freshUser.avatarUrl && freshUser.avatarUrl !== "null" && freshUser.avatarUrl !== "undefined") {
      el.innerHTML = `<img src="${freshUser.avatarUrl}" alt="Staff" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" onerror="this.style.display='none'; this.parentElement.textContent='${(freshUser.fullName || "D").trim().charAt(0).toUpperCase()}'">`;
    } else {
      el.textContent = (freshUser.fullName || "D").trim().charAt(0).toUpperCase();
    }
  }

  // Inject Notification Badge CSS
  const style = document.createElement('style');
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
        const newUser = JSON.parse(localStorage.getItem("novabuk_user") || "null");
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
  document.querySelectorAll(".staff-dropdown").forEach(d => d.classList.remove("show"));
  
  if (!isShow) dropdown.classList.add("show");
}

// Close dropdowns on outside click
window.addEventListener("click", () => {
  document.querySelectorAll(".staff-dropdown").forEach(d => d.classList.remove("show"));
});


// ── GET CLINIC ID ─────────────────────────────────────────────
// Returns the clinicId the doctor is associated with.
// Stored in localStorage when the doctor sets up their profile.
// Falls back to null if not set.
function getClinicId() {
  const user = JSON.parse(localStorage.getItem("novabuk_user") || "{}");
  return user.clinicId || null;
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
  const token = localStorage.getItem("novabuk_token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401 || res.status === 403) {
    clinicLogout();
    throw new Error("Session expired or access denied");
  }

  return res;
}


// ── TIME HELPERS ──────────────────────────────────────────────
function formatTime(date) {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function timeAgo(date) {
  if (!date) return "—";
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
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

  const parts    = (name || "?").trim().split(" ");
  const initials = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : parts[0][0];
  return `<div style="
    width:${size}px;height:${size}px;background:#d0eff4;color:#0f2027;
    border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-weight:700;font-size:${Math.round(size*0.38)}px;
    font-family:'Poppins',sans-serif;flex-shrink:0;letter-spacing:-0.5px;
  ">${initials.toUpperCase()}</div>`;
}


// ── STATUS BADGE ──────────────────────────────────────────────
function statusBadge(status) {
  const map = {
    Pending:    "background:#fff3cd;color:#856404",
    Confirmed:  "background:#d1ecf1;color:#0c5460",
    InProgress: "background:#d4edda;color:#155724",
    Completed:  "background:#e2d9f3;color:#6f42c1",
    Cancelled:  "background:#f8d7da;color:#721c24",
  };
  const label = status === "InProgress" ? "In Progress" : status;
  return `<span style="display:inline-block;padding:3px 10px;border-radius:20px;
    font-size:10px;font-weight:700;white-space:nowrap;${map[status]||"background:#eee;color:#333"}
  ">${label}</span>`;
}


// ── NOTIFICATIONS ──────────────────────────────────────────────
// Fetches unread count and updates the topbar bell badge.
async function updateNotificationBadge() {
  const badge = document.getElementById("topbarNotificationBadge");
  if (!badge) return;

  try {
    const res = await clinicFetch(`${API_BASE}/notifications/unread-count`);
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
          <div class="dd-email">${user.email || 'Clinic Staff'}</div>
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
