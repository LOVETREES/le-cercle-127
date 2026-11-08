<?php
/**
 * Plugin Name: Cercle 127 - Recherche du dictionnaire (pertinence)
 * Description: Améliore le classement de la recherche du Dictionnaire des symboles : singulier et pluriel équivalents (dent / dents), fiche principale en premier, mots qui commencent par la recherche avant les mots qui la contiennent (« dent » ne remonte plus « accident »). Remplace seulement la fonction de score dans la page ; désactiver l'extension revient à l'état précédent.
 * Version: 1.0.0
 * Author: Le Cercle 127
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_filter( 'the_content', function ( $content ) {
	if ( ! is_page( 'symboles-oniriques' ) || false === strpos( $content, 'function score(it,q){' ) ) {
		return $content;
	}
	$score = <<<'JS'
function score(it,q){
    var t=norm(it.title), al=norm(it.aliases), nq=norm(q), words=nq.split(/\s+/).filter(Boolean);
    if(!words.length)return 0;
    var core=function(s){return s.replace(/^(le|la|les|l|un|une|des|du|de|d)\s+/,'');};
    var stem=function(w){return w.length>3?w.replace(/(s|x)$/,''):w;};
    var wordHit=function(w){return new RegExp('(^|[^a-z0-9])'+reEsc(stem(w))+'(s|x)?([^a-z0-9]|$)').test(t);};
    var startHit=function(w){return new RegExp('(^|[^a-z0-9])'+reEsc(w)).test(t);};
    if(t===nq||core(t)===core(nq)||stem(core(t))===stem(core(nq)))return 100;
    if(words.every(wordHit))return t.indexOf(nq)===0?80:70;
    if(words.every(startHit))return 55;
    if(words.every(function(w){return al.indexOf(w)!==-1;}))return 40;
    if(words.every(function(w){return t.indexOf(w)!==-1;}))return 20;
    return 0;
  }
JS;
	$new = preg_replace( '/function score\(it,q\)\{.*?\n  \}\n(?=\s*function render)/s', $score . "\n", $content, 1, $count );
	return ( $count && is_string( $new ) ) ? $new : $content;
}, 20 );

// Le hub des symboles est gardé en cache une heure : on le vide pour que la correction s'applique tout de suite.
register_activation_hook( __FILE__, function () {
	if ( function_exists( 'wp_cache_flush' ) ) {
		wp_cache_flush();
	}
	$page = get_page_by_path( 'symboles-oniriques' );
	if ( $page ) {
		clean_post_cache( $page->ID );
		do_action( 'jetpack_boost_clear_page_cache' );
	}
} );
