// Supabase Configuration
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

let supabase = null;
let currentSession = null;

// Initialize Supabase client
function initSupabase() {
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase JS library not loaded');
        return;
    }

    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        console.warn('Supabase credentials not configured. Auth will not work.');
        return;
    }

    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Initialize authentication
async function initAuth() {
    if (!supabase) {
        console.log('Supabase not initialized');
        renderAuthUI(null);
        return;
    }

    try {
        const { data: { session } } = await supabase.auth.getSession();
        currentSession = session;
        renderAuthUI(session);
        setupAuthStateListener();
    } catch (error) {
        console.error('Error initializing auth:', error);
        renderAuthUI(null);
    }
}

// Setup real-time auth state changes
function setupAuthStateListener() {
    if (!supabase) return;

    supabase.auth.onAuthStateChange((event, session) => {
        currentSession = session;
        renderAuthUI(session);
        if (event === 'SIGNED_OUT') {
            // Clear any sync-related data when signing out
        }
    });
}

// Sign up with email and password
async function signUp(email, password, confirmPassword) {
    if (!supabase) {
        alert('Supabase not configured');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) {
            alert('Sign up failed: ' + error.message);
            return;
        }

        alert('Sign up successful! Please check your email to confirm your account.');
        return data;
    } catch (error) {
        console.error('Sign up error:', error);
        alert('Sign up failed: ' + error.message);
    }
}

// Sign in with email and password
async function signIn(email, password) {
    if (!supabase) {
        alert('Supabase not configured');
        return;
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            alert('Sign in failed: ' + error.message);
            return;
        }

        return data;
    } catch (error) {
        console.error('Sign in error:', error);
        alert('Sign in failed: ' + error.message);
    }
}

// Sign out
async function signOut() {
    if (!supabase) return;

    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert('Sign out failed: ' + error.message);
            return;
        }
    } catch (error) {
        console.error('Sign out error:', error);
    }
}

// Render authentication UI
function renderAuthUI(session) {
    const container = document.getElementById('authContainer');
    if (!container) return;

    if (!supabase || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        container.innerHTML = `
            <div class="auth-message">
                <p>Supabase not configured</p>
                <p style="font-size: 0.85rem; opacity: 0.6; margin-top: 0.5rem;">
                    Please configure Supabase credentials in js/auth.js to enable cloud sync
                </p>
            </div>
        `;
        return;
    }

    if (session) {
        // User is signed in
        container.innerHTML = `
            <div class="auth-signed-in">
                <div class="auth-email">${session.user.email}</div>
                <button class="btn" onclick="handleSignOut()" style="margin-top: 1rem; width: 100%;">Sign Out</button>
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                    <div class="settings-section-title" style="margin-bottom: 0.5rem;">Data Sync</div>
                    <div class="sync-status">
                        <span id="syncStatusIndicator">🟢</span>
                        <span id="syncStatusText">Connected</span>
                    </div>
                </div>
            </div>
        `;
    } else {
        // User is not signed in
        container.innerHTML = `
            <div id="authForm" class="auth-form">
                <div class="auth-toggle">
                    <button class="auth-toggle-btn active" onclick="showSignIn()">Sign In</button>
                    <button class="auth-toggle-btn" onclick="showSignUp()">Sign Up</button>
                </div>

                <div id="signInForm" class="auth-input-group">
                    <input type="email" id="signInEmail" class="task-input" placeholder="Email" style="width: 100%; margin-bottom: 0.5rem;">
                    <input type="password" id="signInPassword" class="task-input" placeholder="Password" style="width: 100%; margin-bottom: 0.5rem;">
                    <button class="btn" onclick="handleSignIn()" style="width: 100%;">Sign In</button>
                </div>

                <div id="signUpForm" class="auth-input-group" style="display: none;">
                    <input type="email" id="signUpEmail" class="task-input" placeholder="Email" style="width: 100%; margin-bottom: 0.5rem;">
                    <input type="password" id="signUpPassword" class="task-input" placeholder="Password" style="width: 100%; margin-bottom: 0.5rem;">
                    <input type="password" id="signUpConfirm" class="task-input" placeholder="Confirm Password" style="width: 100%; margin-bottom: 0.5rem;">
                    <button class="btn" onclick="handleSignUp()" style="width: 100%;">Create Account</button>
                </div>

                <p style="font-size: 0.85rem; opacity: 0.6; margin-top: 1rem; text-align: center;">
                    You can use the app offline without signing in
                </p>
            </div>
        `;
    }
}

// UI Handler: Show sign in form
function showSignIn() {
    document.getElementById('signInForm').style.display = 'block';
    document.getElementById('signUpForm').style.display = 'none';
    document.querySelectorAll('.auth-toggle-btn')[0].classList.add('active');
    document.querySelectorAll('.auth-toggle-btn')[1].classList.remove('active');
}

// UI Handler: Show sign up form
function showSignUp() {
    document.getElementById('signInForm').style.display = 'none';
    document.getElementById('signUpForm').style.display = 'block';
    document.querySelectorAll('.auth-toggle-btn')[0].classList.remove('active');
    document.querySelectorAll('.auth-toggle-btn')[1].classList.add('active');
}

// UI Handler: Sign in
async function handleSignIn() {
    const email = document.getElementById('signInEmail').value.trim();
    const password = document.getElementById('signInPassword').value;

    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }

    await signIn(email, password);
}

// UI Handler: Sign up
async function handleSignUp() {
    const email = document.getElementById('signUpEmail').value.trim();
    const password = document.getElementById('signUpPassword').value;
    const confirm = document.getElementById('signUpConfirm').value;

    if (!email || !password || !confirm) {
        alert('Please fill in all fields');
        return;
    }

    await signUp(email, password, confirm);
}

// UI Handler: Sign out
async function handleSignOut() {
    if (confirm('Are you sure you want to sign out?')) {
        await signOut();
    }
}

// Initialize Supabase and auth on page load
initSupabase();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}
