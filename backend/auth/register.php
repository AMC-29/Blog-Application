<?php

require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/csrf.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_error('Method not allowed.', 405);
}

csrf_require();

$input = read_json_body();

$name     = trim($input['name'] ?? '');
$email    = trim($input['email'] ?? '');
$password = (string) ($input['password'] ?? '');

if ($name === '' || $email === '' || $password === '') {
    send_error('Name, email and password are all required.');
}

if (mb_strlen($name) > 100) {
    send_error('Name must be 100 characters or fewer.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_error('Please enter a valid email address.');
}

if (mb_strlen($password) < 6) {
    send_error('Password must be at least 6 characters long.');
}

// Check for an existing account before inserting.
$stmt = $pdo->prepare('SELECT id FROM user WHERE email = :email');
$stmt->execute(['email' => $email]);

if ($stmt->fetch()) {
    send_error('An account with that email already exists.', 409);
}

$hash = password_hash($password, PASSWORD_BCRYPT);

$stmt = $pdo->prepare(
    'INSERT INTO user (username, email, password, role) VALUES (:username, :email, :password, :role)'
);
$stmt->execute([
    'username' => $name,
    'email'    => $email,
    'password' => $hash,
    'role'     => 'user',
]);

send_json(['success' => true, 'message' => 'Account created. You can now log in.'], 201);
