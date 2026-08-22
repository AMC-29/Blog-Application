<?php

function send_json(array $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function send_error(string $message, int $status = 400): void {
    send_json(['success' => false, 'message' => $message], $status);
}

/** Reads and JSON-decodes the raw request body. Always returns an array. */
function read_json_body(): array {
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}
