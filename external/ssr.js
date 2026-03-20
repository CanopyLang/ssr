// Canopy SSR FFI — Server-side rendering of VirtualDom to HTML strings
//
// Imported in Ssr.Render via:
//   foreign import javascript "external/ssr.js" as SsrFFI
//
// This module walks the internal VirtualDom node structure and produces
// HTML strings suitable for server-side rendering. It handles text escaping,
// attribute serialization, void elements, and hydration markers.


// ============================================================================
// CONSTANTS
// ============================================================================

var __2_TEXT = 0, __2_NODE = 1, __2_KEYED_NODE = 2;
var __2_CUSTOM = 3, __2_TAGGER = 4, __2_THUNK = 5;

var _Ssr_VOID_ELEMENTS = {
    'area': true, 'base': true, 'br': true, 'col': true,
    'embed': true, 'hr': true, 'img': true, 'input': true,
    'link': true, 'meta': true, 'param': true, 'source': true,
    'track': true, 'wbr': true
};

var _Ssr_BOOLEAN_ATTRS = {
    'allowfullscreen': true, 'async': true, 'autofocus': true,
    'autoplay': true, 'checked': true, 'controls': true,
    'default': true, 'defer': true, 'disabled': true,
    'formnovalidate': true, 'hidden': true, 'ismap': true,
    'loop': true, 'multiple': true, 'muted': true,
    'nomodule': true, 'novalidate': true, 'open': true,
    'readonly': true, 'required': true, 'reversed': true,
    'selected': true
};


// ============================================================================
// HTML ESCAPING
// ============================================================================

/**
 * Escape HTML special characters in text content.
 * @canopy-type String -> String
 * @name escapeHtml
 */
function escapeHtml(str) {
    if (str.indexOf('&') === -1 && str.indexOf('<') === -1 &&
        str.indexOf('>') === -1 && str.indexOf('"') === -1 &&
        str.indexOf("'") === -1) {
        return str;
    }
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

/**
 * Escape a string for safe embedding inside an HTML attribute value.
 * Handles all characters that could break out of or inject into attribute
 * context: &, <, >, ", ', backtick, and =.
 * @param {string} str
 * @returns {string}
 */
function _Ssr_escapeAttr(str) {
    str = String(str);
    if (str.indexOf('&') === -1 && str.indexOf('<') === -1 &&
        str.indexOf('>') === -1 && str.indexOf('"') === -1 &&
        str.indexOf("'") === -1 && str.indexOf('`') === -1 &&
        str.indexOf('=') === -1) {
        return str;
    }
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/`/g, '&#x60;')
        .replace(/=/g, '&#x3D;');
}


// ============================================================================
// VNODE TO STRING
// ============================================================================

/**
 * Render a VirtualDom node to an HTML string.
 * @canopy-type VirtualDom.Node msg -> String
 * @name toString
 */
function toString(vNode) {
    return _Ssr_renderNode(vNode, false, 0, -1);
}

/**
 * Render a VirtualDom node to an indented HTML string.
 * @canopy-type Int -> VirtualDom.Node msg -> String
 * @name toPrettyString
 */
var toPrettyString = F2(function(indent, vNode) {
    return _Ssr_renderNode(vNode, false, 0, indent);
});

/**
 * Render a VirtualDom node with hydration markers (data-canopy-id attributes).
 * @canopy-type VirtualDom.Node msg -> String
 * @name toHydratableString
 */
function toHydratableString(vNode) {
    return _Ssr_renderNode(vNode, true, 0, -1);
}


// ============================================================================
// CORE RENDERER
// ============================================================================

var _Ssr_nextId = 0;

function _Ssr_renderNode(vNode, hydratable, depth, indent) {
    switch (vNode.$) {
        case __2_TEXT:
            return escapeHtml(vNode.__text);

        case __2_NODE:
            return _Ssr_renderElement(vNode, hydratable, depth, indent);

        case __2_KEYED_NODE:
            return _Ssr_renderKeyedElement(vNode, hydratable, depth, indent);

        case __2_TAGGER:
            return _Ssr_renderNode(vNode.__node, hydratable, depth, indent);

        case __2_THUNK:
            if (!vNode.__node) {
                vNode.__node = vNode.__thunk();
            }
            return _Ssr_renderNode(vNode.__node, hydratable, depth, indent);

        case __2_CUSTOM:
            return '<!-- custom node -->';

        default:
            return '';
    }
}

function _Ssr_renderElement(vNode, hydratable, depth, indent) {
    var tag = vNode.__tag;
    var facts = vNode.__facts;
    var kids = vNode.__kids;
    var namespace = vNode.__namespace;

    var attrStr = _Ssr_renderFacts(facts, hydratable, namespace);
    if (hydratable) {
        attrStr += ' data-canopy-id="' + (_Ssr_nextId++) + '"';
    }

    var open = '<' + tag + attrStr + '>';

    if (_Ssr_VOID_ELEMENTS[tag]) {
        return indent >= 0
            ? _Ssr_indent(depth, indent) + '<' + tag + attrStr + ' />'
            : '<' + tag + attrStr + ' />';
    }

    var childrenStr = '';
    for (var i = 0; i < kids.length; i++) {
        childrenStr += _Ssr_renderNode(kids[i], hydratable, depth + 1, indent);
    }

    if (indent >= 0 && kids.length > 0) {
        var pad = _Ssr_indent(depth, indent);
        var innerPad = _Ssr_indent(depth + 1, indent);
        var parts = [];
        for (var i = 0; i < kids.length; i++) {
            parts.push(_Ssr_renderNode(kids[i], hydratable, depth + 1, indent));
        }
        return pad + open + '\n' + parts.join('\n') + '\n' + pad + '</' + tag + '>';
    }

    return open + childrenStr + '</' + tag + '>';
}

function _Ssr_renderKeyedElement(vNode, hydratable, depth, indent) {
    var tag = vNode.__tag;
    var facts = vNode.__facts;
    var kids = vNode.__kids;
    var namespace = vNode.__namespace;

    var attrStr = _Ssr_renderFacts(facts, hydratable, namespace);
    if (hydratable) {
        attrStr += ' data-canopy-id="' + (_Ssr_nextId++) + '"';
    }

    var open = '<' + tag + attrStr + '>';
    var childrenStr = '';
    for (var i = 0; i < kids.length; i++) {
        // keyed kids are { a: key, b: node } tuples
        childrenStr += _Ssr_renderNode(kids[i].b, hydratable, depth + 1, indent);
    }

    if (indent >= 0 && kids.length > 0) {
        var pad = _Ssr_indent(depth, indent);
        var parts = [];
        for (var i = 0; i < kids.length; i++) {
            parts.push(_Ssr_renderNode(kids[i].b, hydratable, depth + 1, indent));
        }
        return pad + open + '\n' + parts.join('\n') + '\n' + pad + '</' + tag + '>';
    }

    return open + childrenStr + '</' + tag + '>';
}


// ============================================================================
// FACTS (ATTRIBUTES) RENDERING
// ============================================================================

function _Ssr_renderFacts(facts, hydratable, namespace) {
    var result = '';

    // Properties that map to HTML attributes
    if (facts['className']) {
        result += ' class="' + _Ssr_escapeAttr(facts['className']) + '"';
    }

    // Other properties (id, value, etc.)
    for (var key in facts) {
        if (key === 'className') continue;
        if (key.charAt(0) === 'a') continue; // skip sub-fact categories
        var val = facts[key];
        if (typeof val === 'boolean') {
            if (val) result += ' ' + key;
        } else if (typeof val === 'string' || typeof val === 'number') {
            result += ' ' + key + '="' + _Ssr_escapeAttr(val) + '"';
        }
    }

    // HTML attributes (a__1_ATTR)
    var attrs = facts['a__1_ATTR'];
    if (attrs) {
        for (var key in attrs) {
            var val = attrs[key];
            if (_Ssr_BOOLEAN_ATTRS[key]) {
                if (val === '' || val === key || val === true || val === 'true') {
                    result += ' ' + key;
                }
            } else {
                result += ' ' + key + '="' + _Ssr_escapeAttr(val) + '"';
            }
        }
    }

    // Namespaced attributes (a__1_ATTR_NS)
    var nsAttrs = facts['a__1_ATTR_NS'];
    if (nsAttrs) {
        for (var key in nsAttrs) {
            var pair = nsAttrs[key];
            result += ' ' + key + '="' + _Ssr_escapeAttr(pair.__value) + '"';
        }
    }

    // Styles (a__1_STYLE)
    var styles = facts['a__1_STYLE'];
    if (styles) {
        var styleStr = '';
        for (var key in styles) {
            if (styleStr) styleStr += '; ';
            styleStr += key + ': ' + styles[key];
        }
        if (styleStr) {
            result += ' style="' + _Ssr_escapeAttr(styleStr) + '"';
        }
    }

    // Events (a__1_EVENT) are intentionally skipped for server rendering

    return result;
}


// ============================================================================
// INDENTATION
// ============================================================================

function _Ssr_indent(depth, spacesPerLevel) {
    var total = depth * spacesPerLevel;
    var s = '';
    for (var i = 0; i < total; i++) {
        s += ' ';
    }
    return s;
}


// ============================================================================
// FULL DOCUMENT RENDERING
// ============================================================================

/**
 * Render a complete HTML document with head, body, serialized state, and client script.
 * @canopy-type String -> String -> VirtualDom.Node msg -> String -> String -> String
 * @name toDocument
 */
var toDocument = F5(function(titleStr, headContent, bodyNode, stateJson, clientScript) {
    var bodyHtml = _Ssr_renderNode(bodyNode, true, 0, -1);
    return '<!DOCTYPE html>\n'
        + '<html>\n'
        + '<head>\n'
        + '<meta charset="utf-8" />\n'
        + '<title>' + escapeHtml(titleStr) + '</title>\n'
        + headContent + '\n'
        + '</head>\n'
        + '<body>\n'
        + '<div id="app">' + bodyHtml + '</div>\n'
        + '<script id="__CANOPY_STATE__" type="application/json">' + stateJson + '</script>\n'
        + '<script src="' + _Ssr_escapeAttr(clientScript) + '"></script>\n'
        + '</body>\n'
        + '</html>';
});

/**
 * Reset the hydration ID counter. Used for testing to get deterministic output.
 * @canopy-type () -> ()
 * @name resetIdCounter
 */
function resetIdCounter(_v) {
    _Ssr_nextId = 0;
    return _Utils_Tuple0;
}

/**
 * Render a list of style pairs to a style attribute string.
 * @canopy-type List ( String, String ) -> String
 * @name styleToString
 */
function styleToString(pairs) {
    var result = '';
    for (; pairs.b; pairs = pairs.b) {
        var pair = pairs.a;
        if (result) result += '; ';
        result += pair.a + ': ' + pair.b;
    }
    return result;
}
