// Supabase Configuration
const SUPABASE_URL = 'https://grfrcnhmnvasiotejiok.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k';


// Create Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// User Authentication Functions
async function signUp(email, password, userData) {
    try {
        // First, sign up with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: userData
            }
        });

        if (error) throw error;

        // Create user in database
        const userId = 'USER_' + Date.now();
        const referralCode = userData.first_name.substring(0, 3).toUpperCase() +
            userData.last_name.substring(0, 3).toUpperCase() +
            Date.now().toString().slice(-4);

        const { error: dbError } = await supabase
            .from('users')
            .insert([
                {
                    user_id: userId,
                    email: email,
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    phone: userData.phone || '',
                    role: 'user',
                    status: 'active',
                    balance: 0,
                    referral_code: referralCode,
                    join_date: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ]);

        if (dbError) {
            console.warn('User might already exist in database:', dbError);
            // Continue even if there's a database error
        }

        return {
            success: true,
            data: {
                ...data,
                user_id: userId
            }
        };
    } catch (error) {
        console.error('Sign up error:', error);
        return { success: false, error: error.message };
    }
}

async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Get or create user in database
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (userError && userError.code === 'PGRST116') {
            // User doesn't exist in database, create them
            const userId = 'USER_' + Date.now();
            const referralCode = email.split('@')[0].substring(0, 3).toUpperCase() +
                Date.now().toString().slice(-4);

            await supabase
                .from('users')
                .insert([
                    {
                        user_id: userId,
                        email: email,
                        first_name: email.split('@')[0],
                        role: email === 'arinze18@vault.com' ? 'admin' : 'user',
                        status: 'active',
                        balance: 0,
                        referral_code: referralCode,
                        join_date: new Date().toISOString(),
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                ]);
        }

        return { success: true, data };
    } catch (error) {
        console.error('Sign in error:', error);
        return { success: false, error: error.message };
    }
}

async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Sign out error:', error);
        return { success: false, error: error.message };
    }
}

async function getCurrentUser() {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, user: null };

        // Get user data from database
        const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

        if (error && error.code === 'PGRST116') {
            // Create user if doesn't exist
            const userId = 'USER_' + Date.now();
            await supabase
                .from('users')
                .insert([
                    {
                        user_id: userId,
                        email: user.email,
                        first_name: user.email.split('@')[0],
                        role: user.email === 'admin@vault.com' ? 'admin' : 'user',
                        status: 'active',
                        balance: 0,
                        join_date: new Date().toISOString(),
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                ]);

            return {
                success: true,
                user: {
                    email: user.email,
                    user_id: userId,
                    first_name: user.email.split('@')[0],
                    role: user.email === 'admin@vault.com' ? 'admin' : 'user'
                }
            };
        }

        return { success: true, user: userData };
    } catch (error) {
        console.error('Get user error:', error);
        return { success: false, user: null, error: error.message };
    }
}

// Payment Methods Functions
async function getPaymentMethods(type = null) {
    try {
        let query = supabase
            .from('payment_methods')
            .select('*')
            .eq('status', 'active');

        if (type) {
            query = query.eq('type', type);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Get payment methods error:', error);
        return { success: false, error: error.message };
    }
}

// Admin Functions
async function addPaymentMethod(methodData) {
    try {
        const methodId = 'PM_' + Date.now();

        const { data, error } = await supabase
            .from('payment_methods')
            .insert([
                {
                    method_id: methodId,
                    name: methodData.name,
                    type: methodData.type,
                    details: methodData.details,
                    status: methodData.status || 'active',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ]);

        if (error) throw error;

        return { success: true, data, methodId };
    } catch (error) {
        console.error('Add payment method error:', error);
        return { success: false, error: error.message };
    }
}

async function updatePaymentMethod(methodId, updates) {
    try {
        const { data, error } = await supabase
            .from('payment_methods')
            .update(updates)
            .eq('method_id', methodId);

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Update payment method error:', error);
        return { success: false, error: error.message };
    }
}

// Transaction Functions
async function createTransaction(transactionData) {
    try {
        const transactionId = 'TRX_' + Date.now();

        const { data, error } = await supabase
            .from('transactions')
            .insert([
                {
                    transaction_id: transactionId,
                    user_id: transactionData.user_id,
                    type: transactionData.type,
                    amount: transactionData.amount,
                    fee: transactionData.fee || 0,
                    net_amount: transactionData.net_amount,
                    method: transactionData.method,
                    status: transactionData.status || 'pending',
                    description: transactionData.description,
                    transaction_date: new Date().toISOString(),
                    created_at: new Date().toISOString()
                }
            ]);

        if (error) throw error;

        return { success: true, data, transactionId };
    } catch (error) {
        console.error('Create transaction error:', error);
        return { success: false, error: error.message };
    }
}

// Deposit Functions
async function createDepositRequest(depositData) {
    try {
        const requestId = 'DEP_' + Date.now();

        const { data, error } = await supabase
            .from('deposit_requests')
            .insert([
                {
                    request_id: requestId,
                    user_id: depositData.user_id,
                    amount: depositData.amount,
                    weeks: depositData.weeks || 4,
                    method: depositData.method,
                    method_details: depositData.method_details,
                    reference: depositData.reference,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ]);

        if (error) throw error;

        return { success: true, data, requestId };
    } catch (error) {
        console.error('Create deposit request error:', error);
        return { success: false, error: error.message };
    }
}

// Withdrawal Functions
async function createWithdrawalRequest(withdrawalData) {
    try {
        const requestId = 'WDR_' + Date.now();

        const { data, error } = await supabase
            .from('withdrawal_requests')
            .insert([
                {
                    request_id: requestId,
                    user_id: withdrawalData.user_id,
                    amount: withdrawalData.amount,
                    fee: withdrawalData.fee || 0,
                    net_amount: withdrawalData.net_amount,
                    method: withdrawalData.method,
                    method_details: withdrawalData.method_details,
                    account_details: withdrawalData.account_details,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ]);

        if (error) throw error;

        return { success: true, data, requestId };
    } catch (error) {
        console.error('Create withdrawal request error:', error);
        return { success: false, error: error.message };
    }
}

// Export functions
window.supabaseClient = {
    supabase,
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    getPaymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    createTransaction,
    createDepositRequest,
    createWithdrawalRequest
}