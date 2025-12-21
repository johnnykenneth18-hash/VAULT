// Simple Supabase Configuration
(function() {
    'use strict';
    
    console.log('Supabase.js loading...');
    
    // Configuration
    const SUPABASE_URL = 'https://grfrcnhmnvasiotejiok.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k';
    
    // Check if Supabase library is loaded
    if (!window.supabase) {
        console.error('Supabase library not found. Make sure it is loaded before this script.');
        return;
    }
    
    // Create the client with proper session persistence
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: localStorage
        }
    });
    
    console.log('✅ Supabase client created');
    
    // Simple helper functions
    window.supabaseClient = {
        // Get the client
        getClient: function() {
            return supabaseClient;
        },
        
        // Check if user is logged in
        isLoggedIn: async function() {
            try {
                const { data: { user }, error } = await supabaseClient.auth.getUser();
                return { user, error };
            } catch (error) {
                return { user: null, error };
            }
        },
        
        // Simple login function
        login: async function(email, password) {
            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                return { data, error };
            } catch (error) {
                return { data: null, error };
            }
        },
        
        // Simple signup function
        signup: async function(email, password, userData) {
            try {
                const { data, error } = await supabaseClient.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: userData
                    }
                });
                return { data, error };
            } catch (error) {
                return { data: null, error };
            }
        },
        
        // Logout function
        logout: async function() {
            try {
                const { error } = await supabaseClient.auth.signOut();
                return { error };
            } catch (error) {
                return { error };
            }
        },
        
        // Get session
        getSession: async function() {
            try {
                const { data: { session }, error } = await supabaseClient.auth.getSession();
                return { session, error };
            } catch (error) {
                return { session: null, error };
            }
        }
    };
    
    console.log('✅ Supabase client ready');
})();