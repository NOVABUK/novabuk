//const API_URL = "http://localhost:5000/api";
const API_URL = "https://novabuk-backend.onrender.com/api";

const token = localStorage.getItem("novabuk_token");
if (!token) window.location.href = "./sign-in.html";

// ── DROPDOWN ──────────────────────────────────────────────
// const userProfileBtn  = document.getElementById("userProfileBtn");
// const settingsDropdown = document.getElementById("settingsDropdown");

// userProfileBtn.addEventListener("click", (e) => {
//   e.stopPropagation();
//   settingsDropdown.classList.toggle("show");
// });
// window.addEventListener("click", () => settingsDropdown.classList.remove("show"));

// function handleMenuSelect(value) {
//   if (value === "logout") {
//     document.getElementById("logout-modal").style.display = "flex";
//   } else if (value === "profile") {
//     showPage("profile");
//   } else if (value === "settings") {
//     showPage("privacy");
//   }
// }

function closeModal() {
  document.getElementById("logout-modal").style.display = "none";
}

// Logout button in modal
document.querySelector(".btn-logout").addEventListener("click", () => {
  localStorage.removeItem("novabuk_token");
  localStorage.removeItem("novabuk_user");
  localStorage.removeItem("selectedClinic");
  window.location.href = "./sign-in.html";
});

// ── PAGE SWITCHER ─────────────────────────────────────────
// ── PAGE SWITCHER ─────────────────────────────────────────
function showPage(pageKey) {
  const contentArea = document.getElementById("main-content-wrapper");
  const container = document.querySelector(".container-setting");

  // 1. Handle Mobile "Drill-down" View
  if (window.innerWidth <= 768) {
    container.classList.add("view-details");
    window.scrollTo(0, 0);
  }

  // 2. Inject Back Button & Loading Spinner
  contentArea.innerHTML = `
    <button class="mobile-back-btn" onclick="goBackToMenu()" style="display:none;">
    </button>
    <div style="text-align:center;padding:40px"><div class="spinner-inline"></div></div>
  `;

  // 3. Update sidebar active state
  document.querySelectorAll(".sidebar li").forEach(li => {
    li.classList.remove("active");
    // Normalize text for comparison (handle spaces like "Change Password")
    const normalizedLi = li.textContent.toLowerCase().replace(/\s+/g, "");
    if (normalizedLi === pageKey) {
      li.classList.add("active");
    }
  });

  // 4. Load the specific page content
  if (pageKey === "profile")           loadProfilePage(contentArea);
  else if (pageKey === "privacy")       loadPrivacyPage(contentArea);
  else if (pageKey === "notification")  loadNotificationPage(contentArea);
  else if (pageKey === "changepassword") loadChangePasswordPage(contentArea);
}

// ── MOBILE NAVIGATION HELPER ──────────────────────────────
function goBackToMenu() {
    const container = document.querySelector(".container-setting");
    const contentArea = document.getElementById("main-content-wrapper");

    // 1. Remove the mobile view class
    container.classList.remove("view-details");

    // 2. CLEAR the content so it doesn't show under the sidebar
    contentArea.innerHTML = ""; 

    // 3. Reset sidebar active states so nothing looks "selected" in the menu
    document.querySelectorAll(".sidebar li").forEach(li => li.classList.remove("active"));
}

// ── LOAD ON DOM READY ─────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const targetTab = urlParams.get("tab") || "profile";
  showPage(targetTab);

  // Sidebar click
  document.querySelectorAll(".sidebar li").forEach(item => {
    item.addEventListener("click", function() {
      const key = this.textContent.toLowerCase().replace(/\s+/g, "");
      if (key === "logout") {
        document.getElementById("logout-modal").style.display = "flex";
        return;
      }
      showPage(key);
    });
  });
});

// ── FEEDBACK HELPER ───────────────────────────────────────
function showFeedback(id, msg, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = "block";
  el.style.padding = "10px 14px";
  el.style.borderRadius = "6px";
  el.style.marginBottom = "12px";
  el.style.fontSize = "13px";
  el.style.fontFamily = "Poppins, sans-serif";
  el.style.background = type === "success" ? "#f0fff4" : "#fff5f5";
  el.style.color      = type === "success" ? "#276749" : "#e53e3e";
  el.style.border     = type === "success" ? "1px solid #9ae6b4" : "1px solid #fed7d7";
  setTimeout(() => { if (el) el.style.display = "none"; }, 4000);
}

// ── PROFILE PAGE ──────────────────────────────────────────
// ── PROFILE TAG HELPERS (conditions & allergies) ─────────
let _profileConditions = [];
let _profileAllergies  = [];

function _renderTags(arr, listId, inputId, editing) {
  const list  = document.getElementById(listId);
  const input = document.getElementById(inputId);
  if (!list) return;
  list.innerHTML = "";
  arr.forEach((tag, i) => {
    const chip = document.createElement("span");
    chip.className = "p-tag-chip";
    chip.innerHTML = tag + (editing
      ? ` <button type="button" class="p-tag-remove" onclick="_removeTag('${listId}','${inputId}',${i})">×</button>`
      : "");
    list.appendChild(chip);
  });
  if (input) list.appendChild(input);
  list.className = "p-tag-list" + (editing ? " editable" : "");
}

function _removeTag(listId, inputId, i) {
  const arr = listId === "pConditionsList" ? _profileConditions : _profileAllergies;
  arr.splice(i, 1);
  _renderTags(arr, listId, inputId, true);
}

function _addTag(listId, inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;
  const arr = listId === "pConditionsList" ? _profileConditions : _profileAllergies;
  if (!arr.includes(val)) { arr.push(val); _renderTags(arr, listId, inputId, true); }
  input.value = "";
}

// ── AVATAR UPLOAD (inside settings) ──────────────────────
async function uploadSettingsAvatar(input) {
  const file = input.files[0];
  if (!file) return;
  const circle = document.getElementById("pAvatarCircle");
  if (circle) circle.style.opacity = "0.5";
  showFeedback("profileFeedback", "Uploading photo…", "success");
  try {
    const signRes  = await fetch(`${API_URL}/uploads/cloudinary/sign`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` }
    });
    const signData = await signRes.json();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key",   signData.api_key);
    formData.append("timestamp", signData.timestamp);
    formData.append("signature", signData.signature);
    const uploadRes  = await fetch(
      `https://api.cloudinary.com/v1_1/${signData.cloud_name}/image/upload`,
      { method: "POST", body: formData }
    );
    const uploadData = await uploadRes.json();
    if (uploadData.secure_url) {
      // Update circle preview
      if (circle) {
        circle.innerHTML = `<img src="${uploadData.secure_url}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
        circle.style.opacity = "1";
      }
      // Save to backend
      await fetch(`${API_URL}/users/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatarUrl: uploadData.secure_url }),
      });
      // Update localStorage + navbar
      const stored = JSON.parse(localStorage.getItem("novabuk_user") || "{}");
      stored.avatarUrl = uploadData.secure_url;
      localStorage.setItem("novabuk_user", JSON.stringify(stored));
      if (typeof window.refreshNavAvatar === "function") window.refreshNavAvatar();
      showFeedback("profileFeedback", "Photo updated!", "success");
    }
  } catch (err) {
    showFeedback("profileFeedback", "Photo upload failed. Try again.", "error");
    if (circle) circle.style.opacity = "1";
  }
  input.value = "";
}

async function loadProfilePage(area) {
  try {
    const res  = await fetch(`${API_URL}/users/settings`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    const u    = data.success ? data.data.profile : {};
    const hp   = u.healthProfile || {};
    const ec   = u.emergencyContact || {};
    const name = u.fullName || "";
    const [firstName, ...rest] = name.split(" ");
    const lastName = rest.join(" ");

    // Seed tag arrays
    _profileConditions = [...(hp.existingConditions || [])];
    _profileAllergies  = [...(hp.allergies || [])];

    // Avatar display
    const avatarHtml = u.avatarUrl
      ? `<img src="${u.avatarUrl}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
      : `<span style="font-size:2rem;font-weight:700;color:#35bac9;">${name.trim().charAt(0).toUpperCase()}</span>`;

    area.innerHTML = `
      <style>
        .p-avatar-wrap { display:flex; align-items:center; gap:20px; margin-bottom:28px; padding-bottom:24px; border-bottom:1px solid #eee; }
        .p-avatar-circle { width:80px; height:80px; border-radius:50%; background:#e0f2f7; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0; position:relative; }
        .p-avatar-edit { position:absolute; bottom:0; right:0; width:24px; height:24px; background:var(--primary-teal); border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; }
        .p-avatar-edit i { color:white; font-size:11px; }
        .p-avatar-info h3 { margin:0 0 4px; font-family:poppins,sans-serif; font-size:1rem; }
        .p-avatar-info p { margin:0; font-size:12px; color:#888; font-family:poppins,sans-serif; }
        .p-section-title { font-family:poppins,sans-serif; font-size:0.75rem; font-weight:700; color:#999; text-transform:uppercase; letter-spacing:0.6px; margin:28px 0 14px; padding-bottom:6px; border-bottom:1px solid #f0f0f0; }
        .p-tag-list { display:flex; flex-wrap:wrap; gap:8px; padding:10px; border:1px solid #ccc; border-radius:6px; background:#fdfdfd; min-height:44px; }
        .p-tag-list.editable { border-color:#4db6c6; background:#fff; }
        .p-tag-chip { background:#d0eff4; color:#0f2027; padding:4px 10px; border-radius:20px; font-size:12px; font-family:poppins,sans-serif; display:flex; align-items:center; gap:5px; }
        .p-tag-remove { background:none; border:none; cursor:pointer; color:#666; font-size:14px; padding:0; line-height:1; }
        .p-tag-input { border:none; outline:none; background:transparent; font-family:poppins,sans-serif; font-size:12px; flex:1; min-width:120px; }
        .p-tag-hint { font-size:11px; color:#aaa; margin-top:4px; font-family:poppins,sans-serif; }
      </style>

      <div id="profileFeedback" style="display:none"></div>
      <button class="edit-btn" id="editProfileBtn" onclick="toggleProfileEdit()">✏️ Edit profile</button>
      <h1>Profile & Health</h1>

      <!-- Avatar -->
      <div class="p-avatar-wrap">
        <div class="p-avatar-circle" id="pAvatarCircle">
          ${avatarHtml}
          <div class="p-avatar-edit" id="pAvatarEditBtn" style="display:none" onclick="document.getElementById('pAvatarFileInput').click()">
            <i class="fa fa-pencil"></i>
          </div>
        </div>
        <div class="p-avatar-info">
          <h3>${name || "Your Name"}</h3>
          <p id="pAvatarHint" style="display:none">Click the pencil to change your photo</p>
        </div>
        <input type="file" id="pAvatarFileInput" accept="image/*" style="display:none" onchange="uploadSettingsAvatar(this)" />
      </div>

      <!-- Personal Information -->
      <div class="p-section-title">Personal Information</div>
      <div class="profile-grid">
        <div class="input-group"><label>First Name</label><input type="text" id="pFirstName" value="${firstName}" disabled /></div>
        <div class="input-group"><label>Last Name</label><input type="text" id="pLastName" value="${lastName}" disabled /></div>
        <div class="input-group"><label>Email Address</label><input type="email" id="pEmail" value="${u.email || ""}" disabled /></div>
        <div class="input-group"><label>Phone Number</label><input type="text" id="pPhone" value="${u.phone || ""}" disabled placeholder="+234 803 000 0000" /></div>
        <div class="input-group"><label>Date of Birth</label><input type="date" id="pDob" value="${u.dateOfBirth || ""}" disabled /></div>
        <div class="input-group"><label>Gender</label>
          <select id="pGender" disabled>
            <option value="">Select</option>
            ${["Male","Female"].map(g =>
              `<option value="${g}" ${hp.gender === g ? "selected" : ""}>${g}</option>`
            ).join("")}
          </select>
        </div>
        <div class="input-group full-width"><label>Address</label><input type="text" id="pAddress" value="${u.address || ""}" disabled placeholder="123 Health Street" /></div>
        <div class="input-group"><label>City</label><input type="text" id="pCity" value="${u.city || ""}" disabled placeholder="Ikeja" /></div>
        <div class="input-group"><label>State</label><input type="text" id="pState" value="${u.state || ""}" disabled placeholder="Lagos" /></div>
      </div>

      <!-- Health Profile -->
      <div class="p-section-title">Health Profile</div>
      <div class="profile-grid">
        <div class="input-group">
          <label>Age Range</label>
          <select id="pAgeRange" disabled>
            <option value="">Select age range</option>
            ${["Under 18","18–24","25–34","35–44","45–54","55–64","65+"].map(a =>
              `<option value="${a}" ${hp.ageRange === a ? "selected" : ""}>${a}</option>`
            ).join("")}
          </select>
        </div>
        <div class="input-group" style="grid-column:span 1"><!-- spacer --></div>
        <div class="input-group full-width">
          <label>Existing Conditions</label>
          <div class="p-tag-list" id="pConditionsList">
            <input class="p-tag-input" id="pConditionsInput" placeholder="Type and press Enter…" style="display:none" />
          </div>
          <p class="p-tag-hint" id="pConditionsHint" style="display:none">e.g. Diabetes, Hypertension, Asthma</p>
        </div>
        <div class="input-group full-width">
          <label>Allergies</label>
          <div class="p-tag-list" id="pAllergiesList">
            <input class="p-tag-input" id="pAllergiesInput" placeholder="Type and press Enter…" style="display:none" />
          </div>
          <p class="p-tag-hint" id="pAllergiesHint" style="display:none">e.g. Penicillin, Peanuts, Dust</p>
        </div>
      </div>

      <!-- Emergency Contact -->
      <div class="p-section-title">Emergency Contact</div>
      <div class="profile-grid">
        <div class="input-group"><label>Full Name</label><input type="text" id="pEcName" value="${ec.name || ""}" disabled placeholder="Jane Dorcas" /></div>
        <div class="input-group"><label>Phone Number</label><input type="text" id="pEcPhone" value="${ec.phone || ""}" disabled placeholder="+234 123 123 4567" /></div>
      </div>

      <!-- Save row -->
      <div class="input-group full-width" id="saveProfileRow" style="display:none; margin-top:24px;">
        <button class="edit-btn" id="saveProfileBtn" onclick="saveProfile()" style="float:none;background:var(--primary-teal);color:white;padding:10px 24px;">Save Changes</button>
      </div>`;

    // Render tags in view mode
    _renderTags(_profileConditions, "pConditionsList", "pConditionsInput", false);
    _renderTags(_profileAllergies,  "pAllergiesList",  "pAllergiesInput",  false);

    // Wire up tag inputs
    const cInput = document.getElementById("pConditionsInput");
    const aInput = document.getElementById("pAllergiesInput");
    if (cInput) cInput.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === ",") { e.preventDefault(); _addTag("pConditionsList","pConditionsInput"); }
    });
    if (aInput) aInput.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === ",") { e.preventDefault(); _addTag("pAllergiesList","pAllergiesInput"); }
    });

  } catch (err) {
    area.innerHTML = `<p style="color:#e53e3e;padding:20px">Failed to load profile.</p>`;
  }
}

function toggleProfileEdit() {
  const personalFields = ["pFirstName","pLastName","pEmail","pPhone","pDob","pGender","pAddress","pCity","pState","pAgeRange","pEcName","pEcPhone"];
  const isDisabled = document.getElementById("pFirstName").disabled;
  const editing = isDisabled; // we're toggling TO editing if currently disabled

  personalFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = !editing;
  });

  // Show/hide tag inputs
  const cInput = document.getElementById("pConditionsInput");
  const aInput = document.getElementById("pAllergiesInput");
  if (cInput) cInput.style.display = editing ? "inline" : "none";
  if (aInput) aInput.style.display = editing ? "inline" : "none";
  document.getElementById("pConditionsHint") && (document.getElementById("pConditionsHint").style.display = editing ? "block" : "none");
  document.getElementById("pAllergiesHint")  && (document.getElementById("pAllergiesHint").style.display  = editing ? "block" : "none");

  // Re-render tags with/without remove buttons
  _renderTags(_profileConditions, "pConditionsList", "pConditionsInput", editing);
  _renderTags(_profileAllergies,  "pAllergiesList",  "pAllergiesInput",  editing);

  // Re-wire tag inputs after re-render
  const cI = document.getElementById("pConditionsInput");
  const aI = document.getElementById("pAllergiesInput");
  if (cI) cI.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); _addTag("pConditionsList","pConditionsInput"); }
  });
  if (aI) aI.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); _addTag("pAllergiesList","pAllergiesInput"); }
  });

  // Show/hide avatar edit button + hint
  const avatarBtn  = document.getElementById("pAvatarEditBtn");
  const avatarHint = document.getElementById("pAvatarHint");
  if (avatarBtn)  avatarBtn.style.display  = editing ? "flex" : "none";
  if (avatarHint) avatarHint.style.display = editing ? "block" : "none";

  document.getElementById("saveProfileRow").style.display = editing ? "block" : "none";
  document.getElementById("editProfileBtn").textContent   = editing ? "✕ Cancel" : "✏️ Edit profile";
}

async function saveProfile() {
  // Flush any pending tag input
  _addTag("pConditionsList", "pConditionsInput");
  _addTag("pAllergiesList",  "pAllergiesInput");

  const firstName   = document.getElementById("pFirstName").value.trim();
  const lastName    = document.getElementById("pLastName").value.trim();
  const fullName    = `${firstName} ${lastName}`.trim();
  const email       = document.getElementById("pEmail").value.trim();
  const phone       = document.getElementById("pPhone").value.trim();
  const dateOfBirth = document.getElementById("pDob").value.trim();
  const gender      = document.getElementById("pGender").value;
  const address     = document.getElementById("pAddress").value.trim();
  const city        = document.getElementById("pCity").value.trim();
  const state       = document.getElementById("pState").value.trim();
  const ageRange    = document.getElementById("pAgeRange").value;
  const ecName      = document.getElementById("pEcName").value.trim();
  const ecPhone     = document.getElementById("pEcPhone").value.trim();

  const required = [
    { val: firstName, label: "First Name" },
    { val: lastName,  label: "Last Name" },
    { val: email,     label: "Email Address" },
  ];
  const missing = required.filter(f => !f.val).map(f => f.label);
  if (missing.length > 0) {
    showFeedback("profileFeedback", `Please fill in: ${missing.join(", ")}`, "error");
    return;
  }

  const btn = document.getElementById("saveProfileBtn");
  if (btn) { btn.disabled = true; btn.textContent = "Saving…"; }

  try {
    // Single API call — unified profile route
    const res  = await fetch(`${API_URL}/users/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        fullName, email, phone, dateOfBirth, address, city, state,
        gender, ageRange,
        existingConditions: _profileConditions,
        allergies: _profileAllergies,
        emergencyContact: { name: ecName, phone: ecPhone },
      }),
    });
    const data = await res.json();

    if (data.success) {
      const stored = JSON.parse(localStorage.getItem("novabuk_user") || "{}");
      stored.fullName = data.user.fullName;
      if (data.user.avatarUrl) stored.avatarUrl = data.user.avatarUrl;
      localStorage.setItem("novabuk_user", JSON.stringify(stored));
      if (typeof window.refreshNavAvatar === "function") window.refreshNavAvatar();
      showFeedback("profileFeedback", "Profile saved successfully!", "success");
      setTimeout(() => loadProfilePage(document.getElementById("main-content-wrapper")), 1200);
    } else {
      showFeedback("profileFeedback", data.message || "Could not save.", "error");
      if (btn) { btn.disabled = false; btn.textContent = "Save Changes"; }
    }
  } catch (err) {
    showFeedback("profileFeedback", "Network error. Please try again.", "error");
    if (btn) { btn.disabled = false; btn.textContent = "Save Changes"; }
  }
}

// ── PRIVACY PAGE ──────────────────────────────────────────
async function loadPrivacyPage(area) {
  try {
    const res  = await fetch(`${API_URL}/users/settings`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    const ps   = data.success ? (data.data.privacySettings || {}) : {};

    area.innerHTML = `
      <div id="privacyFeedback" style="display:none"></div>
      <h1>Privacy Settings</h1>
      ${[
        { key: "shareDataWithProviders",  label: "Share Data with Healthcare Providers", desc: "Allow doctors to access your health data" },
        { key: "marketingCommunications", label: "Marketing Communications", desc: "Receiving marketing emails and promotional content" },
        { key: "dataAnalytics",           label: "Data Analytics", desc: "Allow anonymous usage data to improve services" },
        { key: "thirdPartyDataSharing",   label: "Third-party Data Sharing", desc: "Allowing sharing of aggregated data with research partners" },
      ].map(item => `
        <div class="setting-item">
          <div class="text"><h3>${item.label}</h3><p>${item.desc}</p></div>
          <label class="switch">
            <input type="checkbox" id="ps_${item.key}" ${ps[item.key] ? "checked" : ""} onchange="savePrivacy('${item.key}', this.checked)">
            <span class="slider"></span>
          </label>
        </div>`).join("")}
      <div class="visibility-section" style="margin-top:20px">
        <h3>Profile Visibility</h3>
        <select class="dropdown" id="ps_profileVisibility" onchange="savePrivacy('profileVisibility', this.value)">
          <option value="Private - Only me"        ${ps.profileVisibility === "Private - Only me"        ? "selected" : ""}>Private - Only me</option>
          <option value="Healthcare providers only" ${ps.profileVisibility === "Healthcare providers only"? "selected" : ""}>Healthcare providers only</option>
          <option value="Private - Anyone"         ${ps.profileVisibility === "Private - Anyone"         ? "selected" : ""}>Private - Anyone</option>
        </select>
      </div>`;
  } catch (err) {
    area.innerHTML = `<p style="color:#e53e3e;padding:20px">Failed to load privacy settings.</p>`;
  }
}

async function savePrivacy(key, value) {
  try {
    await fetch(`${API_URL}/users/privacy-settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ [key]: value }),
    });
    showFeedback("privacyFeedback", "Privacy settings updated.", "success");
  } catch (err) {
    showFeedback("privacyFeedback", "Could not save. Try again.", "error");
  }
}

// ── NOTIFICATION PAGE ─────────────────────────────────────
async function loadNotificationPage(area) {
  try {
    const res  = await fetch(`${API_URL}/users/settings`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    const ns   = data.success ? (data.data.notificationSettings || {}) : {};

    area.innerHTML = `
      <div id="notifFeedback" style="display:none"></div>
      <h1>Notification Settings</h1>
      ${[
        { key: "emailNotifications",   label: "Email Notifications",  desc: "Receive notifications via email" },
        { key: "smsNotifications",     label: "SMS Notifications",    desc: "Receive important alerts via text message" },
        { key: "appointmentReminders", label: "Appointment Reminders",desc: "Get reminded about upcoming appointments" },
        { key: "healthTips",           label: "Health Tips",          desc: "Receive weekly health and wellness advice" },
        { key: "clinicUpdates",        label: "System Updates",       desc: "Get notified about system maintenance and updates" },
      ].map(item => `
        <div class="setting-item">
          <div class="text"><h3>${item.label}</h3><p>${item.desc}</p></div>
          <label class="switch">
            <input type="checkbox" id="ns_${item.key}" ${ns[item.key] ? "checked" : ""} onchange="saveNotification('${item.key}', this.checked)">
            <span class="slider"></span>
          </label>
        </div>`).join("")}`;
  } catch (err) {
    area.innerHTML = `<p style="color:#e53e3e;padding:20px">Failed to load notification settings.</p>`;
  }
}

async function saveNotification(key, value) {
  try {
    await fetch(`${API_URL}/users/notification-settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ [key]: value }),
    });
    showFeedback("notifFeedback", "Notification settings updated.", "success");
  } catch (err) {
    showFeedback("notifFeedback", "Could not save. Try again.", "error");
  }
}

// ── CHANGE PASSWORD PAGE ──────────────────────────────────
function loadChangePasswordPage(area) {
  area.innerHTML = `
    <div id="pwFeedback" style="display:none"></div>
    <h1>Change Password</h1>
    <div class="input-group" style="margin-bottom:15px">
      <label>Current Password</label>
      <input type="password" id="currentPw" placeholder="Enter current password" />
    </div>
    <div class="input-group" style="margin-bottom:15px">
      <label>New Password</label>
      <input type="password" id="newPw" placeholder="Enter new password (min 6 characters)" />
    </div>
    <div class="input-group" style="margin-bottom:20px">
      <label>Confirm New Password</label>
      <input type="password" id="confirmPw" placeholder="Confirm new password" />
    </div>
    <button class="edit-btn" onclick="changePassword()" style="float:none;background:var(--primary-teal);color:white;padding:10px 24px;" id="changePwBtn">
      Update Password
    </button>`;
}

async function changePassword() {
  const currentPassword = document.getElementById("currentPw").value;
  const newPassword     = document.getElementById("newPw").value;
  const confirmPassword = document.getElementById("confirmPw").value;
  const btn             = document.getElementById("changePwBtn");

  if (!currentPassword || !newPassword) {
    showFeedback("pwFeedback", "All fields are required.", "error"); return;
  }
  if (newPassword.length < 6) {
    showFeedback("pwFeedback", "New password must be at least 6 characters.", "error"); return;
  }
  if (newPassword !== confirmPassword) {
    showFeedback("pwFeedback", "Passwords do not match.", "error"); return;
  }

  btn.disabled    = true;
  btn.textContent = "Updating...";

  try {
    const res  = await fetch(`${API_URL}/users/change-password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (data.success) {
      showFeedback("pwFeedback", "Password changed successfully!", "success");
      ["currentPw","newPw","confirmPw"].forEach(id => document.getElementById(id).value = "");
    } else {
      showFeedback("pwFeedback", data.message || "Could not update password.", "error");
    }
  } catch (err) {
    showFeedback("pwFeedback", "Network error. Please try again.", "error");
  } finally {
    btn.disabled    = false;
    btn.textContent = "Update Password";
  }
}