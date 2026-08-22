<?php

if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 0,        // expires when the browser closes
        'path'     => '/',
        'httponly' => true,     // not readable from JavaScript
        'samesite' => 'Lax',    // sent on normal navigation, blocks most cross-site abuse
        // 'secure' => true,    // uncomment once the site is served over HTTPS
    ]);

    session_start();
}
