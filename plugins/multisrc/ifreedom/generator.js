import list from './sources.json' with { type: 'json' };
import defaultSettings from './settings.json' with { type: 'json' };
import { readFileSync } from 'fs';
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
  return list.map(metadata => {
    metadata.filters = Object.assign(defaultSettings.filters, metadata.filters);
    console.log(`[ifreedom]: Generating`, metadata.id);
    return generator(metadata);
  });
};

const generator = function generator(metadata) {
  const IfreedomTemplate = readFileSync(join(folder, 'template.ts'), {
    encoding: 'utf-8',
  });

  const pluginScript = `
    ${IfreedomTemplate}
const plugin = new IfreedomPlugin(${withFilterTypeRefs(JSON.stringify(metadata))});
export default plugin;
    `.trim();

  return {
    lang: 'russian',
    filename: metadata.sourceName,
    pluginScript,
  };
};
