// Supabase Configuration
const SUPABASE_URL = 'https://rhotbzbuvwhdwwrvjhhe.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJob3RiemJ1dndoZHd3cnZqaGhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTMwNjcsImV4cCI6MjA4MDk4OTA2N30.s9gSHCPBJM2hTgqIsIUWo-L5rcKTj0TAsSQ4LnIMfg0';
// Create Supabase client
let supabase;
try {
    if (!window.supabase) throw new Error('Supabase not available. Please ensure supabase.js or supabase-local.js is loaded.');
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase initialized successfully');
} catch (error) {
    console.error('❌ Supabase initialization failed:', error);
}

// User Authentication Functions
async function signUp(email, password, userData) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: userData }
        });

        if (error) throw error;

        // Create user in database
        const userId = 'USER_' + Date.now();
        const referralCode = userData.first_name.substring(0, 3).toUpperCase() +
                             userData.last_name.substring(0, 3).toUpperCase() +
                             Date.now().toString().slice(-4);

        const { error: dbError } = await supabase
            .from('users')
            .insert([{
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
            }]);

        if (dbError) console.warn('User might already exist in database:', dbError);

        return { success: true, data: { ...data, user_id: userId } };
    } catch (error) {
        console.error('Sign up error:', error);
        return { success: false, error: error.message };
    }
}

async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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

            await supabase.from('users').insert([{
                user_id: userId,
                email: email,
                first_name: email.split('@')[0],
                role: email === 'admin@vault.com' ? 'admin' : 'user',
                status: 'active',
                balance: 0,
                referral_code: referralCode,
                join_date: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }]);
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

// FIXED getCurrentUser function
async function getCurrentUser() {
    try {
        if (!supabase || !supabase.auth) return { success: false, user: null };

        // Check Supabase auth user
        let userResponse;
        if (supabase.auth.getUser) {
            // Standard Supabase client
            userResponse = await supabase.auth.getUser();
            userResponse = userResponse.data ? userResponse.data.user : null;
        } else if (supabase.auth.user) {
            // Local Supabase client
            userResponse = await supabase.auth.getUser();
            userResponse = userResponse.user || null;
        }

        if (!userResponse) return { success: false, user: null };

        // Get user data from database
        const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', userResponse.email)
            .single();

        if (error && error.code === 'PGRST116') {
            // Create user if doesn't exist
            const userId = 'USER_' + Date.now();
            await supabase.from('users').insert([{
                user_id: userId,
                email: userResponse.email,
                first_name: userResponse.email.split('@')[0],
                role: userResponse.email === 'admin@vault.com' ? 'admin' : 'user',
                status: 'active',
                balance: 0,
                join_date: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }]);

            return {
                success: true,
                user: {
                    email: userResponse.email,
                    user_id: userId,
                    first_name: userResponse.email.split('@')[0],
                    role: userResponse.email === 'admin@vault.com' ? 'admin' : 'user'
                }
            };
        }

        return { success: true, user: userData };
    } catch (error) {
        console.error('Get user error:', error);
        return { success: false, user: null, error: error.message };
    }
}

// Export functions
window.supabaseClient = {
    supabase,
    signUp,
    signIn,
    signOut,
    getCurrentUser
    // ... keep your other functions like payment and transaction as is
};