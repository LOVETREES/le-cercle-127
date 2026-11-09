<?php
/**
 * Plugin Name: Cercle 127 - Pont Framework 127 (Terra, Naïa, app)
 * Description: Relie l'application et la lecture détaillée de Terra à Framework 127. Publie palm.reading.completed et emotion.submitted dans l'Event Bus (en interne, sans jeton exposé), laisse la Conscience choisir la Sœur (Naïa, Alka pour les rêves récurrents, Terra pour l'ancrage), et propose des souvenirs (memory_candidate_emitted, à valider) uniquement avec l'accord explicite de la personne. Effacement : retirer une lecture ou supprimer son compte efface ses souvenirs. Sans Framework 127 actif, l'extension ne fait rien.
 * Version: 1.1.1
 * Author: Le Cercle 127
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

final class C127_Pont_F127 {
    const VERSION = '1.1.1';
    const NS = 'c127-f127/v1';
    const DAILY_LIMIT = 3;

    public static function init(): void {
        add_action('c127_palm_detailed_saved', [__CLASS__, 'on_palm_saved'], 10, 3);
        add_action('c127_palm_detailed_deleted', [__CLASS__, 'on_palm_deleted'], 10, 2);
        add_action('delete_user', [__CLASS__, 'on_user_deleted'], 10, 1);
        add_action('rest_api_init', [__CLASS__, 'routes']);
        add_filter('the_content', [__CLASS__, 'widget_content'], 20);
        add_shortcode('c127_soeur', [__CLASS__, 'shortcode']);
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

    /* ---------- 2. Demandes aux Sœurs : la Conscience choisit ---------- */

    public static function routes(): void {
        register_rest_route(self::NS, '/emotion', [
            'methods' => 'POST',
            'callback' => [__CLASS__, 'rest_emotion'],
            'permission_callback' => '__return_true',
        ]);
        register_rest_route(self::NS, '/ask', [
            'methods' => 'POST',
            'callback' => [__CLASS__, 'rest_ask'],
            'permission_callback' => '__return_true',
        ]);
        register_rest_route(self::NS, '/health', [
            'methods' => 'GET',
            'callback' => function () {
                return rest_ensure_response(['ok' => true, 'version' => self::VERSION, 'framework' => self::ready(), 'conscience' => class_exists('F127_Conscience'), 'asks' => array_keys(self::ASKS)]);
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

    /**
     * Liste blanche des demandes ouvertes au public. Chaque entrée fixe le type d'événement
     * envoyé à la Conscience (qui choisit elle-même la Sœur), la source et le quota du jour.
     */
    private const ASKS = [
        'alka-motifs' => ['event_type' => 'dream.recurring.submitted', 'source' => 'site.alka', 'limit' => 3, 'fallback' => ['alka', 'dream.pattern_analysis']],
        'terra-ancrage' => ['event_type' => 'grounding.requested', 'source' => 'site.terra', 'limit' => 5, 'fallback' => ['terra', 'grounding.exercise']],
    ];

    private const GROUNDING_CONTEXTS = [
        'cauchemar' => 'au réveil d’un cauchemar',
        'emotion' => 'submergé·e par une émotion',
        'stress' => 'stressé·e, la tête pleine',
        'dispersion' => 'dispersé·e, coupé·e de son corps',
    ];

    /** Contrôles communs : connexion, accord, Framework prêt, quota du jour. */
    private static function guard(WP_REST_Request $request, string $bucket, int $limit) {
        $user_id = self::user_id($request);
        if (!$user_id) {
            return new WP_Error('c127_f127_auth', 'Connexion requise.', ['status' => 401]);
        }
        $p = (array) $request->get_json_params();
        if (true !== ($p['consent'] ?? false)) {
            return new WP_Error('c127_f127_consent', 'Ton accord est nécessaire pour qu’une Sœur te réponde.', ['status' => 400]);
        }
        if (!self::ready() || !class_exists('F127_Conscience')) {
            return new WP_Error('c127_f127_unavailable', 'Les Sœurs se reposent un instant. Réessaie plus tard.', ['status' => 503]);
        }
        $day_key = 'c127_f127_' . $bucket . '_' . $user_id . '_' . gmdate('Ymd');
        $used = (int) get_transient($day_key);
        if ($used >= $limit) {
            return new WP_Error('c127_f127_limit', 'Les Sœurs t’ont déjà répondu plusieurs fois aujourd’hui. Reviens demain.', ['status' => 429]);
        }
        set_transient($day_key, $used + 1, DAY_IN_SECONDS);
        self::$last_quota = $day_key;
        return $user_id;
    }

    private static $last_quota = '';

    /** Une Sœur muette ne doit pas coûter une demande à la personne. */
    private static function refund(): void {
        if (self::$last_quota !== '') {
            $n = (int) get_transient(self::$last_quota);
            set_transient(self::$last_quota, max(0, $n - 1), DAY_IN_SECONDS);
        }
    }

    private static function lang(array $p): string {
        $lang = (string) ($p['lang'] ?? 'fr');
        return in_array($lang, ['fr', 'en', 'es', 'it', 'de'], true) ? $lang : 'fr';
    }

    private static function clean_list($items, int $max, int $len): array {
        $out = [];
        foreach ((array) $items as $it) {
            $it = trim(mb_substr(sanitize_text_field((string) $it), 0, $len));
            if ($it !== '' && !in_array(mb_strtolower($it), array_map('mb_strtolower', $out), true)) {
                $out[] = $it;
            }
            if (count($out) >= $max) {
                break;
            }
        }
        return $out;
    }

    /**
     * Envoie un stimulus à la Conscience et récupère la réponse de la Sœur.
     * Le Framework ne stocke pas le texte de la Sœur (confidentialité) : on le capte au passage,
     * en mémoire seulement, dans la réponse HTTP du Master Worker à NOTRE demande (x-correlation-id).
     */
    private static function ask_conscience(array $stimulus): array {
        $corr = (string) $stimulus['correlation_id'];
        $captured = null;
        $seen = [];
        $catch = function ($response, $args, $url) use ($corr, &$captured, &$seen) {
            $headers = array_change_key_case(is_array($args['headers'] ?? null) ? $args['headers'] : [], CASE_LOWER);
            if ((string) ($headers['x-correlation-id'] ?? '') === $corr && !is_wp_error($response)) {
                $body = (string) wp_remote_retrieve_body($response);
                $seen[] = strlen($body);
                // Plusieurs appels portent cet identifiant : on ne garde que le résultat du Worker.
                if ($captured === null || (strpos($body, '"outputs"') !== false && strpos((string) $captured, '"outputs"') === false)) {
                    $captured = $body;
                }
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

        $answer = '';
        $actions = [];
        $raw = is_string($captured) ? trim($captured) : '';
        $raw = preg_replace('/^```(?:json)?\s*|\s*```$/', '', $raw); // ```json … ``` éventuel
        $worker = $raw !== '' ? json_decode($raw, true) : null;
        if (!is_array($worker) && $raw !== '' && preg_match('/\{.*\}/s', $raw, $m)) {
            $worker = json_decode($m[0], true);
        }
        if (is_array($worker)) {
            $out = $worker['data']['outputs'] ?? $worker['outputs'] ?? [];
            if (is_array($out)) {
                $answer = (string) ($out['response'] ?? '');
                if (trim($answer) === '') { // certains rôles rédigent ailleurs (reading, analysis…)
                    foreach (['reading', 'analysis', 'interpretation', 'message', 'text', 'summary'] as $k) {
                        if (is_string($out[$k] ?? null) && trim($out[$k]) !== '') { $answer = $out[$k]; break; }
                    }
                }
                if (trim($answer) === '' && !empty($out['hypotheses'])) {
                    $answer = implode("\n\n", array_filter(array_map(function ($h) { return is_string($h) ? $h : (string) ($h['text'] ?? $h['hypothesis'] ?? ''); }, (array) $out['hypotheses'])));
                }
                foreach ((array) ($out['suggested_actions'] ?? []) as $a) {
                    if (is_string($a) && trim($a) !== '') {
                        $actions[] = mb_substr(wp_strip_all_tags($a), 0, 300);
                    }
                }
            }
        }
        return [
            'ok' => !$res->is_error() && $answer !== '',
            'decision' => $decision,
            'answer' => self::clip(wp_strip_all_tags($answer), 6000),
            'suggestions' => array_slice($actions, 0, 3),
            'diagnostic' => [
                'worker_seen' => $captured !== null,
                'worker_bytes' => is_string($captured) ? strlen($captured) : 0,
                'responses_seen' => $seen,
                'worker_json' => is_array($worker),
                'worker_keys' => is_array($worker) ? array_slice(array_keys((array) ($worker['data']['outputs'] ?? $worker['outputs'] ?? $worker)), 0, 10) : [],
                'worker_status' => is_array($worker) ? (string) ($worker['data']['status'] ?? '') : '',
                'conscience_status' => $res->get_status(),
            ],
        ];
    }

    /** Coupe un texte trop long à la fin d'une phrase, jamais au milieu d'un mot. */
    private static function clip(string $text, int $max): string {
        $text = trim($text);
        if (mb_strlen($text) <= $max) {
            return $text;
        }
        $cut = mb_substr($text, 0, $max);
        $end = max((int) mb_strrpos($cut, '. '), (int) mb_strrpos($cut, ".\n"), (int) mb_strrpos($cut, '! '), (int) mb_strrpos($cut, '? '));
        return $end > $max / 2 ? mb_substr($cut, 0, $end + 1) : rtrim(mb_substr($cut, 0, (int) mb_strrpos($cut, ' '))) . '…';
    }

    /** Réponse publique ; le diagnostic technique n'est montré qu'aux administrateurs. */
    private static function reply(string $corr, array $r, array $fallback = ['', '']) {
        if (!$r['ok']) {
            self::refund();
        }
        $out = [
            'ok' => $r['ok'],
            'correlation_id' => $corr,
            'sister' => (string) ($r['decision']['agent'] ?? $fallback[0]),
            'capability' => (string) ($r['decision']['capability'] ?? $fallback[1]),
            'reason' => (string) ($r['decision']['reason'] ?? ''),
            'answer' => $r['answer'],
            'suggestions' => $r['suggestions'],
        ];
        if (!$r['ok']) { // forme technique seulement (jamais de contenu), pour comprendre un échec
            $out['diagnostic'] = $r['diagnostic'];
        }
        return rest_ensure_response($out);
    }

    /* ---------- 2a. Émotion du jour (application, Naïa) ---------- */

    public static function rest_emotion(WP_REST_Request $request) {
        $p = (array) $request->get_json_params();
        $key = sanitize_key((string) ($p['emotion'] ?? ''));
        if (!isset(self::EMOTIONS[$key])) {
            return new WP_Error('c127_f127_emotion', 'Émotion inconnue.', ['status' => 400]);
        }
        $user_id = self::guard($request, 'emo', self::DAILY_LIMIT);
        if (is_wp_error($user_id)) {
            return $user_id;
        }
        $ref = self::subject_ref($user_id);
        $corr = 'emo-' . wp_generate_uuid4();
        $recent = [];
        foreach ((array) ($p['recent'] ?? []) as $k => $n) {
            if (isset(self::EMOTIONS[sanitize_key($k)]) && is_numeric($n)) {
                $recent[sanitize_key($k)] = max(0, min(31, (int) $n));
            }
        }
        $r = self::ask_conscience([
            'event_type' => 'emotion.submitted',
            'correlation_id' => $corr,
            'language' => self::lang($p),
            'payload' => [
                'emotion' => self::EMOTIONS[$key],
                'emotion_key' => $key,
                'recent_7_days' => $recent,
                'note' => mb_substr(sanitize_textarea_field((string) ($p['note'] ?? '')), 0, 600),
            ],
            'context' => ['source' => 'app.naia', 'actor' => $ref, 'sensitivity' => 'personal'],
            'constraints' => ['no_side_effects' => true, 'no_diagnosis' => true, 'max_support_sisters' => 2],
            'memory' => (object) [],
        ]);
        if (!empty($p['remember'])) {
            self::propose_memory($corr, (string) ($r['decision']['agent'] ?? 'naia'), (string) ($r['decision']['capability'] ?? 'emotion.identification'), [
                'type' => 'emotion_pattern',
                'summary' => sprintf('Émotion notée le %s : %s%s.', wp_date('j F Y'), mb_strtolower(self::EMOTIONS[$key]), !empty($recent[$key]) ? sprintf(' (%d fois sur 7 jours)', $recent[$key]) : ''),
                'confidence' => 0.9,
                'sensitivity' => 'medium',
                'subject_ref' => $ref,
                'retention' => 'until_user_deletes',
            ]);
        }
        return self::reply($corr, $r, ['naia', 'emotion.identification']);
    }

    /* ---------- 2b. Demandes en liste blanche (Alka, Terra…) ---------- */

    public static function rest_ask(WP_REST_Request $request) {
        $p = (array) $request->get_json_params();
        $kind = sanitize_key((string) ($p['kind'] ?? ''));
        if (!isset(self::ASKS[$kind])) {
            return new WP_Error('c127_f127_kind', 'Demande inconnue.', ['status' => 400]);
        }
        $cfg = self::ASKS[$kind];

        // Validation propre à chaque demande, avant de consommer le quota.
        if ('alka-motifs' === $kind) {
            $motifs = self::clean_list($p['motifs'] ?? [], 6, 60);
            if (!$motifs) {
                return new WP_Error('c127_f127_input', 'Indique au moins un élément qui revient dans tes rêves.', ['status' => 400]);
            }
            $freq = in_array($p['frequency'] ?? '', ['parfois', 'souvent', 'chaque_semaine', 'depuis_longtemps'], true) ? $p['frequency'] : 'souvent';
            $payload = [
                'recurring_motifs' => $motifs,
                'frequency' => $freq,
                'dream_excerpt' => mb_substr(sanitize_textarea_field((string) ($p['excerpt'] ?? '')), 0, 1200),
                'feeling' => mb_substr(sanitize_text_field((string) ($p['feeling'] ?? '')), 0, 120),
                'request' => 'Relier ces motifs récurrents entre eux et à la vie éveillée, sans imposer de vérité.',
            ];
        } else { // terra-ancrage
            $ctx = sanitize_key((string) ($p['context'] ?? ''));
            if (!isset(self::GROUNDING_CONTEXTS[$ctx])) {
                return new WP_Error('c127_f127_input', 'Choisis ce que tu traverses.', ['status' => 400]);
            }
            $payload = [
                'situation' => self::GROUNDING_CONTEXTS[$ctx],
                'situation_key' => $ctx,
                'intensity' => max(1, min(5, (int) ($p['intensity'] ?? 3))),
                'minutes' => in_array((int) ($p['minutes'] ?? 3), [1, 3, 5], true) ? (int) $p['minutes'] : 3,
                'note' => mb_substr(sanitize_textarea_field((string) ($p['note'] ?? '')), 0, 400),
                'request' => 'Un exercice d’ancrage corporel simple, guidé pas à pas, réalisable maintenant.',
            ];
        }

        $user_id = self::guard($request, $kind, (int) $cfg['limit']);
        if (is_wp_error($user_id)) {
            return $user_id;
        }
        $ref = self::subject_ref($user_id);
        $corr = strtok($kind, '-') . '-' . wp_generate_uuid4();
        $r = self::ask_conscience([
            'event_type' => $cfg['event_type'],
            'correlation_id' => $corr,
            'language' => self::lang($p),
            'payload' => $payload,
            'context' => ['source' => $cfg['source'], 'actor' => $ref, 'sensitivity' => 'personal'],
            'constraints' => ['no_side_effects' => true, 'no_diagnosis' => true, 'max_support_sisters' => 2],
            'memory' => (object) [],
        ]);

        if (!empty($p['remember']) && 'alka-motifs' === $kind) {
            self::propose_memory($corr, (string) ($r['decision']['agent'] ?? 'alka'), (string) ($r['decision']['capability'] ?? 'dream.pattern_analysis'), [
                'type' => 'dream_pattern',
                'summary' => sprintf('Motifs récurrents notés le %s : %s.', wp_date('j F Y'), implode(', ', $payload['recurring_motifs'])),
                'confidence' => 0.85,
                'sensitivity' => 'medium',
                'subject_ref' => $ref,
                'retention' => 'until_user_deletes',
            ]);
        }
        return self::reply($corr, $r, $cfg['fallback']);
    }

    /* ---------- 3. Widgets du site (pages Alka et Terra) ---------- */

    const WIDGET_PAGES = [874 => 'alka-motifs', 878 => 'terra-ancrage'];

    public static function widget_content(string $content): string {
        if (!is_page() || !in_the_loop() || !is_main_query()) {
            return $content;
        }
        $kind = self::WIDGET_PAGES[get_the_ID()] ?? '';
        return $kind ? $content . self::widget_html($kind) : $content;
    }

    public static function shortcode($atts): string {
        $kind = sanitize_key((string) (shortcode_atts(['type' => ''], (array) $atts)['type']));
        return isset(self::ASKS[$kind]) ? self::widget_html($kind) : '';
    }

    private static function widget_html(string $kind): string {
        $base = plugin_dir_url(__FILE__);
        wp_enqueue_style('c127-soeurs-ask', $base . 'soeurs-ask.css', [], self::VERSION);
        wp_enqueue_script('c127-soeurs-ask', $base . 'soeurs-ask.js', [], self::VERSION, true);
        wp_localize_script('c127-soeurs-ask', 'C127Ask', [
            'rest' => esc_url_raw(rest_url(self::NS . '/ask')),
            'nonce' => wp_create_nonce('wp_rest'),
            'loggedIn' => is_user_logged_in(),
            'login' => esc_url_raw(wp_login_url(get_permalink())),
        ]);
        ob_start();
        if ('alka-motifs' === $kind) { ?>
<section class="c127ask c127ask--alka" data-c127-ask="alka-motifs" style="--ask-accent:#c8a6f0">
  <p class="c127ask__eyebrow">Alka · Tisseuse des connexions</p>
  <h2 class="c127ask__title">Ce qui revient dans tes rêves</h2>
  <p class="c127ask__lead">Un lieu, une personne, un animal, une sensation qui reviennent ? Alka cherche le fil qui les relie, et ce qu’il dit peut-être de ta vie éveillée.</p>
  <form class="c127ask__form" novalidate>
    <label class="c127ask__label" for="c127ask-motifs">Les éléments qui reviennent <small>(séparés par des virgules)</small></label>
    <input class="c127ask__input" id="c127ask-motifs" name="motifs" type="text" maxlength="300" placeholder="ex. l’eau, une maison inconnue, être en retard" required>
    <fieldset class="c127ask__chips"><legend class="c127ask__label">Depuis quand ?</legend>
      <label><input type="radio" name="frequency" value="parfois"> De temps en temps</label>
      <label><input type="radio" name="frequency" value="souvent" checked> Souvent</label>
      <label><input type="radio" name="frequency" value="chaque_semaine"> Chaque semaine</label>
      <label><input type="radio" name="frequency" value="depuis_longtemps"> Depuis des années</label>
    </fieldset>
    <label class="c127ask__label" for="c127ask-excerpt">Un rêve où ils apparaissent <small>(facultatif)</small></label>
    <textarea class="c127ask__input" id="c127ask-excerpt" name="excerpt" rows="3" maxlength="1200" placeholder="Quelques lignes suffisent…"></textarea>
    <?php self::consent_fields(true); ?>
    <button class="c127ask__send" type="submit">Demander à la Sœur la plus juste</button>
  </form>
  <div class="c127ask__out" aria-live="polite"></div>
</section>
<script>/* Dans l'application, ces demandes passeront par le compte de l'app (version 1.1) : on masque ici. */(function(s){if(window.ReactNativeWebView&&s){s.hidden=true;s.style.display='none';}})(document.currentScript&&document.currentScript.previousElementSibling);</script>
<?php } else { ?>
<section class="c127ask c127ask--terra" data-c127-ask="terra-ancrage" style="--ask-accent:#9fcf8f">
  <p class="c127ask__eyebrow">Terra · Gardienne de l’ancrage</p>
  <h2 class="c127ask__title">Revenir dans ton corps, maintenant</h2>
  <p class="c127ask__lead">Dis ce que tu traverses : la Sœur la plus juste te guide pas à pas dans un exercice d’ancrage court.</p>
  <form class="c127ask__form" novalidate>
    <fieldset class="c127ask__chips"><legend class="c127ask__label">En ce moment, je suis…</legend>
      <label><input type="radio" name="context" value="cauchemar"> Au réveil d’un cauchemar</label>
      <label><input type="radio" name="context" value="emotion"> Submergé·e par une émotion</label>
      <label><input type="radio" name="context" value="stress" checked> Stressé·e, la tête pleine</label>
      <label><input type="radio" name="context" value="dispersion"> Dispersé·e, ailleurs</label>
    </fieldset>
    <label class="c127ask__label" for="c127ask-intensity">Intensité : <output data-intensity-out>3</output> / 5</label>
    <input class="c127ask__range" id="c127ask-intensity" name="intensity" type="range" min="1" max="5" value="3">
    <fieldset class="c127ask__chips"><legend class="c127ask__label">J’ai…</legend>
      <label><input type="radio" name="minutes" value="1"> 1 minute</label>
      <label><input type="radio" name="minutes" value="3" checked> 3 minutes</label>
      <label><input type="radio" name="minutes" value="5"> 5 minutes</label>
    </fieldset>
    <?php self::consent_fields(false); ?>
    <button class="c127ask__send" type="submit">Recevoir mon exercice d’ancrage</button>
  </form>
  <div class="c127ask__out" aria-live="polite"></div>
  <p class="c127ask__notice">Un exercice de bien-être, pas un soin. En cas de détresse, appelle le 3114 (gratuit, 24 h/24).</p>
</section>
<script>/* Dans l'application, ces demandes passeront par le compte de l'app (version 1.1) : on masque ici. */(function(s){if(window.ReactNativeWebView&&s){s.hidden=true;s.style.display='none';}})(document.currentScript&&document.currentScript.previousElementSibling);</script>
<?php }
        return (string) ob_get_clean();
    }

    private static function consent_fields(bool $memory): void { ?>
    <label class="c127ask__check"><input type="checkbox" name="consent" required> J’accepte que ma demande soit transmise à une Sœur (IA) pour me répondre. Rien n’est conservé sans mon accord.</label>
    <?php if ($memory) { ?><label class="c127ask__check"><input type="checkbox" name="remember"> Proposer de garder ces motifs en mémoire (je pourrai les effacer).</label><?php } ?>
<?php }
}

C127_Pont_F127::init();
