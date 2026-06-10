<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Version details for local_skillhubcert.
 *
 * Provides external web service functions for listing and issuing
 * mod_customcert certificates, used by the SkillHub LMS frontend.
 *
 * @package    local_skillhubcert
 * @copyright  2026 SkillHub
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$plugin->component = 'local_skillhubcert';
$plugin->version   = 2026061000;
$plugin->requires  = 2023042400; // Moodle 4.2.
$plugin->maturity  = MATURITY_STABLE;
$plugin->release   = '1.0.0';
