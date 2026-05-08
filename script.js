// ================================================================
// GLOBAL UTILITIES
// ================================================================

// Dynamic API URL based on environment
var API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5000/api"
  : "https://novabuk-backend.onrender.com/api";

function isClinicOpenNow(clinic) {
  if (!clinic) return false;
  
  // 1. Check global status first. If manually set to Closed, return false immediately.
  if (clinic.isOpen === false) return false;
  
  // 2. If no operating hours are set at all, trust the global toggle
  if (!clinic.openingHours) return clinic.isOpen !== false;

  const now = new Date();
  const dayIndex = now.getDay(); // 0=Sun, 1=Mon...6=Sat
  const daysMap = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const currentDay = daysMap[dayIndex];
  
  const hours = clinic.openingHours[currentDay];

  // If no hours set for this specific day, fallback to global status
  if (!hours || !hours.open || !hours.close) return clinic.isOpen !== false;

  // Robust time parser
  const parseTime = (str) => {
    if (!str) return null;
    let [h, m] = str.split(":").map(Number);
    if (isNaN(h)) return null;
    m = isNaN(m) ? 0 : m;

    // Handle PM/AM strings if they exist
    const s = str.toLowerCase();
    if (s.includes("pm") && h < 12) h += 12;
    if (s.includes("am") && h === 12) h = 0;

    return h * 60 + m;
  };

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = parseTime(hours.open);
  let endMinutes = parseTime(hours.close);

  if (startMinutes === null || endMinutes === null) return clinic.isOpen !== false;

  // SMART GUESS: If end time is before start time (e.g. 9:00 to 3:55), 
  // and end time is less than 12:00 PM (720 mins), assume they meant PM.
  if (endMinutes < startMinutes && endMinutes < 720) {
    endMinutes += 720; 
  }
  
  // Special case: Overnight clinics (e.g. 22:00 to 06:00)
  if (endMinutes < startMinutes) {
    // If current time is after start OR before end, it's open
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

const profileBtn = document.getElementById("userProfileBtn");
const dropdownMenu = document.getElementById("settingsDropdown");
// Added a check here to prevent the 'querySelector' error if button is missing
const icon = profileBtn ? profileBtn.querySelector("i") : null;

if (profileBtn && dropdownMenu && icon) {
  profileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle("show");
    icon.classList.toggle("fa-angle-down");
    icon.classList.toggle("fa-angle-up");
  });
}
// --- UNIVERSAL NAVIGATION LOGIC ---

// 1. Handle Active Link Highlighting (Fixes the Redirect/Active issue)
function updateActiveLinks() {
  const allNavLinks = document.querySelectorAll(".nav-menu a");
  // Get current filename (e.g., 'about.html')
  const currentPath = window.location.pathname.split("/").pop() || "index.html";

  allNavLinks.forEach((link) => {
    const linkHref = link.getAttribute("href");
    if (!linkHref) return;
    
    // Clean the href for comparison
    const cleanHref = linkHref.replace("./", "");
    
    if (cleanHref === currentPath) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

// 2. Mobile Toggle Logic (Handles both Navbars correctly)
document.addEventListener("click", (e) => {
  // Check if we clicked the toggle button or an icon inside it
  const toggleBtn = e.target.closest("#navToggle");
  
  if (toggleBtn) {
    e.preventDefault();
    e.stopPropagation();
    
    // Find the specific navbar this button belongs to
    const parentNav = toggleBtn.closest('.navbar');
    const navMenu = parentNav.querySelector(".nav-menu");
    const icon = toggleBtn.querySelector("i");

    if (navMenu) {
      navMenu.classList.toggle("open");
      
      // Update the icon specifically for this button
      if (icon) {
        if (navMenu.classList.contains("open")) {
          icon.classList.replace("fa-bars", "fa-times");
        } else {
          icon.classList.replace("fa-times", "fa-bars");
        }
      }
    }
  } else {
    // Close any open menus if clicking outside
    document.querySelectorAll(".nav-menu.open").forEach(menu => {
      menu.classList.remove("open");
      const navIcon = menu.closest('.navbar').querySelector("#navToggle i");
      if (navIcon) navIcon.classList.replace("fa-times", "fa-bars");
    });
  }
});

// Run highlighting on load
updateActiveLinks();

const navLinks = document.getElementById("navMenu");
const navIcon = document.getElementById("navToggleIcon");
const iconBar = navIcon ? navIcon.querySelector("i") : null;

// Wire logged-out hamburger (navToggleIcon) click
if (navIcon) {
  navIcon.addEventListener("click", function(e) {
    e.stopPropagation();
    const menu = document.getElementById("navMenu");
    if (!menu) return;
    const isOpen = !menu.classList.contains("open");
    menu.classList.toggle("open", isOpen);
    menu.style.display = isOpen ? "block" : "none";
    if (iconBar) {
      iconBar.classList.toggle("fa-bars", !isOpen);
      iconBar.classList.toggle("fa-xmark", isOpen);
    }
  });
}

// Close menu when a nav link is clicked
if (navLinks) {
  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navLinks.style.display = "";
      if (iconBar) {
        iconBar.classList.remove("fa-xmark");
        iconBar.classList.add("fa-bars");
      }
    });
  });
}

const heroButtons = document.querySelectorAll(".button a");

heroButtons.forEach((button) => {
  button.addEventListener("click", function (e) {
    heroButtons.forEach((btn) => btn.classList.remove("active"));
    this.classList.add("active");
  });
});

// function toggleMenu() {
//   const menu = document.getElementById("navMenu");
//   if (!menu || !navToggleBtn || !navToggleIcon) return;

//   menu.classList.toggle("open");
//   const isMenuOpen = menu.classList.contains("open");

//   if (isMenuOpen) {
//     navToggleIcon.classList.remove("fa-bars");
//     navToggleIcon.classList.add("fa-xmark");
//     navToggleBtn.setAttribute("aria-expanded", "true");
//   } else {
//     navToggleIcon.classList.remove("fa-xmark");
//     navToggleIcon.classList.add("fa-bars");
//     navToggleBtn.setAttribute("aria-expanded", "false");
//   }

//   if (window.innerWidth <= 1023) {
//     menu.style.display = isMenuOpen ? "block" : "none";
//   } else {
//     menu.style.display = "";
//   }
// }
function setMenuState(isOpen, clickedButton) {
  const navMenu = document.getElementById("navMenu");
}





// ── LOGGED OUT HAMBURGER MENU (Desktop) ──────────────────
(function initLoggedOutMenu() {
  const loggedoutHamburger = document.getElementById("loggedoutHamburger");

})();

const mvpToggle = document.getElementById("mvp-toggle");
const aiToggle = document.getElementById("ai-toggle");
const mvpContent = document.getElementById("mvp-content");
const aiContent = document.getElementById("ai-content");

if (mvpToggle && aiToggle && mvpContent && aiContent) {
  function setActive(
    selectedToggle,
    unselectedToggle,
    selectedContent,
    unselectedContent,
  ) {
    selectedToggle.classList.add("active");
    unselectedToggle.classList.remove("active");
    selectedContent.classList.add("active-content");
    unselectedContent.classList.remove("active-content");
  }

  mvpToggle.addEventListener("click", () => {
    setActive(mvpToggle, aiToggle, mvpContent, aiContent);
  });

  aiToggle.addEventListener("click", () => {
    setActive(aiToggle, mvpToggle, aiContent, mvpContent);
  });
}

// ── FIXING THE PASSWORD TOGGLE ERRORS ──
const togglePwd = document.getElementById("togglePassword");
const pwd = document.getElementById("signinPassword");
const signPwd = document.getElementById("signupPassword");
const confirmToggle = document.getElementById("togglePwdConfirm");
const confirmPwd = document.getElementById("signupConfirm");

// Only add listeners if BOTH the eye icon and the password field exist
if (togglePwd) {
  if (pwd) {
    togglePwd.addEventListener("click", () => {
      if (pwd.type === "password") {
        pwd.type = "text";
        togglePwd.classList.remove("fa-eye");
        togglePwd.classList.add("fa-eye-slash");
      } else {
        pwd.type = "password";
        togglePwd.classList.remove("fa-eye-slash");
        togglePwd.classList.add("fa-eye");
      }
    });
  }

  if (signPwd) {
    togglePwd.addEventListener("click", () => {
      if (signPwd.type === "password") {
        signPwd.type = "text";
        togglePwd.classList.remove("fa-eye");
        togglePwd.classList.add("fa-eye-slash");
      } else {
        signPwd.type = "password";
        togglePwd.classList.remove("fa-eye-slash");
        togglePwd.classList.add("fa-eye");
      }
    });
  }
}
// Guard: these elements only exist on sign-up page
if (confirmToggle && confirmPwd) {
  confirmToggle.addEventListener("click", () => {
    if (confirmPwd.type === "password") {
      confirmPwd.type = "text";
      confirmToggle.classList.remove("fa-eye");
      confirmToggle.classList.add("fa-eye-slash");
    } else {
      confirmPwd.type = "password";
      confirmToggle.classList.remove("fa-eye-slash");
      confirmToggle.classList.add("fa-eye");
    }
  });
}

const checkbox = document.getElementById("agreeTerms");
const signUpBtn = document.getElementById("signupBtn");

if (checkbox && signUpBtn) {
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      signUpBtn.classList.add("pop");
    } else {
      signUpBtn.classList.remove("pop");
    }
  });
}

// ============================================================
// NOVABUK — PERSISTENT NAV BUTTONS FOR ALL APP PAGES
// ============================================================

// Call this any time avatarUrl changes in localStorage (upload, save, etc.)
window.refreshNavAvatar = function () {
  const navAvatarEl = document.getElementById("navAvatar");
  if (!navAvatarEl) return;
  const user = JSON.parse(localStorage.getItem("novabuk_user") || "{}");
  if (!user.fullName) return;
  if (user.avatarUrl && user.avatarUrl !== "null" && user.avatarUrl !== "undefined") {
    navAvatarEl.innerHTML = `<img src="${user.avatarUrl}" alt="avatar" style="width:100%;height:100%;object-fit:cover;object-position:center top; border-radius:50%;" onerror="this.style.display='none'; this.parentElement.textContent='${user.fullName.trim().charAt(0).toUpperCase()}'" />`;
    navAvatarEl.style.padding = "0";
    navAvatarEl.style.fontSize = "0";
    navAvatarEl.style.overflow = "hidden";
  } else {
    navAvatarEl.innerHTML = "";
    navAvatarEl.textContent = user.fullName.trim().charAt(0).toUpperCase();
    navAvatarEl.style.padding = "";
    navAvatarEl.style.fontSize = "";
    navAvatarEl.style.overflow = "";
  }
};

(function initAppNav() {
  const profileBtn = document.getElementById("userProfileBtn");
  const navAvatarEl = document.getElementById("navAvatar");

  if (!profileBtn) return;

  const user = JSON.parse(localStorage.getItem("novabuk_user") || "{}");

  // Show initials immediately from localStorage (instant, no flicker)
  if (navAvatarEl && user.fullName) {
    if (user.avatarUrl) {
      navAvatarEl.innerHTML = `<img src="${user.avatarUrl}" alt="avatar" style="width:100%;height:100%;object-fit:cover;object-position:center top; border-radius:50%;" />`;
      navAvatarEl.style.padding = "0";
      navAvatarEl.style.fontSize = "0";
      navAvatarEl.style.overflow = "hidden";
    } else {
      navAvatarEl.textContent = user.fullName.trim().charAt(0).toUpperCase();
    }
  }

  // If avatarUrl is missing from localStorage (old login / new device),
  // silently fetch it from the API and update localStorage + navbar
  const token = localStorage.getItem("novabuk_token");
  if (token && user.fullName && !user.avatarUrl) {
    fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.user.avatarUrl) {
          // Update localStorage with the real avatarUrl
          const stored = JSON.parse(
            localStorage.getItem("novabuk_user") || "{}",
          );
          stored.avatarUrl = data.user.avatarUrl;
          if (data.user.role) stored.role = data.user.role;
          localStorage.setItem("novabuk_user", JSON.stringify(stored));
          // Now refresh the navbar
          if (typeof window.refreshNavAvatar === "function")
            window.refreshNavAvatar();
        }
      })
      .catch(() => {}); // silent fail — initials already showing
  }

  window.handleMenuSelect = function (value) {
    if (value === "logout") {
      showLogoutModal();
    } else if (value === "dashboard") {
      const user = JSON.parse(localStorage.getItem("novabuk_user") || "{}");
      if (user.role === "Doctors") {
        window.location.href = "./clinic-queue.html";
      } else {
        window.location.href = "./app-home.html";
      }
    } else if (value === "visits") {
      const user = JSON.parse(localStorage.getItem("novabuk_user") || "{}");
      if (user.role === "Doctors") {
        window.location.href = "./clinic-queue.html";
      } else {
        window.location.href = "./app-history.html";
      }
    } else if (value === "profile" || value === "settings") {
      const user = JSON.parse(localStorage.getItem("novabuk_user") || "{}");
      if (user.role === "Doctors") {
        window.location.href = "./clinic-settings.html";
      } else {
        window.location.href = "./app-setting.html?tab=profile";
      }
    } else if (value === "notification") {
      window.location.href = "./app-setting.html?tab=notification";
    }
  };

  // ── Populate dropdown user block on open ─────────────
  if (profileBtn) {
    profileBtn.addEventListener("click", populateDropdown, { once: false });
  }

  // const token = localStorage.getItem('novabuk_token');
  const path = window.location.pathname;
  const isAuthPage = [
    "sign-in", "sign-up", "forgot-password",
    "reset-password", "send-email",
    "index", "about", "services", "contact",
    "blog", "blog-dynamic",
  ].some((p) => path.includes(p)) || path === "/" || path.endsWith("/");

  if (!token && !isAuthPage) {
    window.location.href = "./index.html";
  }
})(); // Fixed: Added () to execute the function

// ── SHARED INDEX/PUBLIC PAGE NAVBAR SYNC ─────────────────────
// Handles the auth-aware navbar on index, about, services, blog, contact
// Runs on page load AND on bfcache restore (back/forward navigation)
function runIndexNavSync() {
  const token = localStorage.getItem("novabuk_token");
  const user = JSON.parse(localStorage.getItem("novabuk_user") || "{}");

  const loggedOutNav = document.getElementById("loggedOutNav");
  const loggedInNav = document.getElementById("loggedInNav");

  if (token && user.fullName) {
    // USER IS LOGGED IN
    if (loggedOutNav) loggedOutNav.style.display = "none";
    if (loggedInNav) loggedInNav.style.display = "flex";

    // Set the Avatar
    const navAvatar = document.getElementById("navAvatar");
    if (navAvatar) {
      if (user.avatarUrl) {
        navAvatar.innerHTML = `<img src="${user.avatarUrl}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
      } else {
        navAvatar.textContent = user.fullName.trim().charAt(0).toUpperCase();
      }
    }

    // Role-based UI tweaks (Hide patient-only links for doctors)
    if (user.role === "Doctors") {
      const patientLinks = document.querySelectorAll("[onclick*='visits'], [onclick*='profile'], #ddSymptomHint");
      patientLinks.forEach(el => el.style.display = "none");
    }
  } else {
    // USER IS LOGGED OUT
    if (loggedOutNav) loggedOutNav.style.display = "flex";
    if (loggedInNav) loggedInNav.style.display = "none";
  }
}

// Run immediately on load
runIndexNavSync();

// ── BFCACHE FIX ───────────────────────────────────────────────
// When user navigates back/forward, browser may restore page from
// bfcache without re-running scripts. pageshow fires reliably.
window.addEventListener("pageshow", function(e) {
  if (e.persisted) {
    // Page was restored from bfcache — re-sync the navbar
    runIndexNavSync();
  }
});
// ── CROSS-TAB AVATAR SYNC ────────────────────────────────
// If localStorage changes in another tab (e.g. after photo upload),
// refresh the navbar avatar on this tab too.
window.addEventListener("storage", function (e) {
  if (e.key === "novabuk_user") {
    if (typeof window.refreshNavAvatar === "function")
      window.refreshNavAvatar();
  }
});

// ================================================================
// NOVABUK — NOTIFICATION BELL SYSTEM
// ================================================================
(function initNotificationBell() {
  const token = localStorage.getItem("novabuk_token");
  if (!token) return;

  // Find the bell <a> tag and its parent <li>
  const bellLink = document.querySelector(
    '.nav-buttons a[href="./app-history.html"] i.fa-bell, .nav-buttons a[href="./app-history.html"]',
  );
  if (!bellLink) return;

  const bellAnchor = bellLink.closest
    ? bellLink.closest("a")
    : bellLink.parentElement;
  if (!bellAnchor) return;
  const bellLi = bellAnchor.parentElement;
  if (!bellLi) return;

  // Replace the plain <a> with a bell button + dropdown wrapper
  bellLi.innerHTML = `
    <div class="nb-bell-wrap" id="nbBellWrap">
      <button class="nb-bell-btn" id="nbBellBtn" aria-label="Notifications">
        <i class="fa-regular fa-bell"></i>
        <span class="nb-badge" id="nbBadge" style="display:none">0</span>
      </button>
      <div class="nb-dropdown" id="nbDropdown">
        <div class="nb-dropdown-header">
          <span class="nb-dropdown-title">Notifications</span>
          <button class="nb-mark-all" id="nbMarkAll">Mark all read</button>
        </div>
        <div class="nb-dropdown-list" id="nbList">
          <div class="nb-empty">Loading…</div>
        </div>
      </div>
    </div>`;

  const bellBtn = document.getElementById("nbBellBtn");
  const dropdown = document.getElementById("nbDropdown");
  const badge = document.getElementById("nbBadge");
  const list = document.getElementById("nbList");
  const markAllBtn = document.getElementById("nbMarkAll");

  let isOpen = false;

  // ── Toggle dropdown ──────────────────────────────────
  bellBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    isOpen = !isOpen;
    dropdown.classList.toggle("show", isOpen);

    if (isOpen) {
      loadNotifications();
      // Mark all read after a short delay (user had time to see them)
      setTimeout(markAllRead, 1500);
    }
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!document.getElementById("nbBellWrap")?.contains(e.target)) {
      isOpen = false;
      dropdown.classList.remove("show");
    }
  });

  markAllBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    markAllRead();
  });

  // ── Fetch unread count (badge only) ─────────────────
  async function fetchUnreadCount() {
    try {
      const res = await fetch(
        `${API_URL}/notifications/unread-count`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) updateBadge(data.count);
    } catch (e) {}
  }

  function updateBadge(count) {
    if (count > 0) {
      badge.textContent = count > 99 ? "99+" : count;
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }
  }

  // ── Load full notification list ──────────────────────
  async function loadNotifications() {
    list.innerHTML = '<div class="nb-empty">Loading…</div>';
    try {
      const res = await fetch(
        `${API_URL}/notifications`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();

      if (!data.success || data.data.length === 0) {
        list.innerHTML =
          '<div class="nb-empty"><i class="fa-regular fa-bell-slash"></i><p>No notifications yet</p></div>';
        return;
      }

      list.innerHTML = "";
      data.data.forEach((n) => {
        const div = document.createElement("div");
        div.className = "nb-item" + (n.read ? "" : " unread");
        const time = timeAgo(new Date(n.createdAt));
        const icon =
          {
            visit_requested: "fa-calendar-plus",
            visit_confirmed: "fa-calendar-check",
            visit_completed: "fa-circle-check",
            visit_cancelled: "fa-calendar-xmark",
            general: "fa-bell",
          }[n.type] || "fa-bell";

        div.innerHTML = `
          <div class="nb-item-icon ${n.type}">
            <i class="fa-solid ${icon}"></i>
          </div>
          <div class="nb-item-body">
            <p class="nb-item-title">${n.title}</p>
            <p class="nb-item-msg">${n.message}</p>
            <span class="nb-item-time">${time}</span>
          </div>
          ${!n.read ? '<span class="nb-dot"></span>' : ""}
        `;

        div.addEventListener("click", () => {
          markRead(n._id);
          div.classList.remove("unread");
          div.querySelector(".nb-dot")?.remove();
          if (n.link) window.location.href = n.link;
        });

        list.appendChild(div);
      });

      updateBadge(data.unreadCount);
    } catch (e) {
      list.innerHTML =
        '<div class="nb-empty">Could not load notifications.</div>';
    }
  }

  // ── Mark single as read ──────────────────────────────
  async function markRead(id) {
    try {
      await fetch(
        `${API_URL}/notifications/${id}/read`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    } catch (e) {}
  }

  // ── Mark all as read ─────────────────────────────────
  async function markAllRead() {
    try {
      await fetch(
        `${API_URL}/notifications/mark-all-read`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      updateBadge(0);
      // Update dots in open dropdown
      document.querySelectorAll(".nb-item.unread").forEach((el) => {
        el.classList.remove("unread");
        el.querySelector(".nb-dot")?.remove();
      });
    } catch (e) {}
  }

  // ── Time ago helper ──────────────────────────────────
  function timeAgo(date) {
    const diff = Math.floor((Date.now() - date) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  // ── Poll every 60s for new notifications ─────────────
  fetchUnreadCount();
  setInterval(fetchUnreadCount, 60000);
})();

// ================================================================
// NOVABUK — LOGOUT CONFIRMATION MODAL
// ================================================================
(function initLogoutModal() {
  // Inject modal HTML into body once
  const modal = document.createElement("div");
  modal.id = "nbLogoutModal";
  modal.innerHTML = `
    <div class="nb-logout-overlay" id="nbLogoutOverlay">
      <div class="nb-logout-box">
        <div class="nb-logout-icon">
          <i class="fa-solid fa-right-from-bracket"></i>
        </div>
        <h3 class="nb-logout-title">Log out?</h3>
        <p class="nb-logout-msg">You'll need to sign in again to access your account.</p>
        <div class="nb-logout-btns">
          <button class="nb-logout-cancel" onclick="closeLogoutModal()">Cancel</button>
          <button class="nb-logout-confirm" onclick="confirmLogout()">Yes, log out</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);

  // Close on overlay click
  document
    .getElementById("nbLogoutOverlay")
    .addEventListener("click", function (e) {
      if (e.target === this) closeLogoutModal();
    });
})();

function showLogoutModal() {
  const overlay = document.getElementById("nbLogoutOverlay");
  if (overlay) {
    overlay.style.display = "flex";
    requestAnimationFrame(() => overlay.classList.add("show"));
  }
}

function closeLogoutModal() {
  const overlay = document.getElementById("nbLogoutOverlay");
  if (overlay) {
    overlay.classList.remove("show");
    setTimeout(() => (overlay.style.display = "none"), 220);
  }
}

function confirmLogout() {
  localStorage.removeItem("novabuk_token");
  localStorage.removeItem("novabuk_user");
  localStorage.removeItem("selectedClinic");
  // Redirect to index or sign-in depending on page
  const isAppPage = [
    "app-home",
    "complaints",
    "app-clinic",
    "app-history",
    "app-setting",
    "app-visit",
    "profile-health",
  ].some((p) => window.location.pathname.includes(p));
  window.location.href = isAppPage ? "./index.html" : "./index.html";
}

// Keyboard escape closes modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLogoutModal();
});

// ================================================================
// NOVABUK — DROPDOWN POPULATION (user info + visits badge + symptom hint)
// ================================================================
async function populateDropdown() {
  const token = localStorage.getItem("novabuk_token");
  const user = JSON.parse(localStorage.getItem("novabuk_user") || "{}");
  if (!token || !user.fullName) return;

  // ── Fill user identity block immediately from localStorage ──
  const ddName = document.getElementById("ddName");
  const ddEmail = document.getElementById("ddEmail");
  const ddAvatar = document.getElementById("ddAvatar");

  if (ddName) ddName.textContent = user.fullName || "—";
  if (ddEmail) ddEmail.textContent = user.email || "—";

  if (ddAvatar) {
    if (user.avatarUrl) {
      ddAvatar.innerHTML = `<img src="${user.avatarUrl}" alt="avatar" style="width:100%;height:100%;object-fit:cover;object-position:center top; border-radius:50%;" />`;
    } else {
      ddAvatar.textContent = user.fullName.trim().charAt(0).toUpperCase();
      ddAvatar.classList.add("dd-avatar-initials");
    }
  }

  // Skip patient-specific fetches for Doctors
  if (user.role === "Doctors") return;

  // ── Fetch pending visits count + last symptom in parallel ──
  try {
    const [visitsRes, symptomsRes] = await Promise.all([
      fetch(`${API_URL}/visits/my?limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_URL}/symptoms?limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    // Pending visits badge
    const visitsData = await visitsRes.json();
    if (visitsData.success) {
      // Fetch specifically pending count
      const pendingRes = await fetch(
        `${API_URL}/visits/my?limit=50`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const pendingData = await pendingRes.json();
      if (pendingData.success) {
        const pendingCount = pendingData.data.filter(
          (v) => v.status === "Pending",
        ).length;
        const badge = document.getElementById("ddVisitsBadge");
        if (badge && pendingCount > 0) {
          badge.textContent = `${pendingCount} pending`;
          badge.style.display = "flex";
        }
      }
    }

    // Last symptom hint
    const symptomsData = await symptomsRes.json();
    if (symptomsData.success && symptomsData.data.length > 0) {
      const lastSymptom = symptomsData.data[0];
      const daysAgo = Math.floor(
        (Date.now() - new Date(lastSymptom.createdAt)) / 86400000,
      );
      const timeStr =
        daysAgo === 0
          ? "today"
          : daysAgo === 1
            ? "yesterday"
            : `${daysAgo} days ago`;
      const hintEl = document.getElementById("ddSymptomHint");
      const textEl = document.getElementById("ddSymptomText");
      if (hintEl && textEl) {
        textEl.textContent = `Last logged: ${timeStr}`;
        hintEl.style.display = "flex";
      }
    }
  } catch (e) {
    // Silent fail — user block already populated from localStorage
  }
}
