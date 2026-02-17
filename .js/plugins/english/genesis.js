"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var cheerio_1 = require("cheerio");
var fetch_1 = require("@libs/fetch");
var filterInputs_1 = require("@libs/filterInputs");
var novelStatus_1 = require("@libs/novelStatus");
var storage_1 = require("@libs/storage");
var Genesis = /** @class */ (function () {
    function Genesis() {
        this.id = 'genesistudio';
        this.name = 'Genesis';
        this.icon = 'src/en/genesis/icon.png';
        this.customCSS = 'src/en/genesis/customCSS.css';
        this.site = 'https://genesistudio.com';
        this.api = 'https://api.genesistudio.com';
        this.version = '2.0.0';
        this.hideLocked = storage_1.storage.get('hideLocked');
        this.pluginSettings = {
            hideLocked: {
                value: '',
                label: 'Hide locked chapters',
                type: 'Switch',
            },
        };
        this.imageRequestInit = {
            headers: {
                'referrer': this.site,
            },
        };
        this.filters = {
            sort: {
                label: 'Sort Results By',
                value: 'Date',
                options: [
                    { label: 'Date', value: 'Date' },
                    { label: 'Views', value: 'Views' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
            storyStatus: {
                label: 'Status',
                value: 'All',
                options: [
                    { label: 'All', value: 'All' },
                    { label: 'Ongoing', value: 'Ongoing' },
                    { label: 'Completed', value: 'Completed' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
            genres: {
                label: 'Genres',
                value: [],
                options: [
                    { label: 'Action', value: 'Action' },
                    { label: 'Comedy', value: 'Comedy' },
                    { label: 'Drama', value: 'Drama' },
                    { label: 'Fantasy', value: 'Fantasy' },
                    { label: 'Harem', value: 'Harem' },
                    { label: 'Martial Arts', value: 'Martial Arts' },
                    { label: 'Modern', value: 'Modern' },
                    { label: 'Mystery', value: 'Mystery' },
                    { label: 'Psychological', value: 'Psychological' },
                    { label: 'Romance', value: 'Romance' },
                    { label: 'Slice of life', value: 'Slice of Life' },
                    { label: 'Tragedy', value: 'Tragedy' },
                ],
                type: filterInputs_1.FilterTypes.CheckboxGroup,
            },
        };
    }
    Genesis.prototype.parseNovelJSON = function (json) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, json.map(function (novel) { return ({
                        name: novel.novel_title,
                        path: "/novels/".concat(novel.abbreviation).trim(),
                        cover: "".concat(_this.api, "/storage/v1/object/public/directus/").concat(novel.cover, ".png"),
                    }); })];
            });
        });
    };
    Genesis.prototype.popularNovels = function (pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var link, json;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // There is only one page of results, and no known page function, so do not try
                        if (pageNo !== 1)
                            return [2 /*return*/, []];
                        link = "".concat(this.site, "/api/directus/novels?status=published&fields=[\"cover\",\"novel_title\",\"cover\",\"abbreviation\"]&limit=-1");
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(link).then(function (r) { return r.json(); })];
                    case 1:
                        json = _a.sent();
                        return [2 /*return*/, this.parseNovelJSON(json)];
                }
            });
        });
    };
    Genesis.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var abbreviation, url, raw, json, parse, novel, map, url_1, imgJson, _a;
            var _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        abbreviation = novelPath.replace('/novels/', '');
                        url = "".concat(this.site, "/api/directus/novels/by-abbreviation/").concat(abbreviation);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 1:
                        raw = _e.sent();
                        return [4 /*yield*/, raw.json()];
                    case 2:
                        json = _e.sent();
                        return [4 /*yield*/, this.parseNovelJSON([json])];
                    case 3:
                        parse = _e.sent();
                        novel = parse[0];
                        novel.summary = json.synopsis;
                        novel.author = json.author;
                        map = {
                            ongoing: novelStatus_1.NovelStatus.Ongoing,
                            hiatus: novelStatus_1.NovelStatus.OnHiatus,
                            dropped: novelStatus_1.NovelStatus.Cancelled,
                            cancelled: novelStatus_1.NovelStatus.Cancelled,
                            completed: novelStatus_1.NovelStatus.Completed,
                            unknown: novelStatus_1.NovelStatus.Unknown,
                        };
                        novel.status = (_b = map[json.serialization.toLowerCase()]) !== null && _b !== void 0 ? _b : novelStatus_1.NovelStatus.Unknown;
                        if (!json.cover) return [3 /*break*/, 6];
                        url_1 = "".concat(this.site, "/api/directus-file/").concat(json.cover);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url_1)];
                    case 4: return [4 /*yield*/, (_e.sent()).json()];
                    case 5:
                        imgJson = _e.sent();
                        console.log(imgJson.type);
                        novel.cover = "".concat(this.api, "/storage/v1/object/public/directus/").concat(json.cover, ".png");
                        if (imgJson.type == 'image/gif') {
                            novel.cover = (_c = novel.cover) === null || _c === void 0 ? void 0 : _c.replace('.png', '.gif');
                        }
                        else if (imgJson.type !== 'image/png') {
                            novel.cover = (_d = novel.cover) === null || _d === void 0 ? void 0 : _d.replace('.png', '.' + imgJson.type.toString().split('/')[1]);
                        }
                        _e.label = 6;
                    case 6:
                        // Parse the chapters if available and assign them to the novel object
                        _a = novel;
                        return [4 /*yield*/, this.extractChapters(json.id)];
                    case 7:
                        // Parse the chapters if available and assign them to the novel object
                        _a.chapters = _e.sent();
                        return [2 /*return*/, novel];
                }
            });
        });
    };
    // Helper function to extract and format chapters
    Genesis.prototype.extractChapters = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var url, raw, json, chapters;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "".concat(this.site, "/api/novels-chapter/").concat(id);
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 1:
                        raw = _a.sent();
                        return [4 /*yield*/, raw.json()];
                    case 2:
                        json = _a.sent();
                        chapters = json.data.chapters
                            .map(function (index) {
                            var title = index.chapter_title;
                            var chapterPath = "/viewer/".concat(index.id);
                            var isLocked = !index.isUnlocked;
                            if (_this.hideLocked && isLocked)
                                return null;
                            var chapterName = isLocked ? '🔒 ' + title : title;
                            var chapterNum = index.chapter_number;
                            if (!chapterPath)
                                return null;
                            return {
                                name: chapterName,
                                path: chapterPath,
                                chapterNumber: Number(chapterNum),
                            };
                        })
                            .filter(function (chapter) { return chapter !== null; });
                        return [2 /*return*/, chapters];
                }
            });
        });
    };
    Genesis.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var url, id, raw, $, _a, external_api, apikey, URLs, code, srcs, _i, URLs_1, src, script, raw_1, arr, _b, arr_1, seg, _c, arr_2, seg, path, chQuery, json, ch;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        url = "".concat(this.site).concat(chapterPath);
                        id = chapterPath.replace('/viewer/', '');
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url)];
                    case 1:
                        raw = _d.sent();
                        _a = cheerio_1.load;
                        return [4 /*yield*/, raw.text()];
                    case 2:
                        $ = _a.apply(void 0, [_d.sent()]);
                        URLs = [];
                        srcs = $('head')
                            .find('script')
                            .map(function () {
                            var src = $(this).attr('src');
                            if (!src || URLs.includes(src)) {
                                return null;
                            }
                            URLs.push(src);
                        })
                            .toArray();
                        _i = 0, URLs_1 = URLs;
                        _d.label = 3;
                    case 3:
                        if (!(_i < URLs_1.length)) return [3 /*break*/, 7];
                        src = URLs_1[_i];
                        return [4 /*yield*/, (0, fetch_1.fetchApi)("".concat(this.site).concat(src))];
                    case 4:
                        script = _d.sent();
                        return [4 /*yield*/, script.text()];
                    case 5:
                        raw_1 = _d.sent();
                        if (raw_1.includes('sb_publishable')) {
                            code = raw_1;
                            return [3 /*break*/, 7];
                        }
                        _d.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 3];
                    case 7:
                        if (!code) {
                            throw new Error('Failed to find API Key');
                        }
                        arr = code.split(';');
                        for (_b = 0, arr_1 = arr; _b < arr_1.length; _b++) {
                            seg = arr_1[_b];
                            if (seg.includes('sb_publishable')) {
                                code = seg;
                                break;
                            }
                        }
                        arr = code.split('"');
                        for (_c = 0, arr_2 = arr; _c < arr_2.length; _c++) {
                            seg = arr_2[_c];
                            if (seg.includes('https')) {
                                external_api = seg;
                                continue;
                            }
                            if (seg.includes('sb_publishable')) {
                                apikey = seg;
                                continue;
                            }
                        }
                        path = "".concat(external_api, "/rest/v1/chapters?select=id,chapter_title,chapter_number,chapter_content,status,novel&id=eq.").concat(id, "&status=eq.released");
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(path, {
                                method: 'GET',
                                headers: {
                                    // Cookie: 'csrftoken=' + csrftoken,
                                    Referer: this.site,
                                    'apikey': apikey,
                                    'x-client-info': 'supabase-ssr/0.7.0 createBrowserClient',
                                },
                            })];
                    case 8:
                        chQuery = _d.sent();
                        return [4 /*yield*/, chQuery.json()];
                    case 9:
                        json = _d.sent();
                        ch = json[0].chapter_content.replaceAll('\n', '<br/>');
                        return [2 /*return*/, ch];
                }
            });
        });
    };
    Genesis.prototype.searchNovels = function (searchTerm, pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var url, json;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (pageNo !== 1)
                            return [2 /*return*/, []];
                        url = "".concat(this.site, "/api/novels/search?title=").concat(encodeURIComponent(searchTerm));
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(url).then(function (r) { return r.json(); })];
                    case 1:
                        json = _a.sent();
                        return [2 /*return*/, this.parseNovelJSON(json)];
                }
            });
        });
    };
    return Genesis;
}());
exports.default = new Genesis();
