/**
 * auth.js
 * Shared authentication/session logic, loaded on every page before the
 * page-specific script (app.js / blog.js / editor.js).
 */

const API_BASE = 'backend';

/**
 * Wrapper around fetch() that:
 *  - always sends/receives JSON
 *  - includes the PHP session cookie
 *  - attaches the CSRF token header on state-changing requests
 *  - throws with the server's message on failure, so callers can just
 *    catch(err) and show err.message
 */
async function apiFetch(path, { method = 'GET', body = null } = {}) {
    const headers = { 'Content-Type': 'application/json' };

    if (method !== 'GET' && Auth.csrfToken) {
        headers['X-CSRF-Token'] = Auth.csrfToken;
    }

    const response = await fetch(`${API_BASE}/${path}`, {
        method,
        headers,
        credentials: 'same-origin',
        body: body ? JSON.stringify(body) : null,
    });

    let data;
    try {
        data = await response.json();
    } catch {
        data = { success: false, message: 'Unexpected server response.' };
    }

    if (!response.ok || !data.success) {
        throw new Error(data.message || 'Something went wrong. Please try again.');
    }

    return data;
}

/** Displays text in one of the page's .message boxes. */
function showMessage(el, text, type = 'error') {
    if (!el) return;
    el.textContent = text;
    el.className = `message ${type}`;
    el.classList.remove('hidden');
}

const Auth = {
    user: null,
    csrfToken: null,
    ready: null,

    isLoggedIn() {
        return !!this.user;
    },

    /** Fetches session state once per page load. Safe to call multiple times. */
    init() {
        this.ready = (async () => {
            try {
                const data = await apiFetch('auth/me.php');
                this.user = data.user;
                this.csrfToken = data.csrfToken;
            } catch (err) {
                this.user = null;
            }
            this._updateNav();
            return this.user;
        })();

        return this.ready;
    },

    _updateNav() {
        const guestLinks = document.getElementById('guestLinks');
        const userLinks = document.getElementById('userLinks');
        const startWritingBtn = document.getElementById('startWritingBtn');

        if (guestLinks && userLinks) {
            guestLinks.classList.toggle('hidden', this.isLoggedIn());
            userLinks.classList.toggle('hidden', !this.isLoggedIn());
        }

        if (startWritingBtn) {
            startWritingBtn.classList.toggle('hidden', !this.isLoggedIn());
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    },

    async logout() {
        try {
            await this.ready;
            await apiFetch('auth/logout.php', { method: 'POST' });
        } catch (err) {
            // Even if the request fails, drop local session state below.
        }
        this.user = null;
        this.csrfToken = null;
        window.location.href = 'index.html';
    },

    /** Redirects guests away from pages that require a logged-in user. */
    async requireLogin() {
        await this.ready;
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
        }
    },

    /** Redirects logged-in users away from the login/register pages. */
    async redirectIfLoggedIn() {
        await this.ready;
        if (this.isLoggedIn()) {
            window.location.href = 'index.html';
        }
    },
};

Auth.init();

// ---------------------------------------------------------------------
// Register page (only present on register.html)
// ---------------------------------------------------------------------
const registerForm = document.getElementById('registerForm');

if (registerForm) {
    Auth.redirectIfLoggedIn();

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const messageEl = document.getElementById('registerMessage');
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            showMessage(messageEl, 'Passwords do not match.');
            return;
        }

        const submitBtn = registerForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        try {
            await Auth.ready;
            await apiFetch('auth/register.php', {
                method: 'POST',
                body: { name, email, password },
            });

            showMessage(messageEl, 'Account created! Redirecting to login…', 'success');
            setTimeout(() => (window.location.href = 'login.html'), 1200);
        } catch (err) {
            showMessage(messageEl, err.message);
            submitBtn.disabled = false;
        }
    });
}

// ---------------------------------------------------------------------
// Login page (only present on login.html)
// ---------------------------------------------------------------------
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    Auth.redirectIfLoggedIn();

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const messageEl = document.getElementById('loginMessage');
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        try {
            await Auth.ready;
            const data = await apiFetch('auth/login.php', {
                method: 'POST',
                body: { email, password },
            });

            Auth.user = data.user;
            Auth.csrfToken = data.csrfToken;

            window.location.href = 'index.html';
        } catch (err) {
            showMessage(messageEl, err.message);
            submitBtn.disabled = false;
        }
    });
}
