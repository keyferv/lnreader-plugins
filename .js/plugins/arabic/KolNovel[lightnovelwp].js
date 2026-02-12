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
var htmlparser2_1 = require("htmlparser2");
var fetch_1 = require("@libs/fetch");
var novelStatus_1 = require("@libs/novelStatus");
var defaultCover_1 = require("@libs/defaultCover");
var storage_1 = require("@libs/storage");
var LightNovelWPPlugin = /** @class */ (function () {
    function LightNovelWPPlugin(metadata) {
        var _a, _b, _c;
        this.hideLocked = storage_1.storage.get('hideLocked');
        this.id = metadata.id;
        this.name = metadata.sourceName;
        this.icon = "multisrc/lightnovelwp/".concat(metadata.id.toLowerCase(), "/icon.png");
        this.site = metadata.sourceSite;
        var versionIncrements = ((_a = metadata.options) === null || _a === void 0 ? void 0 : _a.versionIncrements) || 0;
        this.version = "1.1.".concat(9 + versionIncrements);
        this.options = (_b = metadata.options) !== null && _b !== void 0 ? _b : {};
        this.filters = metadata.filters;
        if ((_c = this.options) === null || _c === void 0 ? void 0 : _c.hasLocked) {
            this.pluginSettings = {
                hideLocked: {
                    value: '',
                    label: 'Hide locked chapters',
                    type: 'Switch',
                },
            };
        }
    }
    LightNovelWPPlugin.prototype.getHostname = function (url) {
        url = url.split('/')[2];
        var url_parts = url.split('.');
        url_parts.pop(); // remove TLD
        return url_parts.join('.');
    };
    LightNovelWPPlugin.prototype.safeFecth = function (url, search) {
        return __awaiter(this, void 0, void 0, function () {
            var urlParts, protocol, sanitizedUri, r, data, title;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        urlParts = url.split('://');
                        protocol = urlParts.shift();
                        sanitizedUri = urlParts[0].replace(/\/\//g, '/');
                        return [4 /*yield*/, (0, fetch_1.fetchApi)(protocol + '://' + sanitizedUri)];
                    case 1:
                        r = _c.sent();
                        if (!r.ok && search != true)
                            throw new Error('Could not reach site (' + r.status + ') try to open in webview.');
                        return [4 /*yield*/, r.text()];
                    case 2:
                        data = _c.sent();
                        title = (_b = (_a = data.match(/<title>(.*?)<\/title>/)) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.trim();
                        if (this.getHostname(url) != this.getHostname(r.url) ||
                            (title &&
                                (title == 'Bot Verification' ||
                                    title == 'You are being redirected...' ||
                                    title == 'Un instant...' ||
                                    title == 'Just a moment...' ||
                                    title == 'Redirecting...')))
                            throw new Error('Captcha error, please open in webview (or the website has changed url)');
                        return [2 /*return*/, data];
                }
            });
        });
    };
    LightNovelWPPlugin.prototype.parseNovels = function (html) {
        var _this = this;
        html = (0, cheerio_1.load)(html).html(); // fix "'" beeing replaced by "&#8217;" (html entities)
        var novels = [];
        var articles = html.match(/<article([^]*?)<\/article>/g) || [];
        articles.forEach(function (article) {
            var _a = article.match(/<a href="([^\"]*)".*? title="([^\"]*)"/) || [], novelUrl = _a[1], novelName = _a[2];
            if (novelName && novelUrl) {
                var novelCover = article.match(/<img [^>]*?src="([^\"]*)"[^>]*?(?: data-src="([^\"]*)")?[^>]*>/) || [];
                var novelPath = void 0;
                if (novelUrl.includes(_this.site)) {
                    novelPath = novelUrl.replace(_this.site, '');
                }
                else {
                    // TODO: report website new url to server
                    var novelParts = novelUrl.split('/');
                    novelParts.shift();
                    novelParts.shift();
                    novelParts.shift();
                    novelPath = novelParts.join('/');
                }
                novels.push({
                    name: novelName,
                    cover: novelCover[2] || novelCover[1] || defaultCover_1.defaultCover,
                    path: novelPath,
                });
            }
        });
        return novels;
    };
    LightNovelWPPlugin.prototype.popularNovels = function (pageNo_1, _a) {
        return __awaiter(this, arguments, void 0, function (pageNo, _b) {
            var seriesPath, url, key, _i, _c, value, html;
            var _d, _e;
            var filters = _b.filters, showLatestNovels = _b.showLatestNovels;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        seriesPath = (_e = (_d = this.options) === null || _d === void 0 ? void 0 : _d.seriesPath) !== null && _e !== void 0 ? _e : '/series/';
                        url = this.site + seriesPath + '?page=' + pageNo;
                        if (!filters)
                            filters = this.filters || {};
                        if (showLatestNovels)
                            url += '&order=latest';
                        for (key in filters) {
                            if (typeof filters[key].value === 'object')
                                for (_i = 0, _c = filters[key].value; _i < _c.length; _i++) {
                                    value = _c[_i];
                                    url += "&".concat(key, "=").concat(value);
                                }
                            else if (filters[key].value)
                                url += "&".concat(key, "=").concat(filters[key].value);
                        }
                        return [4 /*yield*/, this.safeFecth(url, false)];
                    case 1:
                        html = _f.sent();
                        return [2 /*return*/, this.parseNovels(html)];
                }
            });
        });
    };
    LightNovelWPPlugin.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var baseURL, html, novel, isParsingGenres, isReadingGenre, isReadingSummary, isParsingInfo, isReadingInfo, isReadingAuthor, isReadingArtist, isReadingStatus, isParsingChapterList, isReadingChapter, isReadingChapterInfo, isPaidChapter, hasLockItemOnChapterNum, chapters, tempChapter, hideLocked, parser;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        baseURL = this.site;
                        return [4 /*yield*/, this.safeFecth(baseURL + novelPath, false)];
                    case 1:
                        html = _b.sent();
                        novel = {
                            path: novelPath,
                            name: '',
                            genres: '',
                            summary: '',
                            author: '',
                            artist: '',
                            status: '',
                            chapters: [],
                        };
                        isParsingGenres = false;
                        isReadingGenre = false;
                        isReadingSummary = 0;
                        isParsingInfo = false;
                        isReadingInfo = false;
                        isReadingAuthor = false;
                        isReadingArtist = false;
                        isReadingStatus = false;
                        isParsingChapterList = false;
                        isReadingChapter = false;
                        isReadingChapterInfo = 0;
                        isPaidChapter = false;
                        hasLockItemOnChapterNum = false;
                        chapters = [];
                        tempChapter = {};
                        hideLocked = this.hideLocked;
                        parser = new htmlparser2_1.Parser({
                            onopentag: function (name, attribs) {
                                var _a;
                                // name and cover
                                if (!novel.cover && ((_a = attribs['class']) === null || _a === void 0 ? void 0 : _a.includes('ts-post-image'))) {
                                    novel.name = attribs['title'];
                                    novel.cover = attribs['data-src'] || attribs['src'] || defaultCover_1.defaultCover;
                                } // genres
                                else if (attribs['class'] === 'genxed' ||
                                    attribs['class'] === 'sertogenre') {
                                    isParsingGenres = true;
                                }
                                else if (isParsingGenres && name === 'a') {
                                    isReadingGenre = true;
                                } // summary
                                else if (name === 'div' &&
                                    (attribs['class'] === 'entry-content' ||
                                        attribs['itemprop'] === 'description')) {
                                    isReadingSummary++;
                                } // author and status
                                else if (attribs['class'] === 'spe' || attribs['class'] === 'serl') {
                                    isParsingInfo = true;
                                }
                                else if (isParsingInfo && name === 'span') {
                                    isReadingInfo = true;
                                }
                                else if (name === 'div' && attribs['class'] === 'sertostat') {
                                    isParsingInfo = true;
                                    isReadingInfo = true;
                                    isReadingStatus = true;
                                }
                                // chapters
                                else if (attribs['class'] && attribs['class'].includes('eplister')) {
                                    isParsingChapterList = true;
                                }
                                else if (isParsingChapterList && name === 'li') {
                                    isReadingChapter = true;
                                }
                                else if (isReadingChapter) {
                                    if (name === 'a' && tempChapter.path === undefined) {
                                        tempChapter.path = attribs['href'].replace(baseURL, '').trim();
                                    }
                                    else if (attribs['class'] === 'epl-num') {
                                        isReadingChapterInfo = 1;
                                    }
                                    else if (attribs['class'] === 'epl-title') {
                                        isReadingChapterInfo = 2;
                                    }
                                    else if (attribs['class'] === 'epl-date') {
                                        isReadingChapterInfo = 3;
                                    }
                                    else if (attribs['class'] === 'epl-price') {
                                        isReadingChapterInfo = 4;
                                    }
                                }
                                else if (isReadingSummary && (name === 'div' || name === 'script')) {
                                    isReadingSummary++;
                                }
                            },
                            ontext: function (data) {
                                var _a, _b;
                                // genres
                                if (isParsingGenres) {
                                    if (isReadingGenre) {
                                        novel.genres += data + ', ';
                                    }
                                } // summary
                                else if (isReadingSummary === 1 && data.trim()) {
                                    novel.summary += data;
                                } // author and status
                                else if (isParsingInfo) {
                                    if (isReadingInfo) {
                                        var detailName = data.toLowerCase().replace(':', '').trim();
                                        if (isReadingAuthor) {
                                            novel.author += data || 'Unknown';
                                        }
                                        else if (isReadingArtist) {
                                            novel.artist += data || 'Unknown';
                                        }
                                        else if (isReadingStatus) {
                                            switch (detailName) {
                                                case 'مكتملة':
                                                case 'completed':
                                                case 'complété':
                                                case 'completo':
                                                case 'completado':
                                                case 'tamamlandı':
                                                    novel.status = novelStatus_1.NovelStatus.Completed;
                                                    break;
                                                case 'مستمرة':
                                                case 'ongoing':
                                                case 'en cours':
                                                case 'em andamento':
                                                case 'en progreso':
                                                case 'devam ediyor':
                                                    novel.status = novelStatus_1.NovelStatus.Ongoing;
                                                    break;
                                                case 'متوقفة':
                                                case 'hiatus':
                                                case 'en pause':
                                                case 'hiato':
                                                case 'pausa':
                                                case 'pausado':
                                                case 'duraklatıldı':
                                                    novel.status = novelStatus_1.NovelStatus.OnHiatus;
                                                    break;
                                                default:
                                                    novel.status = novelStatus_1.NovelStatus.Unknown;
                                                    break;
                                            }
                                        }
                                        switch (detailName) {
                                            case 'الكاتب':
                                            case 'author':
                                            case 'auteur':
                                            case 'autor':
                                            case 'yazar':
                                                isReadingAuthor = true;
                                                break;
                                            case 'الحالة':
                                            case 'status':
                                            case 'statut':
                                            case 'estado':
                                            case 'durum':
                                                isReadingStatus = true;
                                                break;
                                            case 'الفنان':
                                            case 'artist':
                                            case 'artiste':
                                            case 'artista':
                                            case 'çizer':
                                                isReadingArtist = true;
                                                break;
                                        }
                                    }
                                } // chapters
                                else if (isParsingChapterList) {
                                    if (isReadingChapter) {
                                        if (isReadingChapterInfo === 1) {
                                            if (data.includes('🔒')) {
                                                isPaidChapter = true;
                                                hasLockItemOnChapterNum = true;
                                            }
                                            else if (hasLockItemOnChapterNum) {
                                                isPaidChapter = false;
                                            }
                                            extractChapterNumber(data, tempChapter);
                                        }
                                        else if (isReadingChapterInfo === 2) {
                                            tempChapter.name =
                                                ((_b = (_a = data
                                                    .match(RegExp("^".concat(novel.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "\\s*(.+)")))) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.trim()) || data.trim();
                                            if (!tempChapter.chapterNumber) {
                                                extractChapterNumber(data, tempChapter);
                                            }
                                        }
                                        else if (isReadingChapterInfo === 3) {
                                            tempChapter.releaseTime = data; //new Date(data).toISOString();
                                        }
                                        else if (isReadingChapterInfo === 4) {
                                            var detailName = data.toLowerCase().trim();
                                            switch (detailName) {
                                                case 'free':
                                                case 'gratuit':
                                                case 'مجاني':
                                                case 'livre':
                                                case '':
                                                    isPaidChapter = false;
                                                    break;
                                                default:
                                                    isPaidChapter = true;
                                                    break;
                                            }
                                        }
                                    }
                                }
                            },
                            onclosetag: function (name) {
                                var _a, _b, _c;
                                // genres
                                if (isParsingGenres) {
                                    if (isReadingGenre) {
                                        isReadingGenre = false; // stop reading genre
                                    }
                                    else {
                                        isParsingGenres = false; // stop parsing genres
                                        novel.genres = (_a = novel.genres) === null || _a === void 0 ? void 0 : _a.slice(0, -2); // remove trailing comma
                                    }
                                } // summary
                                else if (isReadingSummary) {
                                    if (name === 'p') {
                                        novel.summary += '\n\n';
                                    }
                                    else if (name === 'br') {
                                        novel.summary += '\n';
                                    }
                                    else if (name === 'div' || name === 'script') {
                                        isReadingSummary--;
                                    }
                                } // author and status
                                else if (isParsingInfo) {
                                    if (isReadingInfo) {
                                        if (name === 'span') {
                                            isReadingInfo = false;
                                            if (isReadingAuthor && novel.author) {
                                                isReadingAuthor = false;
                                            }
                                            else if (isReadingArtist && novel.artist) {
                                                isReadingArtist = false;
                                            }
                                            else if (isReadingStatus && novel.status !== '') {
                                                isReadingStatus = false;
                                            }
                                        }
                                    }
                                    else if (name === 'div') {
                                        isParsingInfo = false;
                                        novel.author = (_b = novel.author) === null || _b === void 0 ? void 0 : _b.trim();
                                        novel.artist = (_c = novel.artist) === null || _c === void 0 ? void 0 : _c.trim();
                                    }
                                } // chapters
                                else if (isParsingChapterList) {
                                    if (isReadingChapter) {
                                        if (isReadingChapterInfo === 1) {
                                            isReadingChapterInfo = 0;
                                        }
                                        else if (isReadingChapterInfo === 2) {
                                            isReadingChapterInfo = 0;
                                        }
                                        else if (isReadingChapterInfo === 3) {
                                            isReadingChapterInfo = 0;
                                        }
                                        else if (isReadingChapterInfo === 4) {
                                            isReadingChapterInfo = 0;
                                        }
                                        else if (name === 'li') {
                                            isReadingChapter = false;
                                            if (!tempChapter.chapterNumber)
                                                tempChapter.chapterNumber = 0;
                                            if (isPaidChapter)
                                                tempChapter.name = '🔒 ' + tempChapter.name;
                                            if (!hideLocked || !isPaidChapter)
                                                chapters.push(tempChapter);
                                            tempChapter = {};
                                        }
                                    }
                                    else if (name === 'ul') {
                                        isParsingChapterList = false;
                                    }
                                }
                            },
                        });
                        parser.write(html);
                        parser.end();
                        if (chapters.length) {
                            if ((_a = this.options) === null || _a === void 0 ? void 0 : _a.reverseChapters)
                                chapters.reverse();
                            novel.chapters = chapters;
                        }
                        novel.summary = novel.summary.trim();
                        return [2 /*return*/, novel];
                }
            });
        });
    };
    LightNovelWPPlugin.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var data, $_1;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, this.safeFecth(this.site + chapterPath, false)];
                    case 1:
                        data = _e.sent();
                        if ((_a = this.options) === null || _a === void 0 ? void 0 : _a.customJs) {
                            try {
                                $_1 = (0, cheerio_1.load)(data);
                                (_b = $_1('article > style').text().match(/\.\w+(?=\s*[,{])/g)) === null || _b === void 0 ? void 0 : _b.forEach(function (tag) { return $_1("p".concat(tag)).remove(); });
                                $_1('.epcontent .code-block').remove();
                                data = $_1.html();
                            }
                            catch (error) {
                                console.error('Error executing customJs:', error);
                                throw error;
                            }
                        }
                        return [2 /*return*/, (((_d = (_c = data
                                .match(/<div.*?class="epcontent ([^]*?)<div.*?class="?bottomnav/g)) === null || _c === void 0 ? void 0 : _c[0].match(/<p[^>]*>([^]*?)<\/p>/g)) === null || _d === void 0 ? void 0 : _d.join('\n')) || '')];
                }
            });
        });
    };
    LightNovelWPPlugin.prototype.searchNovels = function (searchTerm, page) {
        return __awaiter(this, void 0, void 0, function () {
            var url, html;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = this.site + 'page/' + page + '/?s=' + encodeURIComponent(searchTerm);
                        return [4 /*yield*/, this.safeFecth(url, true)];
                    case 1:
                        html = _a.sent();
                        return [2 /*return*/, this.parseNovels(html)];
                }
            });
        });
    };
    return LightNovelWPPlugin;
}());
function extractChapterNumber(data, tempChapter) {
    var tempChapterNumber = data.match(/(\d+)$/);
    if (tempChapterNumber && tempChapterNumber[0]) {
        tempChapter.chapterNumber = parseInt(tempChapterNumber[0]);
    }
}
var plugin = new LightNovelWPPlugin({ "id": "kolnovel", "sourceSite": "https://kolnovel.site/", "sourceName": "Kol Novel", "options": { "lang": "Arabic", "reverseChapters": true, "customJs": "$('article > style').text().match(/\\.\\w+(?=\\s*[,{])/g)?.forEach(tag => $(`p${tag}`).remove());$('.epcontent .code-block').remove();", "versionIncrements": 9 }, "filters": { "genre[]": { "type": "Checkbox", "label": "تصنيف", "value": [], "options": [{ "label": "Romance", "value": "romance" }, { "label": "Shounen Ai", "value": "shounen-ai" }, { "label": "Wuxia", "value": "wuxia" }, { "label": "Xianxia", "value": "xianxia" }, { "label": "XUANHUAN", "value": "xuanhuan" }, { "label": "أبطال خارقين", "value": "أبطال-خارقين" }, { "label": "أساطير", "value": "أساطير" }, { "label": "أشباح", "value": "أشباح" }, { "label": "أكشن", "value": "action" }, { "label": "ألعاب", "value": "ألعاب" }, { "label": "إثارة", "value": "excitement" }, { "label": "إسلامي", "value": "إسلامي" }, { "label": "إنتقال الى عالم أخر", "value": "isekai" }, { "label": "إيتشي", "value": "etchi" }, { "label": "اكاديمي", "value": "اكاديمي" }, { "label": "اكشن", "value": "اكشن" }, { "label": "الإثارة", "value": "الإثارة" }, { "label": "الخيال العلمي", "value": "sci-fi" }, { "label": "الدراما", "value": "الدراما" }, { "label": "المغامرات", "value": "المغامرات" }, { "label": "انتقام", "value": "انتقام" }, { "label": "بطل مضاد", "value": "بطل-مضاد" }, { "label": "بطل ناضج", "value": "بطل-ناضج" }, { "label": "بقاء", "value": "بقاء" }, { "label": "بناء مملكة", "value": "بناء-مملكة" }, { "label": "بوليسي", "value": "policy" }, { "label": "تاريخ", "value": "تاريخ" }, { "label": "تاريخي", "value": "historical" }, { "label": "تحقيقات", "value": "تحقيق" }, { "label": "تشويق", "value": "تشويق" }, { "label": "تقمص شخصيات", "value": "rpg" }, { "label": "تلاعب", "value": "تلاعب" }, { "label": "تناسخ", "value": "تناسخ" }, { "label": "جريمة", "value": "crime" }, { "label": "جوسى", "value": "josei" }, { "label": "جوسي", "value": "جوسي" }, { "label": "حريم", "value": "harem" }, { "label": "حل الألغاز", "value": "حل-الألغاز" }, { "label": "حياة مدرسية", "value": "school-life" }, { "label": "خارق للطبيعة", "value": "خارق-للطبيعة" }, { "label": "خيال", "value": "خيال" }, { "label": "خيال علمي", "value": "خيال-علمي" }, { "label": "خيالي", "value": "خيالي" }, { "label": "خيالي(فانتازيا)", "value": "fantasy" }, { "label": "دراما", "value": "drama" }, { "label": "درامي", "value": "درامي" }, { "label": "رعب", "value": "horror" }, { "label": "رعب كوني", "value": "رعب-كوني" }, { "label": "رعب نفسي", "value": "رعب-نفسي" }, { "label": "رومانسي", "value": "romantic" }, { "label": "رومانسية", "value": "رومانسية" }, { "label": "رومنسية", "value": "رومنسية" }, { "label": "زنزانة", "value": "زنزانة" }, { "label": "زيانشيا", "value": "زيانشيا" }, { "label": "ستيم بانك", "value": "ستيم-بانك" }, { "label": "سحر", "value": "magic" }, { "label": "سفر بالزمن", "value": "سفر-بالزمن" }, { "label": "سفر عبر الزمن", "value": "سفر-عبر-الزمن" }, { "label": "سياسة", "value": "سياسة" }, { "label": "سينن", "value": "senen" }, { "label": "شريحة من الحياة", "value": "slice-of-life" }, { "label": "شعر", "value": "شعر" }, { "label": "شوانهان", "value": "شوانهان" }, { "label": "شوانهوان", "value": "شوانهوان" }, { "label": "شوجو", "value": "shojo" }, { "label": "شونين", "value": "shonen" }, { "label": "شيانشيا", "value": "شيانشيا" }, { "label": "طبي", "value": "medical" }, { "label": "ظواهر خارقة للطبيعة", "value": "supernatural" }, { "label": "عائلي", "value": "عائلي" }, { "label": "عموض", "value": "عموض" }, { "label": "غموض", "value": "mysteries" }, { "label": "فانتازي", "value": "فانتازي" }, { "label": "فانتازيا", "value": "فانتازيا" }, { "label": "فانفيك", "value": "فانفيك" }, { "label": "فنتازيا", "value": "فنتازيا" }, { "label": "فنون القتال", "value": "martial-arts" }, { "label": "فنون قتال", "value": "فنون-قتال" }, { "label": "قصة قصيرة", "value": "قصة-قصيرة" }, { "label": "قوة خارقة", "value": "قوة-خارقة" }, { "label": "قوى خارقة", "value": "superpower" }, { "label": "كوميدي", "value": "comedy" }, { "label": "كوميديا", "value": "كوميديا" }, { "label": "كوميدية", "value": "كوميدية" }, { "label": "مأسأة", "value": "مأسأة" }, { "label": "مأساة", "value": "مأساة" }, { "label": "مأساوي", "value": "tragedy" }, { "label": "مؤامرة", "value": "مؤامرة" }, { "label": "ما بعد الكارثة", "value": "after-the-disaster" }, { "label": "ما بعد نهاية العالم", "value": "ما-بعد-نهاية-العالم" }, { "label": "مضاد البطل", "value": "مضاد-البطل" }, { "label": "مغامرات", "value": "مغامرات" }, { "label": "مغامرة", "value": "adventure" }, { "label": "ميكا", "value": "mechanical" }, { "label": "ناضج", "value": "mature" }, { "label": "نظام", "value": "نظام" }, { "label": "نفسي", "value": "psychological" }, { "label": "ون شوت", "value": "ون-شوت" }, { "label": "ووشيا", "value": "ووشيا" }, { "label": "ووكسيا", "value": "ووكسيا" }] }, "type[]": { "type": "Checkbox", "label": "النوع", "value": [], "options": [{ "label": "إنجليزية", "value": "english" }, { "label": "ترجمة إحترافية", "value": "ترجمة-إحترافية" }, { "label": "رواية لايت", "value": "light-novel" }, { "label": "رواية مؤلفة", "value": "رواية-مؤلفة" }, { "label": "رواية مترجمة", "value": "رواية-مترجمة" }, { "label": "رواية ويب", "value": "web-novel" }, { "label": "صينية", "value": "chinese" }, { "label": "عربية", "value": "arabic" }, { "label": "كورية", "value": "korean" }, { "label": "مؤلفة", "value": "مؤلفة" }, { "label": "ون شوت", "value": "ون-شوت" }, { "label": "يابانية", "value": "japanese" }] }, "status": { "type": "Picker", "label": "الحالة", "value": "", "options": [{ "label": "الكل", "value": "" }, { "label": "Ongoing", "value": "ongoing" }, { "label": "Hiatus", "value": "hiatus" }, { "label": "Completed", "value": "completed" }] }, "order": { "type": "Picker", "label": "ترتيب حسب", "value": "", "options": [{ "label": "الإعداد الأولي", "value": "" }, { "label": "A-Z", "value": "title" }, { "label": "Z-A", "value": "titlereverse" }, { "label": "أخر التحديثات", "value": "update" }, { "label": "أخر ما تم إضافته", "value": "latest" }, { "label": "الرائجة", "value": "popular" }, { "label": "التقييم", "value": "rating" }] } } });
exports.default = plugin;
