// Copyright 2017 Volker Sorge
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


/**
 * @fileoverview Basic message file for l10n.
 *
 * @author volker.sorge@gmail.com (Volker Sorge)
 */
goog.provide('sre.Messages');


// One (or more) flat message object per rule set.
/**
 * @type {Object.<string>}
 */
sre.Messages.MS = {
  START: '',
  FRAC_V: '',
  FRAC_B: '',
  FRAC_S: '',
  END: '',
  FRAC_OVER: '',
  TWICE: '',
  NEST_FRAC: '',
  ENDFRAC: '',
  SUPER: '',
  SUB: '',
  SUP: '',
  SUPERSCRIPT: '',
  SUBSCRIPT: '',
  BASELINE: '',
  BASE: '',
  NESTED: '',
  NEST_ROOT: '',
  STARTROOT: '',
  ENDROOT: '',
  ROOTINDEX: '',
  ROOT: '',
  INDEX: '',
  UNDER: '',
  UNDERSCRIPT: '',
  OVER: '',
  OVERSCRIPT: ''
};


/**
 * Parsing functions.
 * @type {Object.<function(*): *>}
 */
sre.Messages.MS_FUNC = {

  /**
   * Method to determine end of nesting depth for nested fraction.
   * @param {!Node} node A node.
   * @return {boolean} True if current element should not be considered for
   *     nesting depth.
   */
  FRAC_NEST_DEPTH: function(node) { return false; },

  /**
   * Translation for count word nesting description of radicals.
   * @param {number} count The counting parameter.
   * @return {string} The corresponding string.
   */
  RADICAL_NEST_DEPTH: function(count) { return ''; },

  /**
   * Generates a root ending message by combining the end message (postfix) with
   * the index. Example: Start Root Cubic ... End Root Cubic.
   * @param {string} postfix The postfix.
   * @param {string} index The index.
   * @return {string} The combined string, postfix plus index.
   */
  COMBINE_ROOT_INDEX: function(postfix, index) {return postfix;}

};


/**
 * Named root indices. E.g., square, cubic, etc.
 * @type {Object.<string>}
 */
sre.Messages.MS_ROOT_INDEX = { };


/**
 * Localised font names.
 * @type {Object.<sre.SemanticAttr.Font>}
 */
sre.Messages.FONT = {
  'bold': '',
  'bold-fraktur': '',
  'bold-italic': '',
  'bold-script': '',
  'caligraphic': '',
  'caligraphic-bold': '',
  'double-struck': '',
  'double-struck-italic': '',
  'fraktur': '',
  'italic': '',
  'monospace': '',
  'normal': '',
  'oldstyle': '',
  'oldstyle-bold': '',
  'script': '',
  'sans-serif': '',
  'sans-serif-italic': '',
  'sans-serif-bold': '',
  'sans-serif-bold-italic': '',
  'unknown': ''
};


/**
 * Localised role names.
 * @type {Object.<sre.SemanticAttr.Role>}
 */
sre.Messages.ROLE = {
  // Infixoperators
  'addition': '',
  'multiplication': '',
  'subtraction': '',
  'division': '',
  // Relations.
  'equality': '',
  'inequality': '',
  'element': '',
  'arrow': '',
  // Roles of matrices or vectors.
  'determinant': '',
  'rowvector': '',
  'binomial': '',
  'squarematrix': '',
  // Roles of rows, lines, cells.
  'multiline': '',
  'matrix': '',
  'vector': '',
  'cases': '',
  'table': '',
  // Unknown
  'unknown': ''
};


/**
 * Localised enclose roles.
 * @type {Object.<sre.SemanticAttr.Role>}
 */
sre.Messages.ENCLOSE = {
  'longdiv': '',
  'actuarial': '',
  'radical': '',
  'box': '',
  'roundedbox': '',
  'circle': '',
  'left': '',
  'right': '',
  'top': '',
  'bottom': '',
  'updiagonalstrike': '',
  'downdiagonalstrike': '',
  'verticalstrike': '',
  'horizontalstrike': '',
  'madruwb': '',
  'updiagonalarrow': '',
  'phasorangle': '',
  // Unknown
  'unknown': ''
};


/**
 * Navigation messages.
 * @type {Object.<string>}
 */
sre.Messages.NAVIGATE = {
  COLLAPSIBLE: '',
  EXPANDABLE: '',
  LEVEL: ''
};
