<?php
/**
 * Plugin Name: Cercle 127 - Lectures de la main (compte)
 * Description: Sauvegarde dans le compte de la personne les lectures de la main faites avec Terra dans l'application. Authentification identique à l'application (jeton Bearer vérifié par /cercle127/v1/me). Désactiver l'extension n'efface aucune donnée.
 * Version: 1.0.0
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
