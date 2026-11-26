<?php
/**
 * Plugin Name: Le Cercle 127 — Quiz d'Astria
 * Description: Un court voyage guidé par Astria (sept questions) qui trace « Ta carte du Cercle » : Soleil, Lune et ascendant, la Sœur que ton ciel met en avant, celle qui t'accompagne en ce moment et ta porte de naissance parmi les 127. Le calcul se fait dans le navigateur avec le même moteur que le Labyrinthe vivant : rien n'est envoyé ni enregistré sur le site. Shortcode : [c127_quiz_astria]. Désactiver l'extension retire le quiz.
 * Version: 1.0.1
 * Author: Le Cercle 127
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

const C127QA_VERSION = '1.0.1';

/** Le quiz s'appuie sur le moteur astronomique et les données (villes, 127 lames) du Labyrinthe vivant. */
function c127qa_engine_url(string $file): string {
    return plugins_url('c127-labyrinthe-vivant/' . $file);
}

add_action('wp_enqueue_scripts', function () {
    if (!is_singular()) { return; }
    $post = get_post();
    if (!$post || !has_shortcode((string) $post->post_content, 'c127_quiz_astria')) { return; }
    $base = plugin_dir_url(__FILE__);
    $engine_dir = WP_PLUGIN_DIR . '/c127-labyrinthe-vivant/';
    $deps = [];
    if (is_readable($engine_dir . 'astronomy.browser.min.js') && is_readable($engine_dir . 'lv-data.js')) {
        wp_enqueue_script('c127-astronomy-engine', c127qa_engine_url('astronomy.browser.min.js'), [], (string) filemtime($engine_dir . 'astronomy.browser.min.js'), true);
        wp_enqueue_script('c127-labyrinthe-data', c127qa_engine_url('lv-data.js'), [], (string) filemtime($engine_dir . 'lv-data.js'), true);
        $deps = ['c127-astronomy-engine', 'c127-labyrinthe-data'];
    }
    wp_enqueue_style('c127-quiz-astria', $base . 'quiz-astria.css', [], C127QA_VERSION);
    wp_enqueue_script('c127-quiz-astria', $base . 'quiz-astria.js', $deps, C127QA_VERSION, true);
    $signup = get_page_by_path('creer-un-compte');
    wp_localize_script('c127-quiz-astria', 'C127QA', [
        'img' => esc_url_raw($base . 'soeurs/'),
        'cards' => esc_url_raw(content_url('plugins/oracle-127-2.9.1-images/assets/images/edition-127/')),
        'loggedIn' => is_user_logged_in() ? 1 : 0,
        'grimoire' => esc_url_raw(home_url('/grimoire/')),
        'signup' => esc_url_raw($signup ? get_permalink($signup) . '#creer-mon-compte' : wp_registration_url()),
        'reve' => esc_url_raw(home_url('/lecture-de-reve/')),
        'labyrinthe' => esc_url_raw(home_url('/labyrinthe-du-grimoire/')),
        'soeurs' => [
            'Oni' => esc_url_raw(home_url('/oni-gardienne-des-reves/')),
            'Alka' => esc_url_raw(home_url('/alka-tisseuse-des-connexions/')),
            'Naïa' => esc_url_raw(home_url('/naia-gardienne-des-emotions/')),
            'Terra' => esc_url_raw(home_url('/terra-gardienne-de-lancrage/')),
            'Ignis' => esc_url_raw(home_url('/ignis-flamme-de-la-transformation/')),
            'Astria' => esc_url_raw(home_url('/astria-etoile-des-aspirations/')),
            'Irma' => esc_url_raw(home_url('/irma-gardienne-des-choix/')),
        ],
    ]);
}, 45);

add_shortcode('c127_quiz_astria', function () {
    $img = esc_url(plugin_dir_url(__FILE__) . 'soeurs/astria.webp');
    return '<div id="c127qa" class="c127qa" data-ready="0">'
        . '<div class="c127qa__fallback"><img src="' . $img . '" alt="" width="96" height="96">'
        . '<p>Astria prépare ta carte du Cercle… Si rien ne s’affiche, active JavaScript ou recharge la page.</p></div>'
        . '</div>';
});
