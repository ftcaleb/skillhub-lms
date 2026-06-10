<?php
// This file is part of Moodle - http://moodle.org/

/**
 * External function to issue a customcert certificate to a user.
 *
 * @package    local_skillhubcert
 * @copyright  2026 SkillHub
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_skillhubcert\external;

defined('MOODLE_INTERNAL') || die();

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;
use context_system;

/**
 * Issues a certificate (creates a customcert issue record) for a user.
 */
class issue_certificate extends external_api {

    /**
     * Parameter definition.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'customcertid' => new external_value(PARAM_INT, 'The customcert instance id'),
            'userid' => new external_value(PARAM_INT, 'The user to issue the certificate to'),
        ]);
    }

    /**
     * Issue the certificate.
     *
     * @param int $customcertid The customcert instance id.
     * @param int $userid The user id.
     * @return array
     */
    public static function execute(int $customcertid, int $userid): array {
        global $DB;

        $params = self::validate_parameters(self::execute_parameters(), [
            'customcertid' => $customcertid,
            'userid' => $userid,
        ]);

        $context = context_system::instance();
        self::validate_context($context);
        require_capability('moodle/user:viewdetails', $context);

        // Validate the customcert instance and user exist.
        $DB->get_record('customcert', ['id' => $params['customcertid']], 'id', MUST_EXIST);
        \core_user::get_user($params['userid'], 'id', MUST_EXIST);

        // If already issued, return the existing issue instead of duplicating.
        $existing = $DB->get_record('customcert_issues', [
            'customcertid' => $params['customcertid'],
            'userid' => $params['userid'],
        ]);
        if ($existing) {
            return [
                'issueid' => (int)$existing->id,
                'code' => (string)$existing->code,
                'alreadyissued' => true,
            ];
        }

        // Prefer the plugin's own API if available.
        if (method_exists('\mod_customcert\certificate', 'issue_certificate')) {
            $issueid = \mod_customcert\certificate::issue_certificate($params['customcertid'], $params['userid']);
        } else {
            $issue = new \stdClass();
            $issue->customcertid = $params['customcertid'];
            $issue->userid = $params['userid'];
            $issue->code = \mod_customcert\certificate::generate_code();
            $issue->emailed = 0;
            $issue->timecreated = time();
            $issueid = $DB->insert_record('customcert_issues', $issue);
        }

        $issue = $DB->get_record('customcert_issues', ['id' => $issueid], '*', MUST_EXIST);

        return [
            'issueid' => (int)$issue->id,
            'code' => (string)$issue->code,
            'alreadyissued' => false,
        ];
    }

    /**
     * Return definition.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'issueid' => new external_value(PARAM_INT, 'The issue record id'),
            'code' => new external_value(PARAM_ALPHANUM, 'The certificate verification code'),
            'alreadyissued' => new external_value(PARAM_BOOL, 'True if the certificate was already issued'),
        ]);
    }
}
