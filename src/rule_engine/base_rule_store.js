// Copyright 2013 Google Inc.
// Copyright 2014 Volker Sorge
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
 * @fileoverview Abstract base class for all speech rule stores.
 *
 * The base rule store implements some basic functionality that is common to
 * most speech rule stores.
 * @author sorge@google.com (Volker Sorge)
 */

goog.provide('sre.BaseRuleStore');

goog.require('sre.AuditoryDescription');
goog.require('sre.BaseUtil');
goog.require('sre.Debugger');
goog.require('sre.DomUtil');
goog.require('sre.DynamicCstr');
goog.require('sre.Engine');
goog.require('sre.SpeechRule');
goog.require('sre.SpeechRuleEvaluator');
goog.require('sre.SpeechRuleFunctions');
goog.require('sre.SpeechRuleStore');
goog.require('sre.Trie');
goog.require('sre.XpathUtil');



/**
 * @constructor
 * @implements {sre.SpeechRuleEvaluator}
 * @implements {sre.SpeechRuleStore}
 */
sre.BaseRuleStore = function() {
  /**
   * Set of custom query functions for the store.
   * @type {sre.SpeechRuleFunctions.CustomQueries}
   */
  this.customQueries = new sre.SpeechRuleFunctions.CustomQueries();

  /**
   * Set of custom strings for the store.
   * @type {sre.SpeechRuleFunctions.CustomStrings}
   */
  this.customStrings = new sre.SpeechRuleFunctions.CustomStrings();

  /**
   * Set of context functions for the store.
   * @type {sre.SpeechRuleFunctions.ContextFunctions}
   */
  this.contextFunctions = new sre.SpeechRuleFunctions.ContextFunctions();

  /**
   * Set of speech rules in the store.
   * @type {!Array.<sre.SpeechRule>}
   * @private
   */
  this.speechRules_ = [];

  /**
   * Trie for indexing speech rules in this store.
   * @type {sre.Trie}
   */
  this.trie = new sre.Trie(this);

  /**
   * A priority list of dynamic constraint attributes.
   * @type {!sre.DynamicCstr.Order}
   */
  this.parseOrder = sre.DynamicCstr.DEFAULT_ORDER;

  /**
   * A dynamic constraint parser.
   * @type {!sre.DynamicCstr.Parser}
   */
  this.parser = new sre.DynamicCstr.Parser(this.parseOrder);

  /**
   * Default locale.
   * @type {string}
   */
  this.locale = sre.DynamicCstr.DEFAULT_VALUES[sre.DynamicCstr.Axis.LOCALE];

  /**
   * @type {boolean}
   */
  this.initialized = false;

};


/**
 * @override
 */
sre.BaseRuleStore.prototype.lookupRule = function(node, dynamic) {
  if (!node ||
      (node.nodeType != sre.DomUtil.NodeType.ELEMENT_NODE &&
       node.nodeType != sre.DomUtil.NodeType.TEXT_NODE)) {
    return null;
  }
  var matchingRules = this.trie.lookupRules(node, dynamic.allProperties());
  return (matchingRules.length > 0) ?
      this.pickMostConstraint_(dynamic, matchingRules) : null;
};


/**
 * @override
 */
sre.BaseRuleStore.prototype.defineRule = function(
    name, dynamic, action, prec, cstr) {
  var rule;
  try {
    var postc = sre.SpeechRule.Action.fromString(action);
    var cstrList = Array.prototype.slice.call(arguments, 4);
    var fullPrec = new sre.SpeechRule.Precondition(prec, cstrList);
    var dynamicCstr = this.parseCstr(dynamic);
    rule = new sre.SpeechRule(name, dynamicCstr, fullPrec, postc);
  } catch (err) {
    if (err.name == 'RuleError') {
      console.error('Rule Error ', prec, '(' + dynamic + '):', err.message);
      return null;
    }
    else {
      throw err;
    }
  }
  this.addRule(rule);
  return rule;
};


/**
 * @override
 */
sre.BaseRuleStore.prototype.addRule = function(rule) {
  this.trie.addRule(rule);
  this.speechRules_.unshift(rule);
};


/**
 * @override
 */
sre.BaseRuleStore.prototype.deleteRule = function(rule) {
  var index = this.speechRules_.indexOf(rule);
  if (index != -1) {
    this.speechRules_.splice(index, 1);
  }
};


/**
 * @override
 */
sre.BaseRuleStore.prototype.findRule = function(pred) {
  for (var i = 0, rule; rule = this.speechRules_[i]; i++) {
    if (pred(rule)) {
      return rule;
    }
  }
  return null;
};


/**
 * @override
 */
sre.BaseRuleStore.prototype.findAllRules = function(pred) {
  return this.speechRules_.filter(pred);
};


/**
 * @override
 */
sre.BaseRuleStore.prototype.evaluateDefault = function(node) {
  return [sre.AuditoryDescription.create({'text': node.textContent})];
};


/**
 * Test the applicability of a speech rule in debugging mode.
 * @param {sre.SpeechRule} rule Rule to debug.
 * @param {!Node} node DOM node to test applicability of given rule.
 */
sre.BaseRuleStore.prototype.debugSpeechRule = function(rule, node) {
  var prec = rule.precondition;
  var queryResult = this.applyQuery(node, prec.query);
  sre.Debugger.getInstance().output(
      prec.query, queryResult ? queryResult.toString() : queryResult);
  prec.constraints.forEach(
      goog.bind(function(cstr) {
        sre.Debugger.getInstance().output(
            cstr, this.applyConstraint(node, cstr));},
      this));
};


/**
 * Function to initialize the store with speech rules. It is called by the
 * speech rule engine upon parametrization with this store. The function allows
 * us to define sets of rules in separate files while depending on functionality
 * that is defined in the rule store.
 * Essentially it is a way of getting around dependencies.
 */
sre.BaseRuleStore.prototype.initialize = goog.abstractMethod;


/**
 * Removes duplicates of the given rule from the rule store. Thereby duplicates
 * are identified by having the same precondition and dynamic constraint.
 * @param {sre.SpeechRule} rule The rule.
 */
sre.BaseRuleStore.prototype.removeDuplicates = function(rule) {
  for (var i = this.speechRules_.length - 1, oldRule;
       oldRule = this.speechRules_[i]; i--) {
    if (oldRule != rule &&
        rule.dynamicCstr.equal(oldRule.dynamicCstr) &&
        sre.BaseRuleStore.comparePreconditions_(oldRule, rule)) {
      this.speechRules_.splice(i, 1);
    }
  }
};


/**
 * Checks if we have a custom query and applies it. Otherwise returns null.
 * @param {!Node} node The initial node.
 * @param {string} funcName A function name.
 * @return {Array.<Node>} The list of resulting nodes.
 */
sre.BaseRuleStore.prototype.applyCustomQuery = function(
    node, funcName) {
  var func = this.customQueries.lookup(funcName);
  return func ? func(node) : null;
};


/**
 * Applies either an Xpath selector or a custom query to the node
 * and returns the resulting node list.
 * @param {!Node} node The initial node.
 * @param {string} expr An Xpath expression string or a name of a custom
 *     query.
 * @return {Array.<Node>} The list of resulting nodes.
 */
sre.BaseRuleStore.prototype.applySelector = function(node, expr) {
  var result = this.applyCustomQuery(node, expr);
  return result || sre.XpathUtil.evalXPath(expr, node);
};


/**
 * Applies either an Xpath selector or a custom query to the node
 * and returns the first result.
 * @param {!Node} node The initial node.
 * @param {string} expr An Xpath expression string or a name of a custom
 *     query.
 * @return {Node} The resulting node.
 */
sre.BaseRuleStore.prototype.applyQuery = function(node, expr) {
  var results = this.applySelector(node, expr);
  if (results.length > 0) {
    return results[0];
  }
  return null;
};


/**
 * Applies either an Xpath selector or a custom query to the node and returns
 * true if the application yields a non-empty result.
 * @param {!Node} node The initial node.
 * @param {string} expr An Xpath expression string or a name of a custom
 *     query.
 * @return {boolean} True if application was successful.
 */
sre.BaseRuleStore.prototype.applyConstraint = function(node, expr) {
  var result = this.applyQuery(node, expr);
  return !!result || sre.XpathUtil.evaluateBoolean(expr, node);
};


/**
 * Picks the result of the most constraint rule by prefering those:
 * 1) that best match the dynamic constraints.
 * 2) with the most additional constraints.
 * @param {sre.DynamicCstr} dynamic Dynamic constraints.
 * @param {!Array.<sre.SpeechRule>} rules An array of rules.
 * @return {sre.SpeechRule} The most constraint rule.
 * @private
 */
sre.BaseRuleStore.prototype.pickMostConstraint_ = function(dynamic, rules) {
  var comparator = sre.Engine.getInstance().comparator;
  rules.sort(
      function(r1, r2) {
        return comparator.compare(r1.dynamicCstr, r2.dynamicCstr) ||
            // When same number of dynamic constraint attributes matches for
            // both rules, compare length of static constraints.
            (r2.precondition.constraints.length -
             r1.precondition.constraints.length);}
  );
  sre.Debugger.getInstance().generateOutput(
      goog.bind(function() {
        return rules.map(function(x) {
          return x.name + '(' + x.dynamicCstr.toString() + ')';});
      }, this)
  );
  return rules[0];
};


// TODO (sorge) Define the following methods directly on the precondition
//     classes.
/**
 * Compares two static constraints (i.e., lists of precondition constraints) and
 * returns true if they are equal.
 * @param {Array.<string>} cstr1 First static constraints.
 * @param {Array.<string>} cstr2 Second static constraints.
 * @return {boolean} True if the static constraints are equal.
 * @private
 */
sre.BaseRuleStore.compareStaticConstraints_ = function(
    cstr1, cstr2) {
  if (cstr1.length != cstr2.length) {
    return false;
  }
  for (var i = 0, cstr; cstr = cstr1[i]; i++) {
    if (cstr2.indexOf(cstr) == -1) {
      return false;
    }
  }
  return true;
};


/**
 * Compares the preconditions of two speech rules.
 * @param {sre.SpeechRule} rule1 The first speech rule.
 * @param {sre.SpeechRule} rule2 The second speech rule.
 * @return {boolean} True if the preconditions are equal.
 * @private
 */
sre.BaseRuleStore.comparePreconditions_ = function(rule1, rule2) {
  var prec1 = rule1.precondition;
  var prec2 = rule2.precondition;
  if (prec1.query != prec2.query) {
    return false;
  }
  return sre.BaseRuleStore.compareStaticConstraints_(
      prec1.constraints, prec2.constraints);
};


/**
 * @return {!Array.<sre.SpeechRule>} Set of all speech rules in the store.
 */
sre.BaseRuleStore.prototype.getSpeechRules = function() {
  return this.speechRules_;
};


/**
 * Sets the speech rule set of the store.
 * @param {!Array.<sre.SpeechRule>} rules New rule set.
 */
sre.BaseRuleStore.prototype.setSpeechRules = function(rules) {
  this.speechRules_ = rules;
};


/**
 * Default constraint parser that adds the locale to the rest constraint
 * (generally, domain.style).
 * @param {string} cstr The constraint string.
 * @return {!sre.DynamicCstr} The parsed constraint including locale.
 */
sre.BaseRuleStore.prototype.parseCstr = function(cstr) {
  return this.parser.parse(this.locale + '.' + cstr);
};
