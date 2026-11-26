<?php
/**
 * Plugin Name: Le Cercle 127 — Premium
 * Description: L'abonnement Cercle Premium (mensuel ou annuel), valable sur le site, l'app web et les apps iPhone et Android. RevenueCat prévient le site de chaque achat, renouvellement, annulation ou expiration (webhook déjà relié pour la Perle d'Oni) ; le site garde, pour chaque compte, la date de fin de l'accès Premium et la vérifie avant chaque lecture payante par l'IA. REST c127-premium/v1/status pour l'app. Désactiver l'extension : plus aucun accès Premium (hors attributions manuelles « c127_plus »).
 * Version: 1.0.0
 * Author: Le Cercle 127
 */
if (!defined('ABSPATH')) { exit; }

const C127P_ENTITLEMENT = 'premium';
const C127P_UNTIL = 'c127_plus_until';   // fin de l'accès Premium (horodatage Unix), tenue à jour par RevenueCat
const C127P_MANUAL = 'c127_plus';        // « 1 » : accès attribué à la main (proches, presse), sans date de fin

/** Date de fin de l'accès Premium payé (0 si aucun). */
function c127_premium_until(int $uid): int {
    return (int) get_user_meta($uid, C127P_UNTIL, true);
}

/** Le compte a-t-il accès au Premium en ce moment ? */
function c127_is_premium(int $uid): bool {
    if ($uid <= 0) { return false; }
    if (user_can($uid, 'manage_options')) { return true; }
    if ('1' === (string) get_user_meta($uid, C127P_MANUAL, true)) { return true; }
    return c127_premium_until($uid) > time();
}

/**
 * Un événement RevenueCat (transmis par le webhook du site, c127-oni/v1/perle-webhook).
 * Seuls les événements qui portent le droit « premium » changent l'accès.
 */
add_action('c127_rc_event', function (array $e, int $uid) {
    if ($uid <= 0) { return; }
    $ents = array_map('strval', (array) ($e['entitlement_ids'] ?? []));
    if (!empty($e['entitlement_id'])) { $ents[] = (string) $e['entitlement_id']; }
    if (!in_array(C127P_ENTITLEMENT, $ents, true)) { return; }
    $type = (string) ($e['type'] ?? '');
    $exp = isset($e['expiration_at_ms']) ? (int) floor(((float) $e['expiration_at_ms']) / 1000) : 0;
    switch ($type) {
        case 'INITIAL_PURCHASE':
        case 'RENEWAL':
        case 'UNCANCELLATION':
        case 'PRODUCT_CHANGE':
        case 'SUBSCRIPTION_EXTENDED':
        case 'TEMPORARY_ENTITLEMENT_GRANT':
        case 'CANCELLATION': // résiliation : l'accès reste jusqu'à la fin de la période payée
            if ($exp > 0) { update_user_meta($uid, C127P_UNTIL, $exp); }
            break;
        case 'EXPIRATION':
            delete_user_meta($uid, C127P_UNTIL);
            break;
    }
    update_user_meta($uid, 'c127_plus_last_event', ['type' => $type, 'store' => (string) ($e['store'] ?? ''), 'product' => (string) ($e['product_id'] ?? ''), 'at' => gmdate('c')]);
}, 10, 2);

/** Le compte qui appelle : session du site, ou jeton de l'application (même vérification que la lecture d'Oni). */
function c127_premium_caller(WP_REST_Request $r): int {
    $uid = get_current_user_id();
    if ($uid) { return $uid; }
    $auth = trim((string) $r->get_header('authorization'));
    if (stripos($auth, 'bearer ') !== 0) { return 0; }
    $me = new WP_REST_Request('GET', '/cercle127/v1/me');
    $me->set_header('authorization', $auth);
    $res = rest_do_request($me);
    if ($res->is_error() || 200 !== $res->get_status()) { return 0; }
    $d = $res->get_data();
    return isset($d['id']) ? absint($d['id']) : 0;
}

add_action('rest_api_init', function () {
    register_rest_route('c127-premium/v1', '/status', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => function (WP_REST_Request $r) {
            $uid = c127_premium_caller($r);
            if (!$uid) { return new WP_Error('c127p_auth', 'Connexion requise.', ['status' => 401]); }
            $until = c127_premium_until($uid);
            return rest_ensure_response([
                'premium' => c127_is_premium($uid),
                'until' => $until > 0 ? gmdate('c', $until) : null,
                'app_user_id' => 'wp-' . $uid,
            ]);
        },
    ]);
});

/* ---------- Réglages → Cercle Premium : ce qu'il faut créer dans RevenueCat (administrateurs) ---------- */
add_action('admin_menu', function () {
    add_options_page('Cercle Premium', 'Cercle Premium', 'manage_options', 'c127-premium', function () {
        if (!current_user_can('manage_options')) { return; }
        global $wpdb;
        $active = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$wpdb->usermeta} WHERE meta_key = %s AND CAST(meta_value AS UNSIGNED) > %d", C127P_UNTIL, time()));
        echo '<div class="wrap"><h1>Cercle Premium</h1>';
        echo '<p><strong>' . esc_html((string) $active) . '</strong> abonnement(s) Premium actif(s).</p>';
        echo '<h2>Réglages RevenueCat</h2><ol>';
        echo '<li>Un droit (<em>entitlement</em>) nommé <code>premium</code>.</li>';
        echo '<li>Deux produits rattachés à ce droit : <code>premium_mensuel</code> (4,99 €/mois) et <code>premium_annuel</code> (39,99 €/an, 7 jours d’essai), sur l’App Store, Google Play et Web Billing (Stripe).</li>';
        echo '<li>Une offre (<em>offering</em>) <code>default</code> avec les forfaits <code>$rc_monthly</code> et <code>$rc_annual</code>.</li>';
        echo '<li>Le webhook déjà configuré pour la Perle d’Oni suffit : il transmet aussi les événements Premium (Réglages → Perle d’Oni).</li>';
        echo '</ol><p>L’identifiant RevenueCat de chaque personne est <code>wp-&lt;numéro du compte&gt;</code>, le même sur toutes les plateformes.</p>';
        echo '<p>Accès offert à la main : ajouter la donnée utilisateur <code>c127_plus</code> = <code>1</code>.</p></div>';
    });
});
