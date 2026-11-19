<?php
/**
 * Plugin Name: Le Cercle 127 — Grimoire
 * Description: Le tableau de bord du Grimoire : rêves, symboles et émotions qui reviennent, carte des portes (les 7 Sœurs), rêves récents, suivi émotionnel. Construit avec les vraies données de la personne connectée ; le reste de la page (dictée, labyrinthe…) est conservé.
 * Version: 1.0.1
 * Author: Le Cercle 127
 */
if (!defined('ABSPATH')) { exit; }

function c127g_on() { return is_page('grimoire') && is_user_logged_in(); }

add_action('wp_enqueue_scripts', function () {
    if (!c127g_on()) { return; }
    $base = plugin_dir_url(__FILE__); $dir = plugin_dir_path(__FILE__);
    $u = wp_get_current_user();
    wp_enqueue_style('c127g-fonts', 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600&family=Cormorant+Garamond:ital,wght@0,500;1,500&family=Manrope:wght@400;500;600;700;800&display=swap', [], null);
    wp_enqueue_style('c127g', $base . 'grimoire.css', [], (string) filemtime($dir . 'grimoire.css'));
    wp_enqueue_script('c127g', $base . 'grimoire.js', [], (string) filemtime($dir . 'grimoire.js'), true);
    wp_localize_script('c127g', 'C127Grim', [
        'dreams' => esc_url_raw(rest_url('cercle127/v1/dreams')),
        'reading' => esc_url_raw(rest_url('c127-grimoire/v1/reading')),
        'memories' => esc_url_raw(rest_url('c127-f127/v1/memories')),
        'nonce' => wp_create_nonce('wp_rest'),
        'name' => $u && $u->display_name ? $u->display_name : '',
        'links' => [
            'oni' => home_url('/lecture-de-reve/'),
            'carnet' => home_url('/carnet-vocal/'),
            'symboles' => home_url('/symboles/'),
        ],
        'sisters' => [
            ['oni', 'Oni', 'I', home_url('/oni-gardienne-des-reves/')],
            ['alka', 'Alka', 'II', home_url('/alka-tisseuse-des-connexions/')],
            ['naia', 'Naïa', 'III', home_url('/naia-gardienne-des-emotions/')],
            ['terra', 'Terra', 'IV', home_url('/terra-gardienne-de-lancrage/')],
            ['ignis', 'Ignis', 'V', home_url('/ignis-flamme-de-la-transformation/')],
            ['astria', 'Astria', 'VI', home_url('/astria-etoile-des-aspirations/')],
            ['irma', 'Irma', 'VII', home_url('/irma-gardienne-des-choix/')],
        ],
    ]);
});

add_filter('body_class', function ($c) { if (c127g_on()) { $c[] = 'c127g-on'; } return $c; });

// L'emplacement du tableau de bord, en tête du contenu de la page.
add_filter('the_content', function ($html) {
    if (!c127g_on() || !in_the_loop() || !is_main_query()) { return $html; }
    return '<div id="c127g" class="c127g wp-exclude-emoji"><p class="c127g-loading">Ton Grimoire s’ouvre…</p></div>' . $html;
}, 5);

/* Read-only projection of the existing private dream; no alternative storage. */
add_action('rest_api_init', function () {
    register_rest_route('c127-grimoire/v1', '/reading/(?P<id>[1-9][0-9]*)', [
        'methods' => WP_REST_Server::READABLE,
        'permission_callback' => function ($request) {
            return is_user_logged_in() && wp_verify_nonce($request->get_header('X-WP-Nonce'), 'wp_rest')
                ? true : new WP_Error('c127_auth', 'Connexion requise.', ['status' => 401]);
        },
        'callback' => 'c127g_reading',
    ]);
});
function c127g_reading($request) {
    $id = (int) $request['id'];
    $post = get_post($id);
    if (!get_current_user_id() || !$post || $post->post_type !== 'reve_personnel'
        || $post->post_status !== 'private' || (int) $post->post_author !== get_current_user_id()) {
        return new WP_Error('c127_not_found', 'Rêve introuvable.', ['status' => 404]);
    }
    $raw = json_decode(get_post_meta($id, '_f127_reading_json', true), true);
    $reading = null;
    $sources = [];
    if (is_array($raw) && ($raw['schema'] ?? '') === 'dream.reading.v1'
        && (string) ($raw['dream_id'] ?? '') === (string) $id
        && ($raw['status'] ?? '') === 'completed' && is_array($raw['reading'] ?? null)) {
        $reading = $raw['reading'];
        $prov = json_decode(get_post_meta($id, '_f127_reading_provenance_json', true), true);
        if (is_array($prov) && ($prov['capability'] ?? '') === 'dream.read'
            && ($prov['executor'] ?? '') === 'framework127-worker'
            && ($prov['strategy'] ?? '') === 'deterministic-document-context-v1'
            && is_array($prov['documents_consulted'] ?? null)) {
            foreach (array_slice($prov['documents_consulted'], 0, 3) as $doc) {
                if (!is_array($doc) || !in_array($doc['role'] ?? '', ['oni_practice', 'oni_voice_reference'], true)
                    || !is_int($doc['page'] ?? null) || $doc['page'] < 1
                    || !is_string($doc['title'] ?? null)) { continue; }
                $sources[] = ['title' => $doc['title'], 'page' => $doc['page']];
            }
        }
    }
    $response = rest_ensure_response(['dream_id' => $id, 'reading' => $reading, 'sources' => $sources]);
    $response->header('Cache-Control', 'private, no-store, max-age=0');
    return $response;
}
add_filter('rest_post_dispatch', function ($response, $server, $request) {
    if (strpos($request->get_route(), '/c127-grimoire/v1/reading/') === 0) {
        $response->header('Cache-Control', 'private, no-store, max-age=0');
    }
    return $response;
}, 10, 3);
