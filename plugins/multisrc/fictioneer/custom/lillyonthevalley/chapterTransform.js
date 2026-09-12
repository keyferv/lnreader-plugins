/* global loadedCheerio */
// Injected into FictioneerPlugin.parseChapter; loadedCheerio is provided by the template scope.
const scriptContent = loadedCheerio('script')
  .toArray()
  .map(script => loadedCheerio(script).html())
  .find(content => content && content.includes('var gib ='));

if (scriptContent) {
  const gibMatch = scriptContent.match(/var gib = (\[.*?\])/);
  if (gibMatch) {
    // Never eval() remote chapter text: the gib list is plain data, so parse
    // it as JSON and validate every entry before using it as a selector.
    // (JSDoc typing: this snippet is injected verbatim into the TypeScript
    // template, where the annotation keeps the generated code type-safe.)
    /** @type {unknown[]} */
    let gibArray = [];
    try {
      const parsed = JSON.parse(gibMatch[1]);
      if (Array.isArray(parsed)) gibArray = parsed;
    } catch {
      gibArray = [];
    }
    gibArray.forEach(cssClass => {
      if (typeof cssClass === 'string' && /^[A-Za-z0-9_-]+$/.test(cssClass)) {
        loadedCheerio(`.${cssClass}`).remove();
      }
    });
  }
}

loadedCheerio('ruby').remove();

loadedCheerio('section#chapter-content p *').each((_, el) => {
  if (loadedCheerio(el).attr('data-fcnc-rev') !== '1') return;
  const textContent = loadedCheerio(el).text().trim();
  if (textContent) {
    loadedCheerio(el).replaceWith(Array.from(textContent).reverse().join(''));
  }
});

return (
  loadedCheerio('section#chapter-content > div')
    .html()
    ?.normalize()
    .replace(/\u00A0/g, ' ')
    .replace(/\u2060/g, '')
    .replace(/­/g, '') // &shy;
    .replace(/[\u202F\u2007\u200B]/g, '') || ''
);
