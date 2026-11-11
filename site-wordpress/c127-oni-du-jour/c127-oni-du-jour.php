<?php
/**
 * Plugin Name: Le Cercle 127 — Lecture du jour d'Oni
 * Description: Une lecture de rêve immédiate par jour et par compte, sur le Grimoire du site comme dans l'application (même scénario Make, même quota, relue après coup). Le site vérifie le compte et le rêve pour Make (REST c127-oni/v1/reve), sans jamais confier de mot de passe ni de jeton de session au navigateur ; garde-fou de détresse (3114 / 112).
 * Version: 1.1.2
 * Author: Le Cercle 127
 */
if (!defined('ABSPATH')) { exit; }

const C127OD_HOOK = 'https://hook.eu2.make.com/epuxbt8jq6of4mux15crbkph88rcb59j';

function c127od_on() { return is_page('grimoire') && is_user_logged_in(); }

/* ---------- Billet court (5 minutes) : prouve à Make que le site a vérifié ce compte pour ce rêve ---------- */
function c127od_ticket(int $uid, int $dream): string {
    $exp = time() + 300;
    $sig = hash_hmac('sha256', $uid . '|' . $dream . '|' . $exp, wp_salt('auth'));
    return $uid . '.' . $dream . '.' . $exp . '.' . $sig;
}
function c127od_ticket_user(string $t, int $dream): int {
    $p = explode('.', $t);
    if (count($p) !== 4) { return 0; }
    [$uid, $d, $exp, $sig] = $p;
    if ((int) $d !== $dream || (int) $exp < time()) { return 0; }
    $ok = hash_hmac('sha256', (int) $uid . '|' . (int) $d . '|' . (int) $exp, wp_salt('auth'));
    return hash_equals($ok, $sig) ? absint($uid) : 0;
}

/** Les rêves de la personne, lus avec ses propres droits (jeton de l'application, ou compte vérifié). */
function c127od_dreams(int $uid, string $bearer = ''): array {
    $req = new WP_REST_Request('GET', '/cercle127/v1/dreams');
    $prev = get_current_user_id();
    if ($bearer !== '') { $req->set_header('authorization', $bearer); } else { wp_set_current_user($uid); }
    $res = rest_do_request($req);
    if ($bearer === '') { wp_set_current_user($prev); }
    if ($res->is_error() || 200 !== $res->get_status()) { return []; }
    $d = $res->get_data();
    if (isset($d['dreams']) && is_array($d['dreams'])) { $d = $d['dreams']; }
    return is_array($d) ? array_values($d) : [];
}

add_action('rest_api_init', function () {
    // Appelé par Make : identifie le compte (jeton Bearer de l'app ou billet du site) et rend le rêve demandé.
    register_rest_route('c127-oni/v1', '/reve', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => function (WP_REST_Request $r) {
            $dream = absint($r->get_param('dream_id'));
            if (!$dream) { return new WP_Error('c127od_dream', 'Rêve manquant.', ['status' => 400]); }
            $uid = 0; $bearer = '';
            $auth = trim((string) $r->get_header('authorization'));
            if (stripos($auth, 'bearer ') === 0 && strlen(trim(substr($auth, 7))) > 0) {
                $me = new WP_REST_Request('GET', '/cercle127/v1/me');
                $me->set_header('authorization', $auth);
                $res = rest_do_request($me);
                if (!$res->is_error() && 200 === $res->get_status()) { $d = $res->get_data(); $uid = isset($d['id']) ? absint($d['id']) : 0; $bearer = $auth; }
            }
            if (!$uid) { $uid = c127od_ticket_user((string) $r->get_header('x_c127_ticket'), $dream); }
            if (!$uid) { return new WP_Error('c127od_auth', 'Connexion requise.', ['status' => 401]); }
            foreach (c127od_dreams($uid, $bearer) as $d) {
                if ((int) ($d['id'] ?? 0) !== $dream) { continue; }
                return rest_ensure_response([
                    'user_id' => $uid,
                    'id' => $dream,
                    'title' => (string) ($d['title'] ?? ''),
                    'story' => (string) ($d['story'] ?? ''),
                    'emotion' => (string) ($d['emotion'] ?? ''),
                    'dream_date' => (string) ($d['dream_date'] ?? ''),
                    'symbols' => is_array($d['symbols'] ?? null) ? implode(', ', array_map('strval', $d['symbols'])) : (string) ($d['symbols'] ?? ''),
                    'has_reading' => !empty($d['interpretation']),
                ]);
            }
            return new WP_Error('c127od_notfound', 'Rêve introuvable.', ['status' => 404]);
        },
    ]);

    // Appelé par le Grimoire du site (session + nonce) : un billet de 5 minutes pour ce rêve. Le navigateur appelle
    // ensuite Make lui-même (une requête PHP de 30 s serait coupée par l'hébergeur).
    register_rest_route('c127-oni/v1', '/billet', [
        'methods' => 'POST',
        'permission_callback' => function () { return is_user_logged_in(); },
        'callback' => function (WP_REST_Request $r) {
            $p = $r->get_json_params();
            $dream = absint($p['dream_id'] ?? 0);
            if (!$dream) { return new WP_Error('c127od_dream', 'Rêve manquant.', ['status' => 400]); }
            if (($p['consent'] ?? false) !== true) { return new WP_Error('c127od_consent', 'Votre accord est nécessaire avant l’envoi à Oni.', ['status' => 400]); }
            return rest_ensure_response(['ticket' => c127od_ticket(get_current_user_id(), $dream), 'hook' => C127OD_HOOK]);
        },
    ]);
});

add_action('wp_enqueue_scripts', function () {
    if (!c127od_on()) { return; }
    $base = plugin_dir_url(__FILE__); $dir = plugin_dir_path(__FILE__);
    wp_enqueue_style('c127od', $base . 'oni-du-jour.css', [], (string) filemtime($dir . 'oni-du-jour.css'));
    wp_enqueue_script('c127od', $base . 'oni-du-jour.js', [], (string) filemtime($dir . 'oni-du-jour.js'), true);
    wp_localize_script('c127od', 'C127OD', [
        'dreams' => esc_url_raw(rest_url('cercle127/v1/dreams')),
        'ticket' => esc_url_raw(rest_url('c127-oni/v1/billet')),
        'nonce' => wp_create_nonce('wp_rest'),
        'perle' => home_url('/lecture-de-reve/'),
        'app' => home_url('/application/'),
        'privacy' => home_url('/confidentialite-le-cercle-127/'),
    ]);
}, 41);

// L'emplacement, juste après le tableau de bord du Grimoire.
add_filter('the_content', function ($html) {
    if (!c127od_on() || !in_the_loop() || !is_main_query()) { return $html; }
    return '<section id="c127od" class="c127od wp-exclude-emoji" aria-labelledby="c127od-t"></section>' . $html;
}, 4);
