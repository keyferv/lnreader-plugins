"use strict";
// Compatibility wrapper for FanNovel (readwn)
try {
    var mod = require('../../../.js/plugins/english/FanNovel[readwn]');
    var plugin = mod && (mod.default || mod);
    if (!plugin)
        throw new Error('FanNovel: no plugin exported');
    module.exports = plugin;
    module.exports.default = plugin;
}
catch (e) {
    throw e;
}
