<?php
/**
 * Contrat de rendu du Grimoire, sans WordPress ni données réelles.
 * Exécuter avec php puis php -n pour vérifier le repli sans extension DOM.
 */
define('ABSPATH', __DIR__ . '/');
$GLOBALS['c127g_test'] = [
    'page' => 'grimoire', 'logged' => false, 'loop' => true, 'main' => true,
    'signup' => true, 'registration' => false, 'raw' => '', 'shortcode' => true,
    'actions' => [], 'filters' => [], 'styles' => [], 'scripts' => [], 'localized' => [], 'nocache' => 0,
];
function add_action($name, $callback, $priority = 10) { $GLOBALS['c127g_test']['actions'][$name][$priority][] = $callback; }
function add_filter($name, $callback, $priority = 10) { $GLOBALS['c127g_test']['filters'][$name][$priority][] = $callback; }
function run_action($name) {
    $hooks = $GLOBALS['c127g_test']['actions'][$name] ?? [];
    ksort($hooks);
    foreach ($hooks as $callbacks) { foreach ($callbacks as $callback) { $callback(); } }
}
function run_filter($name, $value) {
    $hooks = $GLOBALS['c127g_test']['filters'][$name] ?? [];
    ksort($hooks);
    foreach ($hooks as $callbacks) { foreach ($callbacks as $callback) { $value = $callback($value); } }
    return $value;
}
function is_page($slug) { return $GLOBALS['c127g_test']['page'] === $slug; }
function is_user_logged_in() { return $GLOBALS['c127g_test']['logged']; }
function in_the_loop() { return $GLOBALS['c127g_test']['loop']; }
function is_main_query() { return $GLOBALS['c127g_test']['main']; }
function plugin_dir_url($file) { return 'https://example.test/wp-content/plugins/c127-grimoire/'; }
function plugin_dir_path($file) { return dirname($file) . '/'; }
function wp_get_current_user() { return (object) ['display_name' => 'Compte de test']; }
function wp_enqueue_style($handle, ...$args) { $GLOBALS['c127g_test']['styles'][$handle] = $args; }
function wp_enqueue_script($handle, ...$args) { $GLOBALS['c127g_test']['scripts'][$handle] = $args; }
function wp_localize_script($handle, $name, $data) { $GLOBALS['c127g_test']['localized'][$handle] = $data; }
function wp_create_nonce($action) { return 'nonce-de-test'; }
function home_url($path) { return 'https://example.test' . $path; }
function rest_url($path) { return home_url('/wp-json/' . $path); }
function esc_url_raw($url) { return $url; }
function esc_url($url) { return htmlspecialchars($url, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function get_permalink($post = null) { return home_url($post ? '/creer-un-compte/' : '/grimoire/'); }
function get_page_by_path($path) { return $GLOBALS['c127g_test']['signup'] ? (object) ['post_status' => 'publish'] : null; }
function get_post_status($post) { return $post->post_status; }
function get_option($name) { return 'users_can_register' === $name && $GLOBALS['c127g_test']['registration']; }
function wp_registration_url() { return home_url('/wp-login.php?action=register'); }
function wp_login_url($redirect = '') { return home_url('/wp-login.php?redirect_to=' . rawurlencode($redirect)); }
function wp_lostpassword_url($redirect = '') { return home_url('/wp-login.php?action=lostpassword&redirect_to=' . rawurlencode($redirect)); }
function nocache_headers() { $GLOBALS['c127g_test']['nocache']++; }


function has_filter($name, $callback) {
    foreach ($GLOBALS['c127g_test']['filters'][$name] ?? [] as $priority => $callbacks) {
        if (in_array($callback, $callbacks, true)) { return $priority; }
    }
    return false;
}
function remove_filter($name, $callback, $priority) {
    $callbacks = $GLOBALS['c127g_test']['filters'][$name][$priority] ?? [];
    $GLOBALS['c127g_test']['filters'][$name][$priority] = array_values(array_filter($callbacks, function ($item) use ($callback) { return $item !== $callback; }));
}
function get_queried_object_id() { return 8354; }
function get_post_field($field, $id, $context = 'display') { return $GLOBALS['c127g_test']['raw']; }
function has_shortcode($content, $tag) { return false !== strpos($content, '[' . $tag); }
function shortcode_exists($tag) { return 'core127_grimoire' === $tag && $GLOBALS['c127g_test']['shortcode']; }
function do_shortcode($content) {
    $form = '<section class="core127 core127-grimoire"><form class="core127-dream-form"><textarea name="dream_story"></textarea><button>Garder ce rêve</button></form></section>';
    return str_replace('[core127_grimoire]', $form, $content);
}
// Reproduit le fallback de la source Core 127 disponible, enregistré après do_shortcode.
function core127_surface_fallback($content) {
    if (is_page('grimoire') && !has_shortcode($content, 'core127_grimoire')) {
        return $content . do_shortcode('[core127_grimoire]');
    }
    return $content;
}

require dirname(__DIR__) . '/site-wordpress/c127-grimoire/c127-grimoire.php';

// Simule le widget mémoire qui est ajouté plus tard que le tableau de bord.
add_filter('the_content', function ($html) {
    return $html . '<section id="c127-memoire"><p>Chargement de la mémoire privée…</p></section>';
}, 20);

$checks = 0;
function verify($condition, $message) {
    global $checks;
    $checks++;
    if (!$condition) { throw new RuntimeException($message); }
}
function same($actual, $expected, $message) { verify($actual === $expected, $message); }
function has($html, $needle) { return false !== strpos($html, $needle); }

$fixture = <<<'HTML'
<div><button id="c127-mic">Dicter le récit</button></div>
<a href="/wp-login.php?action=logout">Se déconnecter de Mon Grimoire</a>
<div id="c127-map"><div id="c127-map-body">Chargement de vos rêves…</div></div>
<script>document.querySelector('#c127-map-body'); fetch('/wp-json/cercle127/v1/dreams');</script>
<section><h1>Ancienne présentation du Grimoire</h1></section>
<section class="core127 core127-login">
  <h2>Votre Grimoire vous attend</h2>
  <p role="alert" class="core127-error">Message de validation de Core 127.</p>
  <form class="core127-auth-form" method="post" action="https://example.test/grimoire/">
    <input type="hidden" name="core127_login_nonce" value="nonce-formulaire-test">
    <input type="hidden" name="core127_auth_action" value="login">
    <label>Adresse e-mail ou identifiant <input name="core127_login" autocomplete="username"></label>
    <label>Mot de passe <input type="password" name="core127_password" autocomplete="current-password"></label>
    <button type="submit">Entrer dans mon Grimoire</button>
  </form>
</section>
HTML;

$guest = run_filter('the_content', $fixture);
verify(has($guest, 'c127g-entry-title'), 'L’entrée visiteur doit être affichée.');
verify(has($guest, 'Créer mon Grimoire gratuit'), 'La création de compte doit être visible.');
verify(has($guest, '/creer-un-compte/#creer-mon-compte'), 'La page de création du site doit être réutilisée.');
verify(has($guest, 'core127_login_nonce'), 'Le nonce du formulaire existant doit être conservé.');
verify(has($guest, 'nonce-formulaire-test'), 'Le nonce ne doit pas être régénéré ou perdu.');
verify(has($guest, 'core127_auth_action'), 'Le traitement de connexion Core 127 doit être conservé.');
verify(has($guest, 'autocomplete="current-password"'), 'Le champ de mot de passe doit être conservé.');
same(substr_count($guest, '<form'), 1, 'Une seule connexion doit être proposée.');
foreach (['c127-map', 'c127-mic', 'c127-memoire', 'action=logout', 'Chargement de vos rêves', 'fetch(', 'Ancienne présentation'] as $private) {
    verify(!has($guest, $private), 'Un bloc privé a survécu pour un visiteur : ' . $private);
}
if (class_exists('DOMDocument')) {
    verify(has($guest, 'Message de validation de Core 127.'), 'Le message de validation existant doit rester accessible.');
} else {
    $_SERVER['REQUEST_METHOD'] = 'POST';
    $_POST['core127_auth_action'] = 'login';
    verify(has(c127g_guest_content($fixture), 'role="alert"'), 'Le repli sans DOM doit signaler une connexion non finalisée.');
    unset($_POST['core127_auth_action']);
    $_SERVER['REQUEST_METHOD'] = 'GET';
}

$GLOBALS['c127g_test']['styles'] = $GLOBALS['c127g_test']['scripts'] = $GLOBALS['c127g_test']['localized'] = [];
run_action('wp_enqueue_scripts');
verify(isset($GLOBALS['c127g_test']['styles']['c127g']), 'L’entrée visiteur doit recevoir les styles.');
verify(!isset($GLOBALS['c127g_test']['scripts']['c127g']), 'Le script de données ne doit pas être chargé avant connexion.');
same($GLOBALS['c127g_test']['localized'], [], 'Aucune configuration privée ne doit être émise pour un visiteur.');
verify(in_array('c127g-guest', run_filter('body_class', []), true), 'La classe visiteur doit être distincte.');

$fallback = c127g_guest_content('<p>Le formulaire Core 127 est indisponible.</p>');
verify(has($fallback, 'wp-login.php?redirect_to='), 'Sans formulaire connu, la connexion WordPress doit rester accessible.');
verify(has($fallback, rawurlencode(home_url('/grimoire/'))), 'La connexion de repli doit revenir au Grimoire.');
verify(!has($fallback, '<form'), 'Le plugin ne doit pas créer un second gestionnaire de mot de passe.');

$GLOBALS['c127g_test']['signup'] = false;
verify(!has(c127g_guest_content($fixture), 'Créer mon Grimoire gratuit'), 'Ne pas proposer une inscription désactivée.');
$GLOBALS['c127g_test']['registration'] = true;
verify(has(c127g_guest_content($fixture), 'action=register'), 'L’inscription WordPress doit servir de repli si elle est autorisée.');
$GLOBALS['c127g_test']['signup'] = true;
$GLOBALS['c127g_test']['registration'] = false;

$GLOBALS['c127g_test']['logged'] = true;
same(c127g_guest_content($fixture), $fixture, 'La vue connectée ne doit pas être remplacée.');
$connected = run_filter('the_content', '<p>Contenu connecté de test.</p>');
verify(has($connected, 'id="c127g"'), 'Le tableau de bord connecté doit toujours être injecté.');
verify(has($connected, 'Contenu connecté de test.'), 'Le contenu connecté existant doit rester présent.');
verify(!has($connected, 'c127g-entry-title'), 'L’entrée visiteur ne doit pas apparaître après connexion.');
$GLOBALS['c127g_test']['scripts'] = $GLOBALS['c127g_test']['localized'] = [];
run_action('wp_enqueue_scripts');
verify(isset($GLOBALS['c127g_test']['scripts']['c127g']), 'Le tableau de bord connecté doit garder son script.');
verify(isset($GLOBALS['c127g_test']['localized']['c127g']['nonce']), 'La session connectée doit garder sa configuration REST.');
verify(in_array('c127g-on', run_filter('body_class', []), true), 'La classe du tableau de bord doit être conservée.');

$GLOBALS['c127g_test']['logged'] = false;
$GLOBALS['c127g_test']['main'] = false;
same(c127g_guest_content($fixture), $fixture, 'Le filtre doit rester limité au contenu principal.');
$GLOBALS['c127g_test']['main'] = true;
$GLOBALS['c127g_test']['page'] = 'oni-gardienne-des-reves';
same(c127g_guest_content($fixture), $fixture, 'Les autres pages doivent garder leur contenu.');
run_action('template_redirect');
same($GLOBALS['c127g_test']['nocache'], 0, 'Les autres pages ne doivent pas changer de politique de cache.');
$GLOBALS['c127g_test']['page'] = 'grimoire';
run_action('template_redirect');
same($GLOBALS['c127g_test']['nocache'], 1, 'Le Grimoire doit envoyer les en-têtes de non-cache.');
verify(defined('DONOTCACHEPAGE') && DONOTCACHEPAGE, 'Le Grimoire doit demander l’exclusion du cache de page.');


$GLOBALS['c127g_test']['logged'] = true;
$GLOBALS['c127g_test']['raw'] = '[core127_grimoire]';
add_filter('the_content', 'core127_surface_fallback', 18);
$rendered = do_shortcode($GLOBALS['c127g_test']['raw']);
same(substr_count(run_filter('the_content', $rendered), '<form'), 2, 'Le cas de régression doit reproduire la double injection avant protection.');
run_action('wp');
same(has_filter('the_content', 'core127_surface_fallback'), false, 'Le fallback connu doit être remplacé uniquement dans cette requête Grimoire.');
same(substr_count(run_filter('the_content', $rendered), '<form'), 1, 'Un shortcode déjà rendu doit garder un seul formulaire de rêve.');
$GLOBALS['c127g_test']['raw'] = 'Une introduction sans shortcode.';
same(substr_count(run_filter('the_content', '<p>Introduction</p>'), '<form'), 1, 'Le formulaire de secours doit rester disponible si la page n’en contient pas.');
same(substr_count(run_filter('the_content', $rendered), '<form'), 1, 'Un bloc déjà rendu ailleurs doit empêcher une seconde injection.');
$GLOBALS['c127g_test']['shortcode'] = false;
same(substr_count(run_filter('the_content', '<p>Introduction</p>'), '<form'), 0, 'Un shortcode indisponible ne doit pas être injecté.');
$GLOBALS['c127g_test']['shortcode'] = true;
remove_filter('the_content', 'c127g_surface_fallback', 18);
add_filter('the_content', 'core127_surface_fallback', 18);
$GLOBALS['c127g_test']['page'] = 'grand-labyrinthe';
run_action('wp');
same(has_filter('the_content', 'core127_surface_fallback'), 18, 'Le fallback des autres pages doit garder son branchement.');
$GLOBALS['c127g_test']['page'] = 'grimoire';

echo $checks . " vérifications de contrat réussies.\n";
