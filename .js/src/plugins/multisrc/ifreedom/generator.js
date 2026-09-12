"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAll = void 0;
var sources_json_1 = __importDefault(require("./sources.json"));
var settings_json_1 = __importDefault(require("./settings.json"));
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
    return sources_json_1.default.map(function (metadata) {
        metadata.filters = Object.assign(settings_json_1.default.filters, metadata.filters);
        console.log("[ifreedom]: Generating", metadata.id);
        return generator(metadata);
    });
};
exports.generateAll = generateAll;
var generator = function generator(metadata) {
    var IfreedomTemplate = (0, fs_1.readFileSync)((0, path_1.join)(folder, 'template.ts'), {
        encoding: 'utf-8',
    });
    var pluginScript = "\n    ".concat(IfreedomTemplate, "\nconst plugin = new IfreedomPlugin(").concat(withFilterTypeRefs(JSON.stringify(metadata)), ");\nexport default plugin;\n    ").trim();
    return {
        lang: 'russian',
        filename: metadata.sourceName,
        pluginScript: pluginScript,
    };
};
