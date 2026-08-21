<?php
/**
 * POST /backend/auth/login.php
 * Body: { email, password }
 */

require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/csrf.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_error('Method not allowed.', 405);
}

csrf_require();

$input = read_json_body();

$email    = trim($input['email'] ?? '');
$password = (string) ($input['password'] ?? '');

if ($email === '' || $password === '') {
    send_error('Email and password are required.');
}

$stmt = $pdo->prepare('SELECT id, username, email, password, role FROM user WHERE email = :email');
$stmt->execute(['email' => $email]);
$user = $stmt->fetch();

// Same generic message whether the email doesn't exist or the password is
// wrong, so a caller can't use this endpoint to enumerate registered emails.
if (!$user || !password_verify($password, $user['password'])) {
    send_error('Invalid email or password.', 401);
}

// Prevent session fixation: issue the authenticated user a brand-new
// session id rather than reusing whatever the pre-login guest session had.
session_regenerate_id(true);

$_SESSION['user_id']  = $user['id'];
$_SESSION['username'] = $user['username'];
$_SESSION['role']     = $user['role'];

// A fresh session means a fresh CSRF token too.
unset($_SESSION['csrf_token']);

send_json([
    'success'   => true,
    'user'      => [
        'id'       => (int) $user['id'],
        'username' => $user['username'],
        'email'    => $user['email'],
        'role'     => $user['role'],
    ],
    'csrfToken' => csrf_token(),
]);
