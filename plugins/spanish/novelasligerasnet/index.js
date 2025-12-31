// Compatibility wrapper for NovelasLigerasNet
try {
  // Require the compiled module in .js/plugins where build outputs are kept
  const mod = require('../../../.js/plugins/spanish/novelasligerasnet');
  const plugin = mod && (mod.default || mod);
  if (!plugin) throw new Error('NovelasLigerasNet: no plugin exported');
  module.exports = plugin;
  module.exports.default = plugin;
} catch (e) {
  // Re-throw so installer receives a clear error
  throw e;
}
