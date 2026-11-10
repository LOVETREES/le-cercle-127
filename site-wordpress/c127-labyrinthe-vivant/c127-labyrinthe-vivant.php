<?php
/**
 * Plugin Name: Le Cercle 127 — Labyrinthe vivant
 * Description: Sur la page du Grand Labyrinthe, confronte l'ACQUIS (ciel de naissance, lecture symbolique, calculé dans le navigateur avec Astronomy Engine) au VÉCU (bilan de la semaine, et rêves du Grimoire pour les personnes connectées). Heptagone des Sept Sœurs, porte de naissance, porte du moment. Rien n'est envoyé : naissance et bilans restent dans le navigateur.
 * Version: 1.0.0
 * Author: Le Cercle 127
 */
if (!defined('ABSPATH')) { exit; }

add_action('wp_enqueue_scripts', function () {
    if (!is_page('labyrinthe-du-grimoire')) { return; }
    $base = plugin_dir_url(__FILE__);
    $dir = plugin_dir_path(__FILE__);
    $v = function ($f) use ($dir) { return (string) filemtime($dir . $f); };
    wp_enqueue_style('c127-labyrinthe-vivant', $base . 'labyrinthe-vivant.css', [], $v('labyrinthe-vivant.css'));
    wp_enqueue_script('c127-astronomy-engine', $base . 'astronomy.browser.min.js', [], $v('astronomy.browser.min.js'), true);
    wp_enqueue_script('c127-labyrinthe-data', $base . 'lv-data.js', [], $v('lv-data.js'), true);
    wp_enqueue_script('c127-labyrinthe-vivant', $base . 'labyrinthe-vivant.js', ['c127-astronomy-engine', 'c127-labyrinthe-data'], $v('labyrinthe-vivant.js'), true);
    wp_localize_script('c127-labyrinthe-vivant', 'C127LV', [
        'loggedIn' => is_user_logged_in() ? 1 : 0,
        'dreams' => esc_url_raw(rest_url('cercle127/v1/dreams')),
        'nonce' => wp_create_nonce('wp_rest'),
        'login' => esc_url_raw(wp_login_url(get_permalink())),
        'cards' => esc_url_raw(content_url('plugins/oracle-127-2.9.1-images/assets/images/edition-127/')),
    ]);
}, 40);
