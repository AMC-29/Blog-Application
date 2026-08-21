<?php
/**
 * POST /backend/blogs/create.php
 * Body: { title, content }
 * Requires: logged-in session
 */

require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/csrf.php';
require_once __DIR__ . '/../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_error('Method not allowed.', 405);
}

csrf_require();
$userId = require_auth();

$input = read_json_body();

$title   = trim($input['title'] ?? '');
$content = trim($input['content'] ?? '');

if ($title === '' || $content === '') {
    send_error('Title and content are required.');
}

if (mb_strlen($title) > 150) {
    send_error('Title must be 150 characters or fewer.');
}

$stmt = $pdo->prepare(
    'INSERT INTO blogPost (user_id, title, content) VALUES (:user_id, :title, :content)'
);
$stmt->execute([
    'user_id' => $userId,
    'title'   => $title,
    'content' => $content,
]);

send_json([
    'success' => true,
    'message' => 'Blog published.',
    'id'      => (int) $pdo->lastInsertId(),
], 201);
