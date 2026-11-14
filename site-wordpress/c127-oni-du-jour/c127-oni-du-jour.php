<?php
/**
 * Plugin Name: Le Cercle 127 — Lecture du jour d'Oni
 * Description: Une lecture de rêve immédiate par jour et par compte, sur le Grimoire du site comme dans l'application (même scénario Make, même quota, relue après coup). Le site vérifie le compte et le rêve pour Make (REST c127-oni/v1/reve), sans jamais confier de mot de passe ni de jeton de session au navigateur ; garde-fou de détresse (3114 / 112).
 * Version: 1.2.0
 * Author: Le Cercle 127
 */
if (!defined('ABSPATH')) { exit; }

const C127OD_HOOK = 'https://hook.eu2.make.com/epuxbt8jq6of4mux15crbkph88rcb59j';
// Scénario Make « Perle d'Oni (achat app, relue avant envoi) ».
const C127OD_PERLE_HOOK = 'https://hook.eu2.make.com/o75o668f39prrtnqai9ckk0kt3v2kuai';
const C127OD_PERLE_PRODUCTS = ['perle_oni', 'perle_oni_bienvenue'];

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


/* =====================================================================================================
 * La Perle d'Oni achetée dans l'application (Google Play, via RevenueCat).
 * - RevenueCat prévient le site de chaque achat confirmé par Google (webhook protégé par un secret
 *   que le site génère lui-même, à recopier dans RevenueCat) ;
 * - l'app confirme l'achat pour un rêve (POST c127-oni/v1/perle) ;
 * - quand les deux concordent, le site lance Make, qui redemande le dossier signé (perle-dossier),
 *   prépare la lecture approfondie et la range pour relecture humaine (48 h).
 * Aucune donnée bancaire ne passe par le site.
 * ===================================================================================================== */

const C127OD_PERLES_META = 'c127_perles';

function c127od_secret(): string {
    $s = get_option('c127od_rc_secret');
    if (!$s) { $s = wp_generate_password(40, false, false); update_option('c127od_rc_secret', $s, false); }
    return (string) $s;
}
function c127od_sig(string $tx): string { return hash_hmac('sha256', 'perle|' . $tx, wp_salt('auth')); }

/** Compte de la personne : jeton de l'application (Bearer), sinon session du site. */
function c127od_request_user(WP_REST_Request $r): array {
    $auth = trim((string) $r->get_header('authorization'));
    if (stripos($auth, 'bearer ') === 0 && strlen(trim(substr($auth, 7))) > 0) {
        $me = new WP_REST_Request('GET', '/cercle127/v1/me');
        $me->set_header('authorization', $auth);
        $res = rest_do_request($me);
        if (!$res->is_error() && 200 === $res->get_status()) { $d = $res->get_data(); return [isset($d['id']) ? absint($d['id']) : 0, $auth]; }
        return [0, ''];
    }
    return [get_current_user_id(), ''];
}

function c127od_perles(int $uid): array { $l = get_user_meta($uid, C127OD_PERLES_META, true); return is_array($l) ? array_values($l) : []; }
function c127od_save_perles(int $uid, array $l): void { update_user_meta($uid, C127OD_PERLES_META, array_values($l)); }

/** Achats confirmés par RevenueCat : transaction → compte, produit. */
function c127od_verified(): array { $v = get_option('c127od_rc_verified', []); return is_array($v) ? $v : []; }

function c127od_dream_of(int $uid, int $dream, string $bearer = ''): ?array {
    foreach (c127od_dreams($uid, $bearer) as $d) { if ((int) ($d['id'] ?? 0) === $dream) { return $d; } }
    return null;
}

/** Lance la Perle si l'achat est à la fois confirmé par RevenueCat et rattaché à un rêve par l'app. */
function c127od_maybe_launch(int $uid, string $tx): void {
    $v = c127od_verified();
    if (empty($v[$tx]) || (int) $v[$tx]['uid'] !== $uid) { return; }
    $l = c127od_perles($uid);
    foreach ($l as $i => $p) {
        if (($p['tx'] ?? '') !== $tx || ($p['status'] ?? '') !== 'a_verifier') { continue; }
        $l[$i]['status'] = 'en_preparation';
        c127od_save_perles($uid, $l);
        wp_remote_post(C127OD_PERLE_HOOK, ['timeout' => 15, 'headers' => ['Content-Type' => 'application/json'], 'body' => wp_json_encode(['tx' => $tx, 'sig' => c127od_sig($tx)])]);
        return;
    }
}

/** « livrée » quand la lecture du rêve a changé depuis l'achat (la Perle validée remplace la lecture). */
function c127od_refresh_status(int $uid): array {
    $l = c127od_perles($uid); $changed = false; $dreams = null;
    foreach ($l as $i => $p) {
        if (($p['status'] ?? '') !== 'en_preparation') { continue; }
        if ($dreams === null) { $dreams = c127od_dreams($uid); }
        foreach ($dreams as $d) {
            if ((int) ($d['id'] ?? 0) !== (int) $p['dream']) { continue; }
            $h = md5((string) ($d['interpretation'] ?? ''));
            if (!empty($d['interpretation']) && $h !== ($p['ihash'] ?? '')) { $l[$i]['status'] = 'livree'; $changed = true; }
        }
    }
    if ($changed) { c127od_save_perles($uid, $l); }
    return $l;
}

add_action('rest_api_init', function () {
    register_rest_route('c127-oni/v1', '/perle', [
        [
            'methods' => 'GET',
            'permission_callback' => '__return_true',
            'callback' => function (WP_REST_Request $r) {
                [$uid] = c127od_request_user($r);
                if (!$uid) { return new WP_Error('c127od_auth', 'Connexion requise.', ['status' => 401]); }
                $l = c127od_refresh_status($uid);
                return rest_ensure_response([
                    'welcomeEligible' => count($l) === 0,
                    'perles' => array_map(function ($p) { return ['dreamId' => (string) $p['dream'], 'status' => $p['status'] === 'a_verifier' ? 'en_preparation' : $p['status'], 'at' => $p['at']]; }, $l),
                ]);
            },
        ],
        [
            'methods' => 'POST',
            'permission_callback' => '__return_true',
            'callback' => function (WP_REST_Request $r) {
                [$uid, $bearer] = c127od_request_user($r);
                if (!$uid) { return new WP_Error('c127od_auth', 'Connexion requise.', ['status' => 401]); }
                $p = $r->get_json_params();
                $dream = absint($p['dream_id'] ?? 0);
                $product = (string) ($p['product_id'] ?? '');
                $tx = substr(preg_replace('/[^A-Za-z0-9._:-]/', '', (string) ($p['transaction_id'] ?? '')), 0, 120);
                if (!$dream || $tx === '' || !in_array($product, C127OD_PERLE_PRODUCTS, true) || ($p['consent'] ?? false) !== true) {
                    return new WP_Error('c127od_perle', 'Demande incomplète.', ['status' => 400]);
                }
                $l = c127od_perles($uid);
                foreach ($l as $x) { if (($x['tx'] ?? '') === $tx) { c127od_maybe_launch($uid, $tx); return rest_ensure_response(['status' => 'deja_confirmee']); } }
                $d = c127od_dream_of($uid, $dream, $bearer);
                if (!$d) { return new WP_Error('c127od_dream', 'Rêve introuvable.', ['status' => 404]); }
                $l[] = ['tx' => $tx, 'product' => $product, 'dream' => $dream, 'at' => gmdate('c'), 'status' => 'a_verifier', 'ihash' => md5((string) ($d['interpretation'] ?? ''))];
                c127od_save_perles($uid, $l);
                c127od_maybe_launch($uid, $tx);
                return rest_ensure_response(['status' => 'en_preparation']);
            },
        ],
    ]);

    // RevenueCat → site : achats confirmés et remboursements.
    register_rest_route('c127-oni/v1', '/perle-webhook', [
        'methods' => 'POST',
        'permission_callback' => '__return_true',
        'callback' => function (WP_REST_Request $r) {
            $auth = trim((string) $r->get_header('authorization'));
            $secret = c127od_secret();
            if (!hash_equals($secret, $auth) && !hash_equals('Bearer ' . $secret, $auth)) { return new WP_Error('c127od_auth', 'Refusé.', ['status' => 401]); }
            $e = (array) (($r->get_json_params()['event'] ?? []));
            $type = (string) ($e['type'] ?? '');
            $product = (string) ($e['product_id'] ?? '');
            $tx = (string) ($e['transaction_id'] ?? ($e['original_transaction_id'] ?? ''));
            $uid = preg_match('/^wp-(\d+)$/', (string) ($e['app_user_id'] ?? ''), $m) ? absint($m[1]) : 0;
            if ($type === 'TEST') { return rest_ensure_response(['ok' => true, 'test' => true]); }
            if (!$uid || $tx === '' || !in_array($product, C127OD_PERLE_PRODUCTS, true)) { return rest_ensure_response(['ok' => true, 'ignored' => true]); }
            $v = c127od_verified();
            if ($type === 'NON_RENEWING_PURCHASE') {
                $v[$tx] = ['uid' => $uid, 'product' => $product, 'at' => gmdate('c'), 'env' => (string) ($e['environment'] ?? '')];
                if (count($v) > 2000) { $v = array_slice($v, -2000, null, true); }
                update_option('c127od_rc_verified', $v, false);
                c127od_maybe_launch($uid, $tx);
            } elseif ($type === 'CANCELLATION') {
                $l = c127od_perles($uid);
                foreach ($l as $i => $p) { if (($p['tx'] ?? '') === $tx) { $l[$i]['status'] = 'remboursee'; } }
                c127od_save_perles($uid, $l);
            }
            return rest_ensure_response(['ok' => true]);
        },
    ]);

    // Make → site : le dossier d'une Perle confirmée (signature HMAC du site, sinon rien).
    register_rest_route('c127-oni/v1', '/perle-dossier', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => function (WP_REST_Request $r) {
            $tx = (string) $r->get_param('tx');
            if ($tx === '' || !hash_equals(c127od_sig($tx), (string) $r->get_param('sig'))) { return new WP_Error('c127od_sig', 'Refusé.', ['status' => 403]); }
            $v = c127od_verified();
            if (empty($v[$tx])) { return new WP_Error('c127od_unverified', 'Achat non confirmé.', ['status' => 404]); }
            $uid = (int) $v[$tx]['uid'];
            foreach (c127od_perles($uid) as $p) {
                if (($p['tx'] ?? '') !== $tx || ($p['status'] ?? '') !== 'en_preparation') { continue; }
                $d = c127od_dream_of($uid, (int) $p['dream']);
                if (!$d) { break; }
                return rest_ensure_response([
                    'dream_id' => (int) $p['dream'],
                    'titre' => preg_replace('/^Privé\s*:\s*/u', '', (string) ($d['title'] ?? '')),
                    'recit' => (string) ($d['story'] ?? ''),
                    'emotion' => (string) ($d['emotion'] ?? ''),
                    'date' => (string) ($d['dream_date'] ?? ''),
                    'symboles' => is_array($d['symbols'] ?? null) ? implode(', ', array_map('strval', $d['symbols'])) : (string) ($d['symbols'] ?? ''),
                ]);
            }
            return new WP_Error('c127od_notfound', 'Dossier introuvable.', ['status' => 404]);
        },
    ]);
});

/* ---------- Réglages → Perle d'Oni : adresse et secret à recopier dans RevenueCat (administrateurs) ---------- */
add_action('admin_menu', function () {
    add_options_page('Perle d’Oni (achats app)', 'Perle d’Oni', 'manage_options', 'c127-perle', function () {
        if (!current_user_can('manage_options')) { return; }
        if (isset($_POST['c127od_regen']) && check_admin_referer('c127od_regen')) { delete_option('c127od_rc_secret'); }
        $url = rest_url('c127-oni/v1/perle-webhook');
        $secret = c127od_secret();
        $v = c127od_verified();
        echo '<div class="wrap"><h1>La Perle d’Oni — achats dans l’application</h1>';
        echo '<p>Dans <strong>RevenueCat → Project settings → Integrations → Webhooks → Add new configuration</strong>, recopiez :</p>';
        echo '<table class="form-table"><tr><th>Webhook URL</th><td><input class="large-text code" readonly value="' . esc_attr($url) . '"></td></tr>';
        echo '<tr><th>Authorization header value</th><td><input class="large-text code" readonly value="' . esc_attr('Bearer ' . $secret) . '"><p class="description">Secret propre à ce site. Ne le communiquez à personne d’autre.</p></td></tr>';
        echo '<tr><th>Environment</th><td>Production et Sandbox (les achats de test sont acceptés).</td></tr></table>';
        echo '<p>Achats confirmés reçus : <strong>' . count($v) . '</strong>.</p>';
        echo '<form method="post">'; wp_nonce_field('c127od_regen'); echo '<p><button class="button" name="c127od_regen" value="1" onclick="return confirm(\'Générer un nouveau secret ? Il faudra le recopier dans RevenueCat.\')">Générer un nouveau secret</button></p></form></div>';
    });
});

/* ---------- RGPD : les Perles achetées figurent dans l'export ; l'effacement retire le lien aux rêves ---------- */
add_filter('wp_privacy_personal_data_exporters', function ($ex) {
    $ex['c127-perle'] = ['exporter_friendly_name' => 'Le Cercle 127 — Perles d’Oni achetées dans l’application', 'callback' => function ($email, $page = 1) {
        $u = get_user_by('email', $email); $items = [];
        if ($u) { foreach (c127od_perles((int) $u->ID) as $p) { $items[] = ['group_id' => 'c127-perles', 'group_label' => 'Perles d’Oni', 'item_id' => 'perle-' . md5($p['tx']), 'data' => [['name' => 'Date', 'value' => $p['at']], ['name' => 'Produit', 'value' => $p['product']], ['name' => 'Rêve', 'value' => (string) $p['dream']], ['name' => 'État', 'value' => $p['status']]]]; } }
        return ['data' => $items, 'done' => true];
    }];
    return $ex;
});
add_filter('wp_privacy_personal_data_erasers', function ($er) {
    $er['c127-perle'] = ['eraser_friendly_name' => 'Le Cercle 127 — Perles d’Oni', 'callback' => function ($email, $page = 1) {
        $u = get_user_by('email', $email); $had = $u && c127od_perles((int) $u->ID);
        if ($u) { delete_user_meta((int) $u->ID, C127OD_PERLES_META); }
        return ['items_removed' => (bool) $had, 'items_retained' => false, 'messages' => ['Les achats restent enregistrés chez Google Play (obligations comptables).'], 'done' => true];
    }];
    return $er;
});
