<?php
/**
 * Plugin Name: Le Cercle 127 — App web (PWA)
 * Description: Sert l'application Le Cercle 127 exportée pour le web à l'adresse /app/ : installable sur l'écran d'accueil (manifeste, icônes, service worker), même compte que l'app des stores. Les fichiers versionnés sont mis en cache longtemps ; la page de l'app ne l'est jamais (ni par le navigateur ni par Jetpack Boost). Désactiver l'extension libère /app/.
 * Version: 1.0.1
 * Author: Le Cercle 127
 */
if (!defined('ABSPATH')) { exit; }

const C127_APP_TYPES = [
    'js' => 'text/javascript; charset=utf-8', 'html' => 'text/html; charset=utf-8', 'json' => 'application/json',
    'webmanifest' => 'application/manifest+json', 'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
    'webp' => 'image/webp', 'gif' => 'image/gif', 'svg' => 'image/svg+xml', 'ico' => 'image/x-icon',
    'ttf' => 'font/ttf', 'otf' => 'font/otf', 'woff' => 'font/woff', 'woff2' => 'font/woff2', 'mp3' => 'audio/mpeg', 'm4a' => 'audio/mp4',
];

function c127_app_send($file, $immutable) {
    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    if (!defined('DONOTCACHEPAGE')) define('DONOTCACHEPAGE', true);
    while (ob_get_level() > 0) ob_end_clean();
    status_header(200);
    header('Content-Type: ' . (C127_APP_TYPES[$ext] ?? 'application/octet-stream'));
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: ' . ($immutable ? 'public, max-age=31536000, immutable' : 'no-cache'));
    if (basename($file) === 'sw.js') header('Service-Worker-Allowed: /app/');
    // Pas de Content-Length : le serveur compresse (gzip) la réponse et la taille annoncée serait fausse.
    readfile($file);
    exit;
}

add_action('init', function () {
    $path = (string) parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    if ($path === '/app') { wp_safe_redirect(home_url('/app/'), 301); exit; }
    if (strpos($path, '/app/') !== 0) return;
    $root = __DIR__ . '/dist';
    $rel = rawurldecode(substr($path, 5));
    $file = $rel === '' ? false : realpath($root . '/' . $rel);
    // Uniquement des fichiers du dossier dist (aucune sortie de dossier possible).
    if ($file && strpos($file, realpath($root) . DIRECTORY_SEPARATOR) === 0 && is_file($file)) {
        c127_app_send($file, (bool) preg_match('#^(_expo/static|assets)/#', $rel));
    }
    // Fichier manquant avec une extension : vraie 404 (pas l'app, pour ne pas masquer une erreur).
    if ($rel !== '' && preg_match('/\.[a-z0-9]{2,12}$/i', $rel)) { status_header(404); exit; }
    // Toute autre adresse sous /app/ est une page de l'app : la page unique la prend en charge.
    c127_app_send($root . '/index.html', false);
}, 0);
