<?php
/**
 * Plugin Name: Cercle 127 - Terra Plus (mudras, schéma des lignes, lecture du jour)
 * Description: Complète l'atelier de Terra : illustrations des quatre mudras et façon de faire chaque geste, schéma de la main dont les lignes s'allument, message clair en fin de lecture, une lecture de la main par jour, et la lecture détaillée sur photo (avec consentement, photo non conservée) avec l'évolution de la main dans le temps. Désactiver l'extension revient à l'état précédent.
 * Version: 1.2.0
 * Author: Le Cercle 127
 */

if (!defined('ABSPATH')) exit;

add_action('wp_enqueue_scripts', function () {
    if (!is_page('terra-gardienne-de-lancrage')) return;
    $base = plugin_dir_url(__FILE__) . 'assets/';
    $dir  = plugin_dir_path(__FILE__) . 'assets/';
    wp_enqueue_style('c127-terra-plus', $base . 'terra-plus.css', [], (string) filemtime($dir . 'terra-plus.css'));
    wp_enqueue_script('c127-terra-plus', $base . 'terra-plus.js', [], (string) filemtime($dir . 'terra-plus.js'), true);
    wp_enqueue_script('c127-terra-detailed', $base . 'terra-detailed.js', [], (string) filemtime($dir . 'terra-detailed.js'), true);
    wp_add_inline_script('c127-terra-detailed', 'window.C127TerraDetailed = ' . wp_json_encode([
        'rest' => esc_url_raw(rest_url('c127-palm/v1/')),
        'nonce' => is_user_logged_in() ? wp_create_nonce('wp_rest') : '',
        'loggedIn' => is_user_logged_in(),
        'login' => wp_login_url(get_permalink()),
    ]) . ';', 'before');
}, 30);
