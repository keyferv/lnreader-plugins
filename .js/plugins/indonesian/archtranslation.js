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
var fetch_1 = require("@libs/fetch");
var cheerio_1 = require("cheerio");
var defaultCover_1 = require("@libs/defaultCover");
var novelStatus_1 = require("@libs/novelStatus");
var ArchTranslation = /** @class */ (function () {
    function ArchTranslation() {
        this.id = 'archtranslation';
        this.name = 'ArchTranslation';
        this.site = 'https://www.archtranslation.com';
        this.icon = 'src/id/archtranslation/icon.png';
        this.version = '1.1.1'; // Agrupación por Volúmenes
    }
    ArchTranslation.prototype.popularNovels = function (pageNo_1, _a) {
        return __awaiter(this, arguments, void 0, function (pageNo, _b) {
            var url, currentUrl, i, pageBody, page$, nextUrl, body, $, novels;
            var _this = this;
            var filters = _b.filters;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        url = "".concat(this.site, "/search/label/LN?max-results=6");
                        if (!(pageNo > 1)) return [3 /*break*/, 5];
                        currentUrl = url;
                        i = 1;
                        _c.label = 1;
                    case 1:
                        if (!(i < pageNo)) return [3 /*break*/, 4];
                        return [4 /*yield*/, (0, fetch_1.fetchText)(currentUrl)];
                    case 2:
                        pageBody = _c.sent();
                        page$ = (0, cheerio_1.load)(pageBody);
                        nextUrl = page$('.blog-pager-older-link').attr('href');
                        if (!nextUrl) {
                            return [2 /*return*/, []];
                        }
                        currentUrl = nextUrl;
                        _c.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4:
                        url = currentUrl;
                        _c.label = 5;
                    case 5: return [4 /*yield*/, (0, fetch_1.fetchText)(url)];
                    case 6:
                        body = _c.sent();
                        $ = (0, cheerio_1.load)(body);
                        novels = [];
                        $('.blog-post').each(function (i, el) {
                            var title = $(el).find('.entry-title a').text().trim();
                            var path = $(el).find('.entry-title a').attr('href');
                            var img = $(el).find('.post-filter-image img');
                            if (img.length === 0)
                                img = $(el).find('img');
                            var cover = img.first().attr('data-src') || img.first().attr('src');
                            if (cover) {
                                if (cover.startsWith('//'))
                                    cover = 'https:' + cover;
                                cover = cover.replace(/=[^=]+$/, '=s0');
                            }
                            title = title.replace(/(Chapter|Vol|Volume)\s*\d+.*/i, '').trim();
                            if (path && title) {
                                novels.push({
                                    name: title,
                                    path: path.replace(_this.site, ''),
                                    cover: cover || defaultCover_1.defaultCover,
                                });
                            }
                        });
                        return [2 /*return*/, novels];
                }
            });
        });
    };
    ArchTranslation.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var body, $, postBody, coverUrl, coverImg, rawCoverUrl, chapters, chapterSet, currentVolume, chapterRegex, projectUrl_1, newPath, contentText, novel, authorMatch, artistMatch, genreMatch, statusMatch, status_1, sinopsisIndex, summary, nextSectionMatch;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchText)(this.site + novelPath)];
                    case 1:
                        body = _a.sent();
                        $ = (0, cheerio_1.load)(body);
                        postBody = $('#postBody');
                        if (postBody.length === 0)
                            postBody = $('.post-body');
                        if (postBody.length === 0)
                            postBody = $('.entry-content');
                        coverUrl = defaultCover_1.defaultCover;
                        coverImg = postBody.find('.separator img').first();
                        if (coverImg.length === 0)
                            coverImg = postBody.find('img').first();
                        rawCoverUrl = coverImg.attr('data-src') || coverImg.attr('src');
                        if (rawCoverUrl) {
                            if (rawCoverUrl.startsWith('//'))
                                rawCoverUrl = 'https:' + rawCoverUrl;
                            else if (rawCoverUrl.startsWith('/'))
                                rawCoverUrl = this.site + rawCoverUrl;
                            rawCoverUrl = rawCoverUrl.replace(/=[^=]+$/, '=s0');
                            coverUrl = rawCoverUrl;
                        }
                        chapters = [];
                        chapterSet = new Set();
                        currentVolume = '';
                        chapterRegex = /Chapter|Vol|Prolo|Epilo|Ilustra|Selingan|Short story|Side Story|Extras|Ekstra|Batch|Tamat|Bagian/i;
                        // Recorremos TODOS los elementos en orden para detectar encabezados de volumen
                        postBody.find('*').each(function (i, el) {
                            var $el = $(el);
                            // A) Detección de Cabecera de Volumen
                            // Si el elemento contiene texto como "Volume 1", actualizamos currentVolume
                            // Ignoramos enlaces para esto, solo texto plano o contenedores
                            if (el.tagName !== 'a') {
                                var text = $el.text().trim();
                                // Regex estricto: Debe ser "Volume X" o "Vol X" exacto
                                if (/^(Volume|Vol\.?)\s*\d+$/i.test(text)) {
                                    currentVolume = text;
                                    return;
                                }
                            }
                            // B) Detección de Capítulo
                            if (el.tagName === 'a') {
                                var href = $el.attr('href');
                                var text = $el.text().trim();
                                if (href && text) {
                                    if (href && href.startsWith('//'))
                                        href = 'https:' + href;
                                    else if (href && href.startsWith('/'))
                                        href = _this.site + href;
                                    if (href && href.includes('archtranslation.com')) {
                                        href = href.split('?')[0];
                                        var isExcluded = href.includes('/search/label') ||
                                            href.includes('/author/') ||
                                            href.replace(_this.site, '') === novelPath;
                                        if (chapterRegex.test(text) && !isExcluded) {
                                            if (!chapterSet.has(href)) {
                                                chapterSet.add(href);
                                                // Construimos el nombre final
                                                var displayName = text;
                                                if (currentVolume) {
                                                    displayName = "".concat(currentVolume, " ").concat(text);
                                                }
                                                chapters.push({
                                                    name: displayName,
                                                    path: href.replace(_this.site, ''),
                                                    releaseTime: null,
                                                    chapterNumber: chapters.length + 1,
                                                    // volume: currentVolume || undefined, // Agrupa en la UI si la app lo soporta
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        });
                        // --- 3. REDIRECCIÓN (Fallback) ---
                        if (chapters.length === 0 && novelPath.match(/\/\d{4}\/\d{2}\//)) {
                            $('a[href*="/p/"]').each(function (_, el) {
                                var href = $(el).attr('href');
                                var text = $(el).text().toLowerCase();
                                if (href && href.includes(_this.site)) {
                                    if (!text.includes('privacy') && !text.includes('dmca')) {
                                        var currentTitle = $('.entry-title').text().trim().toLowerCase();
                                        if (currentTitle.includes(text) ||
                                            text.includes('project') ||
                                            text.includes('toc')) {
                                            projectUrl_1 = href;
                                            return false;
                                        }
                                    }
                                }
                            });
                            if (projectUrl_1) {
                                newPath = projectUrl_1.replace(this.site, '');
                                if (newPath !== novelPath)
                                    return [2 /*return*/, this.parseNovel(newPath)];
                            }
                        }
                        contentText = '';
                        postBody.find('div, p, span, h4').each(function (_, el) {
                            var t = $(el).text().trim();
                            if (t)
                                contentText += t + '\n';
                        });
                        novel = {
                            path: novelPath,
                            name: $('.entry-title').text().trim() || 'Untitled',
                            cover: coverUrl,
                            chapters: chapters,
                        };
                        authorMatch = contentText.match(/Author\s*:\s*(.+)/i);
                        artistMatch = contentText.match(/Artist\s*:\s*(.+)/i);
                        genreMatch = contentText.match(/Genre\s*:\s*(.+)/i);
                        statusMatch = contentText.match(/Status\s*:\s*(.+)/i);
                        if (authorMatch)
                            novel.author = authorMatch[1].trim();
                        if (artistMatch)
                            novel.artist = artistMatch[1].trim();
                        if (genreMatch)
                            novel.genres = genreMatch[1].trim();
                        if (statusMatch) {
                            status_1 = statusMatch[1].toLowerCase();
                            if (status_1.includes('ongoing'))
                                novel.status = novelStatus_1.NovelStatus.Ongoing;
                            else if (status_1.includes('completed'))
                                novel.status = novelStatus_1.NovelStatus.Completed;
                            else if (status_1.includes('hiatus'))
                                novel.status = novelStatus_1.NovelStatus.OnHiatus;
                            else
                                novel.status = novelStatus_1.NovelStatus.Unknown;
                        }
                        sinopsisIndex = contentText.toLowerCase().indexOf('sinopsis');
                        if (sinopsisIndex !== -1) {
                            summary = contentText.substring(sinopsisIndex + 9);
                            nextSectionMatch = summary.match(/(Volume \d+|Chapter \d+|Prolo(g|ue))/i);
                            if (nextSectionMatch && nextSectionMatch.index) {
                                summary = summary.substring(0, nextSectionMatch.index);
                            }
                            novel.summary = summary.trim();
                        }
                        else {
                            novel.summary = contentText.substring(0, 300) + '...';
                        }
                        return [2 /*return*/, novel];
                }
            });
        });
    };
    ArchTranslation.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var body, $, content;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchText)(this.site + chapterPath)];
                    case 1:
                        body = _a.sent();
                        $ = (0, cheerio_1.load)(body);
                        content = $('.post-body');
                        content
                            .find('#bottom-ad-placeholder, .widget, .adsbygoogle, script, #related-post, .post-footer')
                            .remove();
                        content.find('.btn, .separator a').remove();
                        content.find('a').each(function (_, el) {
                            var text = $(el).text().trim().toLowerCase();
                            if (text === 'previous' ||
                                text === 'next' ||
                                text === 'contents' ||
                                text.includes('daftar isi')) {
                                $(el).remove();
                            }
                        });
                        content.find('img').each(function (i, el) {
                            var dataSrc = $(el).attr('data-src');
                            if (dataSrc) {
                                $(el).attr('src', dataSrc);
                                $(el).removeAttr('data-src');
                            }
                            var src = $(el).attr('src');
                            if (src) {
                                if (src.includes('blogger.googleusercontent.com')) {
                                    src = src.replace(/=[^=]+$/, '=s1600');
                                }
                                $(el).attr('src', src);
                            }
                            $(el).removeAttr('style');
                            $(el).removeAttr('height');
                            $(el).removeAttr('width');
                        });
                        content.find('.separator').removeAttr('style').css('text-align', 'center');
                        return [2 /*return*/, content.html() || ''];
                }
            });
        });
    };
    ArchTranslation.prototype.searchNovels = function (searchTerm, pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var url, body, $, novels;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "".concat(this.site, "/search?q=").concat(encodeURIComponent(searchTerm), "&max-results=20&start=").concat((pageNo - 1) * 20);
                        return [4 /*yield*/, (0, fetch_1.fetchText)(url)];
                    case 1:
                        body = _a.sent();
                        $ = (0, cheerio_1.load)(body);
                        novels = [];
                        $('.blog-post').each(function (i, el) {
                            var title = $(el).find('.entry-title a').text().trim();
                            var path = $(el).find('.entry-title a').attr('href');
                            var img = $(el).find('.post-filter-image img');
                            if (img.length === 0)
                                img = $(el).find('img');
                            var cover = img.first().attr('data-src') || img.first().attr('src');
                            if (cover) {
                                if (cover.startsWith('//'))
                                    cover = 'https:' + cover;
                                cover = cover.replace(/=[^=]+$/, '=s0');
                            }
                            title = title.replace(/(Chapter|Vol|Volume)\s*\d+.*/i, '').trim();
                            if (path && title) {
                                novels.push({
                                    name: title,
                                    path: path.replace(_this.site, ''),
                                    cover: cover || defaultCover_1.defaultCover,
                                });
                            }
                        });
                        return [2 /*return*/, novels];
                }
            });
        });
    };
    return ArchTranslation;
}());
exports.default = new ArchTranslation();
