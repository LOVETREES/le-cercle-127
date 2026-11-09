<?php
/**
 * Plugin Name: Cercle 127 - Pont Framework 127 (Terra, Naïa, app)
 * Description: Relie l'application et la lecture détaillée de Terra à Framework 127. Publie palm.reading.completed et emotion.submitted dans l'Event Bus (en interne, sans jeton exposé), laisse la Conscience choisir la Sœur, et propose des souvenirs (memory_candidate_emitted, à valider) uniquement avec l'accord explicite de la personne. Effacement : retirer une lecture ou supprimer son compte efface ses souvenirs. Sans Framework 127 actif, l'extension ne fait rien.
 * Version: 1.0.2
 * Author: Le Cercle 127
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

final class C127_Pont_F127 {
    const VERSION = '1.0.2';
    const NS = 'c127-f127/v1';
    const DAILY_LIMIT = 3;

    public static function init(): void {
        add_action('c127_palm_detailed_saved', [__CLASS__, 'on_palm_saved'], 10, 3);
        add_action('c127_palm_detailed_deleted', [__CLASS__, 'on_palm_deleted'], 10, 2);
        add_action('delete_user', [__CLASS__, 'on_user_deleted'], 10, 1);
        add_action('rest_api_init', [__CLASS__, 'routes']);
    }

    /* ---------- Outils ---------- */

    public static function ready(): bool {
        return class_exists('F127_Observability') && is_callable(['F127_Observability', 'append_event']);
    }

    /** Identifiant pseudonyme stable : la mémoire F127 ne contient jamais l'identité. */
    public static function subject_ref(int $user_id): string {
        return 'u_' . substr(hash_hmac('sha256', (string) $user_id, wp_salt('auth')), 0, 24);
    }

    /** Publication interne, identique au bus : Observability puis f127_event_published. */
    public static function publish(array $event) {
        if (!self::ready()) {
            return false;
        }
        $event['timestamp'] = $event['timestamp'] ?? gmdate('c');
        $logged = F127_Observability::append_event($event);
        if (is_wp_error($logged)) {
            return false;
        }
        if (empty($logged['idempotent'])) {
            do_action('f127_event_published', $event, $logged);
        }
        return $logged;
    }

    /** Proposition de souvenir : reste « pending » jusqu'à validation humaine dans Framework 127. */
    private static function propose_memory(string $corr, string $agent, string $capability, array $candidate): void {
        self::publish([
            'event_id' => $corr . ':memory_candidate_emitted',
            'event_type' => 'memory_candidate_emitted',
            'correlation_id' => $corr,
            'agent' => $agent,
            'capability' => $capability,
            'status' => 'emitted',
            'memory_policy' => 'manual',
            'memory_origin' => 'c127_user_consent',
            'memory_candidates' => [array_merge([
                'source_id' => $corr,
                'origin' => 'c127_user_consent',
                'consent' => 'explicit',
            ], $candidate)],
            'payload_summary' => ['origin' => 'wordpress.c127_pont_f127', 'consent' => 'explicit'],
        ]);
    }

    /** Efface candidates et mémoires F127 d'une personne (et d'une corrélation précise si donnée). */
    private static function erase(string $subject_ref, string $corr = ''): int {
        global $wpdb;
        if (!class_exists('F127_Runtime')) {
            return 0;
        }
        $count = 0;
        foreach ([F127_Runtime::candidates_table(), F127_Runtime::memories_table()] as $table) {
            if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table)) !== $table) {
                continue;
            }
            $like = '%' . $wpdb->esc_like('"subject_ref":"' . $subject_ref . '"') . '%';
            if ($corr !== '') {
                $count += (int) $wpdb->query($wpdb->prepare("DELETE FROM {$table} WHERE correlation_id = %s AND metadata LIKE %s", $corr, $like));
            } else {
                $count += (int) $wpdb->query($wpdb->prepare("DELETE FROM {$table} WHERE metadata LIKE %s", $like));
            }
        }
        return $count;
    }

    /* ---------- 1. Terra : lecture détaillée de la main ---------- */

    public static function on_palm_saved(int $user_id, array $entry, bool $remember): void {
        if (!self::ready() || empty($entry['f127_correlation_id'])) {
            return;
        }
        $corr = (string) $entry['f127_correlation_id'];
        $ref = self::subject_ref($user_id);
        $obs = is_array($entry['observations'] ?? null) ? $entry['observations'] : [];
        $lines = [];
        foreach (['heart', 'head', 'life', 'fate', 'sun'] as $k) {
            $l = $obs['lines'][$k] ?? null;
            if (is_array($l)) {
                $lines[$k] = [
                    'present' => $l['present'] ?? null,
                    'length' => $l['length'] ?? '',
                    'depth' => $l['depth'] ?? '',
                    'shape' => $l['shape'] ?? '',
                ];
            }
        }

        // Trace d'exécution (aucun texte de lecture, aucune photo).
        self::publish([
            'event_id' => $corr . ':palm.reading.completed',
            'event_type' => 'palm.reading.completed',
            'correlation_id' => $corr,
            'agent' => 'terra',
            'capability' => 'hand.symbolic_reading',
            'status' => 'completed',
            'payload_summary' => [
                'origin' => 'wordpress.c127_palm',
                'actor' => $ref,
                'sensitivity' => 'personal',
                'reading_id' => (string) ($entry['id'] ?? ''),
                'photo_kept' => false,
                'memory_consent' => $remember,
            ],
            'result_summary' => [
                'hand' => (string) ($entry['hand'] ?? ''),
                'palm_shape' => (string) ($obs['palm_shape'] ?? ''),
                'element' => (string) ($obs['element'] ?? ''),
                'lines' => $lines,
                'changes' => $entry['changes'] ?? [],
                'confidence' => $entry['confidence'] ?? null,
            ],
        ]);

        if (!$remember) {
            return;
        }

        $parts = [];
        $names = ['heart' => 'cœur', 'head' => 'tête', 'life' => 'vie', 'fate' => 'destin', 'sun' => 'soleil'];
        foreach ($lines as $k => $l) {
            $parts[] = 'ligne de ' . $names[$k] . ' ' . (($l['present'] === false) ? 'absente' : trim(($l['length'] ?: '') . ' ' . ($l['depth'] ?: '')));
        }
        $summary = sprintf(
            'Lecture de la main du %s (%s) : paume %s, élément %s ; %s.',
            wp_date('j F Y', strtotime((string) ($entry['at'] ?? 'now'))),
            'main ' . ($entry['hand'] ?? 'inconnue'),
            $obs['palm_shape'] ?? '?',
            $obs['element'] ?? '?',
            implode(', ', $parts)
        );
        self::propose_memory($corr, 'terra', 'hand.symbolic_reading', [
            'type' => 'context_fact',
            'summary' => $summary,
            'confidence' => is_numeric($entry['confidence'] ?? null) ? (float) $entry['confidence'] : 0.6,
            'sensitivity' => 'medium',
            'subject_ref' => $ref,
            'reading_id' => (string) ($entry['id'] ?? ''),
            'retention' => 'until_user_deletes',
        ]);
    }

    public static function on_palm_deleted(int $user_id, array $entry): void {
        if (!empty($entry['f127_correlation_id'])) {
            self::erase(self::subject_ref($user_id), (string) $entry['f127_correlation_id']);
        }
    }

    public static function on_user_deleted($user_id): void {
        self::erase(self::subject_ref((int) $user_id));
    }

    /* ---------- 2. App : émotion du jour → Conscience → la Sœur juste ---------- */

    public static function routes(): void {
        register_rest_route(self::NS, '/emotion', [
            'methods' => 'POST',
            'callback' => [__CLASS__, 'rest_emotion'],
            'permission_callback' => '__return_true',
        ]);
        register_rest_route(self::NS, '/health', [
            'methods' => 'GET',
            'callback' => function () {
                return rest_ensure_response(['ok' => true, 'version' => self::VERSION, 'framework' => self::ready(), 'conscience' => class_exists('F127_Conscience')]);
            },
            'permission_callback' => '__return_true',
        ]);
    }

    /** Même authentification que l'application (jeton Bearer vérifié par /cercle127/v1/me), ou session du site. */
    private static function user_id(WP_REST_Request $request): int {
        $auth = (string) $request->get_header('authorization');
        if ($auth !== '' && stripos($auth, 'bearer ') === 0) {
            $me = new WP_REST_Request('GET', '/cercle127/v1/me');
            $me->set_header('authorization', $auth);
            $res = rest_do_request($me);
            if (!$res->is_error() && 200 === $res->get_status()) {
                $d = $res->get_data();
                return isset($d['id']) ? absint($d['id']) : 0;
            }
            return 0;
        }
        return get_current_user_id();
    }

    private const EMOTIONS = [
        'peur' => 'La peur', 'colere' => 'La colère', 'tristesse' => 'La tristesse',
        'culpabilite' => 'La culpabilité', 'confusion' => 'La confusion', 'soulagement' => 'Le soulagement',
    ];

    public static function rest_emotion(WP_REST_Request $request) {
        $user_id = self::user_id($request);
        if (!$user_id) {
            return new WP_Error('c127_f127_auth', 'Connexion requise.', ['status' => 401]);
        }
        $p = (array) $request->get_json_params();
        if (true !== ($p['consent'] ?? false)) {
            return new WP_Error('c127_f127_consent', 'Ton accord est nécessaire pour qu’une Sœur te réponde.', ['status' => 400]);
        }
        $key = sanitize_key((string) ($p['emotion'] ?? ''));
        if (!isset(self::EMOTIONS[$key])) {
            return new WP_Error('c127_f127_emotion', 'Émotion inconnue.', ['status' => 400]);
        }
        if (!self::ready() || !class_exists('F127_Conscience')) {
            return new WP_Error('c127_f127_unavailable', 'Les Sœurs se reposent un instant. Réessaie plus tard.', ['status' => 503]);
        }

        // Garde-fou de coût : quelques réponses par jour.
        $day_key = 'c127_f127_emo_' . $user_id . '_' . gmdate('Ymd');
        $used = (int) get_transient($day_key);
        if ($used >= self::DAILY_LIMIT) {
            return new WP_Error('c127_f127_limit', 'Les Sœurs t’ont déjà répondu plusieurs fois aujourd’hui. Reviens demain.', ['status' => 429]);
        }
        set_transient($day_key, $used + 1, DAY_IN_SECONDS);

        $ref = self::subject_ref($user_id);
        $corr = 'emo-' . wp_generate_uuid4();
        $recent = [];
        foreach ((array) ($p['recent'] ?? []) as $k => $n) {
            if (isset(self::EMOTIONS[sanitize_key($k)]) && is_numeric($n)) {
                $recent[sanitize_key($k)] = max(0, min(31, (int) $n));
            }
        }
        $lang = in_array($p['lang'] ?? 'fr', ['fr', 'en', 'es', 'it', 'de'], true) ? $p['lang'] : 'fr';

        // La Conscience choisit la Sœur : l'appelant ne l'impose jamais.
        $stimulus = [
            'event_type' => 'emotion.submitted',
            'correlation_id' => $corr,
            'language' => $lang,
            'payload' => [
                'emotion' => self::EMOTIONS[$key],
                'emotion_key' => $key,
                'recent_7_days' => $recent,
                'note' => mb_substr(sanitize_textarea_field((string) ($p['note'] ?? '')), 0, 600),
            ],
            'context' => ['source' => 'app.naia', 'actor' => $ref, 'sensitivity' => 'personal'],
            'constraints' => ['no_side_effects' => true, 'no_diagnosis' => true, 'max_support_sisters' => 2],
            'memory' => (object) [],
        ];
        // Le Framework n'enregistre pas le texte de la Sœur (confidentialité) : on le capte
        // au passage, en mémoire seulement, dans la réponse HTTP du Master Worker à NOTRE demande.
        $captured = null;
        $catch = function ($response, $args, $url) use ($corr, &$captured) {
            $headers = array_change_key_case(is_array($args['headers'] ?? null) ? $args['headers'] : [], CASE_LOWER);
            if ((string) ($headers['x-correlation-id'] ?? '') === $corr && !is_wp_error($response)) {
                $captured = (string) wp_remote_retrieve_body($response);
            }
            return $response;
        };
        add_filter('http_response', $catch, 10, 3);

        $req = new WP_REST_Request('POST', '/f127/v1/conscience/ingest');
        $req->set_header('content-type', 'application/json');
        $req->set_header('x-f127-token', F127_Observability::token());
        $req->set_body(wp_json_encode($stimulus));
        $res = rest_do_request($req);
        remove_filter('http_response', $catch, 10);
        $data = $res->get_data();
        $decision = is_array($data['decision'] ?? null) ? $data['decision']
            : (is_array($data['data']['details']['decision'] ?? null) ? $data['data']['details']['decision'] : []);

        // Réponse de la Sœur (enveloppe F127_WORKER_RESULT : data.outputs.response).
        $answer = '';
        $actions = [];
        $raw = is_string($captured) ? trim($captured) : '';
        // Le modèle entoure parfois le JSON de ```json … ``` : on l'enlève.
        $raw = preg_replace('/^```(?:json)?\s*|\s*```$/', '', $raw);
        $worker = $raw !== '' ? json_decode($raw, true) : null;
        if (!is_array($worker) && $raw !== '' && preg_match('/\{.*\}/s', $raw, $m)) {
            $worker = json_decode($m[0], true);
        }
        if (is_array($worker)) {
            $out = $worker['data']['outputs'] ?? $worker['outputs'] ?? [];
            if (is_array($out)) {
                $answer = (string) ($out['response'] ?? '');
                foreach ((array) ($out['suggested_actions'] ?? []) as $a) {
                    if (is_string($a) && trim($a) !== '') {
                        $actions[] = mb_substr(wp_strip_all_tags($a), 0, 300);
                    }
                }
            }
        }

        if (!empty($p['remember'])) {
            self::propose_memory($corr, (string) ($decision['agent'] ?? 'naia'), (string) ($decision['capability'] ?? 'emotion.identification'), [
                'type' => 'emotion_pattern',
                'summary' => sprintf('Émotion notée le %s : %s%s.', wp_date('j F Y'), mb_strtolower(self::EMOTIONS[$key]), !empty($recent[$key]) ? sprintf(' (%d fois sur 7 jours)', $recent[$key]) : ''),
                'confidence' => 0.9,
                'sensitivity' => 'medium',
                'subject_ref' => $ref,
                'retention' => 'until_user_deletes',
            ]);
        }

        return rest_ensure_response([
            'ok' => !$res->is_error(),
            'correlation_id' => $corr,
            'sister' => (string) ($decision['agent'] ?? ''),
            'capability' => (string) ($decision['capability'] ?? ''),
            'reason' => (string) ($decision['reason'] ?? ''),
            'answer' => mb_substr(wp_strip_all_tags($answer), 0, 2000),
            'suggestions' => array_slice($actions, 0, 3),
            'diagnostic' => [
                'worker_seen' => $captured !== null,
                'worker_bytes' => is_string($captured) ? strlen($captured) : 0,
                'worker_json' => is_array($worker),
                'worker_keys' => is_array($worker) ? array_slice(array_keys($worker), 0, 6) : [],
                'conscience_status' => $res->get_status(),
            ],
        ]);
    }
}

C127_Pont_F127::init();
