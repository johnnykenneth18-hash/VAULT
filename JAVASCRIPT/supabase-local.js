// Supabase Local Client - FIXED VERSION
(function() {
    if (!window.supabase) {
        window.supabase = {
            createClient: function(url, key) {
                // Store credentials globally
                window.supabaseConfig = { url, key };
                
                return {
                    auth: {
                        // SIGN IN - FIXED
                        signInWithPassword: async function(credentials) {
                            try {
                                const response = await fetch(url + '/auth/v1/token?grant_type=password', {
                                    method: 'POST',
                                    headers: {
                                        'apikey': key,
                                        'Content-Type': 'application/json',
                                        'Authorization': 'Bearer ' + key
                                    },
                                    body: JSON.stringify({
                                        email: credentials.email,
                                        password: credentials.password
                                    })
                                });
                                
                                const result = await response.json();
                                
                                // Store session data
                                if (result.access_token) {
                                    localStorage.setItem('sb_access_token', result.access_token);
                                    localStorage.setItem('sb_refresh_token', result.refresh_token);
                                    localStorage.setItem('sb_user_id', result.user?.id);
                                }
                                
                                return { 
                                    data: { 
                                        user: result.user,
                                        session: result
                                    }, 
                                    error: response.ok ? null : result 
                                };
                                
                            } catch (error) {
                                return { data: null, error: { message: error.message } };
                            }
                        },
                        
                        // GET USER - FIXED VERSION (No 403 errors)
                        getUser: async function() {
                            try {
                                const token = localStorage.getItem('sb_access_token');
                                
                                // CRITICAL: Don't call the API if token looks fake or is missing
                                if (!token) {
                                    return { data: { user: null }, error: null };
                                }
                                
                                // CHECK: If it's our admin bypass token (starts with fake JWT prefix)
                                if (token.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.admin_token_')) {
                                    console.log('⚠️ Admin bypass token detected, skipping Supabase auth check');
                                    // Create a fake user object for admin
                                    const adminEmail = localStorage.getItem('userEmail') || 'arinze18@vault.com';
                                    return { 
                                        data: { 
                                            user: {
                                                id: localStorage.getItem('sb_user_id') || 'admin_user',
                                                email: adminEmail,
                                                user_metadata: { first_name: 'Admin' }
                                            }
                                        }, 
                                        error: null 
                                    };
                                }
                                
                                // Only call Supabase API for REAL tokens
                                const response = await fetch(url + '/auth/v1/user', {
                                    headers: {
                                        'apikey': key,
                                        'Authorization': 'Bearer ' + token
                                    }
                                });
                                
                                // Handle 403 gracefully (expired/invalid token)
                                if (response.status === 403) {
                                    console.log('Session expired, clearing invalid token');
                                    localStorage.removeItem('sb_access_token');
                                    localStorage.removeItem('sb_refresh_token');
                                    return { data: { user: null }, error: null };
                                }
                                
                                const result = await response.json();
                                
                                return { 
                                    data: { 
                                        user: response.ok ? result : null 
                                    }, 
                                    error: response.ok ? null : result 
                                };
                                
                            } catch (error) {
                                console.log('getUser error (non-critical):', error.message);
                                return { data: { user: null }, error: { message: error.message } };
                            }
                        },
                        
                        // GET SESSION
                        getSession: async function() {
                            try {
                                const token = localStorage.getItem('sb_access_token');
                                
                                if (!token) {
                                    return { data: { session: null }, error: null };
                                }
                                
                                // Handle admin bypass token
                                if (token.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.admin_token_')) {
                                    console.log('⚠️ Admin bypass token detected for getSession');
                                    return {
                                        data: {
                                            session: {
                                                access_token: token,
                                                refresh_token: localStorage.getItem('sb_refresh_token') || 'admin_refresh',
                                                expires_at: Math.floor(Date.now() / 1000) + 3600,
                                                user: {
                                                    id: localStorage.getItem('sb_user_id') || 'admin_user',
                                                    email: localStorage.getItem('userEmail') || 'admin@vault.com'
                                                }
                                            }
                                        },
                                        error: null
                                    };
                                }
                                
                                // For real tokens, you'd call the API here
                                // But for simplicity, return a basic session
                                return {
                                    data: {
                                        session: {
                                            access_token: token,
                                            refresh_token: localStorage.getItem('sb_refresh_token'),
                                            user: { id: localStorage.getItem('sb_user_id') }
                                        }
                                    },
                                    error: null
                                };
                                
                            } catch (error) {
                                return { data: { session: null }, error: { message: error.message } };
                            }
                        },
                        
                        // SIGN OUT
                        signOut: async function() {
                            localStorage.removeItem('sb_access_token');
                            localStorage.removeItem('sb_refresh_token');
                            localStorage.removeItem('sb_user_id');
                            return { error: null };
                        }
                    },
                    
                    // DATABASE OPERATIONS
                    from: function(table) {
                        return {
                            insert: function(data) {
                                return {
                                    select: function() {
                                        return {
                                            single: async function() {
                                                try {
                                                    const token = localStorage.getItem('sb_access_token');
                                                    const headers = {
                                                        'apikey': key,
                                                        'Content-Type': 'application/json',
                                                        'Prefer': 'return=representation'
                                                    };
                                                    
                                                    if (token) {
                                                        headers['Authorization'] = 'Bearer ' + token;
                                                    }
                                                    
                                                    const response = await fetch(url + '/rest/v1/' + table, {
                                                        method: 'POST',
                                                        headers: headers,
                                                        body: JSON.stringify(data)
                                                    });
                                                    
                                                    const result = await response.json();
                                                    return { 
                                                        data: result && result.length > 0 ? result[0] : null, 
                                                        error: response.ok ? null : result 
                                                    };
                                                    
                                                } catch (error) {
                                                    return { data: null, error: { message: error.message } };
                                                }
                                            }
                                        };
                                    }
                                };
                            },
                            
                            select: function(columns) {
                                return {
                                    eq: function(column, value) {
                                        return {
                                            single: async function() {
                                                try {
                                                    const token = localStorage.getItem('sb_access_token');
                                                    const headers = {
                                                        'apikey': key
                                                    };
                                                    
                                                    if (token) {
                                                        headers['Authorization'] = 'Bearer ' + token;
                                                    }
                                                    
                                                    const response = await fetch(
                                                        url + '/rest/v1/' + table + '?' + column + '=eq.' + encodeURIComponent(value),
                                                        { headers: headers }
                                                    );
                                                    
                                                    const result = await response.json();
                                                    
                                                    if (response.ok && result && result.length > 0) {
                                                        return { data: result[0], error: null };
                                                    } else {
                                                        return { 
                                                            data: null, 
                                                            error: { code: 'PGRST116', message: 'No rows found' } 
                                                        };
                                                    }
                                                    
                                                } catch (error) {
                                                    return { data: null, error: { message: error.message } };
                                                }
                                            }
                                        };
                                    }
                                };
                            }
                        };
                    }
                };
            }
        };
    }
})();