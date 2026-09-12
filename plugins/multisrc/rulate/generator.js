/* eslint-disable no-undef, @typescript-eslint/no-var-requires */
import list from './sources.json' with { type: 'json' };
import defaultSettings from './settings.json' with { type: 'json' };
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const folder = dirname(fileURLToPath(import.meta.url));
const key = 'fpoiKLUues81werht039';

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
    source.key = key;
    source.filters = defaultSettings.filters;

    const exist = existsSync(
      join(folder, 'filters', source.sourceName + '.json'),
    );
    if (exist) {
      const filters = readFileSync(
        join(folder, 'filters', source.sourceName + '.json'),
      );
      source.filters = Object.assign(
        defaultSettings.filters,
        JSON.parse(filters).filters,
      );
    }

    console.log(`[rulate]: Generating`, source.id);
    return generator(source);
  });
};

const generator = function generator(source) {
  const rulateTemplate = readFileSync(join(folder, 'template.ts'), {
    encoding: 'utf-8',
  });

  const pluginScript = `
  ${rulateTemplate}
const plugin = new RulatePlugin(${withFilterTypeRefs(JSON.stringify(source))});
export default plugin;
    `.trim();

  return {
    lang: 'russian',
    filename: source.sourceName,
    pluginScript,
  };
};
