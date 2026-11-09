<?php
/**
 * Plugin Name: Le Cercle 127 — Chat sobre
 * Description: Habillage épuré des conversations avec les Sœurs (CSS + hauteur auto du champ). Ne modifie ni l'envoi, ni l'historique, ni les connexions Framework 127.
 * Version: 1.0.1
 * Author: Le Cercle 127
 */
if (!defined('ABSPATH')) { exit; }
add_action('wp_enqueue_scripts', function () {
    // Feuille légère, entièrement limitée au sélecteur .oschat.
    $v = '1.0.0';
    wp_enqueue_style('c127-chat-sobre', plugins_url('chat-sobre.css', __FILE__), [], $v);
    wp_enqueue_script('c127-chat-sobre', plugins_url('chat-sobre.js', __FILE__), [], $v, true);
}, 100);
