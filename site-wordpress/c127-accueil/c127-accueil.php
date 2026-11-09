<?php
/**
 * Plugin Name: Le Cercle 127 — Accueil recentré et prolongement du rêve
 * Description: Accueil centré sur le rêve : « Raconter mon rêve » (prix lu sur la page) et « Ouvrir mon Grimoire » en tête, bandeau « Ton rituel du jour » (carte, émotion, main) avec gestes cochés et série de jours, le reste replié plus bas. Après le paiement d'une Perle d'Oni : « Pendant qu'Oni lit ton rêve », Terra et Naïa en prolongement. Le thème n'est pas modifié ; désactiver l'extension rend l'accueil d'origine.
 * Version: 1.0.0
 * Author: Le Cercle 127
 */
if (!defined('ABSPATH')) { exit; }

add_action('wp_enqueue_scripts', function () {
    $front = is_front_page();
    $confirm = is_page('confirmation-de-paiement');
    if (!$front && !$confirm) { return; }
    $base = plugin_dir_url(__FILE__);
    $dir = plugin_dir_path(__FILE__);
    wp_enqueue_style('c127-accueil', $base . 'accueil.css', [], (string) filemtime($dir . 'accueil.css'));
    wp_enqueue_script('c127-accueil', $base . 'accueil.js', [], (string) filemtime($dir . 'accueil.js'), true);
    wp_localize_script('c127-accueil', 'C127Accueil', [
        'mode' => $front ? 'home' : 'confirm',
        'links' => [
            'reve' => home_url('/lecture-de-reve/'),
            'grimoire' => home_url('/grimoire/'),
            'oracle' => home_url('/oracle-127/'),
            'naia' => home_url('/naia-gardienne-des-emotions/#c127-ask-naia-apaisement'),
            'terra' => home_url('/terra-gardienne-de-lancrage/'),
            'terraAncrage' => home_url('/terra-gardienne-de-lancrage/#c127-ask-terra-ancrage'),
        ],
    ]);
}, 40);
