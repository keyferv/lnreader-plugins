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
function cleanText(input) {
    return (input || '').replace(/\s+/g, ' ').trim();
}
function getImgSrc($, el) {
    if (!el)
        return undefined;
    var img = $(el);
    return (img.attr('data-lazy-src') ||
        img.attr('data-src') ||
        img.attr('data-original') ||
        img.attr('src') ||
        undefined);
}
function absolutizeUrl(site, href) {
    try {
        return new URL(href, site).toString();
    }
    catch (_a) {
        return href;
    }
}
function toPath(site, fullUrl) {
    var normalizedSite = site.replace(/\/$/, '');
    return fullUrl.replace(normalizedSite, '').replace(/^\//, '');
}
var NovelasLigerasNet = /** @class */ (function () {
    function NovelasLigerasNet() {
        this.id = 'novelasligerasnet';
        this.name = 'Novelas Ligeras (net)';
        this.icon = 'src/es/novelasligerasnet/icon.png';
        this.site = 'https://novelasligeras.net/';
        this.version = '1.0.1';
        this.filters = {
            category: {
                type: filterInputs_1.FilterTypes.Picker,
                label: 'Categoría',
                value: '',
                options: [
                    { label: 'Cualquiera', value: '' },
                    { label: 'Acción', value: '40' },
                    { label: 'Adulto', value: '53' },
                    { label: 'Artes Marciales', value: '52' },
                    { label: 'Aventura', value: '41' },
                    { label: 'Ciencia Ficción', value: '59' },
                    { label: 'Comedia', value: '43' },
                    { label: 'Deportes', value: '68' },
                    { label: 'Drama', value: '44' },
                    { label: 'Ecchi', value: '45' },
                    { label: 'Fantasía', value: '46' },
                    { label: 'Gender Bender', value: '47' },
                    { label: 'Harem', value: '48' },
                    { label: 'Histórico', value: '49' },
                    { label: 'Horror', value: '50' },
                    { label: 'Josei', value: '51' },
                    { label: 'Mechas', value: '54' },
                    { label: 'Misterio', value: '55' },
                    { label: 'Psicológico', value: '56' },
                    { label: 'Recuentos de la Vida', value: '66' },
                    { label: 'Romance', value: '57' },
                    { label: 'Seinen', value: '60' },
                    { label: 'Shojo', value: '62' },
                    { label: 'Shojo Ai', value: '63' },
                    { label: 'Shonen', value: '64' },
                    { label: 'Smut', value: '67' },
                    { label: 'Sobrenatural', value: '69' },
                    { label: 'Tragedia', value: '70' },
                    { label: 'Vida Escolar', value: '58' },
                    { label: 'Xianxia', value: '72' },
                    { label: 'Xuanhuan', value: '73' },
                    { label: 'Yuri', value: '75' },
                ],
            },
            status: {
                type: filterInputs_1.FilterTypes.Picker,
                label: 'Estado',
                value: '',
                options: [
                    { label: 'Cualquiera', value: '' },
                    { label: 'Cancelado', value: '18' },
                    { label: 'Completado', value: '407' },
                    { label: 'En Proceso', value: '16' },
                    { label: 'Pausado', value: '17' },
                ],
            },
            type: {
                type: filterInputs_1.FilterTypes.Picker,
                label: 'Tipo',
                value: '',
                options: [
                    { label: 'Cualquiera', value: '' },
                    { label: 'Novela Ligera', value: '23' },
                    { label: 'Novela Web', value: '24' },
                ],
            },
            country: {
                type: filterInputs_1.FilterTypes.Picker,
                label: 'País',
                value: '',
                options: [
                    { label: 'Cualquiera', value: '' },
                    { label: 'China', value: '20' },
                    { label: 'Corea', value: '22' },
                    { label: 'Japón', value: '21' },
                ],
            },
        };
    }
    NovelasLigerasNet.prototype.resolveUrl = function (path) {
        try {
            return new URL(path, this.site).toString();
        }
        catch (_a) {
            return path;
        }
    };
    NovelasLigerasNet.prototype.getDocument = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var res, html;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(url, {
                            headers: {
                                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                            },
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok) {
                            throw new Error("Could not reach site (".concat(res.status, "). If this is Cloudflare-protected, open in webview or provide cookies (cf_clearance) in Settings."));
                        }
                        return [4 /*yield*/, res.text()];
                    case 2:
                        html = _a.sent();
                        return [2 /*return*/, (0, cheerio_1.load)(html)];
                }
            });
        });
    };
    NovelasLigerasNet.prototype.extractNovelCandidates = function ($, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var novels = [];
        var seen = new Set();
        var maxItems = options.max || 30;
        var pushNovel = function (name, url, cover) {
            var abs = absolutizeUrl(_this.site, url);
            var path = toPath(_this.site, abs);
            if (!path || seen.has(path))
                return;
            var cleanName = cleanText(name);
            if (!cleanName)
                return;
            seen.add(path);
            novels.push({ name: cleanName, path: path, cover: cover });
        };
        var looksLikeNovelUrl = function (href) {
            var h = href.toLowerCase();
            if (h.includes('wp-login') || h.includes('wp-admin'))
                return false;
            if (h.includes('#') ||
                h.startsWith('javascript:') ||
                h.startsWith('data:') ||
                h.startsWith('vbscript:'))
                return false;
            if (h.includes('mailto:') || h.includes('tel:'))
                return false;
            if (h.includes('/category/') || h.includes('/tag/'))
                return false;
            if (h.includes('/feed/') || h.includes('rss'))
                return false;
            // Common slugs
            return (h.includes('/producto/') ||
                h.includes('/product/') ||
                h.includes('novela') ||
                h.includes('novel') ||
                h.includes('serie') ||
                h.includes('series'));
        };
        // Prefer dt-css-grid (WooCommerce product grid)
        $('.dt-css-grid .wf-cell').each(function (_idx, cell) {
            var a = $(cell).find('h4.entry-title a[href]').first();
            var href = a.attr('href');
            if (!href)
                return;
            var abs = absolutizeUrl(_this.site, href);
            if (!abs.includes('novelasligeras.net'))
                return;
            if (!looksLikeNovelUrl(abs))
                return;
            var name = cleanText($(cell).attr('data-name')) ||
                cleanText(a.text()) ||
                cleanText(a.attr('title'));
            var cover = getImgSrc($, $(cell).find('img.attachment-woocommerce_thumbnail')[0]) ||
                getImgSrc($, $(cell).find('figure.woocom-project img')[0]) ||
                undefined;
            pushNovel(name, abs, cover);
        });
        if (novels.length)
            return novels.slice(0, maxItems);
        // Prefer article/title patterns (WordPress-ish)
        var selectors = [
            'article h2 a[href]',
            'article h3 a[href]',
            'article h4 a[href]',
            'h4.entry-title a[href]',
            '.entry-content a[href]',
            'main a[href]',
        ];
        for (var _i = 0, selectors_1 = selectors; _i < selectors_1.length; _i++) {
            var sel = selectors_1[_i];
            $(sel).each(function (_idx, a) {
                var href = $(a).attr('href');
                if (!href)
                    return;
                var abs = absolutizeUrl(_this.site, href);
                if (!abs.includes('novelasligeras.net'))
                    return;
                if (!looksLikeNovelUrl(abs))
                    return;
                var name = cleanText($(a).text()) || cleanText($(a).attr('title'));
                var cover = getImgSrc($, $(a).find('img')[0]) ||
                    getImgSrc($, $(a).closest('article').find('img')[0]);
                pushNovel(name, abs, cover);
            });
            if (novels.length >= maxItems)
                break;
        }
        return novels.slice(0, maxItems);
    };
    NovelasLigerasNet.prototype.popularNovels = function (pageNo_1, _a) {
        return __awaiter(this, arguments, void 0, function (pageNo, _b) {
            var base, params, listUrl, $, novels, $home;
            var _c, _d, _e, _f;
            var showLatestNovels = _b.showLatestNovels, filters = _b.filters;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        base = this.site + 'index.php/lista-de-novela-ligera-novela-web/';
                        params = new URLSearchParams();
                        params.set('paged', String(pageNo));
                        // URLs confirmadas por ti:
                        // - Recientes: /lista-de-novela-ligera-novela-web/
                        // - Popular:   /lista-de-novela-ligera-novela-web/?orderby=popularity
                        if (!showLatestNovels)
                            params.set('orderby', 'popularity');
                        if (filters) {
                            if ((_c = filters.category) === null || _c === void 0 ? void 0 : _c.value)
                                params.set('product-search-filter-product_cat', filters.category.value);
                            if ((_d = filters.status) === null || _d === void 0 ? void 0 : _d.value)
                                params.set('product-search-filter-pa_estado', filters.status.value);
                            if ((_e = filters.type) === null || _e === void 0 ? void 0 : _e.value)
                                params.set('product-search-filter-pa_tipo', filters.type.value);
                            if ((_f = filters.country) === null || _f === void 0 ? void 0 : _f.value)
                                params.set('product-search-filter-pa_pais', filters.country.value);
                        }
                        listUrl = "".concat(base, "?").concat(params.toString());
                        return [4 /*yield*/, this.getDocument(listUrl)];
                    case 1:
                        $ = _g.sent();
                        novels = this.extractNovelCandidates($, { max: 30 });
                        if (!!novels.length) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.getDocument(this.site)];
                    case 2:
                        $home = _g.sent();
                        return [2 /*return*/, this.extractNovelCandidates($home, { max: 30 })];
                    case 3: return [2 /*return*/, novels];
                }
            });
        });
    };
    NovelasLigerasNet.prototype.searchNovels = function (searchTerm, pageNo) {
        return __awaiter(this, void 0, void 0, function () {
            var params, url, $, novels, seen;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = new URLSearchParams();
                        params.set('s', searchTerm);
                        params.set('post_type', 'product');
                        params.set('paged', String(pageNo));
                        url = "".concat(this.site, "?").concat(params.toString());
                        return [4 /*yield*/, this.getDocument(url)];
                    case 1:
                        $ = _a.sent();
                        novels = [];
                        seen = new Set();
                        $('article').each(function (_idx, article) {
                            var a = $(article).find('h2 a[href], h3 a[href], h4 a[href]').first();
                            var href = a.attr('href');
                            if (!href)
                                return;
                            var abs = absolutizeUrl(_this.site, href);
                            var path = toPath(_this.site, abs);
                            if (!path || seen.has(path))
                                return;
                            var name = cleanText(a.text()) || cleanText(a.attr('title'));
                            if (!name)
                                return;
                            var cover = getImgSrc($, $(article).find('img')[0]) ||
                                $(article).find('meta[property="og:image"]').attr('content') ||
                                undefined;
                            seen.add(path);
                            novels.push({ name: name, path: path, cover: cover });
                        });
                        if (novels.length)
                            return [2 /*return*/, novels];
                        // Broad fallback
                        return [2 /*return*/, this.extractNovelCandidates($, { max: 30 })];
                }
            });
        });
    };
    NovelasLigerasNet.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var url, $, name, cover, summary, novel, infoText, authorMatch, statusMatch, chapterLinks, chapterSelectors, looksLikeChapterUrl, _i, chapterSelectors_1, sel, seenChapter, chapters;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = this.resolveUrl(novelPath);
                        return [4 /*yield*/, this.getDocument(url)];
                    case 1:
                        $ = _a.sent();
                        name = cleanText($('h1.entry-title').first().text()) ||
                            cleanText($('h1').first().text()) ||
                            cleanText($('meta[property="og:title"]').attr('content')) ||
                            novelPath;
                        cover = $('meta[property="og:image"]').attr('content') ||
                            getImgSrc($, $('img.wp-post-image')[0]) ||
                            getImgSrc($, $('article img')[0]) ||
                            undefined;
                        summary = cleanText($('meta[property="og:description"]').attr('content')) ||
                            cleanText($('article .entry-content p')
                                .slice(0, 5)
                                .toArray()
                                .map(function (p) { return $(p).text(); })
                                .join('\n')) ||
                            cleanText($('.entry-content').text());
                        novel = {
                            name: name,
                            path: novelPath,
                            cover: cover,
                            summary: summary,
                        };
                        infoText = cleanText($('article').text());
                        authorMatch = infoText.match(/Autor\s*:?\s*([^\n\r]+)/i);
                        if (authorMatch === null || authorMatch === void 0 ? void 0 : authorMatch[1])
                            novel.author = cleanText(authorMatch[1]);
                        statusMatch = infoText.match(/Estado\s*:?\s*([^\n\r]+)/i);
                        if (statusMatch === null || statusMatch === void 0 ? void 0 : statusMatch[1])
                            novel.status = cleanText(statusMatch[1]);
                        chapterLinks = [];
                        chapterSelectors = [
                            '.wp-manga-chapter a[href]',
                            '.chapter-list a[href]',
                            '.chapters a[href]',
                            '.woocommerce-product-details__short-description a[href]',
                            '.entry-summary a[href]',
                            'ol li a[href]',
                            'ul li a[href]',
                        ];
                        looksLikeChapterUrl = function (href) {
                            var h = href.toLowerCase();
                            if (!h.includes('novelasligeras.net'))
                                return false;
                            if (h.includes('#') ||
                                h.startsWith('javascript:') ||
                                h.startsWith('data:') ||
                                h.startsWith('vbscript:'))
                                return false;
                            // Ejemplo real: /index.php/2025/09/17/shadow-slave-cap-1-novela-web-2/
                            var looksDatedPost = /\/index\.php\/20\d{2}\/\d{2}\/\d{2}\//.test(h);
                            return (looksDatedPost ||
                                h.includes('-cap-') ||
                                h.includes('/cap-') ||
                                h.includes('capitulo') ||
                                h.includes('cap') ||
                                h.includes('chapter') ||
                                h.includes('epis'));
                        };
                        for (_i = 0, chapterSelectors_1 = chapterSelectors; _i < chapterSelectors_1.length; _i++) {
                            sel = chapterSelectors_1[_i];
                            $(sel).each(function (_idx, a) {
                                var href = $(a).attr('href');
                                if (!href)
                                    return;
                                var abs = absolutizeUrl(_this.site, href);
                                if (!looksLikeChapterUrl(abs))
                                    return;
                                var title = cleanText($(a).text()) || cleanText($(a).attr('title'));
                                if (!title)
                                    return;
                                chapterLinks.push({ name: title, href: abs });
                            });
                            if (chapterLinks.length)
                                break;
                        }
                        // If nothing matched, fallback to any link in entry-content that looks like chapter
                        if (!chapterLinks.length) {
                            $('.entry-content a[href]').each(function (_idx, a) {
                                var href = $(a).attr('href');
                                if (!href)
                                    return;
                                var abs = absolutizeUrl(_this.site, href);
                                if (!looksLikeChapterUrl(abs))
                                    return;
                                var title = cleanText($(a).text()) || cleanText($(a).attr('title'));
                                if (!title)
                                    return;
                                chapterLinks.push({ name: title, href: abs });
                            });
                        }
                        // Fallback extra para páginas tipo /producto/: cualquier link dentro del contenido que parezca capítulo
                        if (!chapterLinks.length) {
                            $('a[href]').each(function (_idx, a) {
                                var href = $(a).attr('href');
                                if (!href)
                                    return;
                                var abs = absolutizeUrl(_this.site, href);
                                if (!looksLikeChapterUrl(abs))
                                    return;
                                var title = cleanText($(a).text()) || cleanText($(a).attr('title'));
                                if (!title)
                                    return;
                                chapterLinks.push({ name: title, href: abs });
                            });
                        }
                        seenChapter = new Set();
                        chapters = [];
                        chapterLinks.forEach(function (c, idx) {
                            var path = toPath(_this.site, c.href);
                            if (!path || seenChapter.has(path))
                                return;
                            seenChapter.add(path);
                            chapters.push({
                                name: c.name,
                                path: path,
                                chapterNumber: idx + 1,
                                releaseTime: null,
                            });
                        });
                        if (chapters.length)
                            novel.chapters = chapters;
                        return [2 /*return*/, novel];
                }
            });
        });
    };
    NovelasLigerasNet.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var url, $, containers, _i, containers_1, sel, html;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = this.resolveUrl(chapterPath);
                        return [4 /*yield*/, this.getDocument(url)];
                    case 1:
                        $ = _a.sent();
                        // Remove common junk
                        $('script, style, noscript, iframe').remove();
                        $('.ads, .ad, .advertisement, .sharedaddy, .wp-block-buttons').remove();
                        $('header, nav, footer').remove();
                        containers = [
                            '#chapter-content',
                            '.reading-content',
                            '.entry-content',
                            'article',
                            'main',
                        ];
                        for (_i = 0, containers_1 = containers; _i < containers_1.length; _i++) {
                            sel = containers_1[_i];
                            html = $(sel).first().html();
                            if (html && cleanText(html).length > 50)
                                return [2 /*return*/, html];
                        }
                        return [2 /*return*/, $('.entry-content').html() || ''];
                }
            });
        });
    };
    return NovelasLigerasNet;
}());
exports.default = new NovelasLigerasNet();
