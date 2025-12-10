// Minimal Supabase client to avoid CDN issues
(function() {
    if (!window.supabase) {
        window.supabase = {
            createClient: function(url, key) {
                return {
                    auth: {
                        signUp: async function(credentials) {
                            const response = await fetch(url + '/auth/v1/signup', {
                                method: 'POST',
                                headers: {
                                    'apikey': key,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(credentials)
                            });
                            return response.json();
                        },
                        signInWithPassword: async function(credentials) {
                            const response = await fetch(url + '/auth/v1/token?grant_type=password', {
                                method: 'POST',
                                headers: {
                                    'apikey': key,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(credentials)
                            });
                            return response.json();
                        },
                        getUser: async function() {
                            const token = localStorage.getItem('sb_token');
                            const response = await fetch(url + '/auth/v1/user', {
                                headers: {
                                    'apikey': key,
                                    'Authorization': 'Bearer ' + token
                                }
                            });
                            return response.json();
                        },
                        resetPasswordForEmail: async function(email, options) {
                            const response = await fetch(url + '/auth/v1/recover', {
                                method: 'POST',
                                headers: {
                                    'apikey': key,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ email: email, ...options })
                            });
                            return response.json();
                        }
                    },
                    from: function(table) {
                        return {
                            insert: async function(data) {
                                const token = localStorage.getItem('sb_token');
                                const response = await fetch(url + '/rest/v1/' + table, {
                                    method: 'POST',
                                    headers: {
                                        'apikey': key,
                                        'Authorization': 'Bearer ' + token,
                                        'Content-Type': 'application/json',
                                        'Prefer': 'return=representation'
                                    },
                                    body: JSON.stringify(data[0])
                                });
                                return response.json();
                            },
                            select: function(columns) {
                                return {
                                    eq: function(column, value) {
                                        return {
                                            single: async function() {
                                                const token = localStorage.getItem('sb_token');
                                                const response = await fetch(url + '/rest/v1/' + table + '?' + column + '=eq.' + value, {
                                                    headers: {
                                                        'apikey': key,
                                                        'Authorization': 'Bearer ' + token
                                                    }
                                                });
                                                const data = await response.json();
                                                return { data: data[0], error: data.length === 0 ? { code: 'PGRST116' } : null };
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