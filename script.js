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
const icon = profileBtn ? profileBtn.querySelector("i") : null;

// ── MOBILE SIDEBAR DRAWER AND BACKDROP INITIALIZATION ──
(function initSidebarDrawer() {
  // 1. Create backdrop overlay dynamically if not exists
  let backdrop = document.querySelector(".nav-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.className = "nav-backdrop";
    document.body.appendChild(backdrop);
    
    // Backdrop click collapses the drawer
    backdrop.addEventListener("click", () => {
      document.querySelectorAll(".nav-menu.open").forEach(menu => {
        menu.classList.remove("open");
        const navBtn = menu.closest('.navbar').querySelector("#navToggle");
        if (navBtn) {
          navBtn.style.opacity = "1";
          navBtn.style.pointerEvents = "auto";
        }
      });
      backdrop.classList.remove("show");
      document.body.style.overflow = "";
    });
  }

  // 2. Prepend user details block inside mobile nav menu
  const navMenu = document.getElementById("navMenu");
  if (navMenu && !navMenu.querySelector(".mobile-nav-user-block")) {
    const user = JSON.parse(localStorage.getItem("novabuk_user") || "{}");
    if (user.fullName) {
      const userBlock = document.createElement("div");
      userBlock.className = "mobile-nav-user-block";
      
      let avatarHtml = "";
      if (user.avatarUrl) {
        avatarHtml = `<img src="${user.avatarUrl}" alt="avatar" />`;
      } else {
        avatarHtml = `<span>${user.fullName.trim().charAt(0).toUpperCase()}</span>`;
      }

      userBlock.innerHTML = `
        <div class="mobile-nav-avatar">${avatarHtml}</div>
        <div class="mobile-nav-user-info">
          <div class="mobile-nav-name">${user.fullName}</div>
          <div class="mobile-nav-email">${user.email || ''}</div>
        </div>
        <button class="drawer-close-btn" onclick="document.querySelector('.nav-backdrop') && document.querySelector('.nav-backdrop').click()" aria-label="Close menu">
          <i class="fa-solid fa-xmark"></i>
        </button>
      `;
      navMenu.insertBefore(userBlock, navMenu.firstChild);
    }
  }

  // 3. Add beautiful icons next to the navigation links inside the drawer
  if (navMenu) {
    const links = navMenu.querySelectorAll(".nav-menu");
    const icons = {
      "Home": '<i class="fa-solid fa-house"></i>',
      "Symptoms Logging": '<i class="fa-solid fa-clipboard-list"></i>',
      "Clinic Directory": '<i class="fa-solid fa-hospital"></i>',
      "History": '<i class="fa-solid fa-clock-rotate-left"></i>'
    };
    links.forEach(link => {
      const text = link.textContent.trim();
      if (icons[text] && !link.querySelector("i")) {
        link.innerHTML = `${icons[text]} <span>${text}</span>`;
      }
    });

    // =====================================================================
    // =====================================================================
    // ⬇️ SETTINGS AND LOGOUT LINKS ARE INJECTED HERE ⬇️
    // =====================================================================
    // =====================================================================
    
    // 4. Inject mobile-only bottom utility links (Settings & Logout)
    // const ul = navMenu.querySelector("ul");
    // if (ul && !ul.querySelector(".mobile-only-link")) {
    //   // Add a subtle divider
    //   const divider = document.createElement("li");
    //   divider.className = "mobile-only-link";
    //   divider.style.height = "1px";
    //   divider.style.background = "rgba(53, 186, 201, 0.15)";
    //   divider.style.margin = "100px 1px";
    //   ul.appendChild(divider);

    //   // Settings
    //   const settingsLi = document.createElement("li");
    //   settingsLi.className = "mobile-only-link";
    //   settingsLi.innerHTML = `<a href="./app-setting.html?tab=privacy"><i class="fa-solid fa-gear"></i> <span>Settings</span></a>`;
    //   ul.appendChild(settingsLi);

    //   // Logout
    //   const logoutLi = document.createElement("li");
    //   logoutLi.className = "mobile-only-link";
    //   logoutLi.innerHTML = `<a href="#" onclick="handleMenuSelect('logout')"><i class="fa-solid fa-right-from-bracket" style="color: #ff7675 !important;"></i> <span style="color: #ff7675;">Logout</span></a>`;
    //   ul.appendChild(logoutLi);
    // }
    
    // =====================================================================
    // =====================================================================
    // ⬆️ SETTINGS AND LOGOUT LINKS INJECTION ENDS HERE ⬆️
    // =====================================================================
    // =====================================================================
  }
})();

if (profileBtn && dropdownMenu && icon) {
  profileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    
    // 1. Automatically close any open mobile navigation menus before opening settings
    document.querySelectorAll(".nav-menu.open").forEach(menu => {
      menu.classList.remove("open");
      const navBtn = menu.closest('.navbar').querySelector("#navToggle");
      if (navBtn) {
        navBtn.style.opacity = "1";
        navBtn.style.pointerEvents = "auto";
      }
    });
    const loggedOutNav = document.getElementById("navMenu");
    if (loggedOutNav && loggedOutNav.classList.contains("open")) {
      loggedOutNav.classList.remove("open");
      loggedOutNav.style.display = "none";
      const loggedOutIcon = document.querySelector("#navToggleIcon i");
      if (loggedOutIcon) {
        loggedOutIcon.classList.add("fa-bars");
        loggedOutIcon.classList.remove("fa-xmark");
      }
    }
    const backdrop = document.querySelector(".nav-backdrop");
    if (backdrop) backdrop.classList.remove("show");
    document.body.style.overflow = "";

    dropdownMenu.classList.toggle("show");
    icon.classList.toggle("fa-angle-down");
    icon.classList.toggle("fa-angle-up");
  });
}
// --- UNIVERSAL NAVIGATION LOGIC ---

// 1. Handle Active Link Highlighting (Fixes the Redirect/Active issue)
function updateActiveLinks() {
  const allNavLinks = document.querySelectorAll(".nav-menu a");
  const currentPath = window.location.pathname.split("/").pop() || "index.html";

  allNavLinks.forEach((link) => {
    const linkHref = link.getAttribute("href");
    if (!linkHref) return;
    
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
  const toggleBtn = e.target.closest("#navToggle");
  
  if (toggleBtn) {
    e.preventDefault();
    e.stopPropagation();

    // 2. Automatically close user settings dropdown menu before opening mobile nav
    const dropdownMenu = document.getElementById("settingsDropdown");
    if (dropdownMenu && dropdownMenu.classList.contains("show")) {
      dropdownMenu.classList.remove("show");
      const profileBtn = document.getElementById("userProfileBtn");
      const icon = profileBtn ? profileBtn.querySelector("i") : null;
      if (icon) {
        icon.classList.add("fa-angle-down");
        icon.classList.remove("fa-angle-up");
      }
    }
    
    const parentNav = toggleBtn.closest('.navbar');
    const navMenu = parentNav.querySelector(".nav-menu");
    const icon = toggleBtn.querySelector("i");
    const backdrop = document.querySelector(".nav-backdrop");

    if (navMenu) {
      navMenu.classList.toggle("open");
      
      if (icon) {
        if (navMenu.classList.contains("open")) {
          if (backdrop) backdrop.classList.add("show");
          document.body.style.overflow = "hidden";
          toggleBtn.style.opacity = "0";
          toggleBtn.style.pointerEvents = "none";
        } else {
          if (backdrop) backdrop.classList.remove("show");
          document.body.style.overflow = "";
          toggleBtn.style.opacity = "1";
          toggleBtn.style.pointerEvents = "auto";
        }
      }
    }
  } else {
    // Close any open menus if clicking outside
    document.querySelectorAll(".nav-menu.open").forEach(menu => {
      menu.classList.remove("open");
      const navBtn = menu.closest('.navbar').querySelector("#navToggle");
      if (navBtn) {
        navBtn.style.opacity = "1";
        navBtn.style.pointerEvents = "auto";
      }
    });
    const backdrop = document.querySelector(".nav-backdrop");
    if (backdrop) backdrop.classList.remove("show");
    document.body.style.overflow = "";

    // 3. Automatically close user settings dropdown if clicked outside
    const dropdownMenu = document.getElementById("settingsDropdown");
    const profileBtn = document.getElementById("userProfileBtn");
    if (dropdownMenu && dropdownMenu.classList.contains("show") && profileBtn && !profileBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
      dropdownMenu.classList.remove("show");
      const icon = profileBtn.querySelector("i");
      if (icon) {
        icon.classList.add("fa-angle-down");
        icon.classList.remove("fa-angle-up");
      }
    }
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



// ── HERO ROTATOR (cycles hero paragraph and images, including ones inside HTML comments) ──
(function initHeroRotator() {
  const heroDescEl = document.querySelector('.hero-desc');
  const slidesWrapper = document.querySelector('.header-img .slides');

  if (!heroDescEl || !slidesWrapper) return;

  // Collect existing image srcs from visible slides
  const existingImgs = Array.from(slidesWrapper.querySelectorAll('img')).map(i => i.getAttribute('src'));

  // Collect image srcs and paragraph texts from HTML comments (if any)
  const commentIterator = document.createNodeIterator(document.documentElement, NodeFilter.SHOW_COMMENT);
  let cnode;
  const commentedImgSrcs = [];
  const commentedTexts = [];
  while ((cnode = commentIterator.nextNode())) {
    const txt = cnode.nodeValue || '';
    // find img src attributes inside the comment
    const imgRe = /<img[^>]+src=["']([^"']+)["']/gi;
    let m;
    while ((m = imgRe.exec(txt))) {
      commentedImgSrcs.push(m[1]);
    }

    // find hero paragraph content inside comments
    const pRe = /<p[^>]*class=["']?hero-desc["']?[^>]*>([\s\S]*?)<\/p>/gi;
    while ((m = pRe.exec(txt))) {
      const clean = m[1].replace(/<[^>]+>/g, '').trim();
      if (clean) commentedTexts.push(clean);
    }
  }

  // Final arrays (unique)
  const imageSrcs = Array.from(new Set(existingImgs.concat(commentedImgSrcs))).filter(Boolean);
  const texts = Array.from(new Set([heroDescEl.textContent.trim()].concat(commentedTexts))).filter(Boolean);

  // If no images found, nothing to rotate
  if (imageSrcs.length === 0) return;

  // Replace slides wrapper with a single dynamic image for simpler swapping
  slidesWrapper.innerHTML = `<img id="heroDynamicImg" src="${imageSrcs[0]}" alt="hero" class="hero-slide active">`;
  const heroImg = document.getElementById('heroDynamicImg');

  let index = 0;
  const total = Math.max(imageSrcs.length, texts.length);

  function tick() {
    index = (index + 1) % total;
    // update text if available
    if (texts.length > 0) {
      heroDescEl.textContent = texts[index % texts.length];
    }
    // update image
    if (imageSrcs.length > 0 && heroImg) {
      heroImg.src = imageSrcs[index % imageSrcs.length];
    }
  }

  // Start rotation (every 4 seconds)
  const interval = setInterval(tick, 4000);

  // Pause on hover
  slidesWrapper.addEventListener('mouseenter', () => clearInterval(interval));
  slidesWrapper.addEventListener('mouseleave', () => setInterval(tick, 4000));

})();



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
  // Set initial state based on checkbox
  signUpBtn.disabled = !checkbox.checked;

  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      signUpBtn.classList.add("pop");
      signUpBtn.disabled = false;
    } else {
      signUpBtn.classList.remove("pop");
      signUpBtn.disabled = true;
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
    smartFetch(`${API_URL}/users/me`, {
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
    "index", "about", "services", "contact","data-privacy","terms",
    "blog", "blog-dynamic"
  ].some((p) => path.includes(p)) || path === "/" || path.endsWith("/");

  if (!token && !isAuthPage) {
    window.location.href = "./index.html";
  }
})(); 

(function initNetworkUI() {
    let toastTimeout;
    let isToastForced = false;

    // 1. Create the toast element
    const toast = document.createElement('div');
    toast.id = 'networkToast';
    toast.className = 'network-toast';
    document.body.appendChild(toast);

    function showToast(message, isOnline, forceVisible = false) {
        clearTimeout(toastTimeout);
        toast.innerHTML = isOnline 
            ? `<i class="fa-solid fa-wifi"></i> <span>${message}</span>`
            : `<i class="fa-solid fa-cloud-showers-water"></i> <span>${message}</span>`;
        
        toast.className = `network-toast show ${isOnline ? 'online' : 'offline'}`;
        isToastForced = forceVisible;

<<<<<<< HEAD
        // Decide auto-hide timeout:
        // - not forced: short (3.5s)
        // - forced but offline: still auto-hide after 10s (avoid persistent offline pill)
        // - forced and online (e.g. syncing): remain visible until cleared
        let timeoutMs;
        if (!forceVisible) {
            timeoutMs = 3500;
        } else if (isOnline === false) {
            timeoutMs = 10000;
        } else {
            timeoutMs = null; // keep visible (e.g. syncing) until programmatically cleared
        }

        if (timeoutMs !== null) {
            toastTimeout = setTimeout(() => {
                toast.classList.remove('show');
                isToastForced = false;
            }, timeoutMs);
=======
        // If not forced to stay visible, hide after 3.5 seconds
        if (!forceVisible) {
            toastTimeout = setTimeout(() => {
                toast.classList.remove('show');
                isToastForced = false;
            }, 3500);
>>>>>>> c1f93590dcf96710a7e7f3757141a65e7cc26281
        }
    }
    window.showNetworkToast = showToast;

    // 2. Smart Polling for Outbox Status
    async function checkStatus() {
        if (typeof window.getOutboxCount !== 'function') return;
        
        const count = await window.getOutboxCount();
        const isOnline = navigator.onLine;

        if (count > 0) {
            if (isOnline) {
                // If we are online but have pending items, we must be trying to sync them
                showToast(`Syncing ${count} pending item(s)...`, true, true);
                if (typeof window.syncOutbox === 'function') window.syncOutbox();
            } else {
                // Offline with pending items
                showToast(`Offline. ${count} item(s) waiting to sync.`, false, true);
            }
        } else {
            // No pending items. 
            if (!isOnline) {
                // Just offline.
                if (!isToastForced) showToast("offline.", false, true);
            } else if (isToastForced) {
                // We were forced visible (e.g. syncing), but now count is 0 and we are online!
                // So we are officially "Back online" and synced!
                showToast("", true, false);
            }
        }
    }

    // 3. Listen for Explicit Network Changes
    window.addEventListener('offline', () => checkStatus());
    window.addEventListener('online', () => {
        showToast("Online", true, false);
        checkStatus();
    });

    // Start polling status every 3 seconds to catch edge cases
    setInterval(checkStatus, 3000);
    checkStatus();

    // 4. Exit Guard: Warning if trying to leave with pending data
    window.addEventListener('beforeunload', (e) => {
        if (typeof window.getOutboxCount === 'function') {
            window.getOutboxCount().then(count => {
                if (count > 0) {
                    e.preventDefault();
                    e.returnValue = 'You have unsaved medical data. Please wait for it to sync before leaving.';
                }
            });
        }
    });

    // 5. Sync whenever window gets focus
    window.addEventListener('focus', () => checkStatus());
})();

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
      const res = await smartFetch(
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
      const res = await smartFetch(
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
      await smartFetch(
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
      await smartFetch(
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
      smartFetch(`${API_URL}/visits/my?limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      smartFetch(`${API_URL}/symptoms?limit=1`, {
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



// Register the Service Worker for Offline Support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
     navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('[Service Worker] Registered!', reg))
      .catch((err) => console.log('[Service Worker] Registration failed:', err));
  });
}
<<<<<<< HEAD

// ================================================================
// NOVABUK — HERO SLIDER & DYNAMIC PARAGRAPH
// ================================================================
(function initHeroSlider() {
  const slidesContainer = document.querySelector('.header-img.slider .slides');
  const slides = document.querySelectorAll('.header-img.slider .slides img.hero-slide');
  const paragraph = document.querySelector('.hero-text-side .hero-desc');
  
  if (!slidesContainer || slides.length === 0 || !paragraph) return;
  
  // Custom paragraphs matching banner1, banner2, and banner3
  const texts = [
    "Empowering Africa's Healthcare with AI-driven Digital Records",
    "Smarter consultations with real-time patient health records and AI insights.",
    "Connecting patients, doctors, clinics and pharmacies for a unified health ecosystem."
  ];
  
  let currentIndex = 0;
  const slideInterval = 5000; // 5 seconds
  let timer;
  
  function showSlide(index) {
    if (index >= slides.length) index = 0;
    if (index < 0) index = slides.length - 1;
    
    currentIndex = index;
    
    // Smooth text transition
    paragraph.classList.add('fade-out');
    setTimeout(() => {
      paragraph.textContent = texts[currentIndex];
      paragraph.classList.remove('fade-out');
    }, 400);
    
    // Smooth image transition
    const isMobile = window.innerWidth <= 1300;
    if (isMobile) {
      // On mobile/tablet, scroll the active image into view
      const activeSlide = slides[currentIndex];
      if (activeSlide) {
        activeSlide.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    } else {
      // On desktop, toggle active class for cross-fade
      slides.forEach((slide, i) => {
        if (i === currentIndex) {
          slide.classList.add('active');
        } else {
          slide.classList.remove('active');
        }
      });
    }
  }
  
  function startAutoplay() {
    timer = setInterval(() => {
      showSlide(currentIndex + 1);
    }, slideInterval);
  }
  
  function stopAutoplay() {
    clearInterval(timer);
  }
  
  // Set initial active state for desktop
  slides.forEach((slide, i) => {
    if (i === 0) {
      slide.classList.add('active');
    } else {
      slide.classList.remove('active');
    }
  });
  
  startAutoplay();
  
  // On mobile/tablet, handle manual swipe detection to sync text
  let isScrolling;
  slidesContainer.addEventListener('scroll', () => {
    // Only detect manual scroll on mobile/tablet view
    if (window.innerWidth > 1300) return;
    
    window.clearTimeout(isScrolling);
    isScrolling = setTimeout(() => {
      const containerRect = slidesContainer.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      
      let closestIndex = 0;
      let minDistance = Infinity;
      
      slides.forEach((slide, i) => {
        const slideRect = slide.getBoundingClientRect();
        const slideCenter = slideRect.left + slideRect.width / 2;
        const distance = Math.abs(slideCenter - containerCenter);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = i;
        }
      });
      
      if (closestIndex !== currentIndex) {
        stopAutoplay();
        currentIndex = closestIndex;
        
        // Update text
        paragraph.classList.add('fade-out');
        setTimeout(() => {
          paragraph.textContent = texts[currentIndex];
          paragraph.classList.remove('fade-out');
        }, 400);
        
        startAutoplay();
      }
    }, 150);
  });
})();
=======
>>>>>>> c1f93590dcf96710a7e7f3757141a65e7cc26281
