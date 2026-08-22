<?php

require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_error('Method not allowed.', 405);
}

$stmt = $pdo->query(
    'SELECT b.id, b.title, b.content, b.created_at, b.updated_at,
            b.user_id, u.username
     FROM blogPost b
     JOIN user u ON u.id = b.user_id
     ORDER BY b.created_at DESC'
);

$blogs = $stmt->fetchAll();

// Normalize numeric types since PDO can hand back ints as strings.
foreach ($blogs as &$blog) {
    $blog['id']      = (int) $blog['id'];
    $blog['user_id'] = (int) $blog['user_id'];
}
unset($blog);

send_json(['success' => true, 'blogs' => $blogs]);
