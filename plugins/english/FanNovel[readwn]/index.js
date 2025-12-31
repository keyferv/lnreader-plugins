// Compatibility wrapper for FanNovel (readwn)
try {
  const mod = require('../../../.js/plugins/english/FanNovel[readwn]');
  const plugin = mod && (mod.default || mod);
  if (!plugin) throw new Error('FanNovel: no plugin exported');
  module.exports = plugin;
  module.exports.default = plugin;
} catch (e) {
  throw e;
}
