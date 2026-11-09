<?php
/**
 * Plugin Name: Cercle 127 — Démo : Terra lit la main
 * Description: Démonstration animée de la lecture de la main (scan, points de la main, lignes réelles, lecture de chiromancienne). Shortcode [c127_demo_main].
 * Version: 1.0.1
 * Author: Le Cercle 127
 */
if (!defined('ABSPATH')) exit;

function c127dm_has_shortcode() {
    if (!is_singular()) return false;
    $post = get_post();
    return $post && has_shortcode($post->post_content, 'c127_demo_main');
}

add_action('wp_enqueue_scripts', function () {
    if (!c127dm_has_shortcode()) return;
    $dir = plugin_dir_path(__FILE__) . 'assets/';
    $url = plugin_dir_url(__FILE__) . 'assets/';
    wp_enqueue_style('c127dm-fonts', 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap', [], null);
    wp_enqueue_style('c127dm', $url . 'demo.css', [], (string) filemtime($dir . 'demo.css'));
    wp_enqueue_script('c127dm', $url . 'demo.js', [], (string) filemtime($dir . 'demo.js'), true);
    $data = json_decode((string) file_get_contents($dir . 'demo-data.json'), true);
    wp_add_inline_script('c127dm', 'window.C127DemoMain = ' . wp_json_encode($data) . ';', 'before');
});

add_filter('body_class', function ($c) { if (c127dm_has_shortcode()) $c[] = 'c127dm-page'; return $c; });

add_action('wp_head', function () {
    if (!c127dm_has_shortcode()) return;
    // La démo porte son propre titre : celui du thème disparaît sur cette page.
    echo '<style>body.c127dm-page .page-hero,body.c127dm-page .entry-title,body.c127dm-page h1.wp-block-post-title{display:none!important}body.c127dm-page .page-body>.wrap{max-width:1240px!important;width:auto!important}body.c127dm-page .page-body{padding-top:0}</style>';
});

add_shortcode('c127_demo_main', function () {
    $html = (string) file_get_contents(plugin_dir_path(__FILE__) . 'demo.html');
    $img = esc_url(plugin_dir_url(__FILE__) . 'assets/main-demo.jpg');
    return '<div class="c127dm wp-exclude-emoji">' . str_replace('%IMG%', $img, $html) . '</div>';
});
