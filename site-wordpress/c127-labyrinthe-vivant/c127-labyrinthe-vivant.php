<?php
/**
 * Plugin Name: Le Cercle 127 — Labyrinthe vivant
 * Description: Sur la page du Grand Labyrinthe, confronte l'ACQUIS (ciel de naissance, lecture symbolique, calculé dans le navigateur avec Astronomy Engine) au VÉCU (bilan de la semaine, et rêves du Grimoire pour les personnes connectées). Heptagone des Sept Sœurs, porte de naissance, porte du moment. La naissance reste dans le navigateur ; les bilans de la semaine peuvent, sur accord explicite, être gardés dans le compte pour être retrouvés entre le site et l'application (REST c127-lv/v1/bilans, chiffres de 0 à 4 seulement, effaçables).
 * Version: 1.1.0
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
        'bilans' => esc_url_raw(rest_url('c127-lv/v1/bilans')),
    ]);
}, 40);

/* ---------- Bilans de la semaine gardés dans le compte (sur accord) ---------- */
// Même authentification que l'application (jeton Bearer vérifié par /cercle127/v1/me), ou session du site.
function c127lv_user_id(WP_REST_Request $request): int {
    $auth = (string) $request->get_header('authorization');
    if ($auth !== '' && stripos($auth, 'bearer ') === 0) {
        $me = new WP_REST_Request('GET', '/cercle127/v1/me');
        $me->set_header('authorization', $auth);
        $res = rest_do_request($me);
        if (!$res->is_error() && 200 === $res->get_status()) {
            $d = $res->get_data();
            return isset($d['id']) ? absint($d['id']) : 0;
        }
        return 0;
    }
    return get_current_user_id();
}

const C127LV_META = 'c127_lv_bilans';
const C127LV_SISTERS = ['Oni', 'Alka', 'Naïa', 'Terra', 'Ignis', 'Astria', 'Irma'];

/** Un bilan propre, ou null : semaine ISO, 7 réponses entières de 0 à 4, niveaux facultatifs entre 0 et 1. */
function c127lv_clean($b) {
    if (!is_array($b) || !isset($b['week'], $b['answers']) || !preg_match('/^\d{4}-W\d{2}$/', (string) $b['week'])) { return null; }
    $a = $b['answers'];
    if (!is_array($a) || count($a) !== 7) { return null; }
    $answers = [];
    foreach (array_values($a) as $x) {
        if (!is_numeric($x) || (int) $x < 0 || (int) $x > 4) { return null; }
        $answers[] = (int) $x;
    }
    $at = isset($b['at']) && strtotime((string) $b['at']) ? gmdate('c', strtotime((string) $b['at'])) : gmdate('c');
    $out = ['week' => (string) $b['week'], 'at' => $at, 'answers' => $answers];
    if (isset($b['levels']) && is_array($b['levels'])) {
        $lv = [];
        foreach (C127LV_SISTERS as $s) { if (isset($b['levels'][$s]) && is_numeric($b['levels'][$s])) { $lv[$s] = max(0, min(1, round((float) $b['levels'][$s], 3))); } }
        if (count($lv) === 7) { $out['levels'] = $lv; }
    }
    return $out;
}

function c127lv_list(int $uid): array {
    $l = get_user_meta($uid, C127LV_META, true);
    return is_array($l) ? array_values($l) : [];
}

add_action('rest_api_init', function () {
    register_rest_route('c127-lv/v1', '/bilans', [
        [
            'methods' => 'GET',
            'permission_callback' => '__return_true',
            'callback' => function (WP_REST_Request $r) {
                $uid = c127lv_user_id($r);
                if (!$uid) { return new WP_Error('c127lv_auth', 'Connexion requise.', ['status' => 401]); }
                return rest_ensure_response(['bilans' => c127lv_list($uid)]);
            },
        ],
        [
            'methods' => 'POST',
            'permission_callback' => '__return_true',
            'callback' => function (WP_REST_Request $r) {
                $uid = c127lv_user_id($r);
                if (!$uid) { return new WP_Error('c127lv_auth', 'Connexion requise.', ['status' => 401]); }
                $p = $r->get_json_params();
                $items = isset($p['bilans']) && is_array($p['bilans']) ? $p['bilans'] : [$p];
                $by = [];
                foreach (c127lv_list($uid) as $b) { $by[$b['week']] = $b; }
                $n = 0;
                foreach (array_slice($items, 0, 60) as $raw) {
                    $b = c127lv_clean($raw);
                    if (!$b) { continue; }
                    // Le plus récent l'emporte pour une même semaine.
                    if (!isset($by[$b['week']]) || strtotime($b['at']) >= strtotime($by[$b['week']]['at'])) { $by[$b['week']] = $b; $n++; }
                }
                krsort($by);
                $list = array_slice(array_values($by), 0, 52);
                update_user_meta($uid, C127LV_META, $list);
                return rest_ensure_response(['saved' => $n, 'bilans' => $list]);
            },
        ],
        [
            'methods' => 'DELETE',
            'permission_callback' => '__return_true',
            'callback' => function (WP_REST_Request $r) {
                $uid = c127lv_user_id($r);
                if (!$uid) { return new WP_Error('c127lv_auth', 'Connexion requise.', ['status' => 401]); }
                delete_user_meta($uid, C127LV_META);
                return rest_ensure_response(['deleted' => true]);
            },
        ],
    ]);
});
