"use strict";
var _a;
/* global loadedCheerio */
// Injected into FictioneerPlugin.parseChapter; loadedCheerio is provided by the template scope.
var scriptContent = loadedCheerio('script')
    .toArray()
    .map(function (script) { return loadedCheerio(script).html(); })
    .find(function (content) { return content && content.includes('var gib ='); });
if (scriptContent) {
    var gibMatch = scriptContent.match(/var gib = (\[.*?\])/);
    if (gibMatch) {
        // Never eval() remote chapter text: the gib list is plain data, so parse
        // it as JSON and validate every entry before using it as a selector.
        // (JSDoc typing: this snippet is injected verbatim into the TypeScript
        // template, where the annotation keeps the generated code type-safe.)
        /** @type {unknown[]} */
        var gibArray = [];
        try {
            var parsed = JSON.parse(gibMatch[1]);
            if (Array.isArray(parsed))
                gibArray = parsed;
        }
        catch (_b) {
            gibArray = [];
        }
        gibArray.forEach(function (cssClass) {
            if (typeof cssClass === 'string' && /^[A-Za-z0-9_-]+$/.test(cssClass)) {
                loadedCheerio(".".concat(cssClass)).remove();
            }
        });
    }
}
loadedCheerio('ruby').remove();
loadedCheerio('section#chapter-content p *').each(function (_, el) {
    if (loadedCheerio(el).attr('data-fcnc-rev') !== '1')
        return;
    var textContent = loadedCheerio(el).text().trim();
    if (textContent) {
        loadedCheerio(el).replaceWith(Array.from(textContent).reverse().join(''));
    }
});
return (((_a = loadedCheerio('section#chapter-content > div')
    .html()) === null || _a === void 0 ? void 0 : _a.normalize().replace(/\u00A0/g, ' ').replace(/\u2060/g, '').replace(/­/g, '').replace(/[\u202F\u2007\u200B]/g, '')) || '');
