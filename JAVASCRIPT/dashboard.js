// ========================================
// COMPLETE BANKING DASHBOARD WITH SUPABASE
// ========================================

// Global variables
let currentUser = null;
let userAccount = null;
let supabase = null;

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('Dashboard loaded - Supabase Edition');
    initDashboard();
});

function initSupabase() {
    if (!supabase) {
        try {
            const SUPABASE_URL = 'https://grfrcnhmnvasiotejiok.supabase.co';
            const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k';

            if (!window.supabase) {
                console.error('Supabase library not loaded');
                return null;
            }

            // Create custom storage that properly handles Supabase auth tokens
            const customStorage = {
                getItem: (key) => {
                    const value = localStorage.getItem(key);
                    console.log('📦 Storage GET:', key, value ? '✓' : '✗');

                    // Try alternative keys if main key not found
                    if (!value) {
                        if (key === 'sb-grfrcnhmnvasiotejiok-auth-token') {
                            // Check for common alternative names
                            const alternatives = [
                                'sb_session_token',
                                'sb_access_token',
                                'supabase.auth.token',
                                'sb-grfrcnhmnvasiotejiok-auth-token'
                            ];

                            for (const altKey of alternatives) {
                                const altValue = localStorage.getItem(altKey);
                                if (altValue) {
                                    console.log(`🔍 Found alternative key: ${altKey}`);
                                    return altValue;
                                }
                            }
                        }
                    }
                    return value;
                },
                setItem: (key, value) => {
                    console.log('📝 Storage SET:', key);
                    localStorage.setItem(key, value);

                    // Also set common alternative names for compatibility
                    if (key.includes('auth-token')) {
                        localStorage.setItem('sb_session_token', value);
                        localStorage.setItem('sb_access_token', value);
                        localStorage.setItem('supabase.auth.token', value);
                    }
                },
                removeItem: (key) => {
                    console.log('🗑️ Storage REMOVE:', key);
                    localStorage.removeItem(key);

                    // Remove all related auth tokens
                    if (key.includes('auth-token') || key.includes('sb-')) {
                        localStorage.removeItem('sb_session_token');
                        localStorage.removeItem('sb_access_token');
                        localStorage.removeItem('supabase.auth.token');
                    }
                }
            };

            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: false,
                    storage: customStorage
                }
            });

            console.log('✅ Supabase client initialized with custom storage');

            // Try to restore session immediately
            restoreSession(supabase);

        } catch (error) {
            console.error('Error initializing Supabase:', error);
            return null;
        }
    }
    return supabase;
}









// Add this helper function after initSupabase:
async function restoreSession(supabase) {
    try {
        // Check if we have any auth tokens
        const tokens = [
            'sb-grfrcnhmnvasiotejiok-auth-token',
            'sb_session_token',
            'sb_access_token',
            'supabase.auth.token'
        ];

        let hasToken = false;
        for (const tokenKey of tokens) {
            if (localStorage.getItem(tokenKey)) {
                hasToken = true;
                console.log(`🔑 Found auth token in: ${tokenKey}`);
                break;
            }
        }

        if (hasToken) {
            console.log('🔄 Attempting to restore session...');
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.log('Session restore error:', error.message);
                // Try to get user directly
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    console.log('✅ User restored via getUser:', user.email);
                }
            } else if (session) {
                console.log('✅ Session restored:', session.user.email);
            }
        } else {
            console.log('⚠️ No auth tokens found in storage');
        }
    } catch (error) {
        console.error('Session restore error:', error);
    }
}


function debugAuth() {
    console.log('🔍 DEBUG - Current Auth State:');

    const items = [
        'userEmail',
        'sb_user_id',
        'sb_session_token',
        'sb_access_token',
        'sb_refresh_token',
        'sb-grfrcnhmnvasiotejiok-auth-token',
        'supabase.auth.token',
        'adminAuthenticated',
        'userRole',
        'isAdmin',
        'admin_session'
    ];

    items.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
            console.log(`${key}:`, `✓ (${value.length} chars)`);

            // Show first 50 chars of interesting values
            if (key.includes('session') || key.includes('token')) {
                console.log(`   Content: ${value.substring(0, 50)}...`);
            }
        } else {
            console.log(`${key}: ✗`);
        }
    });

    // List all localStorage keys for debugging
    const allKeys = Object.keys(localStorage);
    console.log('Complete localStorage keys:', allKeys);
    console.log('Total items:', allKeys.length);
}











// Main dashboard initialization
async function initDashboard() {
    console.log('🚀 INITIALIZING DASHBOARD');

    // Check authentication
    const authResult = await checkAuth();

    if (!authResult.success) {
        console.log('🔀 Auth failed, redirecting to login');
        showNotification('Please login to continue', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }

    // Set global user
    currentUser = authResult.user;

    try {
        // Load user data from Supabase
        await loadUserData(currentUser.email);

        // Initialize UI components
        updateUserInfo();
        updateDashboardStats();

        // Initialize navigation first
        initNavigation();

        // Then load transactions
        loadRecentTransactions();

        // Load admin payment methods
        await loadAdminPaymentMethods();

        // Initialize other sections
        initDepositSection();
        initWithdrawalSection();
        initProfileSection();
        initHistorySection();
        initPartnershipSection();
        initAccountsSection();

        // Initialize time display
        updateCurrentTime();
        setInterval(updateCurrentTime, 1000);

        // Setup logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
            console.log('✅ Logout button initialized');
        }

        console.log('🎉 Dashboard fully loaded! User account:', userAccount);

        // Show success indicator
        setTimeout(() => {
            showNotification('Dashboard loaded successfully!', 'success');
        }, 500);

    } catch (error) {
        console.error('❌ Error initializing dashboard:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

// AUTHENTICATION
async function checkAuth() {
    console.log('🔐 AUTH CHECK - Starting...');

    try {
        const supabase = initSupabase();

        if (!supabase) {
            console.log('❌ Supabase client not initialized');
            return { success: false };
        }

        // Check Supabase session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            console.log('Session check error:', sessionError.message);
        }

        if (session && session.user) {
            console.log('✅ Supabase session found for:', session.user.email);

            localStorage.setItem('userEmail', session.user.email);
            localStorage.setItem('sb_user_id', session.user.id);
            localStorage.setItem('sb_session_token', session.access_token);

            return {
                success: true,
                user: {
                    id: session.user.id,
                    email: session.user.email,
                    firstName: session.user.user_metadata?.first_name ||
                        session.user.email.split('@')[0],
                    lastName: session.user.user_metadata?.last_name || '',
                    role: session.user.email === 'arinze18@vault.com' ? 'admin' : 'user'
                }
            };
        }

        // Try to get user directly
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (user && !userError) {
            console.log('✅ User found via getUser():', user.email);

            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('sb_user_id', user.id);

            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.user_metadata?.first_name ||
                        user.email.split('@')[0],
                    lastName: user.user_metadata?.last_name || '',
                    role: user.email === 'arinze18@vault.com' ? 'admin' : 'user'
                }
            };
        }

        // If no session or user, check localStorage
        const email = localStorage.getItem('userEmail');
        const userId = localStorage.getItem('sb_user_id');

        if (email) {
            console.log('🔄 Using localStorage fallback for:', email);
            return {
                success: true,
                user: {
                    email: email,
                    id: userId || 'local_user',
                    firstName: email.split('@')[0],
                    lastName: '',
                    role: email === 'arinze18@vault.com' ? 'admin' : 'user'
                }
            };
        }

        console.log('❌ No authentication found anywhere');
        return { success: false };

    } catch (error) {
        console.error('❌ Auth check error:', error);
        return { success: false };
    }
}

// USER DATA MANAGEMENT
async function loadUserData(email) {
    try {
        console.log('📊 Loading user data for:', email);

        const supabase = initSupabase();

        if (!supabase) {
            throw new Error('Supabase not initialized');
        }

        // Get user data from database
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('user_id, email, first_name, last_name, phone, address, role, status, balance, total_deposits, total_withdrawals, total_interest, referral_code, join_date')
            .eq('email', email)
            .single();

        if (userError && userError.code === 'PGRST116') {
            // User doesn't exist, create them
            console.log('Creating new user...');
            const userId = 'USER_' + Date.now();
            const referralCode = email.split('@')[0].substring(0, 3).toUpperCase() +
                Date.now().toString().slice(-4);

            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert([
                    {
                        user_id: userId,
                        email: email,
                        first_name: email.split('@')[0],
                        last_name: '',
                        phone: '',
                        address: '',
                        role: email === 'arinze18@vault.com' ? 'admin' : 'user',
                        status: 'active',
                        balance: 0.00, // Start with 0 balance
                        total_deposits: 0,
                        total_withdrawals: 0,
                        total_interest: 0,
                        referral_code: referralCode,
                        join_date: new Date().toISOString(),
                        created_at: new Date().toISOString()
                    }
                ])
                .select()
                .single();

            if (createError) throw createError;

            userAccount = {
                id: newUser.user_id,
                email: newUser.email,
                firstName: newUser.first_name,
                lastName: newUser.last_name || '',
                phone: newUser.phone || '',
                address: newUser.address || '',
                balance: 0.00, // Start with 0
                totalDeposits: newUser.total_deposits || 0,
                totalWithdrawals: newUser.total_withdrawals || 0,
                totalInterest: newUser.total_interest || 0,
                referralCode: newUser.referral_code,
                joinDate: newUser.join_date,
                role: newUser.role,
                status: newUser.status,
                transactions: [],
                accounts: []
            };

        } else if (userError) {
            console.error('Error loading user:', userError);
            throw userError;
        } else {
            // User exists, use their data
            console.log('✅ User found in database:', userData);
            userAccount = {
                id: userData.user_id,
                email: userData.email,
                firstName: userData.first_name,
                lastName: userData.last_name || '',
                phone: userData.phone || '',
                address: userData.address || '',
                balance: userData.balance || 0,
                totalDeposits: userData.total_deposits || 0,
                totalWithdrawals: userData.total_withdrawals || 0,
                totalInterest: userData.total_interest || 0,
                referralCode: userData.referral_code,
                joinDate: userData.join_date,
                role: userData.role,
                status: userData.status,
                transactions: [],
                accounts: []
            };

            // Load transactions
            await loadUserTransactions(userData.user_id);
        }

        // Ensure arrays exist
        if (!userAccount.transactions) userAccount.transactions = [];
        if (!userAccount.accounts) userAccount.accounts = [];

        console.log('✅ User data loaded successfully:', userAccount);

    } catch (error) {
        console.error('❌ Error loading user data:', error);

        // Create a fallback user with 0 balance
        userAccount = {
            id: 'USER_' + Date.now(),
            email: email,
            firstName: email.split('@')[0],
            lastName: '',
            phone: '',
            address: '',
            balance: 0.00,
            totalDeposits: 0,
            totalWithdrawals: 0,
            totalInterest: 0,
            referralCode: email.split('@')[0].substring(0, 3).toUpperCase() + Date.now().toString().slice(-4),
            joinDate: new Date().toISOString(),
            role: email === 'arinze18@vault.com' ? 'admin' : 'user',
            status: 'active',
            transactions: [],
            accounts: []
        };

        console.log('⚠️ Using fallback user data:', userAccount);
        showNotification('Using demo data', 'info');
    }
}

async function loadUserTransactions(userId) {
    try {
        const supabase = initSupabase();
        const { data, error } = await supabase
            .from('transactions')
            .select('transaction_id, type, amount, method, status, description, transaction_date, reference')
            .eq('user_id', userId)
            .order('transaction_date', { ascending: false })
            .limit(10);

        if (!error && data) {
            userAccount.transactions = data.map(t => ({
                id: t.transaction_id,
                type: t.type,
                amount: t.amount,
                date: new Date(t.transaction_date).toLocaleDateString(),
                description: t.description,
                method: t.method,
                status: t.status,
                reference: t.reference
            }));
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// Load admin payment methods for deposit section
async function loadAdminPaymentMethods() {
    try {
        const supabase = initSupabase();

        // Load bank methods for deposit section
        const { data: bankMethods, error: bankError } = await supabase
            .from('admin_payment_methods')
            .select('*')
            .eq('type', 'bank')
            .eq('status', 'active')
            .order('sort_order', { ascending: true });

        // Load crypto methods for deposit section
        const { data: cryptoMethods, error: cryptoError } = await supabase
            .from('admin_payment_methods')
            .select('*')
            .eq('type', 'crypto')
            .eq('status', 'active')
            .order('sort_order', { ascending: true });

        adminPaymentMethods = {
            bank: bankMethods || [],
            crypto: cryptoMethods || []
        };

        // Update dropdowns
        const bankSelect = document.getElementById('bank-select');
        if (bankSelect && bankMethods) {
            bankSelect.innerHTML = '<option value="">Select a bank</option>';
            bankMethods.forEach(method => {
                const option = document.createElement('option');
                option.value = method.id;
                option.textContent = method.name;
                bankSelect.appendChild(option);
            });
        }

        const cryptoSelect = document.getElementById('crypto-select');
        if (cryptoSelect && cryptoMethods) {
            cryptoSelect.innerHTML = '<option value="">Select cryptocurrency</option>';
            cryptoMethods.forEach(method => {
                const option = document.createElement('option');
                option.value = method.id;
                option.textContent = method.name;
                cryptoSelect.appendChild(option);
            });
        }

        // Display payment methods on dashboard
        displayPaymentMethodsOnDashboard();

        // Add event listeners to show details when selection changes
        document.getElementById('bank-select')?.addEventListener('change', function () {
            const methodId = this.value;
            if (methodId) {
                const method = bankMethods.find(m => m.id == methodId);
                if (method) {
                    const detailsContainer = document.getElementById('bank-details');
                    if (detailsContainer) {
                        detailsContainer.innerHTML = `<pre>${method.details}</pre>`;
                    }
                }
            }
        });

        document.getElementById('crypto-select')?.addEventListener('change', function () {
            const methodId = this.value;
            if (methodId) {
                const method = cryptoMethods.find(m => m.id == methodId);
                if (method) {
                    const detailsContainer = document.getElementById('crypto-details');
                    if (detailsContainer) {
                        detailsContainer.innerHTML = `<pre>${method.details}</pre>`;
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error loading admin payment methods:', error);
    }
}

function displayPaymentMethodsOnDashboard() {
    const container = document.getElementById('payment-methods-display');
    if (!container) return;

    if (!adminPaymentMethods.bank.length && !adminPaymentMethods.crypto.length) {
        container.innerHTML = '<div class="no-methods">No payment methods available</div>';
        return;
    }

    let html = '';

    // Add bank methods
    if (adminPaymentMethods.bank.length > 0) {
        adminPaymentMethods.bank.forEach(method => {
            html += `
                <div class="method-card-display">
                    <h4><i class="fas fa-university"></i> ${method.name}</h4>
                    <div class="method-details-display">${method.details.replace(/\n/g, '<br>')}</div>
                    <span class="method-type-badge bank">Bank Account</span>
                </div>
            `;
        });
    }

    // Add crypto methods
    if (adminPaymentMethods.crypto.length > 0) {
        adminPaymentMethods.crypto.forEach(method => {
            html += `
                <div class="method-card-display">
                    <h4><i class="fas fa-coins"></i> ${method.name}</h4>
                    <div class="method-details-display">${method.details.replace(/\n/g, '<br>')}</div>
                    <span class="method-type-badge crypto">Cryptocurrency</span>
                </div>
            `;
        });
    }

    container.innerHTML = html;
}

// UI COMPONENTS
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pageTitle = document.getElementById('page-title');
    const pageDescription = document.getElementById('page-description');

    const sectionTitles = {
        dashboard: { title: 'Dashboard', desc: 'Welcome to your banking dashboard' },
        deposit: { title: 'Deposit', desc: 'Make deposits and earn interest' },
        withdrawal: { title: 'Withdrawal', desc: 'Withdraw funds from your account' },
        profile: { title: 'Profile', desc: 'Manage your personal information' },
        history: { title: 'Transaction History', desc: 'View all your transactions' },
        partnership: { title: 'Partnership', desc: 'Earn with our referral program' },
        accounts: { title: 'My Accounts', desc: 'Manage your bank accounts' }
    };

    navItems.forEach(item => {
        item.addEventListener('click', function () {
            const section = this.dataset.section;

            // Update active nav
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            // Update page title
            if (sectionTitles[section]) {
                if (pageTitle) pageTitle.textContent = sectionTitles[section].title;
                if (pageDescription) pageDescription.textContent = sectionTitles[section].desc;
            }

            // Show selected section
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            const targetSection = document.getElementById(`${section}-section`);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
}

function updateDashboardStats() {
    if (!userAccount) return;

    const currentBalance = document.getElementById('current-balance');
    const totalDeposits = document.getElementById('total-deposits');
    const totalWithdrawals = document.getElementById('total-withdrawals');
    const totalInterest = document.getElementById('total-interest');

    if (currentBalance) currentBalance.textContent = formatCurrency(userAccount.balance);
    if (totalDeposits) totalDeposits.textContent = formatCurrency(userAccount.totalDeposits);
    if (totalWithdrawals) totalWithdrawals.textContent = formatCurrency(userAccount.totalWithdrawals);
    if (totalInterest) totalInterest.textContent = formatCurrency(userAccount.totalInterest);
}

function loadRecentTransactions() {
    const container = document.getElementById('recent-transactions');
    if (!container) {
        console.warn('Recent transactions container not found');
        return;
    }

    if (!userAccount || !userAccount.transactions) {
        container.innerHTML = '<div class="no-transactions">Loading transactions...</div>';
        return;
    }

    const recentTransactions = userAccount.transactions.slice(0, 5);

    if (recentTransactions.length === 0) {
        container.innerHTML = '<div class="no-transactions">No recent transactions</div>';
        return;
    }

    container.innerHTML = recentTransactions.map(transaction => `
        <div class="transaction-item ${transaction.type}">
            <div class="transaction-icon">
                <i class="fas fa-${transaction.type === 'deposit' ? 'arrow-down' :
            transaction.type === 'withdrawal' ? 'arrow-up' :
                'exchange-alt'}"></i>
            </div>
            <div class="transaction-details">
                <h4>${transaction.description || 'Transaction'}</h4>
                <span class="transaction-date">${transaction.date || 'N/A'}</span>
            </div>
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'deposit' ? '+' : '-'}${formatCurrency(transaction.amount || 0)}
            </div>
        </div>
    `).join('');
}

function updateUserInfo() {
    if (!userAccount) return;

    const userName = document.getElementById('sidebar-username');
    if (userName) {
        const displayName = userAccount.firstName || userAccount.email.split('@')[0];
        userName.textContent = displayName.charAt(0).toUpperCase() + displayName.slice(1);
    }

    const firstNameInput = document.getElementById('first-name');
    const lastNameInput = document.getElementById('last-name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const addressInput = document.getElementById('address');

    if (firstNameInput) firstNameInput.value = userAccount.firstName || '';
    if (lastNameInput) lastNameInput.value = userAccount.lastName || '';
    if (emailInput) emailInput.value = userAccount.email || '';
    if (phoneInput) phoneInput.value = userAccount.phone || '';
    if (addressInput) addressInput.value = userAccount.address || '';

    if (userAccount.joinDate) {
        const joinDate = new Date(userAccount.joinDate);
        const memberSince = document.getElementById('member-since');
        if (memberSince) {
            memberSince.textContent = joinDate.toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric'
            });
        }
    }

    const totalTransactions = document.getElementById('total-transactions');
    if (totalTransactions) {
        totalTransactions.textContent = userAccount.transactions?.length || 0;
    }

    const referralLink = document.getElementById('referral-link');
    if (referralLink && userAccount.referralCode) {
        referralLink.value = `${window.location.origin}/register?ref=${userAccount.referralCode}`;
    }
}

// DEPOSIT SECTION FUNCTIONS
function initDepositSection() {
    const depositAmount = document.getElementById('deposit-amount');
    const investmentPeriod = document.getElementById('investment-period');
    const selectedWeeks = document.getElementById('selected-weeks');
    const makeDepositBtn = document.getElementById('make-deposit');
    const depositMethod = document.getElementById('deposit-method');

    if (!depositAmount || !investmentPeriod) return;

    // Update week display
    investmentPeriod.addEventListener('input', function () {
        const weeks = this.value;
        if (selectedWeeks) selectedWeeks.textContent = `${weeks} Week${weeks > 1 ? 's' : ''}`;
        updateDepositPreview();
    });

    // Update deposit preview
    depositAmount.addEventListener('input', updateDepositPreview);

    // Payment method change
    if (depositMethod) {
        depositMethod.addEventListener('change', function () {
            updateDepositMethodFields(this.value);
            updateDepositPreview();
        });
    }

    // Make deposit button
    if (makeDepositBtn) {
        makeDepositBtn.addEventListener('click', processDepositRequest);
    }

    // Initial update
    updateDepositPreview();
    if (depositMethod) updateDepositMethodFields(depositMethod.value);
}

function updateDepositMethodFields(method) {
    // Hide all fields
    ['bank-fields', 'crypto-fields'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // Show selected fields
    const selectedFields = document.getElementById(`${method}-fields`);
    if (selectedFields) {
        selectedFields.style.display = 'block';
    }

    // Update preview
    const methodNames = {
        'bank': 'Bank Transfer',
        'crypto': 'Cryptocurrency'
    };

    const previewMethod = document.getElementById('preview-method');
    if (previewMethod) {
        previewMethod.textContent = methodNames[method] || 'Unknown';
    }
}

function updateDepositPreview() {
    const amount = parseFloat(document.getElementById('deposit-amount').value) || 0;
    const weeks = parseInt(document.getElementById('investment-period').value) || 1;

    // Calculate interest with reduced rate after first week
    let totalInterest = 0;
    let currentAmount = amount;

    for (let week = 1; week <= weeks; week++) {
        const interestRate = (week === 1) ? 0.5 : 0.25; // 50% first week, 25% subsequent weeks
        const weeklyInterest = currentAmount * interestRate;
        totalInterest += weeklyInterest;
        currentAmount += weeklyInterest;
    }

    const finalAmount = amount + totalInterest;

    // Update displays
    const elements = {
        'preview-amount': formatCurrency(amount),
        'preview-weeks': `${weeks} Week${weeks > 1 ? 's' : ''}`,
        'preview-total-interest': formatCurrency(totalInterest),
        'preview-final': formatCurrency(finalAmount),
        'projected-interest': formatCurrency(totalInterest)
    };

    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = elements[id];
    });

    // Update weekly breakdown
    updateWeeklyBreakdown(amount, weeks);
}

function updateWeeklyBreakdown(amount, weeks) {
    const container = document.getElementById('week-breakdown');
    if (!container) return;

    let html = '';
    let currentBalance = amount;

    for (let week = 1; week <= weeks; week++) {
        const interestRate = (week === 1) ? 0.5 : 0.25;
        const weeklyInterest = currentBalance * interestRate;
        currentBalance += weeklyInterest;

        html += `
            <div class="breakdown-item">
                <span>Week ${week} (${week === 1 ? '50%' : '25%'}):</span>
                <span>${formatCurrency(currentBalance)}</span>
            </div>
        `;
    }

    container.innerHTML = html;
}

async function processDepositRequest() {
    const amount = parseFloat(document.getElementById('deposit-amount').value) || 0;
    const method = document.getElementById('deposit-method').value;
    const weeks = parseInt(document.getElementById('investment-period').value) || 1;

    if (amount < 100) {
        showNotification('Minimum deposit amount is $100', 'error');
        return;
    }

    let reference = '';
    let methodDetails = '';

    if (method === 'bank') {
        const bankSelect = document.getElementById('bank-select');
        const bankId = bankSelect.value;
        const depositRef = document.getElementById('deposit-reference').value;

        if (!bankId) {
            showNotification('Please select a bank', 'error');
            return;
        }

        if (!depositRef.trim()) {
            showNotification('Please enter transaction reference', 'error');
            return;
        }

        reference = depositRef;
        const bankMethod = adminPaymentMethods.bank.find(m => m.id == bankId);
        methodDetails = bankMethod ? bankMethod.details : 'Bank Transfer';

    } else if (method === 'crypto') {
        const cryptoSelect = document.getElementById('crypto-select');
        const cryptoId = cryptoSelect.value;
        const txid = document.getElementById('crypto-txid').value;

        if (!cryptoId) {
            showNotification('Please select a cryptocurrency', 'error');
            return;
        }

        if (!txid.trim()) {
            showNotification('Please enter transaction ID', 'error');
            return;
        }

        reference = txid;
        const cryptoMethod = adminPaymentMethods.crypto.find(m => m.id == cryptoId);
        methodDetails = cryptoMethod ? cryptoMethod.details : 'Cryptocurrency';
    }

    try {
        const supabase = initSupabase();
        const requestId = 'DEP_' + Date.now();

        // Create deposit request WITHOUT user_email
        const { error } = await supabase
            .from('deposit_requests')
            .insert([{
                request_id: requestId,
                user_id: userAccount.id,
                amount: amount,
                weeks: weeks,
                method: method,
                method_details: methodDetails,
                reference: reference,
                status: 'pending',
                created_at: new Date().toISOString()
            }]);

        if (error) throw error;

        // Create transaction record
        await supabase
            .from('transactions')
            .insert([{
                transaction_id: 'TXN_' + Date.now(),
                user_id: userAccount.id,
                type: 'deposit',
                amount: amount,
                description: `Deposit request via ${method}`,
                method: method,
                status: 'pending',
                transaction_date: new Date().toISOString()
            }]);

        // Update local data
        userAccount.transactions.unshift({
            id: requestId,
            type: 'deposit',
            amount: amount,
            date: new Date().toLocaleDateString(),
            description: `Deposit request via ${method}`,
            method: method,
            status: 'pending'
        });

        // Show success modal
        showDepositSuccessModal(amount, method, reference);

        // Update UI
        loadRecentTransactions();

    } catch (error) {
        console.error('Error processing deposit:', error);
        showNotification('Failed to submit deposit request', 'error');
    }
}

function showDepositSuccessModal(amount, method, reference) {
    const modal = document.getElementById('depositModal');
    document.getElementById('modal-deposit-amount').textContent = formatCurrency(amount);
    document.getElementById('modal-deposit-method').textContent =
        method === 'bank' ? 'Bank Transfer' : 'Cryptocurrency';
    document.getElementById('modal-deposit-ref').textContent = reference || 'N/A';

    openModal(modal);

    document.querySelectorAll('#depositModal .modal-close, #depositModal .btn-primary').forEach(btn => {
        btn.addEventListener('click', () => closeModal(modal));
    });
}

// WITHDRAWAL SECTION FUNCTIONS
function initWithdrawalSection() {
    const withdrawalAmount = document.getElementById('withdrawal-amount');
    const withdrawalMethod = document.getElementById('withdrawal-method');
    const makeWithdrawalBtn = document.getElementById('make-withdrawal');

    if (!withdrawalAmount || !makeWithdrawalBtn) return;

    withdrawalAmount.addEventListener('input', updateWithdrawalPreview);

    // Withdrawal method change
    if (withdrawalMethod) {
        withdrawalMethod.addEventListener('change', function () {
            updateWithdrawalMethodFields(this.value);
        });
    }

    makeWithdrawalBtn.addEventListener('click', processWithdrawalRequest);

    // Quick buttons
    document.querySelectorAll('.quick-btn').forEach(button => {
        button.addEventListener('click', function () {
            const amount = this.dataset.amount;
            document.getElementById('withdrawal-amount').value = amount;
            updateWithdrawalPreview();
        });
    });

    updateWithdrawalPreview();
    if (withdrawalMethod) updateWithdrawalMethodFields(withdrawalMethod.value);
}

function updateWithdrawalMethodFields(method) {
    // Hide all fields
    ['withdrawal-bank-fields', 'withdrawal-crypto-fields'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // Show selected fields
    const selectedFields = document.getElementById(`withdrawal-${method}-fields`);
    if (selectedFields) {
        selectedFields.style.display = 'block';
    }
}

function updateWithdrawalPreview() {
    const amount = parseFloat(document.getElementById('withdrawal-amount').value) || 0;
    const feeRate = 0.02;
    const fee = amount * feeRate;
    const netAmount = amount - fee;
    const availableBalance = userAccount.balance || 0;

    const elements = {
        'preview-withdrawal': formatCurrency(amount),
        'preview-fee': formatCurrency(fee),
        'preview-net': formatCurrency(netAmount),
        'preview-available': formatCurrency(availableBalance),
        'estimated-fee': formatCurrency(fee)
    };

    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = elements[id];
    });
}

async function processWithdrawalRequest() {
    const amount = parseFloat(document.getElementById('withdrawal-amount').value) || 0;
    const method = document.getElementById('withdrawal-method').value;
    const feeRate = 0.02;
    const fee = amount * feeRate;
    const netAmount = amount - fee;

    if (amount < 50) {
        showNotification('Minimum withdrawal amount is $50', 'error');
        return;
    }

    if (amount > userAccount.balance) {
        showNotification('Insufficient funds', 'error');
        return;
    }

    let accountDetails = '';
    let methodDetails = '';

    if (method === 'bank') {
        const bankName = document.getElementById('withdrawal-bank-name').value;
        const accountNumber = document.getElementById('withdrawal-account-number').value;
        const accountHolder = document.getElementById('withdrawal-account-holder').value;
        const routing = document.getElementById('withdrawal-routing').value;

        if (!bankName || !accountNumber || !accountHolder || !routing) {
            showNotification('Please fill all bank details', 'error');
            return;
        }

        accountDetails = `Bank Name: ${bankName}\nAccount Number: ${accountNumber}\nAccount Holder: ${accountHolder}\nRouting/SWIFT: ${routing}`;
        methodDetails = 'Bank Transfer';

    } else if (method === 'crypto') {
        const cryptoType = document.getElementById('withdrawal-crypto-type').value;
        const walletAddress = document.getElementById('withdrawal-wallet-address').value;
        const network = document.getElementById('withdrawal-network').value;

        if (!cryptoType || !walletAddress || !network) {
            showNotification('Please fill all cryptocurrency details', 'error');
            return;
        }

        accountDetails = `Cryptocurrency: ${cryptoType}\nWallet Address: ${walletAddress}\nNetwork: ${network}`;
        methodDetails = 'Cryptocurrency';
    }

    try {
        const supabase = initSupabase();
        const requestId = 'WDR_' + Date.now();

        // Create withdrawal request WITHOUT user_email
        const { error } = await supabase
            .from('withdrawal_requests')
            .insert([{
                request_id: requestId,
                user_id: userAccount.id,
                amount: amount,
                fee: fee,
                net_amount: netAmount,
                method: method,
                method_details: methodDetails,
                account_details: accountDetails,
                status: 'pending',
                created_at: new Date().toISOString()
            }]);

        if (error) throw error;

        // Create transaction
        await supabase
            .from('transactions')
            .insert([{
                transaction_id: 'TXN_' + Date.now(),
                user_id: userAccount.id,
                type: 'withdrawal',
                amount: amount,
                fee: fee,
                net_amount: netAmount,
                description: `Withdrawal request via ${method}`,
                method: method,
                status: 'pending',
                transaction_date: new Date().toISOString()
            }]);

        // Update local data
        userAccount.transactions.unshift({
            id: requestId,
            type: 'withdrawal',
            amount: amount,
            date: new Date().toLocaleDateString(),
            description: `Withdrawal request via ${method}`,
            method: method,
            status: 'pending',
            fee: fee
        });

        // Show success modal with professional message
        showWithdrawalSuccessModal(amount, method, netAmount);

        // Update UI
        loadRecentTransactions();

    } catch (error) {
        console.error('Error processing withdrawal:', error);
        showNotification('Failed to submit withdrawal request', 'error');
    }
}

function showWithdrawalSuccessModal(amount, method, netAmount) {
    const modal = document.getElementById('withdrawalModal');
    document.getElementById('modal-withdrawal-amount').textContent = formatCurrency(amount);
    document.getElementById('modal-withdrawal-method').textContent =
        method === 'bank' ? 'Bank Transfer' : 'Cryptocurrency';
    document.getElementById('modal-net-amount').textContent = formatCurrency(netAmount);

    // Set professional success message
    const successMessage = document.getElementById('withdrawal-success-message');
    if (successMessage) {
        successMessage.textContent = 'Withdrawal request has been sent to VAULT Industries. Your funds will reflect in your account as soon as possible.';
    }

    openModal(modal);

    document.querySelectorAll('#withdrawalModal .modal-close, #withdrawalModal .btn-primary').forEach(btn => {
        btn.addEventListener('click', () => closeModal(modal));
    });
}

// PROFILE SECTION FUNCTIONS
function initProfileSection() {
    const saveProfileBtn = document.getElementById('save-profile');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', saveProfile);
    }
}

async function saveProfile() {
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;

    try {
        const supabase = initSupabase();

        const { error } = await supabase
            .from('users')
            .update({
                first_name: firstName,
                last_name: lastName,
                phone: phone,
                address: address,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userAccount.id);

        if (error) throw error;

        // Update local data
        userAccount.firstName = firstName;
        userAccount.lastName = lastName;
        userAccount.phone = phone;
        userAccount.address = address;

        showNotification('Profile updated successfully!', 'success');

    } catch (error) {
        console.error('Error saving profile:', error);
        showNotification('Failed to update profile', 'error');
    }
}

// HISTORY SECTION FUNCTIONS
function initHistorySection() {
    const applyFilterBtn = document.getElementById('apply-filter');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', loadTransactionHistory);
    }

    loadTransactionHistory();
}

function loadTransactionHistory() {
    const container = document.getElementById('history-table-body');
    if (!container || !userAccount.transactions) return;

    const transactions = userAccount.transactions;

    if (transactions.length === 0) {
        container.innerHTML = '<tr><td colspan="6" class="no-data">No transactions found</td></tr>';
        return;
    }

    container.innerHTML = transactions.map(transaction => `
        <tr>
            <td>${transaction.date}</td>
            <td><span class="transaction-type ${transaction.type}">${transaction.type}</span></td>
            <td class="${transaction.type}">${transaction.type === 'deposit' ? '+' : '-'}${formatCurrency(transaction.amount)}</td>
            <td>${transaction.method || 'N/A'}</td>
            <td><span class="status ${transaction.status}">${transaction.status}</span></td>
            <td>${transaction.reference || transaction.id.substring(0, 8)}...</td>
        </tr>
    `).join('');
}

// PARTNERSHIP SECTION FUNCTIONS
function initPartnershipSection() {
    const copyReferralBtn = document.getElementById('copy-referral');
    if (copyReferralBtn) {
        copyReferralBtn.addEventListener('click', copyReferralLink);
    }
}

function copyReferralLink() {
    const referralLink = document.getElementById('referral-link');
    if (referralLink && referralLink.value) {
        referralLink.select();
        referralLink.setSelectionRange(0, 99999);
        document.execCommand('copy');
        showNotification('Referral link copied!', 'success');
    }
}

// ACCOUNTS SECTION FUNCTIONS
function initAccountsSection() {
    const addAccountBtn = document.getElementById('add-new-account');
    const transferBtn = document.getElementById('make-transfer');

    if (addAccountBtn) {
        addAccountBtn.addEventListener('click', addNewAccount);
    }

    if (transferBtn) {
        transferBtn.addEventListener('click', processTransfer);
    }

    loadAccounts();
}

async function addNewAccount() {
    const accountType = document.getElementById('new-account-type').value;
    const accountName = document.getElementById('new-account-name').value;
    const initialBalance = parseFloat(document.getElementById('new-account-balance').value) || 0;

    if (!accountName.trim()) {
        showNotification('Please enter account name', 'error');
        return;
    }

    try {
        const supabase = initSupabase();

        const { data, error } = await supabase
            .from('user_accounts')
            .insert([{
                user_id: userAccount.id,
                account_name: accountName,
                account_type: accountType,
                account_number: Math.floor(1000 + Math.random() * 9000).toString(),
                balance: initialBalance,
                status: 'active',
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) throw error;

        // Update local data
        if (data && data.length > 0) {
            userAccount.accounts.push({
                id: data[0].id.toString(),
                name: data[0].account_name,
                type: data[0].account_type,
                number: data[0].account_number,
                balance: data[0].balance,
                status: data[0].status
            });
        }

        // Update UI
        loadAccounts();
        showNotification('Account added successfully!', 'success');

        // Reset form
        document.getElementById('new-account-name').value = '';
        document.getElementById('new-account-balance').value = '';

    } catch (error) {
        console.error('Error adding account:', error);
        showNotification('Failed to add account: ' + error.message, 'error');
    }
}

function loadAccounts() {
    const container = document.getElementById('accounts-grid');
    if (!container) return;

    if (!userAccount.accounts || userAccount.accounts.length === 0) {
        container.innerHTML = '<div class="no-accounts">No accounts found</div>';
        return;
    }

    container.innerHTML = userAccount.accounts.map(account => `
        <div class="account-card">
            <div class="account-header">
                <div class="account-icon">
                    <i class="fas fa-${getAccountIcon(account.type)}"></i>
                </div>
                <div class="account-info">
                    <h3>${account.name}</h3>
                    <span class="account-number">${account.number ? `**** ${account.number}` : 'No number'}</span>
                </div>
            </div>
            <div class="account-balance">
                <p class="amount">${formatCurrency(account.balance)}</p>
                <span class="account-status ${account.status}">${account.status}</span>
            </div>
        </div>
    `).join('');
}

function getAccountIcon(type) {
    switch (type) {
        case 'checking': return 'university';
        case 'savings': return 'piggy-bank';
        case 'investment': return 'chart-line';
        case 'crypto': return 'bitcoin';
        default: return 'wallet';
    }
}

async function processTransfer() {
    const fromAccount = document.getElementById('transfer-from').value;
    const toAccount = document.getElementById('transfer-to').value;
    const amount = parseFloat(document.getElementById('transfer-amount').value) || 0;

    if (!fromAccount || !toAccount || amount <= 0) {
        showNotification('Please fill all transfer details', 'error');
        return;
    }

    if (fromAccount === toAccount) {
        showNotification('Cannot transfer to same account', 'error');
        return;
    }

    try {
        showNotification('Processing transfer...', 'info');
        showNotification('Transfer completed successfully!', 'success');

        // Reset form
        document.getElementById('transfer-amount').value = '';

    } catch (error) {
        console.error('Transfer error:', error);
        showNotification('Transfer failed: ' + error.message, 'error');
    }
}

// UTILITY FUNCTIONS
function formatCurrency(amount) {
    return '$' + (parseFloat(amount) || 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function showNotification(message, type = 'info') {
    document.querySelectorAll('.notification-popup').forEach(el => el.remove());

    const notification = document.createElement('div');
    notification.className = `notification-popup ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const dateString = now.toLocaleDateString();

    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = `${dateString} • ${timeString}`;
    }
}

function openModal(modal) {
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modal) {
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

async function logout() {
    console.log('Logging out...');

    showNotification('Logging out...', 'info');

    try {
        const supabase = initSupabase();
        if (supabase) {
            await supabase.auth.signOut();
            console.log('✅ Supabase signout successful');
        }
    } catch (error) {
        console.log('Supabase signout note:', error.message);
    }

    // Clear all auth data
    const itemsToRemove = [
        'sb_session_token',
        'sb_access_token',
        'sb_refresh_token',
        'userEmail',
        'userRole',
        'sb_user_id',
        'sb-session'
    ];

    itemsToRemove.forEach(item => {
        localStorage.removeItem(item);
        sessionStorage.removeItem(item);
    });

    setTimeout(() => {
        showNotification('Logged out successfully!', 'success');
        window.location.href = 'index.html';
    }, 500);
}

// Initialize
console.log('Dashboard script loaded successfully');