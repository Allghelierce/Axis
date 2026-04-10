// Supabase Configuration
const SUPABASE_URL = 'https://tknvrfmmsjmnmbthkjnu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrbnZyZm1tc2ptbm1idGhram51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTY5NDMsImV4cCI6MjA5MTMzMjk0M30.8gmQcwSknEt21ud4KBDiNmXhsi5t21-oqc013FipQfw';

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
        renderAuthUI(null);
        return;
    }

    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.warn('Auth session error:', error.message);
            // Clear invalid hash
            if (window.location.hash) {
                window.history.replaceState(null, null, window.location.pathname);
            }
        }

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
    if (!supabase) initSupabase();
    if (!supabase) {
        alert('Could not connect to sync server. Check your internet connection.');
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
        const redirectTo = window.location.origin + window.location.pathname;
        console.log('Attempting sign-up for:', email, 'Redirecting to:', redirectTo);
        
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: redirectTo
            }
        });

        console.log('Sign-up response:', { data, error });

        if (error) {
            alert('Sign up failed: ' + error.message);
            return;
        }

        // If data.user is returned but identities is empty, the user already exists
        if (data.user && data.identities && data.identities.length === 0) {
            console.warn('User already exists in Supabase. Emails will not be re-sent automatically.');
        }

        return data;
    } catch (error) {
        console.error('Sign up error caught:', error);
        alert('An unexpected error occurred: ' + error.message);
    }
}

// Sign in with email and password
async function signIn(email, password) {
    if (!supabase) initSupabase();
    if (!supabase) {
        alert('Could not connect to sync server. Check your internet connection.');
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

    if (session) {
        container.innerHTML = `
            <div class="auth-signed-in">
                <div class="auth-email">${session.user.email}</div>
                <div class="sync-status" style="margin-top: 0.6rem;">
                    <span id="syncStatusIndicator" style="font-size:0.6rem;">●</span>
                    <span id="syncStatusText">Synced</span>
                </div>
                <button class="btn" onclick="handleSignOut()" style="margin-top: 1rem; width: 100%;">Sign Out</button>
            </div>
        `;
    } else {
        const note = !supabase ? '<p class="auth-offline-note">Sync unavailable — check connection</p>' : '';
        container.innerHTML = `
            <div id="authForm" class="auth-form">
                <div class="auth-toggle">
                    <button class="auth-toggle-btn active" onclick="showSignIn()">Sign In</button>
                    <button class="auth-toggle-btn" onclick="showSignUp()">Sign Up</button>
                </div>
                <div id="signInForm" class="auth-input-group">
                    <input type="email" id="signInEmail" class="task-input auth-field" placeholder="Email">
                    <input type="password" id="signInPassword" class="task-input auth-field" placeholder="Password">
                    <button class="btn auth-submit-btn" onclick="handleSignIn()">Sign In</button>
                </div>
                <div id="signUpForm" class="auth-input-group" style="display:none;">
                    <input type="email" id="signUpEmail" class="task-input auth-field" placeholder="Email">
                    <input type="password" id="signUpPassword" class="task-input auth-field" placeholder="Password">
                    <input type="password" id="signUpConfirm" class="task-input auth-field" placeholder="Confirm Password">
                    <button class="btn auth-submit-btn" onclick="handleSignUp()">Create Account</button>
                </div>
                ${note}
            </div>
        `;

        // Add Enter key listeners
        const inputs = container.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.keyCode === 13) {
                    const group = input.closest('.auth-input-group');
                    if (group.id === 'signInForm') handleSignIn();
                    else handleSignUp();
                }
            });
        });
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

async function handleSignUp() {
    const email = document.getElementById('signUpEmail').value.trim();
    const password = document.getElementById('signUpPassword').value;
    const confirm = document.getElementById('signUpConfirm').value;

    if (!email || !password || !confirm) {
        alert('Please fill in all fields');
        return;
    }

    const data = await signUp(email, password, confirm);
    if (data && data.user) {
        // Successful sign up with confirmation pending
        const container = document.getElementById('authContainer');
        if (container) {
            container.innerHTML = `
                <div class="auth-form" style="text-align: center; padding: 1rem 0;">
                    <div style="font-size: 1.5rem; margin-bottom: 0.8rem;">✉️</div>
                    <div style="font-weight: 600; margin-bottom: 0.5rem; color: var(--white);">Verify with Email</div>
                    <p style="font-size: 0.8rem; opacity: 0.6; line-height: 1.4; margin-bottom: 1.2rem;">
                        We've sent a link to <br><strong>${email}</strong>.<br>
                        Check your inbox to activate your account.
                    </p>
                    <button class="btn" style="width: 100%; margin-bottom: 0.5rem;" onclick="renderAuthUI(null)">Back to Sign In</button>
                    <button class="btn btn-secondary" style="width: 100%; background: transparent; border: 1px solid var(--border); color: var(--white); opacity: 0.6;" onclick="handleResendEmail('${email}')">Resend Link</button>
                </div>
            `;
        }
    }
}

async function handleResendEmail(email) {
    if (!supabase) initSupabase();
    const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
            emailRedirectTo: window.location.origin + window.location.pathname
        }
    });
    if (error) {
        alert('Resend failed: ' + error.message);
    } else {
        alert('Verification link resent to ' + email);
    }
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
