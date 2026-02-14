"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var novelStatus_1 = require("@libs/novelStatus");
var filterInputs_1 = require("@libs/filterInputs");
var NovelFire = /** @class */ (function () {
    function NovelFire() {
        this.id = 'novelfire';
        this.name = 'Novel Fire';
        this.version = '1.0.21';
        this.icon = 'src/en/novelfire/icon.png';
        this.site = 'https://novelfire.net/';
        // Enables access to host-provided LocalStorage/SessionStorage (if available)
        this.webStorageUtilized = true;
        this.filters = {
            sort: {
                label: 'Sort Results By',
                value: 'rank-top',
                options: [
                    { label: 'Rank (Top)', value: 'rank-top' },
                    { label: 'Rating Score (Top)', value: 'rating-score-top' },
                    { label: 'Bookmark Count (Most)', value: 'bookmark' },
                    { label: 'Review Count (Most)', value: 'review' },
                    { label: 'Title (A>Z)', value: 'abc' },
                    { label: 'Title (Z>A)', value: 'cba' },
                    { label: 'Last Updated (Newest)', value: 'date' },
                    { label: 'Chapter Count (Most)', value: 'chapter-count-most' },
                    { label: 'User Votes (Ranking)', value: 'ranking-ratings' },
                    { label: 'Most Read (Ranking)', value: 'ranking-most-read' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
            status: {
                label: 'Translation Status',
                value: '-1',
                options: [
                    { label: 'All', value: '-1' },
                    { label: 'Completed', value: '1' },
                    { label: 'Ongoing', value: '0' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
            genre_operator: {
                label: 'Genres (And/Or)',
                value: 'and',
                options: [
                    { label: 'And', value: 'and' },
                    { label: 'Or', value: 'or' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
            genres: {
                label: 'Genres',
                value: [],
                options: [
                    { label: 'Action', value: '3' },
                    { label: 'Adult', value: '28' },
                    { label: 'Adventure', value: '4' },
                    { label: 'Anime', value: '46' },
                    { label: 'Arts', value: '47' },
                    { label: 'Comedy', value: '5' },
                    { label: 'Drama', value: '24' },
                    { label: 'Eastern', value: '44' },
                    { label: 'Ecchi', value: '26' },
                    { label: 'Fan-fiction', value: '48' },
                    { label: 'Fantasy', value: '6' },
                    { label: 'Game', value: '19' },
                    { label: 'Gender Bender', value: '25' },
                    { label: 'Harem', value: '7' },
                    { label: 'Historical', value: '12' },
                    { label: 'Horror', value: '37' },
                    { label: 'Isekai', value: '49' },
                    { label: 'Josei', value: '2' },
                    { label: 'Lgbt+', value: '45' },
                    { label: 'Magic', value: '50' },
                    { label: 'Magical Realism', value: '51' },
                    { label: 'Manhua', value: '52' },
                    { label: 'Martial Arts', value: '15' },
                    { label: 'Mature', value: '8' },
                    { label: 'Mecha', value: '34' },
                    { label: 'Military', value: '53' },
                    { label: 'Modern Life', value: '54' },
                    { label: 'Movies', value: '55' },
                    { label: 'Mystery', value: '16' },
                    { label: 'Psychological', value: '9' },
                    { label: 'Realistic Fiction', value: '56' },
                    { label: 'Reincarnation', value: '43' },
                    { label: 'Romance', value: '1' },
                    { label: 'School Life', value: '21' },
                    { label: 'Sci-fi', value: '20' },
                    { label: 'Seinen', value: '10' },
                    { label: 'Shoujo', value: '38' },
                    { label: 'Shoujo Ai', value: '57' },
                    { label: 'Shounen', value: '17' },
                    { label: 'Shounen Ai', value: '39' },
                    { label: 'Slice of Life', value: '13' },
                    { label: 'Smut', value: '29' },
                    { label: 'Sports', value: '42' },
                    { label: 'Supernatural', value: '18' },
                    { label: 'System', value: '58' },
                    { label: 'Tragedy', value: '32' },
                    { label: 'Urban', value: '63' },
                    { label: 'Urban Life', value: '59' },
                    { label: 'Video Games', value: '60' },
                    { label: 'War', value: '61' },
                    { label: 'Wuxia', value: '31' },
                    { label: 'Xianxia', value: '23' },
                    { label: 'Xuanhuan', value: '22' },
                    { label: 'Yaoi', value: '14' },
                    { label: 'Yuri', value: '62' },
                ],
                type: filterInputs_1.FilterTypes.CheckboxGroup,
            },
            language: {
                label: 'Language',
                value: [],
                options: [
                    { label: 'Chinese', value: '1' },
                    { label: 'Korean', value: '2' },
                    { label: 'Japanese', value: '3' },
                    { label: 'English', value: '4' },
                ],
                type: filterInputs_1.FilterTypes.CheckboxGroup,
            },
            rating_operator: {
                label: 'Rating (Min/Max)',
                value: 'min',
                options: [
                    { label: 'Min', value: 'min' },
                    { label: 'Max', value: 'max' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
            rating: {
                label: 'Rating',
                value: '0',
                options: [
                    { label: 'All', value: '0' },
                    { label: '1', value: '1' },
                    { label: '2', value: '2' },
                    { label: '3', value: '3' },
                    { label: '4', value: '4' },
                    { label: '5', value: '5' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
            chapters: {
                label: 'Chapters',
                value: '0',
                options: [
                    { label: 'All', value: '0' },
                    { label: '<50', value: '1,49' },
                    { label: '50-100', value: '50,100' },
                    { label: '100-200', value: '100,200' },
                    { label: '200-500', value: '200,500' },
                    { label: '500-1000', value: '500,1000' },
                    { label: '>1000', value: '1001,1000000' },
                ],
                type: filterInputs_1.FilterTypes.Picker,
            },
        };
    }
    // private cookieJarKey = `${this.id}.cookieJar`;
    // private loadCookieJar(): Record<string, string> {
    //   const fromStorage = storage.get(this.cookieJarKey) as
    //     | Record<string, string>
    //     | string
    //     | undefined;
    //   const ls = localStorage.get?.();
    //   const fromLocalStorage = ls?.[this.cookieJarKey] as
    //     | Record<string, string>
    //     | string
    //     | undefined;
    //   const raw = fromStorage ?? fromLocalStorage;
    //   if (!raw) return {};
    //   if (typeof raw === 'object') return raw as Record<string, string>;
    //   try {
    //     const parsed = JSON.parse(raw);
    //     if (parsed && typeof parsed === 'object') return parsed;
    //   } catch {
    //     // ignore
    //   }
    //   return {};
    // }
    // private saveCookieJar(jar: Record<string, string>) {
    //   try {
    //     const json = JSON.stringify(jar);
    //     storage.set?.(this.cookieJarKey, json);
    //     localStorage.set?.({ [this.cookieJarKey]: json });
    //   } catch {
    //     // ignore
    //   }
    // }
    // private parseCookieHeader(cookieHeader: string): Record<string, string> {
    //   const jar: Record<string, string> = {};
    //   const parts = (cookieHeader || '')
    //     .split(';')
    //     .map(s => s.trim())
    //     .filter(Boolean);
    //   for (const p of parts) {
    //     const eq = p.indexOf('=');
    //     if (eq <= 0) continue;
    //     const name = p.slice(0, eq).trim();
    //     const value = p.slice(eq + 1).trim();
    //     if (!name) continue;
    //     jar[name] = value;
    //   }
    //   return jar;
    // }
    // private mergeSetCookieIntoJar(
    //   setCookieHeader: string,
    //   jar: Record<string, string>,
    // ) {
    //   // Best-effort parsing. Some runtimes concatenate multiple Set-Cookie headers.
    //   // We split on commas that look like cookie delimiters (comma followed by token=).
    //   const parts = (setCookieHeader || '')
    //     .split(/,(?=[^;,\s]+=)/)
    //     .map(s => s.trim())
    //     .filter(Boolean);
    //   for (const part of parts) {
    //     const first = part.split(';')[0]?.trim();
    //     if (!first) continue;
    //     const eq = first.indexOf('=');
    //     if (eq <= 0) continue;
    //     const name = first.slice(0, eq).trim();
    //     const value = first.slice(eq + 1).trim();
    //     if (!name) continue;
    //     jar[name] = value;
    //   }
    // }
    // private captureSetCookie(response: Response) {
    //   // In many browser-like environments Set-Cookie is not readable.
    //   // When it is available (node/native), we persist it as a lightweight cookie jar.
    //   const sc =
    //     response.headers.get('set-cookie') || response.headers.get('Set-Cookie');
    //   if (!sc) return;
    //   const jar = this.loadCookieJar();
    //   this.mergeSetCookieIntoJar(sc, jar);
    //   this.saveCookieJar(jar);
    // }
    // private getCookieHeader(): string | undefined {
    //   const fromStorage =
    //     (storage.get('cookies') as string | undefined) ??
    //     (storage.get('cookie') as string | undefined) ??
    //     (storage.get(`${this.id}.cookies`) as string | undefined);
    //   const ls = localStorage.get?.();
    //   const fromLocalStorage =
    //     (ls?.cookies as string | undefined) ??
    //     (ls?.cookie as string | undefined) ??
    //     (ls?.[`${this.id}.cookies`] as string | undefined);
    //   const candidate = fromStorage ?? fromLocalStorage;
    //   const baseCookie = typeof candidate === 'string' ? candidate.trim() : '';
    //   const jar = this.loadCookieJar();
    //   const jarCookie = Object.entries(jar)
    //     .map(([k, v]) => `${k}=${v}`)
    //     .join('; ');
    //   // Merge base cookie (user-provided) + jar (server-issued). Jar wins on conflicts.
    //   const merged: Record<string, string> = {
    //     ...(baseCookie ? this.parseCookieHeader(baseCookie) : {}),
    //     ...(jarCookie ? this.parseCookieHeader(jarCookie) : {}),
    //   };
    //   const mergedHeader = Object.entries(merged)
    //     .map(([k, v]) => `${k}=${v}`)
    //     .join('; ')
    //     .trim();
    //   return mergedHeader.length ? mergedHeader : undefined;
    // }
    NovelFire.prototype.requestHeaders = function (referer) {
        var headers = {
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,*;q=0.8',
            'Upgrade-Insecure-Requests': '1',
        };
        // const cookie = this.getCookieHeader();
        // if (cookie) headers.Cookie = cookie;
        if (referer)
            headers.Referer = referer;
        return headers;
    };
    NovelFire.prototype.ajaxHeaders = function (referer) {
        return __assign(__assign({}, this.requestHeaders(referer)), { Accept: 'application/json, text/javascript, */*; q=0.01', 'X-Requested-With': 'XMLHttpRequest' });
    };
    NovelFire.prototype.fetchWithHeaders = function (url, referer) {
        return __awaiter(this, void 0, void 0, function () {
            var r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(url, {
                            headers: this.requestHeaders(referer),
                            // IMPORTANT: allow runtime cookie jar to attach cookies automatically (cf_clearance)
                            // credentials: 'include',
                        })];
                    case 1:
                        r = _a.sent();
                        // this.captureSetCookie(r);
                        return [2 /*return*/, r];
                }
            });
        });
    };
    NovelFire.prototype.fetchAjax = function (url, referer) {
        return __awaiter(this, void 0, void 0, function () {
            var r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fetch_1.fetchApi)(url, {
                            headers: this.ajaxHeaders(referer),
                            // IMPORTANT: allow runtime cookie jar to attach cookies automatically (cf_clearance)
                            // credentials: 'include',
                        })];
                    case 1:
                        r = _a.sent();
                        // this.captureSetCookie(r);
                        return [2 /*return*/, r];
                }
            });
        });
    };
    NovelFire.prototype.detectBlockReason = function (html) {
        // DESHABILITADO TEMPORALMENTE - sin detección de bloqueos
        return undefined;
        // const text = (html || '').toLowerCase();
        // if (!text) return undefined;
        // if (
        //   text.includes('cf-challenge') ||
        //   text.includes('challenge-platform') ||
        //   text.includes('just a moment') ||
        //   text.includes('checking your browser') ||
        //   text.includes('cloudflare')
        // ) {
        //   return 'Cloudflare/anti-bot challenge detected';
        // }
        // if (text.includes('you are being rate limited')) {
        //   return 'Rate limited by NovelFire';
        // }
        // if (
        //   text.includes('access denied') ||
        //   text.includes('you have been blocked')
        // ) {
        //   return 'Access blocked';
        // }
        // return undefined;
    };
    NovelFire.prototype.inferChaptersRefererFromPath = function (pathOrUrl) {
        var abs = this.resolveAbsUrl(pathOrUrl, this.site);
        try {
            var u = new URL(abs);
            var parts = u.pathname.split('/').filter(Boolean);
            // Expected patterns:
            // - /book/<slug>/chapter-123
            // - /book/<slug>/chapters
            if (parts[0] === 'book' && parts[1]) {
                return "".concat(this.site, "book/").concat(parts[1], "/chapters");
            }
            return this.site;
        }
        catch (_a) {
            return this.site;
        }
    };
    NovelFire.prototype.resolveAbsUrl = function (href, baseUrl) {
        try {
            return new URL(href, baseUrl).toString();
        }
        catch (_a) {
            return href;
        }
    };
    NovelFire.prototype.toPath = function (absUrl) {
        return absUrl.replace(this.site, '').replace(/^\//, '');
    };
    NovelFire.prototype.normalizePath = function (href, baseUrl) {
        return this.toPath(this.resolveAbsUrl(href, baseUrl));
    };
    NovelFire.prototype.extractPostIdFromChaptersHtml = function (html) {
        var _a, _b;
        // Seen patterns:
        // - listChapterDataAjax?post_id=2888
        // - post_id: 2888
        // - post_id=2888
        var directUrl = (_a = html.match(/listChapterDataAjax\?[^"'<>]*post_id=(\d+)/i)) === null || _a === void 0 ? void 0 : _a[1];
        if (directUrl)
            return directUrl;
        var keyVal = (_b = html.match(/\bpost_id\b\s*[:=]\s*["']?(\d+)["']?/i)) === null || _b === void 0 ? void 0 : _b[1];
        return keyVal;
    };
    NovelFire.prototype.extractChapterItemsFromAjaxPayload = function (payload, baseUrl) {
        var _this = this;
        var _a;
        var items = [];
        var seen = new Set();
        var push = function (name, href) {
            if (!href)
                return;
            var abs = _this.resolveAbsUrl(href, baseUrl);
            var path = _this.toPath(abs);
            if (!path || seen.has(path))
                return;
            seen.add(path);
            items.push({ name: (name || '').trim() || 'No Title Found', path: path });
        };
        var tryFromHtmlString = function (html) {
            var $ = (0, cheerio_1.load)(html);
            var a = $('a[href]').first();
            if (!a.length)
                return;
            var href = a.attr('href');
            var name = a.text().trim() || a.attr('title') || undefined;
            push(name, href);
        };
        var visit = function (node) {
            var _a, _b, _c;
            if (node == null)
                return;
            if (typeof node === 'string') {
                if (node.includes('<a') && node.includes('href=')) {
                    tryFromHtmlString(node);
                }
                return;
            }
            if (Array.isArray(node)) {
                for (var _i = 0, node_1 = node; _i < node_1.length; _i++) {
                    var v = node_1[_i];
                    visit(v);
                }
                return;
            }
            if (typeof node === 'object') {
                // Common keys in DataTables responses
                var href = (_b = (_a = node.href) !== null && _a !== void 0 ? _a : node.url) !== null && _b !== void 0 ? _b : node.link;
                var title = (_c = node.title) !== null && _c !== void 0 ? _c : node.name;
                if (href)
                    push(title, href);
                // Sometimes fields contain HTML strings
                for (var _d = 0, _e = Object.values(node); _d < _e.length; _d++) {
                    var v = _e[_d];
                    if (typeof v === 'string' &&
                        v.includes('<a') &&
                        v.includes('href=')) {
                        tryFromHtmlString(v);
                    }
                    else {
                        visit(v);
                    }
                }
            }
        };
        // DataTables typically: { data: [...] }
        visit((_a = payload === null || payload === void 0 ? void 0 : payload.data) !== null && _a !== void 0 ? _a : payload);
        return items;
    };
    NovelFire.prototype.getCheerio = function (url, search) {
        return __awaiter(this, void 0, void 0, function () {
            var r, html, $;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.fetchWithHeaders(url, this.site)];
                    case 1:
                        r = _a.sent();
                        if (!r.ok && search != true)
                            throw new Error('Could not reach site (' + r.status + ').');
                        return [4 /*yield*/, r.text()];
                    case 2:
                        html = _a.sent();
                        $ = (0, cheerio_1.load)(html);
                        return [2 /*return*/, $];
                }
            });
        });
    };
    NovelFire.prototype.popularNovels = function (pageNo_1, _a) {
        return __awaiter(this, arguments, void 0, function (pageNo, _b) {
            var url, params, _i, _c, language, _d, _e, genre, loadedCheerio, novelSelector;
            var _this = this;
            var showLatestNovels = _b.showLatestNovels, filters = _b.filters;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        url = '';
                        // Usar el endpoint específico de "latest-release-novels" para recientes
                        if (showLatestNovels) {
                            url = "".concat(this.site, "latest-release-novels?page=").concat(pageNo);
                        }
                        else if (filters) {
                            if (filters.sort.value === 'ranking-ratings') {
                                url = "".concat(this.site, "ranking/ratings?page=").concat(pageNo);
                            }
                            else if (filters.sort.value === 'ranking-most-read') {
                                url = "".concat(this.site, "ranking/most-read?page=").concat(pageNo);
                            }
                            else {
                                url = this.site + 'search-adv';
                                params = new URLSearchParams();
                                for (_i = 0, _c = filters.language.value; _i < _c.length; _i++) {
                                    language = _c[_i];
                                    params.append('country_id[]', language);
                                }
                                params.append('ctgcon', filters.genre_operator.value);
                                for (_d = 0, _e = filters.genres.value; _d < _e.length; _d++) {
                                    genre = _e[_d];
                                    params.append('categories[]', genre);
                                }
                                params.append('totalchapter', filters.chapters.value);
                                params.append('ratcon', filters.rating_operator.value);
                                params.append('rating', filters.rating.value);
                                params.append('status', filters.status.value);
                                params.append('sort', filters.sort.value);
                                params.append('page', pageNo.toString());
                                url += "?".concat(params.toString());
                            }
                        }
                        else {
                            // Endpoint por defecto para "popular" (sin filtros)
                            url = "".concat(this.site, "search-adv?ctgcon=and&totalchapter=0&ratcon=min&rating=0&status=-1&sort=rank-top&page=").concat(pageNo);
                        }
                        return [4 /*yield*/, this.getCheerio(url, false)];
                    case 1:
                        loadedCheerio = _f.sent();
                        novelSelector = showLatestNovels
                            ? '.novel-list.horizontal .novel-item' // Selector para latest-release-novels
                            : '.novel-item';
                        return [2 /*return*/, loadedCheerio(novelSelector)
                                .map(function (index, ele) {
                                // Para latest-release-novels, el título está en .novel-title (texto directo)
                                // Para search-adv, está en el atributo 'title' del <a>
                                var novelName = showLatestNovels
                                    ? loadedCheerio(ele).find('.novel-title').text().trim() ||
                                        loadedCheerio(ele).find('.novel-title > a').attr('title') ||
                                        'No Title Found'
                                    : loadedCheerio(ele).find('.novel-title > a').attr('title') ||
                                        loadedCheerio(ele).find('.novel-title > a').text().trim() ||
                                        loadedCheerio(ele).find('.title > a').attr('title') ||
                                        loadedCheerio(ele).find('.title > a').text().trim() ||
                                        loadedCheerio(ele).find('h2.title a').text().trim() ||
                                        loadedCheerio(ele).find('a').attr('title') ||
                                        'No Title Found';
                                // Probar diferentes atributos para la portada
                                var novelCover = loadedCheerio(ele).find('.novel-cover img').attr('data-src') ||
                                    loadedCheerio(ele).find('.novel-cover img').attr('src') ||
                                    loadedCheerio(ele).find('.cover img').attr('data-src') ||
                                    loadedCheerio(ele).find('.cover img').attr('src') ||
                                    loadedCheerio(ele).find('img').attr('data-src') ||
                                    loadedCheerio(ele).find('img').attr('src');
                                if (novelCover) {
                                    novelCover = _this.resolveAbsUrl(novelCover, url);
                                }
                                var novelHref = loadedCheerio(ele).find('.novel-title > a').attr('href') ||
                                    loadedCheerio(ele).find('.cover-wrap > a').attr('href') ||
                                    loadedCheerio(ele).find('a').attr('href');
                                if (!novelHref)
                                    return null;
                                var path = _this.normalizePath(novelHref, url);
                                if (!path)
                                    return null;
                                return {
                                    name: novelName,
                                    cover: novelCover,
                                    path: path,
                                };
                            })
                                .get()
                                .filter(function (novel) { return novel !== null; })];
                }
            });
        });
    };
    NovelFire.prototype.parseChapters = function (chaptersBasePath, pages) {
        return __awaiter(this, void 0, void 0, function () {
            var pagesArray, allChapters, base, referer, chaptersPageRes, chaptersHtml, $, chaptersLink, maxChaptersAttr, maxChapters_1, chapters, cleanPath, i, maxChapters, calculatedPages, postId, ajaxUrl, draw, start, length_1, all, seenAll_1, guard, r, contentType, payload, text, batch, added, _i, batch_1, c, recordsTotal, doneByTotal, _a, parsePage, chunkSize, retryCount, sleepTime, chaptersArray, i, pagesArrayChunk, firstPage, lastPage, attempt, chaptersArrayChunk, err_1, seenAll, _b, chaptersArray_1, chapters, _c, chapters_1, c;
            var _this = this;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        pagesArray = Array.from({ length: Math.max(1, pages) }, function (_, i) { return i + 1; });
                        allChapters = [];
                        base = this.resolveAbsUrl(chaptersBasePath, this.site);
                        referer = base;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 16, , 17]);
                        return [4 /*yield*/, this.fetchWithHeaders(base, referer)];
                    case 2:
                        chaptersPageRes = _d.sent();
                        return [4 /*yield*/, chaptersPageRes.text()];
                    case 3:
                        chaptersHtml = _d.sent();
                        $ = (0, cheerio_1.load)(chaptersHtml);
                        chaptersLink = $('.chapter-latest-container').attr('href');
                        if (!chaptersLink) return [3 /*break*/, 6];
                        base = this.resolveAbsUrl(chaptersLink, base);
                        return [4 /*yield*/, this.fetchWithHeaders(base, referer)];
                    case 4:
                        chaptersPageRes = _d.sent();
                        return [4 /*yield*/, chaptersPageRes.text()];
                    case 5:
                        chaptersHtml = _d.sent();
                        $ = (0, cheerio_1.load)(chaptersHtml);
                        _d.label = 6;
                    case 6:
                        maxChaptersAttr = $('#gotochapno').attr('max');
                        if (maxChaptersAttr) {
                            maxChapters_1 = parseInt(maxChaptersAttr, 10);
                            if (!isNaN(maxChapters_1) && maxChapters_1 > 0) {
                                chapters = [];
                                cleanPath = chaptersBasePath
                                    .replace(/\/chapters\/?$/, '')
                                    .replace(/\/$/, '');
                                for (i = 1; i <= maxChapters_1; i++) {
                                    chapters.push({
                                        name: "Chapter ".concat(i),
                                        path: "".concat(cleanPath, "/chapter-").concat(i),
                                    });
                                }
                                return [2 /*return*/, chapters];
                            }
                        }
                        maxChapters = parseInt($('#gotochapno').attr('max') || '0', 10);
                        if (maxChapters > 0) {
                            calculatedPages = Math.ceil(maxChapters / 20);
                            if (calculatedPages > pagesArray.length) {
                                pagesArray = Array.from({ length: calculatedPages }, function (_, i) { return i + 1; });
                            }
                        }
                        postId = this.extractPostIdFromChaptersHtml(chaptersHtml);
                        if (!postId) return [3 /*break*/, 15];
                        ajaxUrl = new URL(this.resolveAbsUrl('/listChapterDataAjax', this.site));
                        draw = 1;
                        start = 0;
                        length_1 = 20;
                        all = [];
                        seenAll_1 = new Set();
                        guard = 0;
                        _d.label = 7;
                    case 7:
                        if (!(guard < 500)) return [3 /*break*/, 14];
                        ajaxUrl.search = '';
                        ajaxUrl.searchParams.set('post_id', postId);
                        ajaxUrl.searchParams.set('draw', String(draw++));
                        ajaxUrl.searchParams.set('start', String(start));
                        ajaxUrl.searchParams.set('length', String(length_1));
                        ajaxUrl.searchParams.set('order[0][column]', '2');
                        ajaxUrl.searchParams.set('order[0][dir]', 'asc');
                        // Columns (mirrors captured request)
                        ajaxUrl.searchParams.set('columns[0][data]', 'title');
                        ajaxUrl.searchParams.set('columns[0][name]', '');
                        ajaxUrl.searchParams.set('columns[0][searchable]', 'true');
                        ajaxUrl.searchParams.set('columns[0][orderable]', 'false');
                        ajaxUrl.searchParams.set('columns[0][search][value]', '');
                        ajaxUrl.searchParams.set('columns[0][search][regex]', 'false');
                        ajaxUrl.searchParams.set('columns[1][data]', 'created_at');
                        ajaxUrl.searchParams.set('columns[1][name]', '');
                        ajaxUrl.searchParams.set('columns[1][searchable]', 'true');
                        ajaxUrl.searchParams.set('columns[1][orderable]', 'true');
                        ajaxUrl.searchParams.set('columns[1][search][value]', '');
                        ajaxUrl.searchParams.set('columns[1][search][regex]', 'false');
                        ajaxUrl.searchParams.set('columns[2][data]', 'n_sort');
                        ajaxUrl.searchParams.set('columns[2][name]', '');
                        ajaxUrl.searchParams.set('columns[2][searchable]', 'false');
                        ajaxUrl.searchParams.set('columns[2][orderable]', 'true');
                        ajaxUrl.searchParams.set('columns[2][search][value]', '');
                        ajaxUrl.searchParams.set('columns[2][search][regex]', 'false');
                        ajaxUrl.searchParams.set('search[value]', '');
                        ajaxUrl.searchParams.set('search[regex]', 'false');
                        // Cache-buster used by DataTables in browsers
                        ajaxUrl.searchParams.set('_', String(Date.now()));
                        return [4 /*yield*/, this.fetchAjax(ajaxUrl.toString(), referer)];
                    case 8:
                        r = _d.sent();
                        if (!r.ok)
                            return [3 /*break*/, 14];
                        contentType = (r.headers.get('content-type') || '').toLowerCase();
                        payload = null;
                        if (!contentType.includes('application/json')) return [3 /*break*/, 10];
                        return [4 /*yield*/, r.json().catch(function () { return null; })];
                    case 9:
                        payload = _d.sent();
                        return [3 /*break*/, 12];
                    case 10: return [4 /*yield*/, r.text().catch(function () { return ''; })];
                    case 11:
                        text = _d.sent();
                        // const ajaxBlockReason = this.detectBlockReason(text);
                        // if (ajaxBlockReason) {
                        //   throw new Error(
                        //     `${ajaxBlockReason}. Provide the Cloudflare cookie (cf_clearance). Other cookies may be set automatically after a successful open in webview.`,
                        //   );
                        // }
                        payload = null;
                        _d.label = 12;
                    case 12:
                        if (!payload)
                            return [3 /*break*/, 14];
                        batch = this.extractChapterItemsFromAjaxPayload(payload, referer);
                        added = 0;
                        for (_i = 0, batch_1 = batch; _i < batch_1.length; _i++) {
                            c = batch_1[_i];
                            if (!(c === null || c === void 0 ? void 0 : c.path) || seenAll_1.has(c.path))
                                continue;
                            seenAll_1.add(c.path);
                            all.push(c);
                            added++;
                        }
                        recordsTotal = typeof payload.recordsTotal === 'number'
                            ? payload.recordsTotal
                            : typeof payload.recordsFiltered === 'number'
                                ? payload.recordsFiltered
                                : undefined;
                        start += length_1;
                        doneByTotal = recordsTotal != null && start >= recordsTotal;
                        if (doneByTotal)
                            return [3 /*break*/, 14];
                        if (added === 0)
                            return [3 /*break*/, 14];
                        _d.label = 13;
                    case 13:
                        guard++;
                        return [3 /*break*/, 7];
                    case 14:
                        if (all.length)
                            return [2 /*return*/, all];
                        _d.label = 15;
                    case 15: return [3 /*break*/, 17];
                    case 16:
                        _a = _d.sent();
                        return [3 /*break*/, 17];
                    case 17:
                        parsePage = function (page) { return __awaiter(_this, void 0, void 0, function () {
                            var url, result, body, loadedCheerio, chapters, seen;
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        url = "".concat(base).concat(base.includes('?') ? '&' : '?', "page=").concat(page);
                                        return [4 /*yield*/, this.fetchWithHeaders(url, base)];
                                    case 1:
                                        result = _a.sent();
                                        return [4 /*yield*/, result.text()];
                                    case 2:
                                        body = _a.sent();
                                        loadedCheerio = (0, cheerio_1.load)(body);
                                        if (loadedCheerio.text().includes('You are being rate limited')) {
                                            throw new NovelFireThrottlingError();
                                        }
                                        chapters = [];
                                        seen = new Set();
                                        // Nuevo layout: tabla DataTables
                                        loadedCheerio('#listChapter-table tbody tr td a[href]').each(function (_, a) {
                                            var href = loadedCheerio(a).attr('href');
                                            if (!href)
                                                return;
                                            var abs = _this.resolveAbsUrl(href, url);
                                            var path = _this.toPath(abs);
                                            if (!path || seen.has(path))
                                                return;
                                            var name = loadedCheerio(a).text().trim() ||
                                                loadedCheerio(a).attr('title') ||
                                                'No Title Found';
                                            seen.add(path);
                                            chapters.push({ name: name, path: path });
                                        });
                                        // Fallback antiguo: lista .chapter-list
                                        if (!chapters.length) {
                                            loadedCheerio('.chapter-list li a[href]').each(function (_, a) {
                                                var href = loadedCheerio(a).attr('href');
                                                if (!href)
                                                    return;
                                                var abs = _this.resolveAbsUrl(href, url);
                                                var path = _this.toPath(abs);
                                                if (!path || seen.has(path))
                                                    return;
                                                var name = loadedCheerio(a).attr('title') ||
                                                    loadedCheerio(a).text().trim() ||
                                                    'No Title Found';
                                                seen.add(path);
                                                chapters.push({ name: name, path: path });
                                            });
                                        }
                                        return [2 /*return*/, chapters];
                                }
                            });
                        }); };
                        chunkSize = 5;
                        retryCount = 10;
                        sleepTime = 3.5;
                        chaptersArray = [];
                        i = 0;
                        _d.label = 18;
                    case 18:
                        if (!(i < pagesArray.length)) return [3 /*break*/, 28];
                        pagesArrayChunk = pagesArray.slice(i, i + chunkSize);
                        firstPage = pagesArrayChunk[0];
                        lastPage = pagesArrayChunk[pagesArrayChunk.length - 1];
                        attempt = 0;
                        _d.label = 19;
                    case 19:
                        if (!(attempt < retryCount)) return [3 /*break*/, 27];
                        _d.label = 20;
                    case 20:
                        _d.trys.push([20, 22, , 26]);
                        return [4 /*yield*/, Promise.all(pagesArrayChunk.map(parsePage))];
                    case 21:
                        chaptersArrayChunk = _d.sent();
                        chaptersArray.push.apply(chaptersArray, chaptersArrayChunk);
                        return [3 /*break*/, 27];
                    case 22:
                        err_1 = _d.sent();
                        if (!(err_1 instanceof NovelFireThrottlingError)) return [3 /*break*/, 24];
                        attempt += 1;
                        console.warn("[pages=".concat(firstPage, "-").concat(lastPage, "] Novel Fire is rate limiting requests. Retry attempt ").concat(attempt + 1, " in ").concat(sleepTime, " seconds..."));
                        if (attempt === retryCount) {
                            throw err_1;
                        }
                        // Sleep for X second before retrying
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, sleepTime * 1000); })];
                    case 23:
                        // Sleep for X second before retrying
                        _d.sent();
                        return [3 /*break*/, 25];
                    case 24: throw err_1;
                    case 25: return [3 /*break*/, 26];
                    case 26: return [3 /*break*/, 19];
                    case 27:
                        i += chunkSize;
                        return [3 /*break*/, 18];
                    case 28:
                        seenAll = new Set();
                        for (_b = 0, chaptersArray_1 = chaptersArray; _b < chaptersArray_1.length; _b++) {
                            chapters = chaptersArray_1[_b];
                            for (_c = 0, chapters_1 = chapters; _c < chapters_1.length; _c++) {
                                c = chapters_1[_c];
                                if (!(c === null || c === void 0 ? void 0 : c.path) || seenAll.has(c.path))
                                    continue;
                                seenAll.add(c.path);
                                allChapters.push(c);
                            }
                            // Si la paginación realmente no cambia el HTML, evitamos recorrer páginas de más
                            if (chapters.length === 0)
                                break;
                        }
                        if (allChapters.length === 0) {
                            throw new Error('Could not parse chapters page.');
                        }
                        return [2 /*return*/, allChapters];
                }
            });
        });
    };
    NovelFire.prototype.parseNovel = function (novelPath) {
        return __awaiter(this, void 0, void 0, function () {
            var novelUrl, $, baseUrl, novel, coverUrl, summary, rawStatus, map, totalChaptersText, chaptersHref, chaptersBasePath, totalChaptersNum, pages, _a;
            var _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        novelUrl = this.resolveAbsUrl(novelPath, this.site);
                        return [4 /*yield*/, this.getCheerio(novelUrl, false)];
                    case 1:
                        $ = _f.sent();
                        baseUrl = this.site;
                        novel = {
                            path: novelPath,
                        };
                        novel.name =
                            (_c = (_b = $('.novel-title').text().trim()) !== null && _b !== void 0 ? _b : $('.cover > img').attr('alt')) !== null && _c !== void 0 ? _c : 'No Titled Found';
                        coverUrl = (_d = $('.cover > img').attr('data-src')) !== null && _d !== void 0 ? _d : $('.cover > img').attr('src');
                        if (coverUrl) {
                            novel.cover = new URL(coverUrl, baseUrl).href;
                        }
                        novel.genres = $('.categories .property-item')
                            .map(function (i, el) { return $(el).text(); })
                            .toArray()
                            .join(',');
                        summary = $('.summary .content').text().trim();
                        if (summary) {
                            summary = summary.replace('Show More', '');
                            novel.summary = summary;
                        }
                        else {
                            novel.summary = 'No Summary Found';
                        }
                        novel.author =
                            $('.author .property-item > span').text() || 'No Author Found';
                        rawStatus = $('.header-stats .ongoing').text() ||
                            $('.header-stats .completed').text() ||
                            'Unknown';
                        map = {
                            ongoing: novelStatus_1.NovelStatus.Ongoing,
                            hiatus: novelStatus_1.NovelStatus.OnHiatus,
                            dropped: novelStatus_1.NovelStatus.Cancelled,
                            cancelled: novelStatus_1.NovelStatus.Cancelled,
                            completed: novelStatus_1.NovelStatus.Completed,
                            unknown: novelStatus_1.NovelStatus.Unknown,
                        };
                        novel.status = (_e = map[rawStatus.toLowerCase()]) !== null && _e !== void 0 ? _e : novelStatus_1.NovelStatus.Unknown;
                        totalChaptersText = $('.header-stats .icon-book-open')
                            .parent()
                            .text()
                            .trim();
                        chaptersHref = $('a.grdbtn.chapter-latest-container[href], a.chapter-latest-container[href]')
                            .first()
                            .attr('href');
                        chaptersBasePath = chaptersHref
                            ? this.toPath(this.resolveAbsUrl(chaptersHref, novelUrl))
                            : "".concat(this.toPath(novelUrl).replace(/\/$/, ''), "/chapters");
                        totalChaptersNum = parseInt((totalChaptersText || '').replace(/[^0-9]/g, ''), 10);
                        pages = totalChaptersNum ? Math.ceil(totalChaptersNum / 100) : 1;
                        _a = novel;
                        return [4 /*yield*/, this.parseChapters(chaptersBasePath, pages)];
                    case 2:
                        _a.chapters = _f.sent();
                        return [2 /*return*/, novel];
                }
            });
        });
    };
    NovelFire.prototype.parseChapter = function (chapterPath) {
        return __awaiter(this, void 0, void 0, function () {
            var url, referer, result, body, loadedCheerio, bloatElements, html;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = this.resolveAbsUrl(chapterPath, this.site);
                        referer = this.inferChaptersRefererFromPath(url);
                        return [4 /*yield*/, this.fetchWithHeaders(url, referer)];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, result.text()];
                    case 2:
                        body = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        bloatElements = [
                            '.box-ads',
                            '.box-notification',
                            /^nf/, // Regular expression to match tags starting with 'nf'
                        ];
                        bloatElements.forEach(function (tag) {
                            if (tag instanceof RegExp) {
                                loadedCheerio('*')
                                    .filter(function (_, el) {
                                    return tag.test(loadedCheerio(el).prop('tagName').toLowerCase());
                                })
                                    .remove();
                            }
                            else {
                                loadedCheerio(tag).remove();
                            }
                        });
                        html = loadedCheerio('#content').html() ||
                            loadedCheerio('.chapter-content').html() ||
                            loadedCheerio('article').html();
                        if (!html) {
                            throw new Error('Could not parse chapter content.');
                        }
                        return [2 /*return*/, html];
                }
            });
        });
    };
    NovelFire.prototype.searchNovels = function (searchTerm, page) {
        return __awaiter(this, void 0, void 0, function () {
            var url, result, body, loadedCheerio;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "".concat(this.site, "search?keyword=").concat(encodeURIComponent(searchTerm), "&page=").concat(page);
                        return [4 /*yield*/, this.fetchWithHeaders(url, this.site)];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, result.text()];
                    case 2:
                        body = _a.sent();
                        loadedCheerio = (0, cheerio_1.load)(body);
                        return [2 /*return*/, loadedCheerio('.novel-list.chapters .novel-item')
                                .map(function (index, ele) {
                                var novelName = loadedCheerio(ele).find('a').attr('title') || 'No Title Found';
                                var novelCover = loadedCheerio(ele)
                                    .find('.novel-cover > img')
                                    .attr('src');
                                var novelHref = loadedCheerio(ele).find('a').attr('href');
                                if (!novelHref)
                                    return null;
                                var path = _this.normalizePath(novelHref, url);
                                if (!path)
                                    return null;
                                return {
                                    name: novelName,
                                    cover: novelCover,
                                    path: path,
                                };
                            })
                                .get()
                                .filter(function (novel) { return novel !== null; })];
                }
            });
        });
    };
    return NovelFire;
}());
exports.default = new NovelFire();
// Custom error for when Novel Fire is rate limiting requests
var NovelFireThrottlingError = /** @class */ (function (_super) {
    __extends(NovelFireThrottlingError, _super);
    function NovelFireThrottlingError(message) {
        if (message === void 0) { message = 'Novel Fire is rate limiting requests'; }
        var _this = _super.call(this, message) || this;
        _this.name = 'NovelFireError';
        return _this;
    }
    return NovelFireThrottlingError;
}(Error));
