<?php
/**
 * GET /backend/blogs/get_single.php?id=123
 * Public.
 */

require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_error('Method not allowed.', 405);
}

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

if (!$id) {
    send_error('A valid blog id is required.', 400);
}

$stmt = $pdo->prepare(
    'SELECT b.id, b.title, b.content, b.created_at, b.updated_at,
            b.user_id, u.username
     FROM blogPost b
     JOIN user u ON u.id = b.user_id
     WHERE b.id = :id'
);
$stmt->execute(['id' => $id]);
$blog = $stmt->fetch();

if (!$blog) {
    send_error('Blog not found.', 404);
}

$blog['id']      = (int) $blog['id'];
$blog['user_id'] = (int) $blog['user_id'];

send_json(['success' => true, 'blog' => $blog]);
