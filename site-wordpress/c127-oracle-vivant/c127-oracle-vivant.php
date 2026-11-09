<?php
/**
 * Plugin Name: Le Cercle 127 — Oracle vivant
 * Description: Anime et « gamifie » le tirage de l'Oracle 127 sans toucher au moteur : distribution des cartes depuis le paquet, révélation 3D avec halo et gerbe dorée, carillon (coupable) et vibration, collection des 127 lames découvertes, série de jours et paliers. Respecte « réduire les animations ». Désactiver l'extension rend l'Oracle d'origine.
 * Version: 1.0.1
 * Author: Le Cercle 127
 */
if (!defined('ABSPATH')) { exit; }
add_action('wp_enqueue_scripts', function () {
    if (!is_page('oracle-127')) { return; }
    $base = plugin_dir_url(__FILE__);
    $dir = plugin_dir_path(__FILE__);
    wp_enqueue_style('c127-oracle-vivant', $base . 'oracle-vivant.css', [], (string) filemtime($dir . 'oracle-vivant.css'));
    wp_enqueue_script('c127-oracle-vivant', $base . 'oracle-vivant.js', [], (string) filemtime($dir . 'oracle-vivant.js'), true);
}, 40);
