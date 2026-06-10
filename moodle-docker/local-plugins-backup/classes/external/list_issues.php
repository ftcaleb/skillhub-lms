<?php
// This file is part of Moodle - http://moodle.org/

/**
 * External function to list issued customcert certificates for a user.
 *
 * @package    local_skillhubcert
 * @copyright  2026 SkillHub
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_skillhubcert\external;

defined('MOODLE_INTERNAL') || die();

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;
use context_system;

/**
 * Lists certificate issues for a user, optionally with base64-encoded PDF content.
 */
class list_issues extends external_api {

    /**
     * Parameter definition.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'The user whose certificate issues to list'),
            'includepdf' => new external_value(PARAM_INT, 'If 1, include base64 PDF content for each issue',
                VALUE_DEFAULT, 0),
        ]);
    }

    /**
     * List the certificate issues for a user.
     *
     * @param int $userid The user id.
     * @param int $includepdf Whether to include base64 PDF content.
     * @return array
     */
    public static function execute(int $userid, int $includepdf = 0): array {
        global $DB, $USER, $CFG;

        $params = self::validate_parameters(self::execute_parameters(), [
            'userid' => $userid,
            'includepdf' => $includepdf,
        ]);

        $context = context_system::instance();
        self::validate_context($context);

        // Only allow users to view their own issues unless they can view other users' details.
        if ((int)$USER->id !== (int)$params['userid']) {
            require_capability('moodle/user:viewdetails', $context);
        }

        $user = \core_user::get_user($params['userid'], '*', MUST_EXIST);

        $sql = "SELECT i.id, i.userid, i.customcertid, i.code, i.timecreated,
                       c.name AS certname, c.templateid
                  FROM {customcert_issues} i
                  JOIN {customcert} c ON c.id = i.customcertid
                 WHERE i.userid = :userid
              ORDER BY i.timecreated DESC";
        $records = $DB->get_records_sql($sql, ['userid' => $params['userid']]);

        $issues = [];
        foreach ($records as $record) {
            $templaterecord = false;
            if (!empty($record->templateid)) {
                $templaterecord = $DB->get_record('customcert_templates', ['id' => $record->templateid]);
            }

            $pdfname = null;
            $pdfcontent = null;
            $haspdf = false;

            if (!empty($params['includepdf']) && $templaterecord) {
                try {
                    $template = new \mod_customcert\template($templaterecord);
                    $filecontents = $template->generate_pdf(false, $params['userid'], true);
                    if (!empty($filecontents)) {
                        $pdfcontent = base64_encode($filecontents);
                        $pdfname = clean_filename($record->certname . '.pdf');
                        $haspdf = true;
                    }
                } catch (\Throwable $e) {
                    // PDF generation failed for this issue; return the issue without PDF
                    // rather than failing the whole request.
                    debugging('local_skillhubcert: PDF generation failed for issue ' . $record->id .
                        ': ' . $e->getMessage(), DEBUG_DEVELOPER);
                }
            }

            $issues[] = [
                'issue' => [
                    'id' => (int)$record->id,
                    'customcertid' => (int)$record->customcertid,
                    'code' => (string)$record->code,
                    'timecreated' => (int)$record->timecreated,
                ],
                'user' => [
                    'id' => (int)$user->id,
                    'fullname' => fullname($user),
                ],
                'template' => [
                    'id' => $templaterecord ? (int)$templaterecord->id : 0,
                    'name' => $templaterecord ? (string)$templaterecord->name : (string)$record->certname,
                ],
                'pdf' => [
                    'name' => $pdfname,
                    'content' => $pdfcontent,
                    'haspdf' => $haspdf,
                ],
            ];
        }

        return ['issues' => $issues];
    }

    /**
     * Return definition.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'issues' => new external_multiple_structure(
                new external_single_structure([
                    'issue' => new external_single_structure([
                        'id' => new external_value(PARAM_INT, 'Issue id'),
                        'customcertid' => new external_value(PARAM_INT, 'Customcert instance id'),
                        'code' => new external_value(PARAM_ALPHANUM, 'Verification code'),
                        'timecreated' => new external_value(PARAM_INT, 'Time the certificate was issued'),
                    ]),
                    'user' => new external_single_structure([
                        'id' => new external_value(PARAM_INT, 'User id'),
                        'fullname' => new external_value(PARAM_NOTAGS, 'User full name'),
                    ]),
                    'template' => new external_single_structure([
                        'id' => new external_value(PARAM_INT, 'Template id (0 if none)'),
                        'name' => new external_value(PARAM_TEXT, 'Template or certificate name'),
                    ]),
                    'pdf' => new external_single_structure([
                        'name' => new external_value(PARAM_FILE, 'PDF filename', VALUE_OPTIONAL, null, NULL_ALLOWED),
                        'content' => new external_value(PARAM_RAW, 'Base64-encoded PDF content', VALUE_OPTIONAL, null, NULL_ALLOWED),
                        'haspdf' => new external_value(PARAM_BOOL, 'Whether PDF content is included'),
                    ]),
                ])
            ),
        ]);
    }
}
