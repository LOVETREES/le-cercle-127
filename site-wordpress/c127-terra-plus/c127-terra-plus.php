<?php
/**
 * Plugin Name: Cercle 127 - Terra Plus (mudras, schéma des lignes, lecture du jour)
 * Description: Complète l'atelier de Terra : vrai scan des lignes sur la photo (MediaPipe + modèle « Palm Line Reader », MIT, exécutés sur l'appareil, hébergés ici), espace à onglets (lire ma main, lecture détaillée, m'ancrer, parler à Terra), pastilles illustrées à la place des menus, arbre de progression (Graine → Canopée) et célébration de fin de lecture ; illustrations des quatre mudras et façon de faire chaque geste, schéma de la main dont les lignes s'allument, message clair en fin de lecture, une lecture de la main par jour, et la lecture détaillée sur photo (avec consentement, photo non conservée) avec l'évolution de la main dans le temps. Désactiver l'extension revient à l'état précédent.
 * Version: 1.9.4
 * Author: Le Cercle 127
 */

if (!defined('ABSPATH')) exit;

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
    wp_add_inline_script('c127-terra-scan', 'window.C127TerraDetailed = ' . wp_json_encode([
        'rest' => esc_url_raw(rest_url('c127-palm/v1/')),
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
