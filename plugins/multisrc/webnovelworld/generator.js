import list from './sources.json' with { type: 'json' };
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const folder = dirname(fileURLToPath(import.meta.url));

// Serialized filter `"type"` literals have no TS enum equivalent in JSON,
// so emit FilterTypes member references instead. Covers both the value
// convention ("Checkbox") and the member-name convention ("CheckboxGroup").
const filterTypeRef = {
  Text: 'FilterTypes.TextInput',
  Picker: 'FilterTypes.Picker',
  Checkbox: 'FilterTypes.CheckboxGroup',
  CheckboxGroup: 'FilterTypes.CheckboxGroup',
  Switch: 'FilterTypes.Switch',
  XCheckbox: 'FilterTypes.ExcludableCheckboxGroup',
};

const withFilterTypeRefs = json =>
  json.replace(
    /"type":"(Text|Picker|Checkbox|CheckboxGroup|Switch|XCheckbox)"/g,
    (_, v) => `"type":${filterTypeRef[v]}`,
  );

export const generateAll = function () {
  return list.map(source => {
    const exist = existsSync(join(folder, 'filters', source.id + '.json'));
    if (exist) {
      const filters = readFileSync(
        join(folder, 'filters', source.id + '.json'),
      );
      source.filters = JSON.parse(filters).filters;
    }
    console.log(
      `[webnovelworld] Generating: ${source.id}${' '.repeat(20 - source.id.length)} ${source.filters ? '🔎with filters🔍' : '🚫no filters🚫'}`,
    );
    return generator(source);
  });
};

const generator = function generator(source) {
  const LightNovelWPTemplate = readFileSync(join(folder, 'template.ts'), {
    encoding: 'utf-8',
  });

  const pluginScript = `
${LightNovelWPTemplate}
const plugin = new WebNovelWorld(${withFilterTypeRefs(JSON.stringify(source))});
export default plugin;
    `.trim();

  return {
    lang: source.options?.lang || 'English',
    filename: source.sourceName,
    pluginScript,
  };
};
