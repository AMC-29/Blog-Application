<?php
/**
 * csrf.php
 *
 * A per-session CSRF token. The frontend fetches it via auth/me.php and
 * sends it back in the X-CSRF-Token header on every state-changing
 * (non-GET) request. This stops another site from silently using a
 * logged-in user's cookies to register, post, edit or delete on their
 * behalf.
 */

function csrf_token(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function csrf_verify(): bool {
    $sent   = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $stored = $_SESSION['csrf_token'] ?? '';
    return $sent !== '' && $stored !== '' && hash_equals($stored, $sent);
}

function csrf_require(): void {
    if (!csrf_verify()) {
        send_error('Invalid or missing CSRF token. Please refresh the page and try again.', 403);
    }
}