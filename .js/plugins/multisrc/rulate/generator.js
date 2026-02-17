"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAll = void 0;
/* eslint-disable no-undef, @typescript-eslint/no-var-requires */
var sources_json_1 = __importDefault(require("./sources.json"));
var settings_json_1 = __importDefault(require("./settings.json"));
var fs_1 = require("fs");
var url_1 = require("url");
var path_1 = require("path");
var folder = (0, path_1.dirname)((0, url_1.fileURLToPath)(import.meta.url));
var key = 'fpoiKLUues81werht039';
var generateAll = function () {
    return sources_json_1.default.map(function (source) {
        source.key = key;
        source.filters = settings_json_1.default.filters;
        var exist = (0, fs_1.existsSync)((0, path_1.join)(folder, 'filters', source.sourceName + '.json'));
        if (exist) {
            var filters = (0, fs_1.readFileSync)((0, path_1.join)(folder, 'filters', source.sourceName + '.json'));
            source.filters = Object.assign(settings_json_1.default.filters, JSON.parse(filters).filters);
        }
        console.log("[rulate]: Generating", source.id);
        return generator(source);
    });
};
exports.generateAll = generateAll;
var generator = function generator(source) {
    var rulateTemplate = (0, fs_1.readFileSync)((0, path_1.join)(folder, 'template.ts'), {
        encoding: 'utf-8',
    });
    var pluginScript = "\n  ".concat(rulateTemplate, "\nconst plugin = new RulatePlugin(").concat(JSON.stringify(source), ");\nexport default plugin;\n    ").trim();
    return {
        lang: 'russian',
        filename: source.sourceName,
        pluginScript: pluginScript,
    };
};
