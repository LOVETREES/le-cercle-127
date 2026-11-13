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
    if (!is_page('grimoire')) { return; }
    $base = plugin_dir_url(__FILE__); $dir = plugin_dir_path(__FILE__);
    wp_enqueue_style('c127g-fonts', 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600&family=Cormorant+Garamond:ital,wght@0,500;1,500&family=Manrope:wght@400;500;600;700;800&display=swap', [], null);
    wp_enqueue_style('c127g', $base . 'grimoire.css', [], (string) filemtime($dir . 'grimoire.css'));
    if (!is_user_logged_in()) { return; }
    $u = wp_get_current_user();
    wp_enqueue_script('c127g', $base . 'grimoire.js', [], (string) filemtime($dir . 'grimoire.js'), true);
    wp_localize_script('c127g', 'C127Grim', [
        'dreams' => esc_url_raw(rest_url('cercle127/v1/dreams')),
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

add_filter('body_class', function ($c) {
    if (is_page('grimoire')) { $c[] = is_user_logged_in() ? 'c127g-on' : 'c127g-guest'; }
    return $c;
});

// L'emplacement du tableau de bord, en tête du contenu de la page.
add_filter('the_content', function ($html) {
    if (!c127g_on() || !in_the_loop() || !is_main_query()) { return $html; }
    return '<div id="c127g" class="c127g wp-exclude-emoji"><p class="c127g-loading">Ton Grimoire s’ouvre…</p></div>' . $html;
}, 5);


/**
 * Le Grimoire dépend de la session, y compris son formulaire de connexion.
 * Un cache de page déjà présent doit être purgé une fois lors de la mise à jour.
 */
function c127g_private_headers() {
    if (!is_page('grimoire')) { return; }
    if (!defined('DONOTCACHEPAGE')) { define('DONOTCACHEPAGE', true); }
    nocache_headers();
}
add_action('template_redirect', 'c127g_private_headers', 0);

/**
 * Conserve le formulaire Core 127 déjà rendu, avec ses nonces et ses messages.
 * Aucun nouveau traitement de mot de passe n'est ajouté par ce plugin.
 */
function c127g_login_fragment($html) {
    if (class_exists('DOMDocument') && class_exists('DOMXPath')) {
        $previous = libxml_use_internal_errors(true);
        try {
            $dom = new DOMDocument('1.0', 'UTF-8');
            $dom->loadHTML('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' . $html . '</body></html>', LIBXML_NONET);
            $xpath = new DOMXPath($dom);
            $forms = $xpath->query('//form[contains(concat(" ", normalize-space(@class), " "), " core127-auth-form ")]');
            if ($forms && $forms->length) {
                $form = $forms->item(0);
                for ($node = $form->parentNode; $node instanceof DOMElement && 'body' !== strtolower($node->tagName); $node = $node->parentNode) {
                    if (preg_match('/(?:^|\s)core127-login(?:\s|$)/', $node->getAttribute('class'))) {
                        return (string) $dom->saveHTML($node);
                    }
                }
                return (string) $dom->saveHTML($form);
            }
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }
    }

    // Repli sans extension DOM : le formulaire HTML n'est pas imbriqué.
    $pattern = <<<'REGEX'
~<form\b(?=[^>]*\bclass\s*=\s*(["'])(?:[^"']*\s)?core127-auth-form(?:\s[^"']*)?\1)[^>]*>.*?</form\s*>~is
REGEX;
    if (preg_match($pattern, $html, $match)) {
        $notice = '';
        if ('POST' === ($_SERVER['REQUEST_METHOD'] ?? '') && isset($_POST['core127_auth_action'])) {
            $notice = '<p role="alert">La connexion n’a pas abouti. Réessayez ou réinitialisez votre mot de passe.</p>';
        }
        return '<section class="core127 core127-login"><h2>Me connecter</h2>' . $notice . $match[0] . '</section>';
    }
    return '';
}

/**
 * Remplace uniquement la vue visiteur du contenu principal.
 * Après les shortcodes et les ajouts de widgets, les contrôles privés et leurs
 * emplacements disparaissent : leurs scripts s'arrêtent avant toute requête.
 */
function c127g_guest_content($html) {
    if (!is_page('grimoire') || is_user_logged_in() || !in_the_loop() || !is_main_query()) { return $html; }

    $redirect = get_permalink();
    $login = c127g_login_fragment($html);
    $registration = '';
    $signup = get_page_by_path('creer-un-compte');
    if ($signup && 'publish' === get_post_status($signup)) {
        $registration = get_permalink($signup) . '#creer-mon-compte';
    } elseif (get_option('users_can_register')) {
        $registration = wp_registration_url();
    }
    if (!$login) {
        $login = '<section class="core127 core127-login"><h2>Me connecter</h2><p>Connectez-vous pour retrouver vos rêves.</p><a class="c127g-btn" href="' . esc_url(wp_login_url($redirect)) . '">Me connecter à mon Grimoire</a></section>';
    }

    ob_start(); ?>
<div id="c127g-entry" class="c127g c127g-entry">
  <section class="c127g-entry__intro" aria-labelledby="c127g-entry-title">
    <p class="c127g-entry__eyebrow">Votre histoire, au fil des nuits</p>
    <h1 id="c127g-entry-title">Mon Grimoire</h1>
    <p>Un espace personnel pour conserver vos rêves, retrouver ce qui revient et poursuivre votre chemin dans le Cercle.</p>
    <div class="c127g-entry__actions">
      <?php if ($registration) : ?><a class="c127g-btn" href="<?php echo esc_url($registration); ?>">Créer mon Grimoire gratuit</a><?php endif; ?>
      <a class="c127g-entry__link" href="#c127g-entry-login">J’ai déjà un compte</a>
    </div>
  </section>
  <div id="c127g-entry-login" class="c127g-entry__login">
    <?php echo $login; // Formulaire déjà produit par Core 127 ; aucun contenu utilisateur ajouté ici. ?>
    <p class="c127g-entry__help"><a href="<?php echo esc_url(wp_lostpassword_url($redirect)); ?>">Mot de passe oublié ?</a></p>
  </div>
</div>
<?php
    return (string) ob_get_clean();
}
add_filter('the_content', 'c127g_guest_content', PHP_INT_MAX);


/**
 * Core 127 peut ajouter son shortcode de secours à la priorité 18, après que
 * WordPress a déjà rendu les shortcodes. On vérifie donc la source brute ET le
 * rendu existant, au lieu de chercher un shortcode dans du HTML déjà produit.
 */
function c127g_has_grimoire_surface($html) {
    $pattern = <<<'REGEX'
~<(?:section|div|form)\b[^>]*\bclass\s*=\s*(["'])(?:[^"']*\s)?(?:core127-grimoire|core127-auth-form)(?:\s[^"']*)?\1~is
REGEX;
    return 1 === preg_match($pattern, $html);
}

function c127g_surface_fallback($html) {
    if (!is_page('grimoire') || !in_the_loop() || !is_main_query() || !shortcode_exists('core127_grimoire')) {
        return $html;
    }
    $source = (string) get_post_field('post_content', get_queried_object_id(), 'raw');
    if (has_shortcode($source, 'core127_grimoire') || c127g_has_grimoire_surface($html)) {
        return $html;
    }
    return $html . do_shortcode('[core127_grimoire]');
}

function c127g_guard_surface_fallback() {
    if (!is_page('grimoire')) { return; }
    $priority = has_filter('the_content', 'core127_surface_fallback');
    if (false === $priority) { return; }
    remove_filter('the_content', 'core127_surface_fallback', $priority);
    add_filter('the_content', 'c127g_surface_fallback', $priority);
}
add_action('wp', 'c127g_guard_surface_fallback', 20);
