// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard loaded');
    initDashboard();
});

async function initDashboard() {
    // Check authentication
    await checkDashboardAuth();
    
    // Initialize components
    initNavigation();
    initDashboardStats();
    loadRecentTransactions();
    initDepositSection();
    initWithdrawalSection();
    initProfileSection();
    initHistorySection();
    initPartnershipSection();
    initAccountsSection();
    
    // Update time
    updateTime();
    setInterval(updateTime, 1000);
    
    // Setup logout
    document.getElementById('logout-btn').addEventListener('click', logout);
}

// Check Authentication
async function checkDashboardAuth() {
    try {
        const { success, user } = await supabaseClient.getCurrentUser();
        
        if (!success || !user) {
            window.location.href = 'login.html';
            return;
        }
        
        // Update user info
        updateUserInfo(user);
        return user;
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = 'login.html';
    }
}

// Update User Info
function updateUserInfo(user) {
    // Update sidebar
    document.getElementById('sidebar-username').textContent = 
        `${user.first_name} ${user.last_name}`;
    
    // Update profile form
    document.getElementById('first-name').value = user.first_name || '';
    document.getElementById('last-name').value = user.last_name || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('address').value = user.address || '';
    
    // Update member since
    if (user.join_date) {
        const joinDate = new Date(user.join_date);
        document.getElementById('member-since').textContent = 
            joinDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    
    // Update referral link
    const referralLink = document.getElementById('referral-link');
    if (referralLink && user.referral_code) {
        referralLink.value = `https://vault.com/ref/${user.referral_code}`;
    }
}

// Navigation
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pageTitle = document.getElementById('page-title');
    const pageDescription = document.getElementById('page-description');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;
            
            // Update active nav
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Update page title
            const titles = {
                dashboard: { title: 'Dashboard', desc: 'Welcome to your banking dashboard' },
                deposit: { title: 'Deposit', desc: 'Make deposits and earn interest' },
                withdrawal: { title: 'Withdrawal', desc: 'Withdraw funds from your account' },
                profile: { title: 'Profile', desc: 'Manage your personal information' },
                history: { title: 'Transaction History', desc: 'View all your transactions' },
                partnership: { title: 'Partnership', desc: 'Earn with our referral program' },
                accounts: { title: 'My Accounts', desc: 'Manage your bank accounts' }
            };
            
            if (titles[section]) {
                pageTitle.textContent = titles[section].title;
                pageDescription.textContent = titles[section].desc;
            }
            
            // Show selected section
            document.querySelectorAll('.content-section').forEach(s => {
                s.classList.remove('active');
            });
            document.getElementById(`${section}-section`).classList.add('active');
        });
    });
}

// Dashboard Stats
async function initDashboardStats() {
    const { success, user } = await supabaseClient.getCurrentUser();
    
    if (success && user) {
        // Update stats
        document.getElementById('current-balance').textContent = formatCurrency(user.balance || 0);
        document.getElementById('total-deposits').textContent = formatCurrency(user.total_deposits || 0);
        document.getElementById('total-withdrawals').textContent = formatCurrency(user.total_withdrawals || 0);
        document.getElementById('total-interest').textContent = formatCurrency(user.total_interest || 0);
        
        // Update total transactions
        const { data: transactions } = await supabaseClient.supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.user_id);
        
        if (transactions) {
            document.getElementById('total-transactions').textContent = transactions.length;
        }
    }
}

// Recent Transactions
async function loadRecentTransactions() {
    const { success, user } = await supabaseClient.getCurrentUser();
    
    if (!success || !user) return;
    
    const { data: transactions, error } = await supabaseClient.supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.user_id)
        .order('transaction_date', { ascending: false })
        .limit(5);
    
    if (error) {
        console.error('Error loading transactions:', error);
        return;
    }
    
    const container = document.getElementById('recent-transactions');
    if (!container) return;
    
    if (!transactions || transactions.length === 0) {
        container.innerHTML = '<div class="no-transactions">No recent transactions</div>';
        return;
    }
    
    container.innerHTML = transactions.map(transaction => `
        <div class="transaction-item ${transaction.type}">
            <div class="transaction-icon">
                <i class="fas fa-${transaction.type === 'deposit' ? 'arrow-down' : 'arrow-up'}"></i>
            </div>
            <div class="transaction-details">
                <h4>${transaction.description || `${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}`}</h4>
                <span class="transaction-date">${new Date(transaction.transaction_date).toLocaleDateString()}</span>
            </div>
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'deposit' ? '+' : '-'}${formatCurrency(transaction.amount)}
            </div>
        </div>
    `).join('');
}

// Deposit Section
function initDepositSection() {
    const depositAmount = document.getElementById('deposit-amount');
    const investmentPeriod = document.getElementById('investment-period');
    const depositMethod = document.getElementById('deposit-method');
    const makeDepositBtn = document.getElementById('make-deposit');
    
    if (!depositAmount || !investmentPeriod) return;
    
    // Update calculator
    function updateDepositCalculator() {
        const amount = parseFloat(depositAmount.value) || 0;
        const weeks = parseInt(investmentPeriod.value) || 4;
        const rate = 0.5; // 50%
        
        const total = amount * Math.pow(1 + rate, weeks);
        const returns = total - amount;
        
        // Update preview
        document.getElementById('preview-amount').textContent = formatCurrency(amount);
        document.getElementById('preview-weeks').textContent = `${weeks} Week${weeks > 1 ? 's' : ''}`;
        document.getElementById('preview-total-interest').textContent = formatCurrency(returns);
        document.getElementById('preview-final').textContent = formatCurrency(total);
        document.getElementById('projected-interest').textContent = formatCurrency(returns);
        
        // Update method
        const methodText = depositMethod.value === 'bank' ? 'Bank Transfer' : 
                         depositMethod.value === 'crypto' ? 'Cryptocurrency' : 'Card';
        document.getElementById('preview-method').textContent = methodText;
        
        // Update weekly breakdown
        updateWeeklyBreakdown(amount, weeks);
    }
    
    // Weekly breakdown
    function updateWeeklyBreakdown(amount, weeks) {
        const container = document.getElementById('week-breakdown');
        if (!container) return;
        
        let html = '';
        let currentBalance = amount;
        const rate = 0.5;
        
        for (let week = 1; week <= weeks; week++) {
            const weeklyInterest = currentBalance * rate;
            currentBalance += weeklyInterest;
            
            html += `
                <div class="breakdown-item">
                    <span>Week ${week}</span>
                    <span>${formatCurrency(currentBalance)}</span>
                </div>
            `;
        }
        
        container.innerHTML = html;
    }
    
    // Method change
    if (depositMethod) {
        depositMethod.addEventListener('change', function() {
            // Show/hide method fields
            document.querySelectorAll('.method-fields').forEach(field => {
                field.style.display = 'none';
            });
            
            const methodFields = document.getElementById(`${this.value}-fields`);
            if (methodFields) {
                methodFields.style.display = 'block';
            }
            
            updateDepositCalculator();
        });
    }
    
    // Make deposit
    if (makeDepositBtn) {
        makeDepositBtn.addEventListener('click', async function() {
            const amount = parseFloat(depositAmount.value) || 0;
            const method = depositMethod.value;
            const weeks = parseInt(investmentPeriod.value) || 4;
            
            if (amount < 100) {
                showNotification('Minimum deposit is $100', 'error');
                return;
            }
            
            const { success, user } = await supabaseClient.getCurrentUser();
            if (!success || !user) return;
            
            // Create deposit request
            const depositData = {
                user_id: user.user_id,
                amount: amount,
                weeks: weeks,
                method: method,
                status: 'pending'
            };
            
            // Get method details
            if (method === 'bank') {
                depositData.method_details = document.getElementById('bank-details').value;
                depositData.reference = document.getElementById('deposit-reference').value;
            } else if (method === 'crypto') {
                depositData.method_details = `Crypto: ${document.getElementById('crypto-type').value}, Address: ${document.getElementById('crypto-address').value}`;
                depositData.reference = document.getElementById('crypto-txid').value;
            }
            
            const { success: depositSuccess, requestId } = await supabaseClient.createDepositRequest(depositData);
            
            if (depositSuccess) {
                showNotification('Deposit request submitted! Waiting for admin approval.', 'success');
                
                // Reset form
                depositAmount.value = '1000';
                investmentPeriod.value = '4';
                
                // Update UI
                updateDepositCalculator();
            } else {
                showNotification('Failed to submit deposit request', 'error');
            }
        });
    }
    
    // Initial calculation
    updateDepositCalculator();
    
    // Update on input
    depositAmount.addEventListener('input', updateDepositCalculator);
    investmentPeriod.addEventListener('input', updateDepositCalculator);
}

// Withdrawal Section (similar structure)
function initWithdrawalSection() {
    // Implement withdrawal functionality
}

// Profile Section
function initProfileSection() {
    const saveProfileBtn = document.getElementById('save-profile');
    
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async function() {
            const firstName = document.getElementById('first-name').value;
            const lastName = document.getElementById('last-name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const address = document.getElementById('address').value;
            
            const { success, user } = await supabaseClient.getCurrentUser();
            if (!success || !user) return;
            
            // Update user in database
            const { error } = await supabaseClient.supabase
                .from('users')
                .update({
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone,
                    address: address,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.user_id);
            
            if (error) {
                showNotification('Failed to update profile', 'error');
            } else {
                showNotification('Profile updated successfully!', 'success');
                updateUserInfo({ ...user, first_name: firstName, last_name: lastName, phone, address });
            }
        });
    }
}

// History Section
function initHistorySection() {
    // Implement transaction history
}

// Partnership Section
function initPartnershipSection() {
    const copyReferralBtn = document.getElementById('copy-referral');
    
    if (copyReferralBtn) {
        copyReferralBtn.addEventListener('click', function() {
            const referralLink = document.getElementById('referral-link');
            if (referralLink) {
                referralLink.select();
                document.execCommand('copy');
                showNotification('Referral link copied to clipboard!', 'success');
            }
        });
    }
}

// Accounts Section
function initAccountsSection() {
    // Implement accounts management
}

// Utility Functions
function formatCurrency(amount) {
    return '$' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const dateString = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = `${dateString} • ${timeString}`;
    }
}

async function logout() {
    const { success } = await supabaseClient.signOut();
    if (success) {
        window.location.href = 'index.html';
    }
}