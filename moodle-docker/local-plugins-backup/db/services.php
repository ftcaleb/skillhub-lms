<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Web service function declarations for local_skillhubcert.
 *
 * @package    local_skillhubcert
 * @copyright  2026 SkillHub
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$functions = [
    'local_skillhubcert_list_issues' => [
        'classname'   => 'local_skillhubcert\external\list_issues',
        'methodname'  => 'execute',
        'description' => 'List issued customcert certificates for a user, optionally including base64 PDF content.',
        'type'        => 'read',
        'ajax'        => false,
    ],
    'local_skillhubcert_issue_certificate' => [
        'classname'   => 'local_skillhubcert\external\issue_certificate',
        'methodname'  => 'execute',
        'description' => 'Issue a customcert certificate to a user.',
        'type'        => 'write',
        'ajax'        => false,
    ],
];
