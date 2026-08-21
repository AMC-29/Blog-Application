<?php
/**
 * PUT /backend/blogs/update.php
 * Body: { id, title, content }
 * Requires: logged-in session, and the blog must belong to that user.
 */

require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/csrf.php';
require_once __DIR__ . '/../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    send_error('Method not allowed.', 405);
}

csrf_require();
$userId = require_auth();

$input = read_json_body();

$id      = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT);
$title   = trim($input['title'] ?? '');
$content = trim($input['content'] ?? '');

if (!$id) {
    send_error('A valid blog id is required.');
}

if ($title === '' || $content === '') {
    send_error('Title and content are required.');
}

if (mb_strlen($title) > 150) {
    send_error('Title must be 150 characters or fewer.');
}

$stmt = $pdo->prepare('SELECT user_id FROM blogPost WHERE id = :id');
$stmt->execute(['id' => $id]);
$blog = $stmt->fetch();

if (!$blog) {
    send_error('Blog not found.', 404);
}

// Ownership is re-checked here against the database record, not against
// anything the client sent - editing the id in the request cannot let a
// user touch someone else's blog.
if ((int) $blog['user_id'] !== $userId) {
    send_error('You can only edit your own blogs.', 403);
}

$stmt = $pdo->prepare(
    'UPDATE blogPost SET title = :title, content = :content WHERE id = :id'
);
$stmt->execute([
    'title'   => $title,
    'content' => $content,
    'id'      => $id,
]);

send_json(['success' => true, 'message' => 'Blog updated.']);
