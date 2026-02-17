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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fetch_1 = require("@libs/fetch");
var novelStatus_1 = require("@libs/novelStatus");
var dayjs_1 = __importDefault(require("dayjs"));
var headers = {
    'User-Agent': 'RuLateApp Android',
    'accept-encoding': 'gzip',
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var RulatePlugin = /** @class */ (function () {
    function RulatePlugin(metadata) {
        var _this = this;
        this.resolveUrl = function (path, isNovel) {
            return _this.site + '/book/' + path + (isNovel ? '/' : '/ready_new');
        };
        this.id = metadata.id;
        this.name = metadata.sourceName + ' (API)';
        this.icon = "multisrc/rulate/".concat(metadata.id.toLowerCase(), "/icon.png");
        this.site = metadata.sourceSite;
        this.version = '1.0.' + (0 + metadata.versionIncrements);
        this.filters = metadata.filters;
        this.key = metadata.key;
    }
    RulatePlugin.prototype.parseNovels = function (url) {
        return (0, fetch_1.fetchApi)(url, { headers: headers })
            .then(function (res) { return res.json(); })
            .then(function (data) {
            var _a;
            var novels = [];
            if (data.status === 'success' && ((_a = data.response) === null || _a === void 0 ? void 0 : _a.length)) {
                data.response.forEach(function (novel) {
                    return novels.push({
                        name: novel.t_title || novel.s_title,
                        path: novel.id.toString(),
                        cover: novel.img,
                    });
                });
            }
            return novels;
        });
    };
    RulatePlugin.prototype.popularNovels = function (page_1, _a) {
        return __awaiter(this, arguments, void 0, function (page, _b) {
            var url;
            var _c;
            var filters = _b.filters, showLatestNovels = _b.showLatestNovels;
            return __generator(this, function (_d) {
                url = this.site + '/api3/searchBooks?limit=40&page=' + page;
                url += '&sort=' + (showLatestNovels ? '4' : ((_c = filters === null || filters === void 0 ? void 0 : filters.sort) === null || _c === void 0 ? void 0 : _c.value) || '6');
                Object.entries(filters || {}).forEach(function (_a) {
                    var type = _a[0], value = _a[1].value;
                    if (value instanceof Array && value.length) {
                        url += '&' + value.map(function (val) { return type + '[]=' + val; }).join('&');
                    }
                });
                url += '&key=' + this.key;
                return [2 /*return*/, this.parseNovels(url)];
            });
        });
    };
    RulatePlugin.prototype.searchNovels = function (searchTerm_1) {
        return __awaiter(this, arguments, void 0, function (searchTerm, page) {
            var url;
            if (page === void 0) { page = 1; }
            return __generator(this, function (_a) {
                url = "".concat(this.site, "/api3/searchBooks?t=").concat(encodeURIComponent(searchTerm), "&limit=40&page=").concat(page, "&key=").concat(this.key);
                return [2 /*return*/, this.parseNovels(url)];
            });
        });
    };
    RulatePlugin.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var book, novel, chaptersData, chapters;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site + '/api3/book?book_id=' + novelPath + '&key=' + this.key, { headers: headers }).then(function (res) { return res.json(); })];
                    case 1:
                        book = _a.sent();
                        novel = {
                            name: book.response.t_title || book.response.s_title,
                            path: novelPath,
                            cover: book.response.img,
                            genres: [book.response.genres, book.response.tags]
                                .flatMap(function (c) { var _a; return (_a = c === null || c === void 0 ? void 0 : c.map) === null || _a === void 0 ? void 0 : _a.call(c, function (g) { return g.title || g.name; }); }) // eslint-disable-line @typescript-eslint/no-explicit-any
                                .join(','),
                            summary: book.response.description,
                            author: book.response.author,
                            status: book.response.status === 'Завершён'
                                ? novelStatus_1.NovelStatus.Completed
                                : novelStatus_1.NovelStatus.Ongoing,
                            rating: book.response.rate && book.response.rate.count > 0
                                ? Number((book.response.rate.sum / book.response.rate.count).toFixed(2))
                                : undefined,
                        };
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site +
                                '/api3/bookChapters?book_id=' +
                                novelPath +
                                '&key=' +
                                this.key, { headers: headers }).then(function (res) { return res.json(); })];
                    case 2:
                        chaptersData = _a.sent();
                        chapters = [];
                        if (chaptersData.response && Array.isArray(chaptersData.response)) {
                            chaptersData.response.forEach(function (chapter) {
                                if (chapter.can_read && chapter.subscription === 0) {
                                    chapters.push({
                                        name: chapter.title + (chapter.illustrated ? ' 🖼️' : ''),
                                        path: novelPath + '/' + chapter.id,
                                        releaseTime: (0, dayjs_1.default)(chapter.cdate * 1000).format('LLL'),
                                        chapterNumber: chapter.ord,
                                    });
                                }
                            });
                        }
                        novel.chapters = chapters;
                        return [2 /*return*/, novel];
                }
            });
        });
    };
    RulatePlugin.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, book, chapter, body;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = chapterPath.split('/'), book = _a[0], chapter = _a[1];
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(this.site +
                                '/api3/chapter?book_id=' +
                                book +
                                '&chapter_id=' +
                                chapter +
                                '&key=' +
                                this.key, { headers: headers }).then(function (res) { return res.json(); })];
                    case 1:
                        body = _b.sent();
                        return [2 /*return*/, body.response.text];
                }
            });
        });
    };
    return RulatePlugin;
}());
var plugin = new RulatePlugin({ "id": "erolate-api", "sourceSite": "https://erolate.com", "sourceName": "Erolate", "versionIncrements": 0, "key": "fpoiKLUues81werht039", "filters": { "sort": { "label": "Сортировка:", "value": "6", "options": [{ "label": "По рейтингу", "value": "6" }, { "label": "По дате последней активности", "value": "4" }, { "label": "По дате создания", "value": "3" }, { "label": "По кол-ву бесплатных глав", "value": "11" }, { "label": "По кол-ву в закладках", "value": "13" }, { "label": "По кол-ву в избранном", "value": "14" }, { "label": "По кол-ву лайков", "value": "8" }, { "label": "По кол-ву переведённых глав", "value": "7" }, { "label": "По кол-ву рецензий", "value": "12" }, { "label": "По кол-ву страниц", "value": "10" }, { "label": "По названию на языке оригинала", "value": "1" }, { "label": "По названию на языке перевода", "value": "2" }, { "label": "По просмотрам", "value": "5" }, { "label": "По степени готовности", "value": "0" }, { "label": "Случайно", "value": "9" }], "type": "Picker" }, "genres": { "type": "Checkbox", "label": "Жанры: все жанры любой жанр", "value": "", "options": [{ "label": "анал", "value": "2" }, { "label": "Арт", "value": "70" }, { "label": "бдсм", "value": "3" }, { "label": "Боевые искусства", "value": "52" }, { "label": "большая грудь", "value": "5" }, { "label": "большая попка", "value": "6" }, { "label": "большой член", "value": "7" }, { "label": "бондаж", "value": "8" }, { "label": "в первый раз", "value": "9" }, { "label": "в цвете", "value": "10" }, { "label": "гарем", "value": "11" }, { "label": "Гарем", "value": "71" }, { "label": "гендарная интрига", "value": "12" }, { "label": "Героическое фэнтези", "value": "57" }, { "label": "групповой секс", "value": "13" }, { "label": "детектив", "value": "39" }, { "label": "Детектив", "value": "50" }, { "label": "Дзёсэй", "value": "45" }, { "label": "драма", "value": "14" }, { "label": "Драма", "value": "46" }, { "label": "зрелые женщины (milf)", "value": "15" }, { "label": "измена", "value": "16" }, { "label": "изнасилование", "value": "17" }, { "label": "инцест", "value": "18" }, { "label": "исторический", "value": "19" }, { "label": "История", "value": "62" }, { "label": "комедия", "value": "20" }, { "label": "Комедия", "value": "51" }, { "label": "контроль над разумом", "value": "35" }, { "label": "маленькая грудь", "value": "21" }, { "label": "мистика", "value": "40" }, { "label": "Мистика", "value": "66" }, { "label": "Мурим", "value": "54" }, { "label": "научная фантастика", "value": "22" }, { "label": "Научная фантастика", "value": "72" }, { "label": "нетораре", "value": "23" }, { "label": "оральный секс", "value": "24" }, { "label": "повседневность", "value": "41" }, { "label": "Повседневность", "value": "53" }, { "label": "Постапокалиптика", "value": "55" }, { "label": "приключения", "value": "38" }, { "label": "Приключения", "value": "42" }, { "label": "Психология", "value": "63" }, { "label": "публичный секс", "value": "33" }, { "label": "романтика", "value": "25" }, { "label": "Романтика", "value": "47" }, { "label": "с изображениями ", "value": "36" }, { "label": "сверхъестественное", "value": "34" }, { "label": "Сверхъестественное", "value": "58" }, { "label": "Сёдзё", "value": "48" }, { "label": "Сёнэн", "value": "43" }, { "label": "смат", "value": "37" }, { "label": "Спорт", "value": "65" }, { "label": "Сэйнэн", "value": "64" }, { "label": "тентакли", "value": "26" }, { "label": "трагедия", "value": "27" }, { "label": "Трагедия", "value": "61" }, { "label": "Триллер", "value": "69" }, { "label": "ужасы", "value": "28" }, { "label": "Ужасы", "value": "68" }, { "label": "фантастика", "value": "32" }, { "label": "Фантастика", "value": "60" }, { "label": "фэнтези", "value": "29" }, { "label": "Фэнтези", "value": "44" }, { "label": "чикан", "value": "30" }, { "label": "Школьная жизнь", "value": "59" }, { "label": "Экшен", "value": "49" }, { "label": "Эротика", "value": "56" }, { "label": "этти", "value": "31" }, { "label": "Этти", "value": "67" }, { "label": "ahegao", "value": "1" }] } } });
exports.default = plugin;
