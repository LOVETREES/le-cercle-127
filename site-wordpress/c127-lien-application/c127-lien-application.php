<?php
/**
 * Plugin Name: Cercle 127 - Lien vers l'application
 * Description: Ajoute un bloc « L'application Le Cercle 127 » sur l'accueil (Android + iPhone) et un lien « Application » dans le pied de page de toutes les pages. Présentation seule : aucune donnée, URL ou page modifiée. Désactiver l'extension annule tout.
 * Version: 1.2.0
 * Author: Le Cercle 127
 * License: GPL-2.0-or-later
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Passer à true dès que l'application est publiée sur l'App Store (après l'accord d'Apple).
if ( ! defined( 'C127_IOS_LIVE' ) ) {
	define( 'C127_IOS_LIVE', false );
}
// Lien public TestFlight (version de test iPhone), à remplir en attendant l'App Store.
if ( ! defined( 'C127_IOS_TESTFLIGHT_URL' ) ) {
	define( 'C127_IOS_TESTFLIGHT_URL', '' );
}
if ( ! defined( 'C127_IOS_APP_URL' ) ) {
	define( 'C127_IOS_APP_URL', 'https://apps.apple.com/fr/app/le-cercle-127/id6831616780' );
}

add_action( 'wp_footer', 'c127_lien_application_render', 50 );

function c127_lien_application_render() {
	if ( is_admin() || is_page( 'application' ) ) {
		return;
	}
	$page     = home_url( '/application/' );
	$config   = array(
		'page'     => $page,
		'android'  => $page,
		'ios'      => C127_IOS_LIVE ? C127_IOS_APP_URL : ( C127_IOS_TESTFLIGHT_URL ? C127_IOS_TESTFLIGHT_URL : $page . '#iphone' ),
		'iosLive'  => (bool) C127_IOS_LIVE,
		'iosBeta'  => ! C127_IOS_LIVE && (bool) C127_IOS_TESTFLIGHT_URL,
		'onFront'  => is_front_page(),
	);
	?>
<style id="c127-lien-application-css">
.c127-appcard{margin:22px auto;max-width:1100px;width:calc(100% - 32px);padding:18px 20px;border:1px solid rgba(223,194,125,.38);border-radius:20px;background:radial-gradient(circle at 12% 20%,rgba(167,152,238,.16),transparent 55%),linear-gradient(160deg,#11172b,#080b17);box-shadow:0 18px 50px rgba(0,0,0,.3);color:#d6d9e4}
.c127-appcard__top{display:flex;align-items:center;gap:16px;text-decoration:none!important;color:inherit}
.c127-appcard__icon{flex:0 0 52px;height:52px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(135deg,#f2dea8,#dfc27d);color:#23182d;font-size:26px;line-height:1}
.c127-appcard__text{flex:1;min-width:0}
.c127-appcard__kicker{display:block;font:700 .66rem/1.4 "Manrope",system-ui,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#dfc27d}
.c127-appcard__title{display:block;font-family:"Cormorant Garamond",Georgia,serif;font-size:1.35rem;line-height:1.2;color:#f2eadc;margin:2px 0}
.c127-appcard__sub{display:block;font:400 .82rem/1.4 "Manrope",system-ui,sans-serif;color:#aab2c6}
.c127-appcard__btns{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}
.c127-appcard__btn{flex:1 1 200px;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 16px;border-radius:999px;font:700 .74rem/1.2 "Manrope",system-ui,sans-serif;letter-spacing:.05em;text-transform:uppercase;text-decoration:none!important;white-space:nowrap}
.c127-appcard__btn--gold{background:linear-gradient(135deg,#f2dea8,#dfc27d);color:#23182d!important}
.c127-appcard__btn--line{border:1px solid rgba(223,194,125,.55);color:#f2dea8!important;background:rgba(255,255,255,.03)}
.c127-appcard__btn small{font-weight:500;text-transform:none;letter-spacing:0;opacity:.8}
.c127-appcard--inline{width:auto;margin:14px 0}
</style>
<script id="c127-lien-application-js">
(function () {
	var cfg = <?php echo wp_json_encode( $config ); ?>;
	var ua = navigator.userAgent || '';
	var isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

	function footerLink() {
		var nav = document.querySelector('.foot-trust');
		if (!nav || nav.querySelector('[data-c127-applink]')) return;
		var a = document.createElement('a');
		a.href = cfg.page;
		a.setAttribute('data-c127-applink', '');
		a.textContent = 'Application';
		nav.insertBefore(a, nav.firstChild);
	}

	function button(href, label, sub, gold) {
		return '<a class="c127-appcard__btn ' + (gold ? 'c127-appcard__btn--gold' : 'c127-appcard__btn--line') + '" href="' + href + '">' +
			label + (sub ? ' <small>' + sub + '</small>' : '') + '</a>';
	}

	function frontCard() {
		if (!cfg.onFront || document.querySelector('.c127-appcard')) return;
		var ios = cfg.iosLive
			? button(cfg.ios, 'Télécharger sur l’App Store', '', isIOS)
			: cfg.iosBeta
				? button(cfg.ios, 'Installer sur iPhone', 'version test TestFlight', isIOS)
				: button(cfg.ios, 'iPhone', 'bientôt sur l’App Store', isIOS);
		var android = button(cfg.android, 'Télécharger pour Android', '', !isIOS);
		var card = document.createElement('div');
		card.className = 'c127-appcard';
		card.innerHTML =
			'<a class="c127-appcard__top" href="' + cfg.page + '">' +
				'<span class="c127-appcard__icon" aria-hidden="true">☾</span>' +
				'<span class="c127-appcard__text">' +
					'<span class="c127-appcard__kicker">Nouveau · Gratuit</span>' +
					'<span class="c127-appcard__title">L’application Le Cercle 127</span>' +
					'<span class="c127-appcard__sub">Notez vos rêves au réveil, même hors connexion.</span>' +
				'</span>' +
			'</a>' +
			'<div class="c127-appcard__btns">' + (isIOS ? ios + android : android + ios) + '</div>';
		// Version mobile : sous les trois vignettes. Version ordinateur : avant la lettre ou le pied de page.
		var tile = document.querySelector('.m1-tile');
		var tiles = tile && tile.parentNode;
		if (tiles && tiles.offsetParent !== null && tiles.parentNode) {
			card.className += ' c127-appcard--inline';
			tiles.parentNode.insertBefore(card, tiles.nextSibling);
			return;
		}
		var list = document.querySelectorAll('.news-sec, .m1-news, footer.site-footer');
		for (var i = 0; i < list.length; i++) {
			if (list[i].offsetParent !== null || list[i].tagName === 'FOOTER') {
				list[i].parentNode.insertBefore(card, list[i]);
				return;
			}
		}
	}

	function run() { footerLink(); frontCard(); }
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
</script>
	<?php
}
