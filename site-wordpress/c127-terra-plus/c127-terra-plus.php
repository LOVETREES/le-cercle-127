<?php
/**
 * Plugin Name: Cercle 127 - Terra Plus (mudras, schéma des lignes, lecture du jour)
 * Description: Complète l'atelier de Terra : illustrations originales des quatre mudras, schéma de la main dont les lignes s'allument pendant les questions, message clair en fin de lecture et une lecture de la main par jour. Ajout de présentation seulement : aucune donnée ni page modifiée. Désactiver l'extension revient à l'état précédent.
 * Version: 1.0.0
 * Author: Le Cercle 127
 */

if (!defined('ABSPATH')) exit;

add_action('wp_enqueue_scripts', function () {
    if (!is_page('terra-gardienne-de-lancrage')) return;
    $base = plugin_dir_url(__FILE__) . 'assets/';
    $dir  = plugin_dir_path(__FILE__) . 'assets/';
    wp_enqueue_style('c127-terra-plus', $base . 'terra-plus.css', [], (string) filemtime($dir . 'terra-plus.css'));
    wp_enqueue_script('c127-terra-plus', $base . 'terra-plus.js', [], (string) filemtime($dir . 'terra-plus.js'), true);
}, 30);
