"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAll = void 0;
var sources_json_1 = __importDefault(require("./sources.json"));
var fs_1 = require("fs");
var url_1 = require("url");
var path_1 = require("path");
var folder = (0, path_1.dirname)((0, url_1.fileURLToPath)(import.meta.url));
// Serialized filter `"type"` literals have no TS enum equivalent in JSON,
// so emit FilterTypes member references instead. Covers both the value
// convention ("Checkbox") and the member-name convention ("CheckboxGroup").
var filterTypeRef = {
    Text: 'FilterTypes.TextInput',
    Picker: 'FilterTypes.Picker',
    Checkbox: 'FilterTypes.CheckboxGroup',
    CheckboxGroup: 'FilterTypes.CheckboxGroup',
    Switch: 'FilterTypes.Switch',
    XCheckbox: 'FilterTypes.ExcludableCheckboxGroup',
};
var withFilterTypeRefs = function (json) {
    return json.replace(/"type":"(Text|Picker|Checkbox|CheckboxGroup|Switch|XCheckbox)"/g, function (_, v) { return "\"type\":".concat(filterTypeRef[v]); });
};
var generateAll = function () {
    return sources_json_1.default.map(function (source) {
        var exist = (0, fs_1.existsSync)((0, path_1.join)(folder, 'filters', source.id + '.json'));
        if (exist) {
            var filters = (0, fs_1.readFileSync)((0, path_1.join)(folder, 'filters', source.id + '.json'));
            source.filters = JSON.parse(filters).filters;
        }
        console.log("[readnovelfull] Generating: ".concat(source.id).concat(' '.repeat(20 - source.id.length), " ").concat(source.filters ? '🔎with filters🔍' : '🚫no filters🚫'));
        return generator(source);
    });
};
exports.generateAll = generateAll;
var generator = function generator(source) {
    var _a, _b;
    var readNovelFullTemplate = (0, fs_1.readFileSync)((0, path_1.join)(folder, 'template.ts'), {
        encoding: 'utf-8',
    });
    var pluginScript = "\n".concat(readNovelFullTemplate.replace('// CustomJS HERE', ((_a = source.options) === null || _a === void 0 ? void 0 : _a.customJs) || ''), "\nconst plugin = new ReadNovelFullPlugin(").concat(withFilterTypeRefs(JSON.stringify(source)), ");\nexport default plugin;\n    ").trim();
    return {
        lang: ((_b = source.options) === null || _b === void 0 ? void 0 : _b.lang) || 'English',
        filename: source.sourceName,
        pluginScript: pluginScript,
    };
};
