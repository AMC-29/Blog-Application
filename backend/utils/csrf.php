<?php

function current_user_id(): ?int {
    return isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null;
}

/** Returns the logged-in user's id, or halts the request with a 401. */
function require_auth(): int {
    $userId = current_user_id();

    if (!$userId) {
        send_error('You must be logged in to do that.', 401);
    }

    return $userId;
}
