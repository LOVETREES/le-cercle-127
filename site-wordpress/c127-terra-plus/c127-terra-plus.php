<?php
/**
 * Plugin Name: Cercle 127 - Terra Plus (mudras, schéma des lignes, lecture du jour)
 * Description: Complète l'atelier de Terra : vrai scan des lignes sur la photo (MediaPipe + modèle « Palm Line Reader », MIT, exécutés sur l'appareil, hébergés ici), espace à onglets (lire ma main, lecture détaillée, m'ancrer, parler à Terra), pastilles illustrées à la place des menus, arbre de progression (Graine → Canopée) et célébration de fin de lecture ; illustrations des quatre mudras et façon de faire chaque geste, schéma de la main dont les lignes s'allument, message clair en fin de lecture, une lecture de la main par jour composée à partir du corpus de Terra (tradition de d’Arpentigny, Desbarrolles et Cheiro, textes originaux), et la lecture détaillée sur photo (avec consentement, photo non conservée) avec l'évolution de la main dans le temps. Désactiver l'extension revient à l'état précédent.
 * Version: 1.11.1
 * Author: Le Cercle 127
 */

if (!defined('ABSPATH')) exit;

// L'ancien module caméra de la page : le thème retire ses boutons à l'affichage mais laisse son script,
// qui plantait en les cherchant. On l'arrête proprement quand ils sont absents.
function c127_terra_plus_guard_old_camera($html) {
    if (strpos($html, "getElementById('btn-terra-camera')") === false) return $html;
    return str_replace("let stream = null;", "if (!btnCamera || !btnSnap || !btnUpload || !fileInput) return;\n  let stream = null;", $html);
}
add_filter('the_content', function ($c) {
    return is_page('terra-gardienne-de-lancrage') ? c127_terra_plus_guard_old_camera($c) : $c;
}, 1);
add_action('template_redirect', function () {
    if (is_page('terra-gardienne-de-lancrage')) ob_start('c127_terra_plus_guard_old_camera');
}, 0);

// La lecture du jour rédigée par Terra (scénario Make) à partir des mesures mises en mots : la photo n'est jamais envoyée.
// L'adresse du scénario reste côté serveur ; limites : 12 lectures par jour et par adresse, 600 par jour au total.
const C127_TERRA_SEANCE_HOOK = 'https://hook.eu2.make.com/z3cpwsn5ra4xa7b9a6ejofodhmjkprzz';
const C127_TERRA_SEANCE_FIELDS = ['title', 'overview', 'heart', 'head', 'life', 'fingers', 'synthesis', 'question', 'mantra'];

function c127_terra_seance_clean_list($list, $max) {
    $out = [];
    foreach (array_slice(is_array($list) ? $list : [], 0, $max) as $item) {
        if (is_string($item) && $item !== '') $out[] = mb_substr(wp_strip_all_tags($item), 0, 260);
    }
    return $out;
}

function c127_terra_seance(WP_REST_Request $req) {
    $p = $req->get_json_params();
    $facts = c127_terra_seance_clean_list($p['faits'] ?? null, 12);
    $element = in_array($p['element'] ?? '', ['terre', 'air', 'feu', 'eau'], true) ? $p['element'] : '';
    if (count($facts) < 3 || !$element) return new WP_REST_Response(['error' => 'donnees'], 400);
    $lang = in_array($p['lang'] ?? 'fr', ['fr', 'en', 'es', 'it', 'de'], true) ? $p['lang'] : 'fr';

    $day = gmdate('Ymd');
    $ip_key = 'c127_seance_' . $day . '_' . md5((string) ($_SERVER['REMOTE_ADDR'] ?? ''));
    $ip_count = (int) get_transient($ip_key);
    $all_key = 'c127_seance_all_' . $day;
    $all_count = (int) get_transient($all_key);
    if ($ip_count >= 12 || $all_count >= 600) return new WP_REST_Response(['error' => 'limite'], 429);
    set_transient($ip_key, $ip_count + 1, DAY_IN_SECONDS);
    set_transient($all_key, $all_count + 1, DAY_IN_SECONDS);

    $measures = wp_json_encode([
        'element' => $element,
        'faits' => $facts,
        'nuances' => c127_terra_seance_clean_list($p['nuances'] ?? null, 10),
    ], JSON_UNESCAPED_UNICODE);
    $res = wp_remote_post(C127_TERRA_SEANCE_HOOK, [
        'timeout' => 60,
        'headers' => ['Content-Type' => 'application/json'],
        'body' => wp_json_encode(['lang' => $lang, 'measures' => $measures]),
    ]);
    if (is_wp_error($res) || wp_remote_retrieve_response_code($res) !== 200) return new WP_REST_Response(['error' => 'terra'], 502);
    $data = json_decode(wp_remote_retrieve_body($res), true);
    if (!is_array($data)) return new WP_REST_Response(['error' => 'terra'], 502);
    $out = [];
    foreach (C127_TERRA_SEANCE_FIELDS as $k) {
        $out[$k] = isset($data[$k]) && is_string($data[$k]) ? mb_substr(wp_strip_all_tags($data[$k]), 0, 1600) : '';
    }
    if ($out['heart'] === '' && $out['overview'] === '') return new WP_REST_Response(['error' => 'terra'], 502);
    return new WP_REST_Response(['reading' => $out], 200);
}

add_action('rest_api_init', function () {
    register_rest_route('c127-terra/v1', '/seance', [
        'methods' => 'POST',
        'callback' => 'c127_terra_seance',
        'permission_callback' => '__return_true',
    ]);
});

// Sur la page de Naïa : la conversation reçoit le message préparé après une lecture de la main.
add_action('wp_enqueue_scripts', function () {
    if (!is_page(872)) return;
    $dir = plugin_dir_path(__FILE__) . 'assets/';
    wp_enqueue_style('c127-terra-relais', plugin_dir_url(__FILE__) . 'assets/terra-plus.css', [], (string) filemtime($dir . 'terra-plus.css'));
    wp_enqueue_script('c127-terra-relais', plugin_dir_url(__FILE__) . 'assets/terra-relais.js', [], (string) filemtime($dir . 'terra-relais.js'), true);
});

add_action('wp_enqueue_scripts', function () {
    if (!is_page('terra-gardienne-de-lancrage')) return;
    $base = plugin_dir_url(__FILE__) . 'assets/';
    $dir  = plugin_dir_path(__FILE__) . 'assets/';
    wp_enqueue_style('c127-terra-plus', $base . 'terra-plus.css', [], (string) filemtime($dir . 'terra-plus.css'));
    wp_enqueue_script('c127-terra-plus', $base . 'terra-plus.js', [], (string) filemtime($dir . 'terra-plus.js'), true);
    wp_enqueue_script('c127-terra-scan', $base . 'terra-scan.js', [], (string) filemtime($dir . 'terra-scan.js'), true);
    wp_enqueue_script('c127-terra-jeu', $base . 'terra-jeu.js', [], (string) filemtime($dir . 'terra-jeu.js'), true);
    wp_enqueue_script('c127-terra-detailed', $base . 'terra-detailed.js', [], (string) filemtime($dir . 'terra-detailed.js'), true);
    wp_enqueue_script('c127-terra-scene', $base . 'terra-scene.js', [], (string) filemtime($dir . 'terra-scene.js'), true);
    wp_enqueue_script('c127-terra-seance', $base . 'terra-seance.js', [], (string) filemtime($dir . 'terra-seance.js'), true);
    wp_enqueue_script('c127-terra-hub', $base . 'terra-hub.js', [], (string) filemtime($dir . 'terra-hub.js'), true);
    // La lecture du jour composée à partir du corpus de Terra (remplace les quatre cartes fixes de l'atelier).
    wp_enqueue_script('c127-terra-corpus', $base . 'terra-corpus.js', [], (string) filemtime($dir . 'terra-corpus.js'), true);
    wp_enqueue_script('c127-terra-lecture', $base . 'terra-lecture.js', ['c127-terra-corpus'], (string) filemtime($dir . 'terra-lecture.js'), true);
    wp_add_inline_script('c127-terra-scan', 'window.C127TerraDetailed = ' . wp_json_encode([
        'rest' => esc_url_raw(rest_url('c127-palm/v1/')),
        'seance' => esc_url_raw(rest_url('c127-terra/v1/seance')),
        'nonce' => is_user_logged_in() ? wp_create_nonce('wp_rest') : '',
        'loggedIn' => is_user_logged_in(),
        'login' => wp_login_url(get_permalink()),
        // Les fichiers lourds vivent dans deux extensions à part (limite de taille d'envoi).
        'mp' => is_dir(WP_PLUGIN_DIR . '/c127-terra-modeles/mediapipe') ? plugins_url('c127-terra-modeles/mediapipe') : '',
        'ort' => is_dir(WP_PLUGIN_DIR . '/c127-terra-lignes/ort') ? plugins_url('c127-terra-lignes/ort') : '',
        'example' => home_url('/terra-lit-la-main/'),
        'naia' => get_permalink(872) ?: home_url('/naia-gardienne-des-emotions/'),
        'palmLines' => is_file(WP_PLUGIN_DIR . '/c127-terra-lignes/palm-lines/student_fp16.onnx') ? plugins_url('c127-terra-lignes/palm-lines/student_fp16.onnx') : '',
    ]) . ';', 'before');
}, 30);
