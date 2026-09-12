"use strict";
var _a, _b;
/* global loadedCheerio */
// Injected into FictioneerPlugin.parseChapter; loadedCheerio is provided by the template scope.
var ghostScript = loadedCheerio('script[id*=ghost]');
var contentHost = loadedCheerio('#cherry-content-host');
if (ghostScript.length && contentHost.length) {
    var poly_1 = ghostScript.attr('data-poly');
    // data-poly attr provide id
    // encoded text is stored in attr data-{id}-{number}
    // create full string of all the data-poly-nums
    var encoded = Array.from({ length: Number(ghostScript.attr('data-total') || 0) }, function (_, i) { return ghostScript.attr("data-".concat(poly_1, "-").concat(i)) || ''; }).join('');
    // technically copypasta from source
    // var c = s.charCodeAt(i);
    // if(c>=65 && c<=90)
    //    o+=String.fromCharCode((c-65+13)%26+65);
    // else if(c>=97&&c<=122)
    //    o+=String.fromCharCode((c-97+13)%26+97);
    // else
    //    o+=s.charAt(i);
    if (encoded) {
        var rot13 = function (str) {
            return str.replace(/[a-zA-Z]/g, function (char) {
                var base = char <= 'Z' ? 65 : 97;
                var shift = ((char.charCodeAt(0) - base + 13) % 26) + base;
                return String.fromCharCode(shift);
            });
        };
        contentHost.replaceWith(decodeURIComponent(atob(rot13(encoded))));
    }
}
loadedCheerio('script, ruby').remove();
loadedCheerio('section#chapter-content p [data-fcnc-rev="1"]').each(function (_, el) {
    var text = loadedCheerio(el).text().trim();
    if (text)
        loadedCheerio(el).replaceWith(Array.from(text).reverse().join(''));
});
return (((_b = (_a = loadedCheerio('section#chapter-content > div')
    .html()) === null || _a === void 0 ? void 0 : _a.replace(/\u00A0/g, ' ')) === null || _b === void 0 ? void 0 : _b.replace(/[\u2060\u00AD\u202F\u2007\u200B]/g, '')) || '');
