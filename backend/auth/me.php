<?php
/**
 * GET /backend/auth/me.php
 *
 * Called by the frontend on every page load. Reports whether the
 * visitor is logged in and hands over the CSRF token their browser
 * needs to attach to future POST/PUT/DELETE requests.
 */

require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/csrf.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_error('Method not allowed.', 405);
}

$user = null;

if (!empty($_SESSION['user_id'])) {
    $stmt = $pdo->prepare('SELECT id, username, email, role FROM user WHERE id = :id');
    $stmt->execute(['id' => $_SESSION['user_id']]);
    $row = $stmt->fetch();

    if ($row) {
        $user = [
            'id'       => (int) $row['id'],
            'username' => $row['username'],
            'email'    => $row['email'],
            'role'     => $row['role'],
        ];
    } else {
        // The account behind this session no longer exists - drop it.
        $_SESSION = [];
        session_destroy();
    }
}

send_json([
    'success'   => true,
    'user'      => $user,
    'csrfToken' => csrf_token(),
]);
