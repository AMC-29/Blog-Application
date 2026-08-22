<?php

require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/csrf.php';
require_once __DIR__ . '/../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    send_error('Method not allowed.', 405);
}

csrf_require();
$userId = require_auth();

$input = read_json_body();
$id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT);

if (!$id) {
    send_error('A valid blog id is required.');
}

$stmt = $pdo->prepare('SELECT user_id FROM blogPost WHERE id = :id');
$stmt->execute(['id' => $id]);
$blog = $stmt->fetch();

if (!$blog) {
    send_error('Blog not found.', 404);
}

if ((int) $blog['user_id'] !== $userId) {
    send_error('You can only delete your own blogs.', 403);
}

$stmt = $pdo->prepare('DELETE FROM blogPost WHERE id = :id');
$stmt->execute(['id' => $id]);

send_json(['success' => true, 'message' => 'Blog deleted.']);
