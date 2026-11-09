<?php
/**
 * Plugin Name: Cercle 127 - Lectures de la main (compte)
 * Description: Sauvegarde dans le compte de la personne les lectures de la main faites avec Terra, et propose la lecture détaillée de la main sur photo (analyse par Terra, photo jamais conservée, première lecture offerte) avec son évolution dans le temps. Authentification identique à l'application (jeton Bearer vérifié par /cercle127/v1/me). Désactiver l'extension n'efface aucune donnée.
 * Version: 1.2.0
 * Author: Le Cercle 127
 * License: GPL-2.0-or-later
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const C127_PALM_META = 'c127_palm_readings';
const C127_PALM_MAX  = 50;

add_action( 'rest_api_init', function () {
	register_rest_route( 'c127-palm/v1', '/readings', array(
		array( 'methods' => 'GET', 'callback' => 'c127_palm_list', 'permission_callback' => '__return_true' ),
		array( 'methods' => 'POST', 'callback' => 'c127_palm_add', 'permission_callback' => '__return_true' ),
	) );
	register_rest_route( 'c127-palm/v1', '/readings/(?P<id>[A-Za-z0-9_-]{1,64})', array(
		array( 'methods' => 'DELETE', 'callback' => 'c127_palm_delete', 'permission_callback' => '__return_true' ),
	) );
} );

/** Identifie la personne avec le même jeton que l'application, via l'API du Cercle. */
function c127_palm_user_id( WP_REST_Request $request ) {
	$auth = $request->get_header( 'authorization' );
	if ( ! $auth || stripos( $auth, 'bearer ' ) !== 0 ) {
		return 0;
	}
	$me = new WP_REST_Request( 'GET', '/cercle127/v1/me' );
	$me->set_header( 'authorization', $auth );
	$res = rest_do_request( $me );
	if ( $res->is_error() || 200 !== $res->get_status() ) {
		return 0;
	}
	$data = $res->get_data();
	return isset( $data['id'] ) ? absint( $data['id'] ) : 0;
}

function c127_palm_unauthorized() {
	return new WP_Error( 'c127_palm_auth', 'Connexion requise.', array( 'status' => 401 ) );
}

function c127_palm_get( $user_id ) {
	$list = get_user_meta( $user_id, C127_PALM_META, true );
	return is_array( $list ) ? array_values( $list ) : array();
}

function c127_palm_clean( $value, $max ) {
	return mb_substr( sanitize_textarea_field( is_string( $value ) ? $value : '' ), 0, $max );
}

function c127_palm_list( WP_REST_Request $request ) {
	$user_id = c127_palm_user_id( $request );
	if ( ! $user_id ) {
		return c127_palm_unauthorized();
	}
	return rest_ensure_response( array( 'items' => c127_palm_get( $user_id ) ) );
}

function c127_palm_add( WP_REST_Request $request ) {
	$user_id = c127_palm_user_id( $request );
	if ( ! $user_id ) {
		return c127_palm_unauthorized();
	}
	$p    = (array) $request->get_json_params();
	$word = c127_palm_clean( $p['word'] ?? '', 2000 );
	$id   = preg_replace( '/[^A-Za-z0-9_-]/', '', (string) ( $p['id'] ?? '' ) );
	if ( '' === $word || '' === $id ) {
		return new WP_Error( 'c127_palm_invalid', 'Lecture incomplète.', array( 'status' => 400 ) );
	}
	$at   = c127_palm_clean( $p['at'] ?? '', 40 );
	$item = array(
		'id'        => substr( $id, 0, 64 ),
		'at'        => $at ? $at : gmdate( 'c' ),
		'word'      => $word,
		'title'     => c127_palm_clean( $p['title'] ?? '', 200 ),
		'mudra'     => c127_palm_clean( $p['mudra'] ?? '', 120 ),
		'mudraCopy' => c127_palm_clean( $p['mudraCopy'] ?? '', 2000 ),
		'breath'    => c127_palm_clean( $p['breath'] ?? '', 2000 ),
		'mantra'    => c127_palm_clean( $p['mantra'] ?? '', 500 ),
		'question'  => c127_palm_clean( $p['question'] ?? '', 500 ),
		'summary'   => c127_palm_clean( $p['summary'] ?? '', 3000 ),
	);
	$list = c127_palm_get( $user_id );
	foreach ( $list as $existing ) {
		if ( $existing['id'] === $item['id'] || ( $existing['word'] === $item['word'] && $existing['mantra'] === $item['mantra'] && $existing['mudra'] === $item['mudra'] ) ) {
			return rest_ensure_response( array( 'ok' => true, 'duplicate' => true ) );
		}
	}
	array_unshift( $list, $item );
	update_user_meta( $user_id, C127_PALM_META, array_slice( $list, 0, C127_PALM_MAX ) );
	return rest_ensure_response( array( 'ok' => true ) );
}

function c127_palm_delete( WP_REST_Request $request ) {
	$user_id = c127_palm_user_id( $request );
	if ( ! $user_id ) {
		return c127_palm_unauthorized();
	}
	$id   = (string) $request['id'];
	$list = array_values( array_filter( c127_palm_get( $user_id ), function ( $x ) use ( $id ) {
		return $x['id'] !== $id;
	} ) );
	update_user_meta( $user_id, C127_PALM_META, $list );
	return rest_ensure_response( array( 'ok' => true ) );
}

// Suppression du compte : les lectures de la main partent avec lui (métadonnées utilisateur).


/* ------------------------------------------------------------------ */
/* Lecture détaillée de la main sur photo (Terra), version 1.1.0       */
/* La photo transite vers Make (scénario confidentiel) puis est        */
/* oubliée : seule la fiche d'observations et la lecture sont gardées. */
/* ------------------------------------------------------------------ */

const C127_PALM_DETAILED_META = 'c127_palm_detailed';
const C127_PALM_DETAILED_COUNT = 'c127_palm_detailed_count';
const C127_PALM_DETAILED_MAX = 36;
const C127_PALM_DETAILED_FREE = 1;
const C127_PALM_DETAILED_HOOK = 'https://hook.eu2.make.com/s40997qaroh07umtuv86oovvg3gmm2yz';
const C127_PALM_DETAILED_GAP = 20 * HOUR_IN_SECONDS;

add_action( 'rest_api_init', function () {
	register_rest_route( 'c127-palm/v1', '/detailed', array(
		array( 'methods' => 'GET', 'callback' => 'c127_palm_detailed_list', 'permission_callback' => '__return_true' ),
		array( 'methods' => 'POST', 'callback' => 'c127_palm_detailed_create', 'permission_callback' => '__return_true' ),
	) );
	register_rest_route( 'c127-palm/v1', '/detailed/(?P<id>[A-Za-z0-9_-]{1,64})', array(
		array( 'methods' => 'DELETE', 'callback' => 'c127_palm_detailed_delete', 'permission_callback' => '__return_true' ),
	) );
	// Make vérifie ici que la demande vient bien du site (ticket à usage unique, 5 minutes).
	register_rest_route( 'c127-palm/v1', '/ticket/(?P<t>[A-Za-z0-9]{32})', array(
		array( 'methods' => 'GET', 'callback' => 'c127_palm_ticket_check', 'permission_callback' => '__return_true' ),
	) );
} );

/** Application (jeton Bearer) ou site (session WordPress + nonce REST). */
function c127_palm_any_user( WP_REST_Request $request ) {
	$id = c127_palm_user_id( $request );
	return $id ? $id : get_current_user_id();
}

function c127_palm_detailed_items( $user_id ) {
	$list = get_user_meta( $user_id, C127_PALM_DETAILED_META, true );
	return is_array( $list ) ? array_values( $list ) : array();
}

function c127_palm_is_plus( $user_id ) {
	return '1' === (string) get_user_meta( $user_id, 'c127_plus', true ) || user_can( $user_id, 'manage_options' );
}

function c127_palm_quota( $user_id ) {
	$count = (int) get_user_meta( $user_id, C127_PALM_DETAILED_COUNT, true );
	$items = c127_palm_detailed_items( $user_id );
	$next  = 0;
	if ( $items && ! user_can( $user_id, 'manage_options' ) ) {
		$last = strtotime( $items[0]['at'] ?? '' );
		if ( $last && $last + C127_PALM_DETAILED_GAP > time() ) {
			$next = $last + C127_PALM_DETAILED_GAP;
		}
	}
	return array(
		'plus'      => c127_palm_is_plus( $user_id ),
		'free_left' => max( 0, C127_PALM_DETAILED_FREE - $count ),
		'next_at'   => $next ? gmdate( 'c', $next ) : null,
	);
}

function c127_palm_detailed_list( WP_REST_Request $request ) {
	$user_id = c127_palm_any_user( $request );
	if ( ! $user_id ) {
		return c127_palm_unauthorized();
	}
	return rest_ensure_response( array( 'items' => c127_palm_detailed_items( $user_id ), 'quota' => c127_palm_quota( $user_id ) ) );
}

function c127_palm_detailed_delete( WP_REST_Request $request ) {
	$user_id = c127_palm_any_user( $request );
	if ( ! $user_id ) {
		return c127_palm_unauthorized();
	}
	$id      = (string) $request['id'];
	$all     = c127_palm_detailed_items( $user_id );
	$removed = array_values( array_filter( $all, function ( $x ) use ( $id ) {
		return ( $x['id'] ?? '' ) === $id;
	} ) );
	$list    = array_values( array_filter( $all, function ( $x ) use ( $id ) {
		return ( $x['id'] ?? '' ) !== $id;
	} ) );
	update_user_meta( $user_id, C127_PALM_DETAILED_META, $list );
	foreach ( $removed as $entry ) {
		// Retirer une lecture efface aussi le souvenir proposé aux Sœurs.
		do_action( 'c127_palm_detailed_deleted', (int) $user_id, $entry );
	}
	return rest_ensure_response( array( 'ok' => true ) );
}

function c127_palm_ticket_check( WP_REST_Request $request ) {
	$key = 'c127_palm_ticket_' . $request['t'];
	$ok  = (bool) get_transient( $key );
	if ( $ok ) {
		delete_transient( $key );
	}
	return rest_ensure_response( array( 'valid' => $ok ) );
}

/** Nettoie récursivement la réponse de Terra (textes courts, aucune balise). */
function c127_palm_sanitize_tree( $value, $depth = 0 ) {
	if ( $depth > 6 ) {
		return null;
	}
	if ( is_array( $value ) ) {
		$out = array();
		foreach ( array_slice( $value, 0, 40, true ) as $k => $v ) {
			$out[ is_int( $k ) ? $k : sanitize_key( $k ) ] = c127_palm_sanitize_tree( $v, $depth + 1 );
		}
		return $out;
	}
	if ( is_bool( $value ) || is_int( $value ) || is_float( $value ) ) {
		return $value;
	}
	return mb_substr( sanitize_textarea_field( (string) $value ), 0, 2500 );
}

/** Changements nets entre deux fiches (lignes bien visibles sur les deux photos). */
function c127_palm_changes( $before, $after ) {
	$changes = array();
	if ( ! is_array( $before ) || ! is_array( $after ) ) {
		return $changes;
	}
	foreach ( array( 'heart', 'head', 'life', 'fate', 'sun' ) as $line ) {
		$a = $before['lines'][ $line ] ?? null;
		$b = $after['lines'][ $line ] ?? null;
		if ( ! is_array( $a ) || ! is_array( $b ) ) {
			continue;
		}
		if ( (float) ( $a['visibility'] ?? 0 ) < 0.5 || (float) ( $b['visibility'] ?? 0 ) < 0.5 ) {
			continue;
		}
		foreach ( array( 'present', 'length', 'depth', 'shape' ) as $field ) {
			$x = $a[ $field ] ?? '';
			$y = $b[ $field ] ?? '';
			if ( '' !== $x && '' !== $y && $x !== $y ) {
				$changes[] = array( 'line' => $line, 'field' => $field, 'from' => $x, 'to' => $y );
			}
		}
	}
	return $changes;
}

function c127_palm_detailed_create( WP_REST_Request $request ) {
	$user_id = c127_palm_any_user( $request );
	if ( ! $user_id ) {
		return c127_palm_unauthorized();
	}
	$p = (array) $request->get_json_params();
	if ( true !== ( $p['consent'] ?? false ) ) {
		return new WP_Error( 'c127_palm_consent', 'Ton accord est nécessaire pour que Terra lise la photo.', array( 'status' => 400 ) );
	}
	$quota = c127_palm_quota( $user_id );
	if ( ! $quota['plus'] && $quota['free_left'] < 1 ) {
		return new WP_Error( 'c127_palm_plus', 'Ta première lecture détaillée t’a été offerte. Les suivantes arrivent avec Le Cercle 127+.', array( 'status' => 402 ) );
	}
	if ( $quota['next_at'] ) {
		return new WP_Error( 'c127_palm_wait', 'Terra lit la main en profondeur une fois par jour au plus. Reviens après ' . wp_date( 'j F \à H\hi', strtotime( $quota['next_at'] ) ) . '.', array( 'status' => 429 ) );
	}
	$image = (string) ( $p['image'] ?? '' );
	if ( ! preg_match( '#^data:image/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$#', $image, $m ) || strlen( $m[2] ) > 6000000 ) {
		return new WP_Error( 'c127_palm_image', 'Photo illisible ou trop lourde.', array( 'status' => 400 ) );
	}
	$bin = base64_decode( $m[2], true );
	if ( ! $bin || ! @getimagesizefromstring( $bin ) ) {
		return new WP_Error( 'c127_palm_image', 'Photo illisible.', array( 'status' => 400 ) );
	}
	unset( $bin );

	$items    = c127_palm_detailed_items( $user_id );
	$previous = $items ? ( $items[0]['observations'] ?? null ) : null;
	$hand     = in_array( $p['hand'] ?? '', array( 'droite', 'gauche' ), true ) ? $p['hand'] : 'inconnue';
	$lang     = in_array( $p['lang'] ?? 'fr', array( 'fr', 'en', 'es', 'it', 'de' ), true ) ? $p['lang'] : 'fr';
	$metrics  = array();
	foreach ( (array) ( $p['metrics'] ?? array() ) as $k => $v ) {
		if ( is_numeric( $v ) ) {
			$metrics[ sanitize_key( $k ) ] = round( (float) $v, 3 );
		}
	}

	$ticket = wp_generate_password( 32, false, false );
	set_transient( 'c127_palm_ticket_' . $ticket, $user_id, 5 * MINUTE_IN_SECONDS );
	if ( function_exists( 'set_time_limit' ) ) {
		@set_time_limit( 200 );
	}
	$res = wp_remote_post( C127_PALM_DETAILED_HOOK, array(
		'timeout' => 170,
		'headers' => array( 'Content-Type' => 'application/json' ),
		'body'    => wp_json_encode( array(
			'ticket'   => $ticket,
			'image'    => $image,
			'hand'     => $hand,
			'lang'     => $lang,
			'metrics'  => wp_json_encode( $metrics ),
			'previous' => $previous ? wp_json_encode( $previous ) : 'aucune',
		) ),
	) );
	unset( $image, $p );
	delete_transient( 'c127_palm_ticket_' . $ticket );
	if ( is_wp_error( $res ) ) {
		return new WP_Error( 'c127_palm_busy', 'Terra n’a pas pu lire ta main pour le moment. Réessaie dans quelques minutes.', array( 'status' => 503 ) );
	}
	$data = json_decode( wp_remote_retrieve_body( $res ), true );
	if ( ! is_array( $data ) ) {
		return new WP_Error( 'c127_palm_busy', 'Terra n’a pas pu lire ta main pour le moment. Réessaie dans quelques minutes.', array( 'status' => 503 ) );
	}
	if ( empty( $data['quality']['ok'] ) ) {
		$issue = sanitize_text_field( (string) ( $data['quality']['issue'] ?? '' ) );
		return new WP_Error( 'c127_palm_photo', $issue ? $issue : 'Reprends la photo : paume ouverte, bien éclairée, toute la main dans le cadre.', array( 'status' => 422 ) );
	}
	if ( empty( $data['reading']['overview'] ) || ! is_array( $data['observations'] ?? null ) ) {
		return new WP_Error( 'c127_palm_busy', 'La lecture de Terra est incomplète. Réessaie dans quelques minutes.', array( 'status' => 503 ) );
	}

	$observations = c127_palm_sanitize_tree( $data['observations'] );
	$remember     = true === ( $request->get_json_params()['remember'] ?? false );
	$entry        = array(
		'id'           => 'pd-' . time() . '-' . wp_rand( 100, 999 ),
		'at'           => gmdate( 'c' ),
		'hand'         => $hand,
		'lang'         => $lang,
		'observations' => $observations,
		'reading'      => c127_palm_sanitize_tree( $data['reading'] ),
		'evolution'    => mb_substr( sanitize_textarea_field( (string) ( $data['evolution'] ?? '' ) ), 0, 2500 ),
		'changes'      => c127_palm_changes( $previous, $observations ),
		'confidence'   => max( 0, min( 1, (float) ( $data['confidence'] ?? 0 ) ) ),
		// Corrélation Framework 127 (trace et, avec accord, souvenir des Sœurs).
		'f127_correlation_id' => 'palm-' . wp_generate_uuid4(),
		'remember'     => $remember,
	);
	array_unshift( $items, $entry );
	update_user_meta( $user_id, C127_PALM_DETAILED_META, array_slice( $items, 0, C127_PALM_DETAILED_MAX ) );
	update_user_meta( $user_id, C127_PALM_DETAILED_COUNT, (int) get_user_meta( $user_id, C127_PALM_DETAILED_COUNT, true ) + 1 );
	do_action( 'c127_palm_detailed_saved', (int) $user_id, $entry, $remember );
	return rest_ensure_response( array( 'item' => $entry, 'quota' => c127_palm_quota( $user_id ) ) );
}
