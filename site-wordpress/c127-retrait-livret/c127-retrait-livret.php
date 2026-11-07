<?php
/**
 * Plugin Name: Cercle 127 - Retrait du Livret des rêves récurrents
 * Description: Retire du Salon d'Oni l'encadré « Le Livret des Rêves Récurrents » (le livret n'est plus vendu). Le contenu de la page n'est pas modifié : désactiver l'extension fait réapparaître l'encadré.
 * Version: 1.0.0
 * Author: Le Cercle 127
 * License: GPL-2.0-or-later
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_filter( 'the_content', 'c127_retrait_livret', 20 );

function c127_retrait_livret( $content ) {
	if ( false === strpos( $content, 'os-book-wrap' ) ) {
		return $content;
	}
	return preg_replace( '#<section class="os-book-wrap"[^>]*>.*?</section>#s', '', $content );
}
