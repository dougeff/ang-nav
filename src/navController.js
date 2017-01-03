(function () {
    'use strict';
    var STARTINGLEVEL = 0;
    var MAXLEVEL = 0;
    var INITIALIZING = true;
    var MICROSITESOA = {
        classes: 'promo-item SOA',
        aClass: '',
        aHref: '/Uptown/School-of-the-Arts',
        img: 'School of the Arts',
        id: 'SOA'
    };
    var MICROSITEFINEART = {
        classes: 'promo-item Art studioArt',
        aClass: '',
        aHref: '/SOA/Studio-Art',
        img: 'Fine Art &amp; Design',
        id: 'fineart'
    };
    var MICROSITECERAMICS = {
        classes: 'promo-item Art ceramics',
        aClass: '',
        aHref: '/SOA/Ceramics',
        img: 'Ceramics',
        id: 'ceramics'
    };
    var MICROSITEJEWELRY = {
        classes: 'promo-item Art jewelry',
        aClass: '',
        aHref: '/SOA/Jewelry.aspx',
        img: 'Jewelry Center',
        id: 'jewelry'
    };
    var MICROSITEMUSIC = {
        classes: 'promo-item Music',
        aClass: '',
        aHref: '/SOA/School-of-Music',
        img: 'Music',
        id: 'music'
    };
    var MICROSITEINSTRUCT = {
        classes: 'promo-item Music instruct',
        aClass: 'group-private',
        aHref: '/Uptown/School-of-the-Arts/School-of-Music/Private-Instruction.aspx',
        img: 'Private &amp; Semi-Private Instruction',
        id: 'instruct'
    };
    var MICROSITEDANCE = {
        classes: 'promo-item Dance',
        aClass: '',
        aHref: '/Uptown/School-of-the-Arts/Harkness-Dance-Center',
        img: 'Dance',
        id: 'dance'
    };
    var MICROSITERK = {
        classes: 'promo-item rk-program',
        aClass: '',
        aHref: '/Uptown/School-of-the-Arts/Scholarship-Programs/Recanati-Kaplan-Program-for-Excellence-in-the-Arts',
        img: 'Recanati Kaplan Scholars',
        id: 'rk'
    };
    var MICROSITELIST = [MICROSITESOA, MICROSITEFINEART, MICROSITECERAMICS, MICROSITEJEWELRY, MICROSITEMUSIC, MICROSITEINSTRUCT, MICROSITEDANCE, MICROSITERK];
    var WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    var DAYPARTS = ['morning', 'afternoon', 'evening'];
    var LOADINGNODEID = 0;
    var ERRORLOADINGNODEID = -1;
    var isMobile = false;

    var SCRIPTNAME = 'ProgramFinder.html';

    var STOPWORDS = ['a', 'able', 'about', 'across', 'after', 'all', 'almost', 'also', 'am', 'among', 'an', 'and', 'any', 'are', 'as', 'at',
                    'be', 'because', 'been', 'but', 'by', 'can', 'cannot', 'could', 'dear', 'did', 'do', 'does', 'either', 'else', 'ever',
                    'every', 'for', 'from', 'get', 'got', 'had', 'has', 'have', 'he', 'her', 'hers', 'him', 'his', 'how', 'however', 'i',
                    'if', 'in', 'into', 'is', 'it', 'its', 'just', 'least', 'let', 'like', 'likely', 'may', 'me', 'might', 'most', 'must',
                    'my', 'neither', 'no', 'nor', 'not', 'of', 'off', 'often', 'on', 'only', 'or', 'other', 'our', 'own', 'rather', 'said',
                    'say', 'says', 'she', 'should', 'since', 'so', 'some', 'than', 'that', 'the', 'their', 'them', 'then', 'there', 'these',
                    'they', 'this', 'tis', 'to', 'too', 'twas', 'us', 'wants', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while',
                    'who', 'whom', 'why', 'will', 'with', 'would', 'yet', 'you', 'your'];

    var navApp = angular.module('artNavApp', ['infinite-scroll', 'ui.bootstrap', 'ngScrollSpy', 'ngTouch', 'ngCookies', 'angular-cache', 'angulartics', 'nav.config', 'ngProgress', 'angular-mmenu']);
    var NavListController = function ($scope, tileInfoSrv, $location, $timeout, $window, $cookieStore, $cookies, navConfig, ngProgressFactory, $exceptionHandler) {
        var self = this;
        self.DefaultFilterNodeNum = Number(navConfig.DefaultFilterNodeNum);
        self.ActiveFilterNodeNum = Number(navConfig.ActiveFilterNodeNum);
        self.allClasses = [{ Name: '', NodeID: LOADINGNODEID}];
        self.allProgramsObj = {
            Level: 0,
            Name: 'All Programs',
            NodeID: self.ActiveFilterNodeNum,
            Current: true,
            FeaturedItemsHeader: ''
        };
        self.arrCategory = [[_.clone(self.allProgramsObj)]];
        self.location = $location;
        self.timeout = $timeout;
        self.cookieStore = $cookieStore;
        self.cookies = $cookies;
        self.JumpNav = {};
        self.navsDict = {};
        self.onscreenResults = [];
        self.classesByNodeId = {};
        self.opened = {};
        self.minBegDate = new Date();
        self.minEndDate = new Date();
        self.maxDate = new Date();
        self.maxDate = self.maxDate.setFullYear(self.maxDate.getFullYear() + 1);
        self.times = _.clone(DAYPARTS);
        self.days = _.clone(WEEKDAYS);
        var shiftDay = self.days.shift();
        self.days.push(shiftDay);
        self.initDaySlice = 'all';
        self.initTimeSlice = 'all';
        self.initSdateSlice = undefined;
        self.initEdateSlice = undefined;
        self.initAgeSlice = 'all';
        self.initSortOrder = 'all';
        self.soonestSortSelected = false;
        self.showSpinner = false;
        self.showGlobalSpinner = false;
        self.debounceSearch = _.debounce(function () { self.modifyUrlSearch(false); }, 2000);
        self.debounceGlobalSearch = _.debounce(function () { self.fetchSearchResults(true); }, 2000);
        self.applyScope = function () { $scope.$apply(); };
        self.enabledFilters = {};
        self.bottomContainerStyle = { 'overflow-x': 'hidden', 'height': '100%' };
        self.bodyStyle = { 'height': '100%', 'margin': '0', 'padding': '0', 'overflow': 'hidden' };
        self.chunkLevels = [];
        self.affixed = false;
        self.scrollingUp = false;
        self.environment = 'desktop';
        self.introOpened = false;
        self.displayIntro = false;
        self.displayInterestIntro = false;
        self.displayBrowseBtnsIntro = false;
        self.navOpened = false;
        self.searchOpened = false;
        self.printedReport = [];
        self.virtualPageUrl = '';
        self.virtualPageTitle = '';
        self.printNum = 1;
        self.showNoGlobalResults = false;
        self.searchTerm = '';
        self.isFetching = false;
        self.dateClearClicked = false;
        self.ageClearClicked = false;
        self.progressbar = ngProgressFactory;
        self.mobileDetect();
        $scope.mainMenuItems = [];
        self.mainMenuItems = $scope.mainMenuItems;
        self.skipDisplayTiles = false;
        self.allProducts = [];

        self.savedPrograms = self.cookieStore.get('savedPrograms');
        if (_.isUndefined(self.savedPrograms)) {
            self.savedPrograms = [];
        }

        self.savedSearches = self.cookieStore.get('savedSearches');
        if (_.isUndefined(self.savedSearches)) {
            self.savedSearches = [];
        }

        self.introScreen = self.cookies.get('introScreen');
        if (_.isUndefined(self.introScreen)) {
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 1);
            self.displayIntro = true;
        }
        self.interestIntro = self.cookies.get('interestIntro');
        if (_.isUndefined(self.interestIntro)) {
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 1);
            self.displayIntro = true;
            self.displayInterestIntro = true;
        }
        self.browseBtnIntro = self.cookies.get('browseBtnIntro');
        if (_.isUndefined(self.browseBtnIntro)) {
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 1);
            self.displayIntro = true;
            self.displayBrowseBtnsIntro = true;
        }

        self.eventClassDropdown = {
            isopen: false
        };

        self.tileInfoSrv = tileInfoSrv;

        (function (cf) {
            if (!cf.get('navCache')) {
                self.navCache = cf('navCache', {
                    maxAge: 30 * 60 * 1000, //30 minutes
                    deleteOnExpire: 'aggressive',
                    onExpire: function (key, value) {
                        var currentInterestArea = self.arrCategory[0];
                        var currentInterestAreaName = currentInterestArea[0].Name;
                        var currentInterestAreaId = currentInterestArea[0].NodeID;
                        self.getInterestItems(self.interestCompiled, { Name: currentInterestAreaName, NodeID: currentInterestAreaId });
                    }
                });
            }
        })(self.tileInfoSrv.cacheFactory);

        self.tileInfoSrv.getAll('/webservices/categoryproduction.svc/FilterNodes/' + self.DefaultFilterNodeNum + '/', self.navCache, 'navigation').then(function (data) {
            var parentdata = data;
            self.allTopLevels = _.map(data.data, function (kw) {
                return { Name: kw.Name, Keywords: kw.Keywords.toLowerCase(), NodeID: kw.NodeID };
            });
            //build mmenu
            $scope.mainMenuOptions = {
                navbar: {
                    title: 'All Programs'
                },
                'iconPanels': true,
                'extensions': ['multiline', 'pageshadow', 'panelshadow'],
                'setSelected': true,
                'navbars': [{
                    content: ['prev', 'title']
                }],
                dragClose: true,
                'scrollBugFix': { fix: true }
            };
            $scope.mainMenuParams = { offCanvas: { pageSelector: '#site-container' } };

            self.tileInfoSrv.getAll('/webservices/categoryproduction.svc/categories/json/dayplanit', self.navCache, 'allProducts').then(function (data) {
                self.allProducts = data.data;
                _.forEach(self.allTopLevels, function (lev) {
                    var items = filterListByKeywords(self.allProducts, [lev.Keywords]);
                    self.navsDict[lev.Name] = items;
                });
                self.getInterestItems(self.getAllInitialClasses, parentdata);
                self.buildCurrentObj();
                self.displayTiles();
            }, function (respData) {
                if (self.allProducts.length === 0) {
                    self.allClasses = [{ Name: 'Error loading data.  Please refresh or come back later.', NodeID: ERRORLOADINGNODEID }];
                    $exceptionHandler('HTTP error: ' + respData.status + ' (' + respData.statusText + ') for ' + respData.config.url);
                }
            });

        }, function (respData) {
            if (!self.allClasses.length || (self.allClasses.length && self.allClasses[0].Name === '')) {
                self.allClasses = [{ Name: 'Error loading data.  Please refresh or come back later.', NodeID: ERRORLOADINGNODEID }];
                $exceptionHandler('HTTP error: ' + respData.status + ' (' + respData.statusText + ') for ' + respData.config.url);
            }
        });

        self.log = function (variable) {
            console.log(variable);
        };

        self.table = function (variable) {
            console.table(variable);
        };

        var w = angular.element($window);
        self.currentScreenWidth = w.outerWidth();
        w.bind('resize', function () {
            //This condition is for mobile devices that change the height of the window when you swipe up or down to scroll.
            if (this.outerWidth !== self.currentScreenWidth) {
                if (!_.isUndefined(self.currentObj)) {
                    resizeTileDisplay($scope);
                    self.onscreenResults = [];
                    self.displayTiles();
                    self.loadMore(self.environment);
                    $scope.$apply();
                }
                self.currentScreenWidth = this.outerWidth;
            }
        });

        self.progressbar.start();
        $timeout(function () {
            self.progressbar.complete();
        }, 2000);

        $scope.$watch(function () {
            return self.location.path();
        }, function (locationPath) {
            if (INITIALIZING) {
                $timeout(function () { INITIALIZING = false; });
                self.progressbar.set(self.progressbar.status() + 4);
            } else {
                var locationObj = seperateSlicersFromUrl(locationPath);
                locationPath = locationObj.path;
                var locationRemoved = locationObj.removed;
                var numOfSlashesLocation = (locationPath.match(/\//g) || []).length;
                $scope.$broadcast('urlChanged', locationPath);
                //if JumpNav is empty then we know back or forward button was used otherwise it will be set by one of the links
                switch (self.JumpNav.Type) {
                    case 'linkTo':
                        // if child link on right side clicked
                        var cloneCurrentObj = {
                            Level: self.currentObj.Level,
                            Name: self.currentObj.Name,
                            NodeID: self.currentObj.NodeID,
                            Current: self.currentObj.Current,
                            FeaturedItemsHeader: self.currentObj.FeaturedItemsHeader
                        };
                        var lastCurrent = _.find(self.activeBreadcrumb, 'Current');
                        if (!_.isUndefined) {
                            lastCurrent.Current = false;
                        }
                        self.activeBreadcrumb.push(cloneCurrentObj);
                        break;
                    case 'linkBack':
                        // if link in active breadcrumb is clicked
                        var lastLocationPath = self.lastLocationPath;
                        var lastLocationObj = seperateSlicersFromUrl(lastLocationPath);
                        lastLocationPath = lastLocationObj.path;
                        var numOfSlashesLastLocation = (lastLocationPath.match(/\//g) || []).length;

                        if (locationPath === '/') {
                            self.activeBreadcrumb = self.activeBreadcrumb.slice(0, 1);
                        } else {
                            for (var x = 0; x < numOfSlashesLastLocation - numOfSlashesLocation; x++) {
                                self.activeBreadcrumb.pop();
                            }
                        }
                        var nextCurrent = _.last(self.activeBreadcrumb);
                        nextCurrent.Current = true;
                        break;
                    case 'jumpTo':
                        // if link in saved breadCrumb is clicked
                        if (locationPath === '/') {
                            self.activeBreadcrumb = self.activeBreadcrumb.slice(0, 1);
                        } else {
                            for (var x = self.activeBreadcrumb.length - 1; x >= 0; x--) {
                                var breadCrumb = self.activeBreadcrumb[x];
                                if (breadCrumb.NodeID === self.currentObj.NodeID) {
                                    break;
                                }
                                self.activeBreadcrumb.pop();
                            }
                        }
                        var nextCurrent = _.last(self.activeBreadcrumb);
                        nextCurrent.Current = true;
                        break;
                    case 'sliceBy':
                        // if slicer is selected
                        // since we don't change position, just filters, we can skip all the link stuff
                        if (self.activeBreadcrumb.length === 0) {
                            //if this is undefined then we are probably doing a global search from the start so need to build up the breadcrumb
                            self.activeBreadcrumb.push(_.clone(self.arrCategory[0][0]));
                        }
                        break;
                    default:
                        if (locationRemoved.indexOf('search__') >= 0) {
                            var locRemSplit = locationRemoved.split('/');
                            var locRemFilter = _.find(locRemSplit, function (ar) {
                                return ar.indexOf('search__') >= 0;
                            });
                            self.searchTerm = locRemFilter.substring(locRemFilter.indexOf('search__') + 8);
                        } else {
                            self.searchTerm = '';
                        }
                        // if browser back and forward buttons or global search used for unpredictable jumps
                        var subfolders;
                        if ((self.arrCategory.length === 0 || self.arrCategory[0].length === 0) && numOfSlashesLocation > 0) {
                            subfolders = locationPath.substring(1).split('/');
                            self.fetchResults(subfolders[0], false);
                        } else {
                            if (self.DefaultFilterNodeNum === self.ActiveFilterNodeNum) {
                                subfolders = decodeURI(locationPath).substring(1).split('/');
                                var rootFolder = subfolders[0];
                                //if logo clicked to reset let's just skip this
                                if (rootFolder.length > 0) {
                                    self.fetchResults(rootFolder, true);
                                }
                            }
                        }
                        self.buildCurrentObj();
                        break;
                }
                if (!self.skipDisplayTiles) {
                    self.displayTiles();
                }
                self.lastLocationPath = locationPath + locationRemoved;
                self.JumpNav = {};
                self.limit = self.origLimit;
                self.affixed = false;
                self.showNoGlobalResults = false;
                self.progressbar.set(self.progressbar.status() + 4);
                $timeout(function () {
                    self.progressbar.complete();
                }, 100);
            }
        });
    };

    NavListController.prototype.fetchResults = function (interest, adjustArr) {
        var self = this;
        if (_.isUndefined(self.navsDict[interest])) {
            self.skipDisplayTiles = true;
            self.isFetching = true;
            self.tileInfoSrv.getAll('/webservices/categoryproduction.svc/FilterNodes/' + self.DefaultFilterNodeNum + '/', self.navCache, 'navigation').then(function (data) {
                self.getInterestItems(self.getAllInitialClasses, data);
                self.allTopLevels = _.map(data.data, function (kw) {
                    return { Name: kw.Name, Keywords: kw.Keywords.toLowerCase(), NodeID: kw.NodeID };
                });
                self.skipDisplayTiles = false;
            }, function (respData) {
                if (!self.allClasses.length || (self.allClasses.length && self.allClasses[0].Name === '')) {
                    self.allClasses = [{ Name: 'Error loading data.  Please refresh or come back later.', NodeID: ERRORLOADINGNODEID}];
                }
                self.isFetching = false;
                self.skipDisplayTiles = false;
            });
        }
        if (adjustArr) {
            //            adjustLevelArray(self.arrCategory, 1, self.arrCategory.length, true);
        }
        var classIndex = _.findIndex(self.allClasses, { 'Name': interest });
        if (classIndex >= 0) {
            var classesByInterest = [self.allClasses[classIndex]];
            self.getValues(classesByInterest, 1, self.navsDict[interest]);
        }
    };

    NavListController.prototype.printAllReport = function () {
        var self = this;
        self.printStatus = 'Printing...';
        self.printedReport = [];
        _.forEach(self.allClasses, function (sl) {
            self.getInterestItems(self.interestCompiled, sl);
        });
        self.printReport(self.classesByNodeId, [], []);
    };

    NavListController.prototype.printReport = function (nodes, keywords, kwArr) {
        var self = this;
        _.forEach(nodes, function (node) {
            if (_.isUndefined(node.parent)) {
                if (_.isArray(node)) {
                    _.forEach(node, function (n) {
                        var kwStringArr = [];
                        _.forEach(keywords, function (kw) {
                            kwStringArr.push(kw.Level + ':  ' + kw.Keywords);
                        });
                        var levelAndKeywords = kwStringArr.toString();
                        var uniqid = n.ProductionNumber === 0 ? n.PackageNo : n.ProductionNumber;
                        var prodNo = n.ProductionNumber;
                        var packageNo = n.PackageNo;
                        var foundArr = _.find(kwArr, { 'uniqid': uniqid });
                        if (_.isUndefined(foundArr)) {
                            var kws = '';
                            _.forEach(keywords, function (kw, ind) {
                                kws += kw.Keywords;
                                if (ind + 1 < keywords.length) {
                                    kws += ',';
                                }
                            });
                            kwArr.push({ uniqid: uniqid, prodid: prodNo, packid: packageNo, name: n.Title, keywords: kws, kws_0: levelAndKeywords });
                        } else {
                            var foundKeywords = foundArr.keywords;
                            var kws = '';
                            _.forEach(keywords, function (kw, ind) {
                                kws += kw.Keywords;
                                if (ind + 1 < keywords.length) {
                                    kws += ',';
                                }
                            });
                            var keywordArr = (kws + ',' + foundKeywords).split(',');
                            var kwUniq = _.uniq(keywordArr).toString();
                            foundArr.keywords = kwUniq;
                            for (var x = 1; x <= 10; x++) {
                                if (_.isUndefined(foundArr['kws_' + x])) {
                                    foundArr['kws_' + x] = levelAndKeywords;
                                    break;
                                }
                            }
                        }
                    });
                    keywords.pop();
                }
                return;
            }
            keywords.push({ Level: node.name, Keywords: node.keywords });
            self.printReport(node, keywords, kwArr);
        });
        self.printedReport = _.sortByOrder(kwArr, ['kws_7', 'kws_6'], ['asc']);
    };

    NavListController.prototype.getSublevels = function (level, nodeid) {
        var self = this;
        if (self.currentObj) {
            if (_.isUndefined(level)) {
                level = self.currentObj.Level;
                nodeid = self.currentObj.NodeID;
            }
            return _.filter(self.arrCategory[level + 1], { 'Parent': nodeid });

        } else {
            return;
        }
    };

    NavListController.prototype.chunkSublevels = function () {
        var self = this;
        var subLevels = self.getSublevels();
        var tempChunkLevels = [];
        if (!_.isUndefined(subLevels)) {
            var chunkSize = (Math.ceil(subLevels.length / 4));
            tempChunkLevels = _.chunk(subLevels, chunkSize);
            if (tempChunkLevels.length < 3) {
                tempChunkLevels.push([]);
            }
        }
        if (!_.isEqual(tempChunkLevels, self.chunkLevels)) {

            self.chunkLevels = tempChunkLevels;
        }
        return self.chunkLevels;
    };

    NavListController.prototype.navigateTo = function (subLevel) {
        var self = this;
        if (subLevel.Level === 1) {
            self.getInterestItems(self.interestClicked, subLevel);
        } else {
            self.setCurrent(subLevel);
        }
    };

    NavListController.prototype.getAllInitialClasses = function (self) {
        var locationPath = self.getLocationPath();
        if (locationPath.length && locationPath !== '/') {
            var match = locationPath.match(/^\/(.+?)(\/|$)/);
            var interestFolder = decodeURI(match[1]);
            self.getValues(self.allClasses, 1, self.navsDict[interestFolder]);
            if (self.mainMenuItems.length === 0) {
                var builtMobileMenu = self.buildMobileMenu();
                self.mainMenuItems.push.apply(self.mainMenuItems, builtMobileMenu);
            }
            self.buildCurrentObj();
            self.displayTiles();
        }
    };

    NavListController.prototype.getLocationPath = function () {
        var self = this;
        var locationPath = '';
        if (self.DefaultFilterNodeNum === self.ActiveFilterNodeNum) {
            locationPath = self.location.path();
        } else {
            var browserPath = self.location.path();
            var nodeHierarchy = getActiveNodeHierarchy(self.allClasses, 'NodeID', self.ActiveFilterNodeNum);
            _.forEachRight(nodeHierarchy, function (nh) {
                locationPath += '/' + nh.Name;
            });
            locationPath += browserPath;
        }
        return locationPath;
    };

    NavListController.prototype.getAllForMobileMenuFromHomepage = function () {
        var self = this;
        self.getValues(self.allClasses, 1, []);
        var builtMobileMenu = self.buildMobileMenu();
        self.mainMenuItems.length = 0;
        self.mainMenuItems.push.apply(self.mainMenuItems, builtMobileMenu);
    };

    NavListController.prototype.buildMobileMenu = function (menuArray, level, items, lastObject, names) {
        var self = this;
        var curLevel = level || 0;
        var storedMenu = menuArray || [];
        var arrCategory;
        if (_.isUndefined(items)) {
            if (self.DefaultFilterNodeNum === self.ActiveFilterNodeNum) {
                arrCategory = self.arrCategory[curLevel];
            } else {
                _.forEach(self.arrCategory, function (arr) {
                    var foundLevel = _.filter(arr, { 'NodeID': self.ActiveFilterNodeNum });
                    if (!_.isUndefined(foundLevel)) {
                        arrCategory = foundLevel;
                        return false;
                    }
                });
            }
        } else {
            arrCategory = items;
        }
        var urlToBuild = names || [];
        _.forEach(arrCategory, function (ac) {
            var tmp = { text: ac.Name, level: curLevel };
            if (ac.NodeID !== self.ActiveFilterNodeNum) {
                urlToBuild.push(ac.Name);
            }
            tmp.href = function () {
                if (this.length > 1) {
                    //if sub area clicked
                    var finalUrl = '';
                    for (var i = 0; i < this.length; i++) {
                        finalUrl += '/' + this[i].replace(/\//g, '%2F');
                    }
                    var locationPath = self.location.path();
                    var locationObj = seperateSlicersFromUrl(locationPath);
                    var locationSlicers = locationObj.removed;
                    self.location.path(finalUrl.trim() + locationSlicers);
                    self.applyScope();
                } else {
                    //if interest area clicked
                    var sl = _.find(self.allClasses, { 'Name': this[0] });
                    if (_.isUndefined(sl)) {
                        self.setCurrent(0);
                    } else {
                        self.getInterestItems(self.interestClicked, sl);
                    }
                    self.applyScope();
                }
            } .bind(_.clone(urlToBuild));
            if (typeof lastObject === 'undefined' || tmp.level === lastObject.level) {
                storedMenu.push(tmp);
            } else {
                if (typeof lastObject.items === 'undefined') {
                    lastObject.items = [];
                }
                lastObject.items.push(tmp);
            }
            var filteredItems = _.filter(self.arrCategory[++curLevel], { 'Parent': ac.NodeID });
            if (filteredItems.length) {
                self.buildMobileMenu(storedMenu, curLevel, filteredItems, tmp, urlToBuild);
            }
            --curLevel;
            urlToBuild.pop();
        });
        return storedMenu;
    };

    NavListController.prototype.getInterestItems = function (func, arg) {
        var self = this;
        var subLevelName;
        self.clearSearch(true);
        if (_.isUndefined(arg.Name)) {
            //if page load
            self.allClasses = [];
            self.allClasses.push.apply(self.allClasses, arg.data);
            var locationPath = self.getLocationPath();
            var locationObj = seperateSlicersFromUrl(locationPath);
            locationPath = locationObj.path;
            if (locationPath.length && locationPath !== '/') {
                var match = locationPath.match(/^\/(.+?)(\/|$)/);
                subLevelName = decodeURI(match[1]);
                //if user comes to site with filters in url but no interest area picked
                //                if (subLevelName.indexOf("__") > 0) {
                //                    subLevelName = undefined;
                //                    self.eventClassDropdown.isopen = true;
                //                }
                //            } else {
                //                self.eventClassDropdown.isopen = true;
            }
        } else {
            //if interest link clicked
            subLevelName = arg.Name;
        }
        if (!_.isUndefined(subLevelName)) {
            if (_.isUndefined(self.navsDict[subLevelName])) {
                //                self.tileInfoSrv.getAll('/webservices/categoryproduction.svc/categories/json/dayplanit', self.navCache, 'allProducts').then(function(data) {
                //                    self.allProducts = data.data;
                //                    _.forEach(self.allTopLevels, function(lev) {
                //                        var items = filterListByKeywords(self.allProducts, [lev.Keywords]);
                //                        self.navsDict[lev.Name] = items;
                //                    });
                //                    func(self, arg, true);
                //                });
            } else {
                func(self, arg, true);
            }
        } else {
            self.getAllForMobileMenuFromHomepage();
        }
    };

    NavListController.prototype.interestCompiled = function (self, subLevel, printNow) {
        var currentName = subLevel.Name;
        //        adjustLevelArray(self.arrCategory, 1, self.arrCategory.length, true);

        var classIndex = _.findIndex(self.allClasses, { 'Name': currentName });
        var classesByInterest = [self.allClasses[classIndex]];
        self.getValues(classesByInterest, 1, self.navsDict[currentName]);
        if (printNow) {
            self.printStatus = 'Printing ' + self.printNum + ' of ' + self.allClasses.length + ' reports';
            self.printNum++;
            if (self.printNum > self.allClasses.length) {
                self.printStatus = 'Done';
            }
            self.printReport(self.classesByNodeId, [], []);
        } else {
            self.printStatus = 'Full report printed';
        }
    };

    NavListController.prototype.interestClicked = function (self, subLevel) {
        var currentName = subLevel.Name;
        var currentSearch = subLevel.SearchTerm;
        var currentId = subLevel.NodeID;
        if (!_.isUndefined(self.currentObj) && currentName === self.currentObj.Name && currentId === self.currentObj.NodeID || (_.isUndefined(self.currentObj) && currentId === LOADINGNODEID)) {
            return;
        }
        if (_.isUndefined(self.currentObj) && currentId === ERRORLOADINGNODEID) {
            self.navCache.removeAll();
            location.reload();
        }
        //        adjustLevelArray(self.arrCategory, 1, self.arrCategory.length, true);

        var classIndex = _.findIndex(self.allClasses, { 'Name': currentName });
        var classesByInterest = [self.allClasses[classIndex]];
        self.getValues(classesByInterest, 1, self.navsDict[currentName]);

        var locationPath = self.location.path();
        var locationObj = seperateSlicersFromUrl(locationPath);
        var locationSlicers = locationObj.removed;
        self.populateSlicers(locationSlicers);

        if (_.isUndefined(self.currentObj)) {
            self.currentObj = {};
        }
        self.activeBreadcrumb = [];
        if (_.isUndefined(self.lastLocationPath)) {
            self.lastLocationPath = '';
        }
        self.activeBreadcrumb.push(_.clone(self.allProgramsObj));
        self.currentObj.Level = 1;
        self.currentObj.Name = currentName;
        self.currentObj.NodeID = currentId;
        self.currentObj.Current = true;
        self.currentObj.FeaturedItemsHeader = '';
        if (_.isUndefined(currentSearch)) {
            self.JumpNav = { To: currentName, Type: 'linkTo' };
        } else {
            self.JumpNav = { To: currentName, Type: 'sliceBy' };
        }
        self.setUrl(currentName, 'replace', 0, currentSearch);
    };

    NavListController.prototype.displayMicroSites = function (currentUrl) {
        var self = this;
        if (currentUrl.indexOf('School Of The Arts') >= 0) {
            if (_.isUndefined(self.microsites) || self.microsites.length === 0) {
                self.microsites = _.clone(MICROSITELIST);
                if (currentUrl.indexOf('/Dance') >= 0) {
                    _.pull(self.microsites,
                        _.find(self.microsites, { 'id': 'fineart' }),
                        _.find(self.microsites, { 'id': 'ceramics' }),
                        _.find(self.microsites, { 'id': 'jewelry' }),
                        _.find(self.microsites, { 'id': 'music' }),
                        _.find(self.microsites, { 'id': 'instruct' })
                    );
                }
                if (currentUrl.indexOf('/Fine Art & Design') >= 0) {
                    _.pull(self.microsites,
                        _.find(self.microsites, { 'id': 'dance' }),
                        _.find(self.microsites, { 'id': 'ceramics' }),
                        _.find(self.microsites, { 'id': 'jewelry' }),
                        _.find(self.microsites, { 'id': 'music' }),
                        _.find(self.microsites, { 'id': 'instruct' })
                    );
                }
                if (currentUrl.indexOf('/Ceramics') >= 0) {
                    _.pull(self.microsites,
                        _.find(self.microsites, { 'id': 'fineart' }),
                        _.find(self.microsites, { 'id': 'dance' }),
                        _.find(self.microsites, { 'id': 'jewelry' }),
                        _.find(self.microsites, { 'id': 'music' }),
                        _.find(self.microsites, { 'id': 'instruct' })
                    );
                }
                if (currentUrl.indexOf('/Music') >= 0) {
                    _.pull(self.microsites,
                        _.find(self.microsites, { 'id': 'fineart' }),
                        _.find(self.microsites, { 'id': 'dance' }),
                        _.find(self.microsites, { 'id': 'jewelry' }),
                        _.find(self.microsites, { 'id': 'ceramics' })
                    );
                }
                if (currentUrl.indexOf('/Jewelry') >= 0) {
                    _.pull(self.microsites,
                        _.find(self.microsites, { 'id': 'fineart' }),
                        _.find(self.microsites, { 'id': 'dance' }),
                        _.find(self.microsites, { 'id': 'ceramics' }),
                        _.find(self.microsites, { 'id': 'music' }),
                        _.find(self.microsites, { 'id': 'instruct' })
                    );
                }
            } else {
                var subFolderPresent = false;
                if (currentUrl.indexOf('/Dance') >= 0) {
                    subFolderPresent = true;
                    var fineart = _.find(self.microsites, { 'id': 'fineart' });
                    if (_.isObject(fineart)) {
                        _.pull(self.microsites, fineart);
                    }
                    var ceramics = _.find(self.microsites, { 'id': 'ceramics' });
                    if (_.isObject(ceramics)) {
                        _.pull(self.microsites, ceramics);
                    }
                    var jewelry = _.find(self.microsites, { 'id': 'jewelry' });
                    if (_.isObject(jewelry)) {
                        _.pull(self.microsites, jewelry);
                    }
                    var music = _.find(self.microsites, { 'id': 'music' });
                    if (_.isObject(music)) {
                        _.pull(self.microsites, music);
                    }
                    var instruct = _.find(self.microsites, { 'id': 'instruct' });
                    if (_.isObject(instruct)) {
                        _.pull(self.microsites, instruct);
                    }
                }
                if (currentUrl.indexOf('/Fine Art & Design') >= 0) {
                    subFolderPresent = true;
                    var dance = _.find(self.microsites, { 'id': 'dance' });
                    if (_.isObject(dance)) {
                        _.pull(self.microsites, dance);
                    }
                    var ceramics = _.find(self.microsites, { 'id': 'ceramics' });
                    if (_.isObject(ceramics)) {
                        _.pull(self.microsites, ceramics);
                    }
                    var jewelry = _.find(self.microsites, { 'id': 'jewelry' });
                    if (_.isObject(jewelry)) {
                        _.pull(self.microsites, jewelry);
                    }
                    var music = _.find(self.microsites, { 'id': 'music' });
                    if (_.isObject(music)) {
                        _.pull(self.microsites, music);
                    }
                    var instruct = _.find(self.microsites, { 'id': 'instruct' });
                    if (_.isObject(instruct)) {
                        _.pull(self.microsites, instruct);
                    }
                }
                if (currentUrl.indexOf('/Ceramics') >= 0) {
                    subFolderPresent = true;
                    var fineart = _.find(self.microsites, { 'id': 'fineart' });
                    if (_.isObject(fineart)) {
                        _.pull(self.microsites, fineart);
                    }
                    var dance = _.find(self.microsites, { 'id': 'dance' });
                    if (_.isObject(dance)) {
                        _.pull(self.microsites, dance);
                    }
                    var jewelry = _.find(self.microsites, { 'id': 'jewelry' });
                    if (_.isObject(jewelry)) {
                        _.pull(self.microsites, jewelry);
                    }
                    var music = _.find(self.microsites, { 'id': 'music' });
                    if (_.isObject(music)) {
                        _.pull(self.microsites, music);
                    }
                    var instruct = _.find(self.microsites, { 'id': 'instruct' });
                    if (_.isObject(instruct)) {
                        _.pull(self.microsites, instruct);
                    }
                }
                if (currentUrl.indexOf('/Jewelry') >= 0) {
                    subFolderPresent = true;
                    var fineart = _.find(self.microsites, { 'id': 'fineart' });
                    if (_.isObject(fineart)) {
                        _.pull(self.microsites, fineart);
                    }
                    var dance = _.find(self.microsites, { 'id': 'dance' });
                    if (_.isObject(dance)) {
                        _.pull(self.microsites, dance);
                    }
                    var ceramics = _.find(self.microsites, { 'id': 'ceramics' });
                    if (_.isObject(ceramics)) {
                        _.pull(self.microsites, ceramics);
                    }
                    var music = _.find(self.microsites, { 'id': 'music' });
                    if (_.isObject(music)) {
                        _.pull(self.microsites, music);
                    }
                    var instruct = _.find(self.microsites, { 'id': 'instruct' });
                    if (_.isObject(instruct)) {
                        _.pull(self.microsites, instruct);
                    }
                }
                if (currentUrl.indexOf('/Music') >= 0) {
                    subFolderPresent = true;
                    var fineart = _.find(self.microsites, { 'id': 'fineart' });
                    if (_.isObject(fineart)) {
                        _.pull(self.microsites, fineart);
                    }
                    var ceramics = _.find(self.microsites, { 'id': 'ceramics' });
                    if (_.isObject(ceramics)) {
                        _.pull(self.microsites, ceramics);
                    }
                    var jewelry = _.find(self.microsites, { 'id': 'jewelry' });
                    if (_.isObject(jewelry)) {
                        _.pull(self.microsites, jewelry);
                    }
                    var dance = _.find(self.microsites, { 'id': 'dance' });
                    if (_.isObject(dance)) {
                        _.pull(self.microsites, dance);
                    }
                }
                if (!subFolderPresent) {
                    var fineart = _.find(self.microsites, { 'id': 'fineart' });
                    if (_.isUndefined(fineart)) {
                        self.microsites.push(MICROSITEFINEART);
                    }
                    var ceramics = _.find(self.microsites, { 'id': 'ceramics' });
                    if (_.isUndefined(ceramics)) {
                        self.microsites.push(MICROSITECERAMICS);
                    }
                    var jewelry = _.find(self.microsites, { 'id': 'jewelry' });
                    if (_.isUndefined(jewelry)) {
                        self.microsites.push(MICROSITEJEWELRY);
                    }
                    var dance = _.find(self.microsites, { 'id': 'dance' });
                    if (_.isUndefined(dance)) {
                        self.microsites.push(MICROSITEDANCE);
                    }
                    var music = _.find(self.microsites, { 'id': 'music' });
                    if (_.isUndefined(music)) {
                        self.microsites.push(MICROSITEMUSIC);
                    }
                    var instruct = _.find(self.microsites, { 'id': 'instruct' });
                    if (_.isUndefined(instruct)) {
                        self.microsites.push(MICROSITEINSTRUCT);
                    }
                }
            }
        } else {
            self.microsites = [];
        }
    };

    NavListController.prototype.slicerPicked = function (whichDateTime, whatTime) {
        var self = this;
        switch (whichDateTime) {
            case 'sdate':
                self.updateEndMinDate();
                break;
            case 'time':
                self.timeSlice = self.updateCheckedGroups(self.timeSlice, whatTime);
                break;
            case 'day':
                self.daySlice = self.updateCheckedGroups(self.daySlice, whatTime);
                break;
            case 'age':
                self.ageSlice = self.updateCheckedGroups(self.ageSlice, whatTime);
                break;
        }
    };

    NavListController.prototype.updateCheckedGroups = function (chkSlc, chkVal) {
        if (_.isUndefined(chkVal)) {
            chkSlc = 'all';
        } else {
            if (!_.isArray(chkSlc)) {
                chkSlc = [];
            }
            if (chkSlc.indexOf(chkVal) > -1) {
                _.pull(chkSlc, chkVal);
                if (chkSlc.length === 0) {
                    chkSlc = 'all';
                }
            } else {
                chkSlc.push(chkVal);
                if (chkVal === 'newborn-5' || chkVal === '6-12' || chkVal === 'teens' || chkVal === 'multigenerational') {
                    _.pull(chkSlc, 'kids');
                } else if (chkVal === 'kids') {
                    _.pull(chkSlc, 'newborn-5');
                    _.pull(chkSlc, '6-12');
                    _.pull(chkSlc, 'teens');
                    _.pull(chkSlc, 'multigenerational');
                } else if (chkVal === 'adults' || chkVal === 'seniors') {
                    _.pull(chkSlc, 'alladults');
                } else if (chkVal === 'alladults') {
                    _.pull(chkSlc, 'adults');
                    _.pull(chkSlc, 'seniors');
                }
            }
        }
        return chkSlc;
    };

    NavListController.prototype.updateEndMinDate = function () {
        var self = this;
        self.minEndDate = _.clone(self.sdateSlice);
        if (self.sdateSlice > self.edateSlice) {
            self.edateSlice = self.sdateSlice;
        }
    };

    NavListController.prototype.openCalendar = function ($event, which) {
        var self = this;
        $event.preventDefault();
        $event.stopPropagation();
        if (which === 'end') {
            self.opened.end = !self.opened.end;
        } else {
            //prevents the start calendar opening up and overlapping the open end calendar
            self.opened.start = !self.opened.start && !self.opened.end ? true : false;
        }
    };

    NavListController.prototype.modifyUrlSearch = function (fromLink) {
        var self = this;
        var location = self.location;
        var locationPath;
        if (fromLink) {
            location = self.location;
            locationPath = location.path();
        } else {
            locationPath = '/';
            self.activeBreadcrumb = [];
            self.currentObj = _.clone(self.allProgramsObj);
        }
        locationPath = rewriteUrlLocation(SEARCHSLICEURL, self.textboxSearch, locationPath);
        location.path(locationPath);

        self.JumpNav = { To: self.currentObj.Name, Type: 'sliceBy' };
        self.searchTerm = self.textboxSearch;
        if (!fromLink) {
            self.debounceSearch.cancel();
            if (self.textboxSearch.length) {
                self.applyScope();
            }
        }
    };

    NavListController.prototype.searchByWord = function () {
        var self = this;
        self.clearSearch(false);
        if (self.textboxSearch.length) {
            self.showSpinner = true;
            self.debounceSearch();
        } else {
            self.modifyUrlSearch(false);
        }
    };

    NavListController.prototype.searchGlobal = function () {
        var self = this;
        if (self.textboxGlobalSearch.length) {
            self.showGlobalSpinner = true;
            self.debounceGlobalSearch(self.textboxGlobalSearch);
        } else {
            self.fetchSearchResults(true);
        }
    };

    NavListController.prototype.prepareSearchRedirect = function (slName) {
        var self = this;
        self.searchOpened = false;
        if (!_.isUndefined(self.textboxGlobalSearch)) {
            self.searchTerm = self.textboxGlobalSearch;
        }
        //if the search result that the user clicks on is in the same interest area that the user is in
        //then just redirect and do a word search as normal
        if (!_.isUndefined(self.currentObj) && slName === self.currentObj.Name) {
            self.textboxSearch = self.searchTerm;
            self.modifyUrlSearch(true);
            return;
        }
        var subLevel = _.find(self.allClasses, { 'Name': slName });
        subLevel.SearchTerm = self.textboxGlobalSearch;
        self.getInterestItems(self.interestClicked, subLevel);
    };

    NavListController.prototype.clearSearch = function (all) {
        var self = this;
        self.displaySearchResults = [];
        self.showNoGlobalResults = false;
        self.textboxGlobalSearch = '';
        if (all) {
            self.textboxSearch = '';
        }
    };

    NavListController.prototype.fetchSearchResults = function (isGlobal) {
        var self = this;
        self.showNoGlobalResults = false;
        self.displaySearchResults = [];
        self.onscreenSearchResults = [];
        var searchTerm = isGlobal ? self.textboxGlobalSearch : self.textboxSearch;
        if (!_.isUndefined(searchTerm) && searchTerm.length) {
            if (self.allProducts.length > 0) {
                var filteredData = checkListContainsWords(self.allProducts, _.deburr(searchTerm));
                if (filteredData.length > 0) {
                    var absUrl = self.location.absUrl().toLowerCase();
                    var baseUrl = absUrl.substring(0, absUrl.indexOf(SCRIPTNAME.toLowerCase())) + SCRIPTNAME;
                    _.forEach(filteredData, function (fd) {
                        var fdKeywords = _.uniq(_.map(fd.CategoryProductionKeywords, function (kw) {
                            return kw.keyword.toLowerCase();
                        }));
                        var allTopLevelKeywords = _.map(self.allTopLevels, 'Keywords');
                        var interestAreas = _.intersection(fdKeywords, allTopLevelKeywords);
                        _.forEach(interestAreas, function (ia) {
                            var subLevel = _.find(self.allTopLevels, { 'Keywords': ia });
                            var subLevelName = subLevel.Name;
                            var subLevelNodeId = subLevel.NodeID;
                            var href = baseUrl + '#/' + subLevelName + '/search__' + searchTerm;
                            if (_.isUndefined(_.find(self.displaySearchResults, { 'interestArea': subLevelName }))) {
                                self.displaySearchResults.push({
                                    searchTerm: searchTerm,
                                    interestArea: subLevelName,
                                    href: encodeURI(href)
                                });
                            }
                            var prodNo = fd.ProductionSeasonNumber === 0 ? fd.PackageNo : fd.ProductionSeasonNumber;
                            var foundClass = _.find(self.onscreenSearchResults, { 'ProdNo': prodNo });
                            if (_.isUndefined(foundClass)) {
                                var classInfoObj = formatDataFromJson(fd, subLevelNodeId);
                                self.onscreenSearchResults.push(classInfoObj);
                            }
                        });
                        self.showGlobalSpinner = false;
                        self.showNoGlobalResults = self.displaySearchResults.length ? false : true;
                    });
                    self.applyScope();
                } else {
                    //search finds no results
                    self.showGlobalSpinner = false;
                    self.showNoGlobalResults = isGlobal;
                }
            } else {
                //no products from page load
                self.showGlobalSpinner = false;
                self.showNoGlobalResults = isGlobal;
            };
        } else {
            self.showGlobalSpinner = false;
            self.showNoGlobalResults = false;
            if (isGlobal) {
                self.debounceGlobalSearch.cancel();
            }
        }
    };

    NavListController.prototype.displayTiles = function () {
        var self = this;
        self.sendToCanopyTracking();
        var onscreenResultsQueue = [];
        if (self.currentObj.NodeID === self.ActiveFilterNodeNum) {
            //if logo is clicked to reset the entire page
            self.onscreenResults = [];
            //            self.activeBreadcrumb = [];
            //            adjustLevelArray(self.arrCategory, 0, self.arrCategory.length, true);
            self.initialized = false;
            self.microsites = [];


            _.forEach(self.allProducts, function (res) {
                var prodNo = res.ProductionSeasonNumber === 0 ? res.PackageNo : res.ProductionSeasonNumber;
                var foundClass = _.find(onscreenResultsQueue, { 'ProdNo': prodNo });
                if (_.isUndefined(foundClass)) {
                    var classInfoObj = formatDataFromJson(res, self.currentObj.NodeID);
                    onscreenResultsQueue.push(classInfoObj);
                }
            });
            self.getClassesByNodeId(onscreenResultsQueue);
        } else {
            var foundNode = findNodeDeep(self.classesByNodeId, self.currentObj.NodeID);
            if (foundNode.results.length) {
                _.forEach(foundNode.results, function (res) {
                    var prodNo = res.ProductionSeasonNumber === 0 ? res.PackageNo : res.ProductionSeasonNumber;
                    var foundClass = _.find(onscreenResultsQueue, { 'ProdNo': prodNo });
                    if (_.isUndefined(foundClass)) {
                        var classInfoObj = formatDataFromJson(res, self.currentObj.NodeID);
                        onscreenResultsQueue.push(classInfoObj);
                    }
                });
            } else {
                var allNodeIds = pluckAllKeys(foundNode);
                _.forEach(allNodeIds, function (nid) {
                    foundNode = findNodeDeep(self.classesByNodeId, nid);
                    _.forEach(foundNode.results, function (res) {
                        var prodNo = res.ProductionSeasonNumber === 0 ? res.PackageNo : res.ProductionSeasonNumber;
                        var foundClass = _.find(onscreenResultsQueue, { 'ProdNo': prodNo });
                        if (_.isUndefined(foundClass)) {
                            var classInfoObj = formatDataFromJson(res, nid);
                            onscreenResultsQueue.push(classInfoObj);
                        }
                    });
                });
            }
            self.getClassesByNodeId(onscreenResultsQueue);
        }
    };

    NavListController.prototype.sendToCanopyTracking = function () {
        var self = this;
        var subfolders = _.map(self.activeBreadcrumb, 'Name');
        var intrstParam, subcatParam, ageParam, typeParam;
        if (subfolders.length) {
            intrstParam = subfolders.shift();
            if (subfolders.length) {
                intrstParam = subfolders.shift();
            }
            subcatParam = subfolders.join(', ');
            if (self.ageSlice === self.initAgeSlice) {
                ageParam = self.ageSlice;
            } else {
                ageParam = self.ageSlice.join(', ');
            }
            typeParam = self.typeSlice;

            var canopyData = {
                'interest': intrstParam
            };
            if (subcatParam !== '') {
                canopyData['subcategory'] = subcatParam;
            }
            if (ageParam !== 'all') {
                canopyData['age'] = ageParam;
            }
            if (typeParam !== 'all') {
                canopyData['type'] = typeParam;
            }

            tracker.trackUnstructEvent({
                schema: "iglu:com.canopylabs.178cead812/program-finder/jsonschema/1-0-0",
                data: canopyData
            });
        }
    };

    NavListController.prototype.getClassesByNodeId = function (onscreenResultsQueue) {
        var self = this;
        try {
            var locationPath = self.location.path();
            self.virtualPageUrl = locationPath;
            var breadcrumbs = self.getBreadcrumbs(false);
            if (breadcrumbs.length) {
                self.virtualPageTitle = breadcrumbs[0].Name;
            } else {
                breadcrumbs = self.getBreadcrumbs(true);
                if (!_.isUndefined(breadcrumbs) && breadcrumbs.length) {
                    self.virtualPageTitle = breadcrumbs.Name;
                } else {
                    self.virtualPageTitle = 'Program Finder Init';
                }
            }

            //      var lastLocationPath = self.lastLocationPath;
            //      lastLocationPath = seperateSlicersFromUrl(lastLocationPath).path;
            //      var lastLocArr = lastLocationPath.split("/");

            //      var locationParts = seperateSlicersFromUrl(locationPath);
            //      locationPath = locationParts.path;
            //      var locationPathRemoved = locationParts.removed;
            //      var locArr = locationPath.split("/");

            //note:  until we get a proper top-down pattern with the keywords, we can't use this code
            // if (_.difference(locArr, lastLocArr).length === 1) {
            //  if (self.onscreenResults.length) {
            //      _.forEach(_.clone(self.onscreenResults), function (arr) {
            //          var checkPropExists = _.find(onscreenResultsQueue, { 'ProdNo': arr.ProdNo });
            //          if (_.isUndefined(checkPropExists)) {
            //              _.pull(self.onscreenResults, arr);
            //          }
            //      });
            //  } else {
            //      self.onscreenResults = _.clone(onscreenResultsQueue);
            //  }
            // } else {
            self.onscreenResults = _.clone(onscreenResultsQueue);
            // }

            if ((!_.isUndefined(self.sdateSlice) && self.sdateSlice !== self.initSdateSlice) || (!_.isUndefined(self.edateSlice) && self.edateSlice !== self.initEdateSlice)) {
                self.onscreenResults = filterListByDateRange(self.onscreenResults, self.sdateSlice, self.edateSlice);
                self.dateApplyClicked = true;
            } else {
                self.dateApplyClicked = false;
            }

            if ((!_.isUndefined(self.daySlice) && self.daySlice !== self.initDaySlice) || (!_.isUndefined(self.timeSlice) && self.timeSlice !== self.initTimeSlice)) {
                self.onscreenResults = filterListWithFutureDates(self.onscreenResults, self.daySlice, self.timeSlice);
                self.dateApplyClicked = true;
            }

            if (!_.isUndefined(self.typeSlice) && self.typeSlice !== 'all') {
                self.onscreenResults = _.filter(self.onscreenResults, function (res) {
                    return res.ItemType.toLowerCase() === self.typeSlice;
                });
            }
            if (!_.isUndefined(self.ageSlice) && self.ageSlice !== self.initAgeSlice) {
                self.onscreenResults = filterListByKeywords(self.onscreenResults, self.ageSlice);
                self.ageApplyClicked = true;
            } else {
                self.ageApplyClicked = false;
            }
            //self.searchTerm = self.textboxSearch;
            if (self.searchTerm.length === 0) {
                if (_.isUndefined(self.textboxGlobalSearch) || self.textboxGlobalSearch.length === 0) {
                    self.searchTerm = self.textboxSearch;
                } else {
                    self.searchTerm = self.textboxGlobalSearch;
                    self.textboxSearch = self.searchTerm;
                }
            } else {
                self.textboxSearch = self.searchTerm;
            }
            self.onscreenResults = checkListContainsWords(self.onscreenResults, self.searchTerm);
//            if (self.onscreenResults.length === 0 && !self.isFetching) {
//                self.fetchSearchResults(false);
//            }

            // var sortBy;
            // var sortUrlLocation = locationPathRemoved.indexOf(SORTSLICEURL);
            // if (sortUrlLocation < 0) {
            //  sortBy = 'all';
            // } else {
            //  var endSlashLocation = locationPathRemoved.indexOf("/", sortUrlLocation + 1);
            //  if (endSlashLocation < 0) {
            //      endSlashLocation = locationPathRemoved.length;
            //  }
            //  sortBy = locationPathRemoved.substring(sortUrlLocation + 7, endSlashLocation);
            // }
            // switch (sortBy) {
            //  case 'progress':
            //      self.onscreenResults = _.sortByOrder(self.onscreenResults, ['InProgress', 'SortDate1', 'SortDate2'], [false, true, true]);
            //      break;
            //  case 'featured':
            //      self.onscreenResults = _.sortByOrder(self.onscreenResults, ['Featured', 'SortDate1', 'SortDate2'], [false, true, true]);
            //      break;
            //  default:
            //      self.onscreenResults = _.sortByAll(self.onscreenResults, ['SortDate1', 'SortDate2']);
            //      break;
            // }
            // self.sortOrder = sortBy;

            self.onscreenResults = _.sortByOrder(self.onscreenResults, ['Featured', 'SortDate1', 'SortDate2'], [false, true, true]);
            self.isFetching = false;
            self.showSpinner = false;
            self.initialized = true;
        }
        catch (err) {
            $exceptionHandler(err);
        }
    };

    NavListController.prototype.sortResults = function (sortBy) {
        var self = this;
        var location = self.location;
        var locationPath = location.path();

        locationPath = rewriteUrlLocation(SORTSLICEURL, sortBy, locationPath);
        location.path(locationPath);

        self.soonestSortSelected = sortBy === 'all' ? true : false;

        self.JumpNav = { To: self.currentObj.Name, Type: 'sliceBy' };
    };

    NavListController.prototype.populateSlicers = function (urlSlicers) {
        var self = this;
        var slicerUrls = [DAYSLICEURL, TIMESLICEURL, TYPESLICEURL, AGESLICEURL, SDATESLICEURL, EDATESLICEURL, SEARCHSLICEURL];
        self.daySlice = _.clone(self.initDaySlice);
        self.timeSlice = _.clone(self.initTimeSlice);
        self.typeSlice = 'all';
        self.ageSlice = _.clone(self.initAgeSlice);
        self.sdateSlice = self.initSdateSlice;
        self.edateSlice = self.initEdateSlice;
        self.textboxSearch = '';
        _.forEach(slicerUrls, function (slicerUrl, index) {
            var sliceUrlStartLocation = urlSlicers.indexOf(slicerUrl);
            if (sliceUrlStartLocation >= 0) {
                var sliceUrlEndLocation = urlSlicers.indexOf('/', sliceUrlStartLocation + 1);
                var sliceString = sliceUrlEndLocation >= 0 ? urlSlicers.substring(sliceUrlStartLocation, sliceUrlEndLocation) : urlSlicers.substring(sliceUrlStartLocation);
                var sliceValues = sliceString.substring(sliceString.indexOf('__') + 2);
                switch (index) {
                    case 0:
                        self.daySlice = sliceValues.split(',');
                        break;
                    case 1:
                        self.timeSlice = sliceValues.split(',');
                        break;
                    case 2:
                        self.typeSlice = sliceValues;
                        break;
                    case 3:
                        self.ageSlice = sliceValues.split(',');
                        break;
                    case 4:
                        self.sdateSlice = Number(sliceValues);
                        break;
                    case 5:
                        self.edateSlice = Number(sliceValues);
                        break;
                    case 6:
                        self.textboxSearch = sliceValues;
                        break;
                }
            }
        });
    };

    NavListController.prototype.buildCurrentObj = function () {
        var self = this;
        var locationPath = self.getLocationPath();
        var locationObj = seperateSlicersFromUrl(locationPath);
        locationPath = locationObj.path;
        var locationSlicers = locationObj.removed;
        try {
            if (locationPath.length && locationPath !== '/') {
                self.lastLocationPath = self.location.path();
                var subfolders = _.compact(decodeURI(locationPath).substring(1).split('/'));
                var findChild, foundChildParent, findObj, foundChild;
                self.activeBreadcrumb = [];
                var topmostNodeFound = false;
                _.forEachRight(subfolders, function (folder, index) {
                    if (folder.length) {
                        folder = folder.replace(/%2F/i, '/');
                        if (_.isUndefined(foundChildParent)) {
                            if (index === 0) {
                                //if this is only one level above then we can safely assume there are no duplicate children
                                findObj = { 'Name': folder };
                            } else {
                                //this is to safeguard against multiple children of the same name
                                var findAllPossibleChildren = _.where(self.arrCategory[index + 1], { 'Name': folder });
                                var findAllPossibleParents = _.where(self.arrCategory[index], { 'Name': subfolders[index - 1] });
                                _.forEach(findAllPossibleChildren, function (kids, index) {
                                    var parentId = kids.Parent;
                                    var foundParent = _.where(findAllPossibleParents, { NodeID: parentId });
                                    if (foundParent.length) {
                                        foundChildParent = foundParent[0].NodeID;
                                        return false;
                                    }
                                });
                                findObj = { 'Name': folder, Parent: foundChildParent };
                            }
                        } else {
                            findObj = { 'Name': folder, NodeID: foundChildParent };
                        }
                        findChild = _.where(self.arrCategory[index + 1], findObj);
                        foundChild = findChild[0];
                        if (_.isUndefined(foundChild)) {
                            //this condition would happen with someone mangling the URL such as "/School of the Arts/Ceramics/School of the Arts"
                            _.pullAt(subfolders, index);
                            self.location.path(fixUrl(self.location.path().replace(folder, '')));
                        } else {
                            foundChildParent = foundChild.Parent;
                            foundChild = _.clone(foundChild);
                            delete foundChild.Parent;

                            if (index === (subfolders.length - 1)) {
                                foundChild.Current = true;
                                self.currentObj = _.clone(foundChild);
                            }
                        }
                    }
                    if (!_.isUndefined(foundChild)) {
                        if (!topmostNodeFound) {
                            self.activeBreadcrumb.push(_.clone(foundChild));
                        }
                        if (self.DefaultFilterNodeNum !== self.ActiveFilterNodeNum) {
                            if (foundChild.NodeID === self.ActiveFilterNodeNum) {
                                topmostNodeFound = true;
                            }
                        }
                    }
                });
                self.activeBreadcrumb.push(_.clone(self.allProgramsObj));
                self.activeBreadcrumb.reverse();
            } else {
                self.activeBreadcrumb = [];
                self.currentObj = _.clone(self.allProgramsObj);
                self.activeBreadcrumb.push(self.currentObj);
                self.lastLocationPath = '';
            }
            self.populateSlicers(locationSlicers);
        }
        catch (err) {
            $exceptionHandler(err);
        }
    };

    NavListController.prototype.setNewPath = function (subLevel) {
        var self = this;
        if (subLevel.Name === self.currentObj.Name && subLevel.Level === self.currentObj.Level && subLevel.NodeID === self.currentObj.NodeID) {
            return;
        }
        self.setUrl(subLevel.Name, 'jump', subLevel.Level);
    };

    NavListController.prototype.setCurrent = function (currentId) {
        var self = this;
        var currentName, currentLevel, currentNode, jumpType, currentIndex, currentFeaturedContent;
        var urlMethod = 'default';
        if (isActualNumber(currentId)) {
            jumpType = 'linkBack';
            urlMethod = currentNode === self.ActiveFilterNodeNum ? 'reset' : 'parse';
            var breadCrumb = self.activeBreadcrumb[currentId];
            currentName = breadCrumb.Name;
            currentLevel = breadCrumb.Level;
            currentNode = breadCrumb.NodeID;
            currentFeaturedContent = breadCrumb.FeaturedItemsHeader;
        } else {
            var subLevel = currentId;
            currentName = subLevel.Name;
            currentLevel = self.currentObj.Level + 1;
            currentNode = subLevel.NodeID;
            jumpType = 'linkTo';
            currentFeaturedContent = subLevel.FeaturedItemsHeader;
        }
        self.currentObj.Level = currentLevel;
        self.currentObj.Name = currentName;
        self.currentObj.NodeID = currentNode;
        self.currentObj.FeaturedItemsHeader = currentFeaturedContent;
        self.JumpNav = { To: currentName, Type: jumpType };
        self.setUrl(currentIndex || currentName, urlMethod);
    };

    NavListController.prototype.setUrl = function (currentId, urlMethod, jumpTo, globalSearch) {
        var self = this;
        var location = self.location;
        var locationPath = location.path();
        var locationObj = seperateSlicersFromUrl(locationPath);
        locationPath = decodeURI(locationObj.path);
        var locationPathRemoved = locationObj.removed;
        if (!_.isUndefined(globalSearch)) {
            locationPathRemoved = '/search__' + globalSearch;
        }
        if (!isActualNumber(currentId)) {
            //protect against any links with a forward-slash, like Beginner/Advanced
            //this is so the slash doesn't get interpreted as another level
            currentId = currentId.replace(/\//g, '%2F');
        }
        var newLocationPath;
        switch (urlMethod) {
            case 'parse':
                var folderPosition = locationPath.indexOf('/' + currentId + '/');
                if (folderPosition >= 0) {
                    locationPath = locationPath.substr(0, folderPosition + currentId.length + 1);
                } else {
                    var hiddenPath = self.getLocationPath();
                    folderPosition = hiddenPath.indexOf('/' + currentId + '/');
                    locationPath = hiddenPath.substr(0, folderPosition);
                }
                newLocationPath = fixUrl(locationPath + locationPathRemoved);
                break;
            case 'build':
                var newLocation = '';
                for (var x = 1; x <= currentId; x++) {
                    newLocation += ('/' + self.activeBreadcrumb[x].Name);
                }
                newLocationPath = fixUrl(newLocation === '' ? '/' + newLocation : newLocation + locationPathRemoved);
                break;
            case 'replace':
                newLocationPath = fixUrl('/' + currentId + locationPathRemoved);
                break;
            case 'reset':
                newLocationPath = fixUrl(locationPathRemoved);
                break;
            case 'jump':
                var folderSplit = locationPath.split('/');
                var newLocation = '';
                for (var x = 0; x <= jumpTo; x++) {
                    newLocation += ('/' + folderSplit[x]);
                }
                newLocationPath = fixUrl(newLocation + '/' + currentId + locationPathRemoved);
                break;
            default:
                if (locationPath === '/') {
                    locationPath = '';
                }
                newLocationPath = fixUrl(locationPath + '/' + currentId + locationPathRemoved);
        }
        location.path(newLocationPath);
        self.displayMicroSites(newLocationPath);
    };

    NavListController.prototype.getValues = function (nodes, level, resultsByKeywords) {
        var self = this;
        var tempArr = [];
        _.forEach(nodes, function (node) {
            if ((node.ChildNode.length === 0 && node.Keywords.length) || node.ChildNode.length > 0) {
                tempArr.push({
                    Name: node.Name.trim(),
                    NodeID: node.NodeID,
                    Level: level,
                    Parent: node.ParentNodeID,
                    KeyWords: node.Keywords,
                    FeaturedItemsHeader: node.FeatureItemsContent
                });
                if (node.Keywords.length) {
                    var keywordsToLookForArr = node.Keywords.toLowerCase().split(',');
                    var filteredResults = filterListByKeywords(resultsByKeywords, keywordsToLookForArr);
                    var foundNode = findNodeDeep(self.classesByNodeId, node.ParentNodeID);
                    if (_.isObject(foundNode)) {
                        foundNode[node.NodeID] = {
                            results: filteredResults,
                            parent: node.ParentNodeID,
                            keywords: node.Keywords,
                            name: node.Name
                        };
                    } else {
                        self.classesByNodeId[node.NodeID] = {
                            results: filteredResults,
                            parent: node.ParentNodeID,
                            keywords: node.Keywords,
                            name: node.Name
                        };
                    }
                }
                if (level > MAXLEVEL) {
                    MAXLEVEL = level;
                }
                if (node.ChildNode.length) {
                    var childNodeValue = self.getValues(node.ChildNode, ++level, resultsByKeywords);
                    if (!childNodeValue) {
                        tempArr.pop();
                    }
                    --level;
                }
            }
        });
        if (tempArr.length === 0) {
            return false;
        }
        if (STARTINGLEVEL < MAXLEVEL) {
            STARTINGLEVEL = adjustLevelArray(self.arrCategory, STARTINGLEVEL, MAXLEVEL, false);
        }
        if (self.arrCategory.length) {
            //prevents repopulating the nav from global search jump
            if (!_.some(self.arrCategory[level], tempArr[0])) {
                self.arrCategory[level] = self.arrCategory[level].concat(tempArr);
            }
        }
        return true;
    };

    NavListController.prototype.getBreadcrumbs = function (last) {
        var self = this;
        return last ? _.last(self.activeBreadcrumb) : _.initial(self.activeBreadcrumb);
    };

    NavListController.prototype.saveSearch = function () {
        var self = this;
        var urlToAdd = self.location.absUrl();
        var locationPath = self.location.path();
        var locationObj = seperateSlicersFromUrl(locationPath);
        locationPath = locationObj.path;
        var foldersToAdd = locationPath.split('/');
        var folderToAdd = _.last(foldersToAdd);
        var locationPathRemoved = locationObj.removed;

        var slicerUrls = [DAYSLICEURL, TIMESLICEURL, TYPESLICEURL, AGESLICEURL, SDATESLICEURL, EDATESLICEURL, SEARCHSLICEURL, SORTSLICEURL];
        var slicerTexts = [];
        _.forEach(slicerUrls, function (slicerUrl, index) {
            var sliceUrlStartLocation = locationPathRemoved.indexOf(slicerUrl);
            if (sliceUrlStartLocation >= 0) {
                var sliceUrlEndLocation = locationPathRemoved.indexOf('/', sliceUrlStartLocation + 1);
                var sliceString = sliceUrlEndLocation >= 0 ? locationPathRemoved.substring(sliceUrlStartLocation, sliceUrlEndLocation) : locationPathRemoved.substring(sliceUrlStartLocation);
                var sliceValues = sliceString.substring(sliceString.indexOf('__') + 2);
                var textVal = (index >= 4 && index <= 5) ? formatDateOutput(new Date(Number(sliceValues)), true) : formatCommaString(sliceValues.toString());
                slicerTexts.push(textVal);
            }
        });

        var savedSearch = {
            url: urlToAdd,
            folder: folderToAdd,
            filter: formatCommaString(slicerTexts.toString())
        };

        var foundSearch = _.findIndex(self.savedSearches, function (ss) {
            return ss.url === savedSearch.url && ss.folder === savedSearch.folder && ss.filter === savedSearch.filter;
        });
        if (foundSearch >= 0) {
            self.deleteSaved(foundSearch, self.savedSearches, 'savedSearches');
        } else {
            self.savedSearches.push(savedSearch);
            self.cookieStore.put('savedSearches', self.savedSearches);
        }
    };

    NavListController.prototype.saveProgram = function (title, img, url, target) {
        var self = this;
        var savedProgram = {
            Url: url,
            UrlTarget: target,
            Title: title,
            Img: img
        };

        var foundProgram = _.findIndex(self.savedPrograms, function (sp) {
            return sp.Url === savedProgram.Url && sp.Title === savedProgram.Title && sp.Img === savedProgram.Img;
        });
        if (foundProgram >= 0) {
            self.deleteSaved(foundProgram, self.savedPrograms, 'savedPrograms');
        } else {
            self.savedPrograms.push(savedProgram);
            self.cookieStore.put('savedPrograms', self.savedPrograms);
        }
    };

    NavListController.prototype.deleteSaved = function (index, savedItems, type) {
        var self = this;
        savedItems.splice(index, 1);
        self.cookieStore.put(type, savedItems);
    };

    NavListController.prototype.loadMore = function (env) {
        var self = this;
        if (env === self.environment) {
            self.limit += self.origLimit;
        }
    };

    NavListController.prototype.sliceBy = function (slicer) {
        var self = this;
        var location = self.location;
        var locationPath = location.path();
        var origLocationPath = locationPath;
        var sliceUrl, sliceArr;
        switch (slicer) {
            case 'day':
                sliceUrl = DAYSLICEURL;
                sliceArr = self.daySlice;
                break;
            case 'time':
                sliceUrl = TIMESLICEURL;
                sliceArr = self.timeSlice;
                break;
            case 'type':
                sliceUrl = TYPESLICEURL;
                sliceArr = self.typeSlice;
                break;
            case 'age':
                sliceUrl = AGESLICEURL;
                sliceArr = self.ageSlice;
                break;
            case 'sdate':
                sliceUrl = SDATESLICEURL;
                sliceArr = Date.parse(self.sdateSlice);
                break;
            case 'edate':
                sliceUrl = EDATESLICEURL;
                sliceArr = Date.parse(self.edateSlice);
                break;
            case 'datetime':
                sliceUrl = [DAYSLICEURL, TIMESLICEURL, SDATESLICEURL, EDATESLICEURL];
                sliceArr = [self.daySlice, self.timeSlice, Date.parse(self.sdateSlice), Date.parse(self.edateSlice)];
                break;
            case 'datetimeage':
                sliceUrl = [DAYSLICEURL, TIMESLICEURL, SDATESLICEURL, EDATESLICEURL, AGESLICEURL];
                sliceArr = [self.daySlice, self.timeSlice, Date.parse(self.sdateSlice), Date.parse(self.edateSlice), self.ageSlice];
                break;
            case 'datetimeagetypesearch':
                sliceUrl = [DAYSLICEURL, TIMESLICEURL, SDATESLICEURL, EDATESLICEURL, AGESLICEURL, TYPESLICEURL, SEARCHSLICEURL];
                sliceArr = [self.daySlice, self.timeSlice, Date.parse(self.sdateSlice), Date.parse(self.edateSlice), self.ageSlice, self.typeSlice, self.textboxSearch];
                break;
        }
        if (!_.isUndefined(sliceUrl)) {
            if (_.isArray(sliceUrl)) {
                _.forEach(sliceUrl, function (arr, idx) {
                    if (!_.isUndefined(sliceArr[idx])) {
                        locationPath = rewriteUrlLocation(arr, sliceArr[idx], locationPath);
                    }
                });
            } else {
                locationPath = rewriteUrlLocation(sliceUrl, sliceArr, locationPath);
            }
            if (locationPath === origLocationPath) {
                self.opened.dayOrTime = false;
                self.opened.ageRange = false;
            } else {
                location.path(locationPath);
            }
            self.JumpNav = { To: self.currentObj.Name, Type: 'sliceBy' };
        }
    };

    NavListController.prototype.checkDateState = function (open) {
        var self = this;
        if (open) {
            self.origDaySlice = _.clone(self.daySlice);
            self.origTimeSlice = _.clone(self.timeSlice);
            self.origSdateSlice = self.sdateSlice;
            self.origEdateSlice = self.edateSlice;
            self.opened.dayOrTime = true;
            self.dateClearClicked = false;
        } else {
            //if popup closes and apply not clicked then it resets
            if (!self.dateApplyClicked && !self.dateClearClicked) {
                self.daySlice = _.clone(self.origDaySlice);
                self.timeSlice = _.clone(self.origTimeSlice);
                self.sdateSlice = self.origSdateSlice;
                self.edateSlice = self.origEdateSlice;
            }
            self.opened.dayOrTime = false;
        }
    };

    NavListController.prototype.checkDateInit = function () {
        var self = this;
        //https://github.com/angular-ui/bootstrap/issues/3701 - clear date issue
        //since fields don't get cleared directly due to bug, we must explicitly set date fields to undefined
        if (_.isNull(self.sdateSlice) || (self.sdateSlice && (typeof self.sdateSlice === 'object' && (self.sdateSlice).getTime() === 0))) {
            delete self.sdateSlice;
        }
        if (_.isNull(self.edateSlice) || (self.edateSlice && (typeof self.edateSlice === 'object' && (self.edateSlice).getTime() === 0))) {
            delete self.edateSlice;
        }
        return (self.sdateSlice === self.initSdateSlice && self.edateSlice === self.initEdateSlice && _.isEqual(self.daySlice, self.initDaySlice)
            && _.isEqual(self.timeSlice, self.initTimeSlice) && (_.isUndefined(self.dateApplyClicked) || !self.dateApplyClicked));
    };

    NavListController.prototype.checkAgeInit = function () {
        var self = this;
        return (_.isEqual(self.ageSlice, self.initAgeSlice) && (_.isUndefined(self.ageApplyClicked) || !self.ageApplyClicked));
    };

    NavListController.prototype.clearDropDown = function (clearWhich) {
        var self = this;
        if (clearWhich.indexOf('datetime') >= 0) {
            self.daySlice = self.initDaySlice;
            self.timeSlice = self.initTimeSlice;
            self.sdateSlice = self.initSdateSlice;
            self.edateSlice = self.initEdateSlice;
            self.dateClearClicked = true;
        }
        if (clearWhich.indexOf('age') >= 0) {
            self.ageSlice = self.initAgeSlice;
            self.ageClearClicked = true;
        }
        if (clearWhich.indexOf('type') >= 0) {
            self.typeSlice = 'all';
        }
        if (clearWhich.indexOf('search') >= 0) {
            self.textboxSearch = '';
            self.searchTerm = '';
        }
        self.sliceBy(clearWhich);
    };

    NavListController.prototype.checkAgeState = function (open) {
        var self = this;
        if (open) {
            self.origAgeSlice = _.clone(self.ageSlice);
            self.opened.ageRange = true;
            self.ageClearClicked = false;
        } else {
            if (!self.ageApplyClicked && !self.ageClearClicked) {
                self.ageSlice = _.clone(self.origAgeSlice);
            }
            self.opened.ageRange = false;
        }
    };

    NavListController.prototype.checkSearchSaved = function () {
        var self = this;
        var isSearchSaved = !_.isUndefined(_.find(self.savedSearches, { 'url': self.location.absUrl() }));
        return isSearchSaved;
    };

    NavListController.prototype.checkProgramSaved = function (title) {
        var self = this;
        var isSearchSaved = !_.isUndefined(_.find(self.savedPrograms, { 'Title': title }));
        return isSearchSaved;
    };

    NavListController.prototype.displayFilterOptions = function () {
        var self = this;
        self.enabledFilters = {};
        var isDateFilterEnabled = self.isFilterEnabled('date');
        var index = 0;
        if (isDateFilterEnabled) {
            self.enabledFilters['Date or Time'] = {
                pre: '',
                suf: '',
                ind: ++index
            };
        }
        var isTypeFilterEnabled = self.isFilterEnabled('type');
        if (isTypeFilterEnabled) {
            self.enabledFilters['Class/Event'] = {
                pre: '',
                suf: '',
                ind: ++index
            };
        }
        var isAgeFilterEnabled = self.isFilterEnabled('age');
        if (isAgeFilterEnabled) {
            self.enabledFilters['Age Range'] = {
                pre: '',
                suf: '',
                ind: ++index
            };
        }
        var isSearchFilterEnabled = self.isFilterEnabled('search');
        if (isSearchFilterEnabled) {
            self.enabledFilters.Search = {
                pre: '',
                suf: '',
                ind: ++index
            };
        }
        if (_.size(self.enabledFilters) > 1) {
            _.forEach(self.enabledFilters, function (arr, ind) {
                if (arr.ind === _.size(self.enabledFilters)) {
                    arr.pre = 'or&nbsp;';
                } else {
                    if (arr.ind === (_.size(self.enabledFilters) - 1)) {
                        if (_.size(self.enabledFilters) > 2) {
                            arr.suf = ',&nbsp;';
                        } else {
                            arr.suf = '&nbsp;';
                        }
                    } else {
                        arr.suf = ',&nbsp;';
                    }
                }
            });
        }
        if (_.size(self.enabledFilters) === 0) {
            return false;
        }
        var okToShow = false;
        if ((self.dateApplyClicked && self.initialized) || self.typeSlice !== 'all' || (self.ageApplyClicked && self.initialized) || self.searchTerm !== '') {
            okToShow = true;
        }
        return okToShow;
    };

    NavListController.prototype.isFilterEnabled = function (which) {
        var self = this;
        var enabled;
        switch (which) {
            case 'date':
                enabled = !self.checkDateInit() && self.initialized;
                break;
            case 'type':
                enabled = !_.isUndefined(self.typeSlice) && self.typeSlice !== 'all';
                break;
            case 'age':
                enabled = !self.checkAgeInit() && self.initialized;
                break;
            case 'search':
                enabled = !_.isUndefined(self.textboxSearch) && self.textboxSearch !== '';
                break;
            default:
                enabled = (!self.checkDateInit() && self.initialized) ||
                (!_.isUndefined(self.typeSlice) && self.typeSlice !== 'all') || (!self.checkAgeInit() && self.initialized) ||
                (!_.isUndefined(self.textboxSearch) && self.textboxSearch !== '');
        }
        return enabled;
    };

    NavListController.prototype.scrollReset = function () {
        var self = this;
        self.scrollingUp = true;
        self.affixed = false;
    };

    NavListController.prototype.showFeaturedHeader = function () {
        var self = this;
        var breadcrumbs = self.getBreadcrumbs(true);
        if (_.isUndefined(breadcrumbs)) {
            return false;
        } else {
            return ((self.getBreadcrumbs(true)).FeaturedItemsHeader).length > 0 && self.onscreenResults.length > 0;
        }
    };

    NavListController.prototype.mobileDetect = function () {
        // User-agent search for common mobile device header text, (common OR lesser common devices AND does it have "mobi", if found then this is a mobile device
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
            || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4)) && /Mobi/i.test(navigator.userAgent)) {
            isMobile = true;
        } else {
            isMobile = false;
        }
    };

    NavListController.prototype.addIntroCookies = function () {
        var self = this;
        var expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + 1);
        self.cookies.put('introScreen', 'displayed', { 'expires': expireDate });
        self.cookies.put('interestIntro', 'clicked', { 'expires': expireDate });
        self.cookies.put('browseBtnIntro', 'clicked', { 'expires': expireDate });
        self.displayIntro = false;
    };

    var pluckAllKeys = function (obj, res) {
        var res = res || [];
        _.forOwn(obj, function (v, k) {
            if (isActualNumber(k)) {
                res.push(Number(k));
            } else {
                return;
            }
            if (_.isObject(v)) {
                pluckAllKeys(v, res);
            }
        });
        return res;
    };

    var getActiveNodeHierarchy = function (arr, key, val, res) {
        var res = res || [];
        _.forEach(arr, function (o) {
            if (o.hasOwnProperty(key) && o[key] === val) {
                res.push(o);
                return false;
            }
            if (_.isObject(o)) {
                getActiveNodeHierarchy(o, key, val, res);
            }
            if (res.length) {
                if (_.isPlainObject(o)) {
                    res.push(o);
                }
                return false;
            }
        });
        return res;
    };

    var findNodeDeep = function (items, prop) {
        function traverse(value) {
            var result;
            if (value.hasOwnProperty(prop)) {
                result = value[prop];
            } else {
                if (value.hasOwnProperty('CategoryProductionKeywords')) {
                    return false;
                }
                _.forEach(value, function (val) {
                    if (val.hasOwnProperty(prop)) {
                        result = val[prop];
                        return false;
                    }
                    if (_.isObject(val)) {
                        result = traverse(val);
                    }
                    if (result) {
                        return false;
                    }
                });
            }
            return result;
        }
        return traverse(items);
    };

    var rewriteUrlLocation = function (sliceUrl, sliceVal, locationPath) {
        var sliceUrlStartLocation = locationPath.indexOf(sliceUrl);
        if (sliceUrlStartLocation >= 0) {
            var sliceUrlEndLocation = locationPath.indexOf('/', sliceUrlStartLocation + 1);
            var sliceStringToReplace = sliceUrlEndLocation >= 0 ? locationPath.substring(sliceUrlStartLocation, sliceUrlEndLocation) : locationPath.substring(sliceUrlStartLocation);
            //clear from url if field is deselected or value is for 'all' or value is erroneous
            if (!sliceVal.toString().length || _.isNaN(sliceVal) || sliceVal === 'all') {
                sliceUrl = '';
                sliceVal = '';
            }
            locationPath = fixUrl(locationPath.replace(sliceStringToReplace, sliceUrl + sliceVal.toString()));
        } else {
            if (!_.isNaN(sliceVal) && sliceVal !== 'all' && sliceVal !== '') {
                locationPath = fixUrl(locationPath + sliceUrl + sliceVal.toString());
            }
        }
        return locationPath;
    };

    var fixUrl = function (possiblyMessyUrl) {
        //replace any urls that have double slashes with one slash
        return possiblyMessyUrl.replace(/\/\//g, '/');
    };

    var filterListByDateRange = function (navArr, sdate, edate) {
        var filteredNavs;
        if (!_.isUndefined(sdate) && isDate(sdate)) {
            if (!_.isUndefined(edate) && isDate(edate)) {
                filteredNavs = _.filter(navArr, function (navs) {
                    var sortDate1 = navs.SortDate1;
                    return sortDate1 >= sdate && sortDate1 <= edate;
                });
            } else {
                filteredNavs = _.filter(navArr, function (navs) {
                    var sortDate1 = navs.SortDate1;
                    return sortDate1 >= sdate;
                });
            }
        } else {
            if (!_.isUndefined(edate) && isDate(edate)) {
                filteredNavs = _.filter(navArr, function (navs) {
                    var sortDate1 = navs.SortDate1;
                    return sortDate1 <= edate;
                });
            } else {
                filteredNavs = navArr;
            }
        }
        return filteredNavs;
    };

    var checkListContainsWords = function (results, searchVal) {
        if (!_.isUndefined(searchVal) && searchVal.length) {
            var filteredNavs = [];
            _.forEach(results, function (result) {
                var descText = result.DescText;
                if (_.isUndefined(descText)) {
                    descText = result.ShortDesc;
                }
                var teachers;
                if (_.isUndefined(result.Teachers)) {
                    var instructors = _.map(result.ProdSeasonInstructors, function (arr) {
                        return arr.Instructor_name.replace(/\s{2,}/g, ' ');
                    });
                    teachers = instructors.toString();
                } else {
                    teachers = result.Teachers;
                }
                var keyWord;
                if (_.isUndefined(result.KeyWord)) {
                    keyWord = _.pluck(result.CategoryProductionKeywords, 'keyword');
                } else {
                    keyWord = result.KeyWord;
                }
                if (getRank(result.Title, searchVal) > 0 || getRank(descText, searchVal) > 0 || getRank(teachers, searchVal) > 0 || getRank(keyWord.toString(), searchVal) > 0) {
                    filteredNavs.push(result);
                }
            });
        } else {
            filteredNavs = results;
        }
        return filteredNavs;
    };

    var getRank = function (itemToSearchIn, searchItem) {
        if (itemToSearchIn.length > 0) {
            var entirePhrase = _.deburr(searchItem.trim().toLowerCase());
            var spacesInPhrase = entirePhrase.match(/\s/g);
            var countSpaces = 0;
            if (spacesInPhrase != null) {
                countSpaces = spacesInPhrase.length;
            }
            var splitPhrase = entirePhrase.split(' ');
            var strippedPhraseArr = _.filter(splitPhrase, function (word) {
                if (!_.includes(STOPWORDS, word.toLowerCase())) {
                    return word;
                }
            });
            var item = _.deburr(itemToSearchIn.toLowerCase());
            if (item.indexOf(entirePhrase) >= 0) {
                //if exact phrase is found and phrase is more than one word
                if (countSpaces > 0) {
                    return 1;
                } else {
                    //if exact phrase is found and phrase is just one word
                    //then strip it to insure it's not matching a common word
                    if (!_.includes(STOPWORDS, item.toLowerCase())) {
                        return 1;
                    }
                }
            }
            if (strippedPhraseArr.length) {
                //strip item of weird characters
                var cleanedItem = item.replace(/[^\w\s]/gi, ' ');
                //divide string into an array using whitespace removing any empty elements
                var itemList = _.compact(cleanedItem.split(' '));
                var itemCount = 0;
                _.forEach(strippedPhraseArr, function (word) {
                    if (_.includes(itemList, word.toLowerCase())) {
                        ++itemCount;
                    }
                });
                //if all parts of the phrase are found
                if (itemCount === strippedPhraseArr.length) {
                    return 2;
                }
                //if any parts of the phrase are found
                //if (itemCount > 0) {
                //    return 3;
                //}
            }
        }
        return 0;
    };

    var isBlankSlice = function (slice) {
        return (_.isUndefined(slice) || slice === 'all');
    };

    var filterListWithFutureDates = function (navArr, daySlices, timeSlices) {
        var filteredNavs;
        if (isBlankSlice(daySlices) && isBlankSlice(timeSlices)) {
            filteredNavs = navArr;
        } else {
            if (daySlices === 'all') {
                daySlices = _.clone(WEEKDAYS);
                var shiftDay = daySlices.shift();
                daySlices.push(shiftDay);
            }
            if (timeSlices === 'all') {
                timeSlices = _.clone(DAYPARTS);
            }
            filteredNavs = _.filter(navArr, function (navs) {
                var isSlicing = false;
                if (navs.FuturePerformances) {
                    // when page first loads
                    var navFutureDates = _.map(navs.FuturePerformances, function (futurePerf) {
                        return new Date(parseInt(futurePerf.perf_dt.substr(6)));
                    });
                } else {
                    var navFutureDates = _.map(navs.FutureDates, function (futurePerf) {
                        return new Date(parseInt(futurePerf.substr(6)));
                    });
                    isSlicing = true;
                }
                var filtered = _.filter(daySlices, function (daySlice) {
                    var returnVal = false;
                    _.forEach(navFutureDates, function (fDate) {
                        var dayNum = fDate.getDay();
                        var hourNum = fDate.getHours();
                        var minNum = fDate.getMinutes();
                        var dayPart;
                        if (hourNum < 12) {
                            if (hourNum == 11 && minNum >= 30) {
                                dayPart = 'afternoon';
                            } else {
                                dayPart = 'morning';
                            }
                        } else if (hourNum >= 12 && hourNum < 17) {
                            dayPart = 'afternoon';
                        } else if (hourNum >= 17) {
                            dayPart = 'evening';
                        }
                        if (WEEKDAYS[dayNum] === daySlice && _.includes(timeSlices, dayPart)) {
                            returnVal = true;
                        }
                    });
                    return returnVal;
                });
                return isSlicing ? filtered.length > 0 : filtered.length === slices.length;
            });
        }
        return filteredNavs;
    };

    var filterListByKeywords = function (navArr, keywords) {
        var filteredNavs;
        if (!_.isUndefined(keywords) && keywords.length) {
            filteredNavs = _.filter(navArr, function (navs) {
                var isSlicing = false;
                var navKeywords;
                if (navs.CategoryProductionKeywords) {
                    // when page first loads
                    navKeywords = _.map(navs.CategoryProductionKeywords, function (catprod) {
                        return catprod.keyword.toLowerCase().trim();
                    });
                } else {
                    navKeywords = _.map(navs.KeyWord, function (catprod) {
                        return catprod.toLowerCase().trim();
                    });
                    isSlicing = true;
                }
                var filtered = _.filter(keywords, function (keyword) {
                    var returnVal;
                    keyword = keyword.trim();
                    switch (keyword) {
                        case 'multigenerational':
                            returnVal = navKeywords.indexOf('parenting & family') != -1;
                            break;
                        case '6-12':
                            returnVal = navKeywords.indexOf('6-12 years') != -1;
                            break;
                        case 'newborn-5':
                            returnVal = navKeywords.indexOf('newborn-5 years') != -1;
                            break;
                        case 'kids':
                            returnVal = navKeywords.indexOf('parenting & family') != -1 || navKeywords.indexOf('6-12 years') != -1 || navKeywords.indexOf('newborn-5 years') != -1 || navKeywords.indexOf('teens') != -1;
                            break;
                        case 'alladults':
                            returnVal = navKeywords.indexOf('adults') != -1 || navKeywords.indexOf('seniors') != -1;
                            break;
                        default:
                            returnVal = navKeywords.indexOf(keyword) != -1;
                    }
                    return returnVal;
                });
                return isSlicing ? filtered.length > 0 : filtered.length === keywords.length;
            });
        } else {
            filteredNavs = navArr;
        }
        return filteredNavs;
    };

    var formatDataFromJson = function (arr, nodeId) {
        var packageNo = arr.PackageNo;
        var prodNo = arr.ProductionSeasonNumber === 0 ? packageNo : arr.ProductionSeasonNumber;
        var keyWords = _.pluck(arr.CategoryProductionKeywords, 'keyword');
        var futurePerformanceDates = _.pluck(arr.FuturePerformances, 'perf_dt');
        var itemTypes = _.remove(keyWords, function (n) {
            return (n.toLowerCase() === 'class' || n.toLowerCase() === 'event');
        });
        var featured = _.includes(keyWords, 'Featured Item') ? true : false;
        var pushToBottom = arr.PushToBottomOfList;
        if (pushToBottom && featured) {
            featured = false;
        }
        var itemType = itemTypes.length ? itemTypes[0] : '';
        var mainImage = arr.MainImage;
        var image = mainImage.length === 0 ? '/_ui/uptown/img/default_lrg_516x311.jpg' : mainImage.substring(mainImage.indexOf('/'));
        var begDate = arr.NextPerformanceDateTime || arr.FirstDate;
        begDate = new Date(parseInt(begDate.substr(6)));
        var yearNumber = begDate.getFullYear();

        var futurePerfCount = Number(arr.FuturePerformanceCount);
        var startDate = futurePerfCount > 1 ? 'Multiple dates/times' : formatDateOutput(begDate);

        var sortDate1 = '';
        var sortDate2 = '';
        var warning = arr.ProdStatus;
        var inProgress;
        if (pushToBottom || begDate < new Date()) {
            sortDate2 = begDate;
            //10 is an arbirtary number to set the secondary sorting
            sortDate1 = begDate.setFullYear(yearNumber + 10);
            inProgress = true;
            pushToBottom = true;
        } else {
            sortDate1 = begDate;
            sortDate2 = '';
            inProgress = false;
        }

        var shortDescription = '<div class="shortDescTxt hidden-xs pb10">' + arr.ShortDesc + '</div>';
        var shortDesc = shortDescription.replace(/<p>/g, '').replace(/<\/p>/g, '<br />');
        var instructors = _.map(arr.ProdSeasonInstructors, function (arr) {
            return arr.Instructor_name.replace(/\s{2,}/g, ' ');
        });
        var teachers = instructors.toString();
        var isAPackage = arr.IsFixedPackage || arr.IsCYOPackage;

        if (isActualNumber(futurePerfCount) && futurePerfCount > 0) {
            if (teachers.length && futurePerfCount > 1) {
                shortDesc += '<div class="teach"><b>Instructor' + (instructors.length > 1 ? 's' : '') + ':</b>&nbsp;&nbsp;' + teachers.replace(/,/g, ', ') + '</div>';
            }
            var performances = arr.FuturePerformances;
            if (performances.length > 0) {
                if (performances.length > 1) {
                    if (packageNo === 0) {
                        shortDesc += '<a class="expand-collapse">' + 'Multiple Dates/Times (' + performances.length + ')' + ' <i class="fa fa-lg fa-caret-down"></i></a>';
                    } else {
                        shortDesc += '<a class="expand-collapse">' + 'This Subscription Includes (' + performances.length + ')' + ' <i class="fa fa-lg fa-caret-down"></i></a>';
                    }
                }
                _.forEach(performances, function (p, ind) {
                    var perfDate = p.perf_dt;
                    perfDate = new Date(parseInt(perfDate.substr(6)));
                    var futureDate = formatDateOutput(perfDate);
                    var fromPrice = p.lowest_price;
                    if (fromPrice !== 'Free') {
                        fromPrice = 'from ' + fromPrice;
                    }
                    var numSessions = p.number_of_sessions;
                    var dowArr, teachArr;
                    if (itemType.toLowerCase() === 'class') {
                        var rawTeachers = p.instructors;
                        teachArr = rawTeachers.split(',');
                        var classInstructors = '';
                        _.forEach(teachArr, function (tch, index) {
                            classInstructors += tch;
                            if ((index + 1) < teachArr.length) {
                                classInstructors += ', ';
                            }
                        });
                        var rawDaysOfWeek = p.days_of_week;
                        if (!_.isNull(rawDaysOfWeek)) {
                            dowArr = rawDaysOfWeek.split(',');
                            var daysOfWeek = '';
                            _.forEach(dowArr, function (dow, index) {
                                daysOfWeek += dow;
                                if ((index + 1) < dowArr.length) {
                                    daysOfWeek += ', ';
                                }
                            });
                        }
                    }
                    if (packageNo === 0) {
                        if (ind === 0) {
                            shortDesc += '<div class="expand-collapse-container table-responsive ' + ((ind + 1) === performances.length ? '' : 'collapse') + '">';
                            shortDesc += '<table width="100%" cellpadding="0" cellspacing="0" class="table table-striped schedule"><tbody><tr>';
                            if (itemType.toLowerCase() === 'class') {
                                shortDesc += '<th width="185">Start Date</th><th>Day' + (dowArr.length > 1 ? 's' : '') + '</th>' +
                                    '<th>Session' + (numSessions > 1 ? 's' : '') + '</th><th>Price</th>' +
                                    '<th>' + (teachers.length ? 'Instructor' + (teachArr.length > 1 ? 's' : '') : '') + '</th>';
                            } else {
                                shortDesc += '<th width="185">Date</th><th>Price</th>';
                            }
                            shortDesc += '</tr>';
                        }
                        shortDesc += '<tr><td class="futureDate">' + futureDate + '</td>';
                        if (itemType.toLowerCase() === 'class') {
                            shortDesc += '<td class="days-week">' + daysOfWeek + '</td><td class="session-count">' + numSessions + '</td>' +
                                '<td class="price-amt">' + fromPrice + '</td><td class="instructors">' + classInstructors + '</td>';
                        } else {
                            shortDesc += '<td>' + fromPrice + '</td>';
                        }
                        shortDesc += '</tr>';

                        //Closes the table and expand/collapse div
                        if ((ind + 1) === performances.length) {
                            shortDesc += '</tbody></table></div>';
                        }
                    } else {
                        if (ind === 0) {
                            shortDesc += '<div class="expand-collapse-container collapse"><table cellpadding="0" cellspacing="0" class="table table-striped schedule schedule-subs mt5"><tbody><tr>';
                        }
                        shortDesc += '<td width="100"><img src="http://www.92y.org' + p.thumbnail + '" border="0" alt="' + p.title + '" style="width: 105px;"><br />';
                        shortDesc += '<a href="http://www.92y.org/tickets/production.aspx?ba=1&performanceNumber=' + p.perf_no + '" target="_blank">' + p.title + '</a>';
                        shortDesc += '<span class="futureDate">' + futureDate + '</span></td>';

                        //Closes the table and expand/collapse div
                        if ((ind + 1) === performances.length) {
                            shortDesc += '</tr></tbody></table></div>';
                        }
                    }
                });
            }
        }

        if (arr.ThisIsPartOfSeries && arr.ThisIsPartOfSeries.length) {
            shortDesc += '<div class="partof">This is part of:  ';
            var moreLinks = [];
            _.forEach(arr.ThisIsPartOfSeries, function (series, index) {
                if ((index + 1) <= arr.ThisIsPartOfSeries.length) {
                    if (index <= 1) {
                        shortDesc += (index >= 1 ? ', ' + series : series);
                    } else {
                        moreLinks.push(series);
                    }
                } else {
                    moreLinks.push(series);
                }
            });
            if (moreLinks.length > 1) {
                shortDesc += ', and <a class="expand-collapse mt5"> more (' + moreLinks.length + ') <i class="fa fa-lg fa-caret-down"></i></a>';
                shortDesc += '<div class="expand-collapse-container collapse">';
                _.forEach(moreLinks, function (ml) {
                    shortDesc += '<div class="morelink">' + ml + '</div>';
                });
                shortDesc += '</div>';
            }
            shortDesc += '</div>';
        }

        var arrUrl = arr.URL;
        var urlTarget = '_blank';
        if (!_.startsWith(arrUrl, 'http')) {
            arrUrl = 'http://www.92y.org' + arrUrl;
            urlTarget = '_self';
            if (itemType.toLowerCase() === 'event' && isMobile == true && !isAPackage) {
                arrUrl = 'http://m.92y.org' + '/Event/' + prodNo;
            }
        }

        var classInfoObj = {
            Title: arr.Title,
            KeyWord: keyWords,
            ProdNo: prodNo,
            NodeID: nodeId,
            Desc: shortDesc,
            DescText: arr.ShortDesc,
            Img: image,
            FriendlyDate: startDate,
            SortDate1: sortDate1,
            SortDate2: sortDate2,
            Url: arrUrl,
            UrlTarget: urlTarget,
            Warning: warning,
            ItemType: itemType,
            Teachers: teachers,
            InProgress: inProgress,
            Featured: featured,
            FutureDates: futurePerformanceDates
        };
        return classInfoObj;
    };

    var formatCommaString = function (uglyString) {
        uglyString = uglyString.replace(/,(.)/g, function ($0, $1) {
            return ', ' + _.capitalize($1);
        });
        return _.capitalize(uglyString);
    };

    var formatDateOutput = function (uglyDate, short) {
        var dayAbbr = new Array('Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat');
        var monthAbbr = new Array('Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec');
        var dateHour = uglyDate.getHours();
        var yearNumber = uglyDate.getFullYear();
        var ampm = dateHour < 12 ? 'AM' : 'PM';
        if (dateHour == 0) {
            dateHour = 12;
        }
        if (dateHour > 12) {
            dateHour = dateHour - 12;
        }
        var dateMinute = uglyDate.getMinutes() > 0 ? ':' + (uglyDate.getMinutes().toString().length === 1 ? '0' + uglyDate.getMinutes() : uglyDate.getMinutes()) : '';
        var prettyDate = short ? monthAbbr[uglyDate.getMonth()] + ' ' + uglyDate.getDate() + ' ' + yearNumber : dayAbbr[uglyDate.getDay()] + ', ' + monthAbbr[uglyDate.getMonth()] + ' ' + uglyDate.getDate() + ', ' + yearNumber + ', ' + dateHour + dateMinute + ' ' + ampm;
        return prettyDate;
    };

    var TileInfoService = function (http, q, cacheFactory) {
        var self = this;
        self.http = http;
        self.q = q;
        self.cacheFactory = cacheFactory;
    };
    TileInfoService.$inject = ['$http', '$q', 'CacheFactory'];

    TileInfoService.prototype.getAll = function (url, cache, cacheType) {
        var self = this;
        return self.http.get(url, { cache: self.cacheFactory.get(cache.info().id) }).success(function (data) {
            cache.put(cacheType, {
                itemData: data
            });
            return data;
        });
    };
    navApp.service('tileInfoSrv', TileInfoService);

    //Added so we can inject our customized progress bar into NavListController
    navApp.factory('progressBar', ['ngProgressFactory', function (ngProgressFactory) {
        //Creates new instance, sets the color, then returns progress bar instance as a variable
        var progressBar = ngProgressFactory.createInstance();
        progressBar.setColor('#C747B8');
        return progressBar;
    } ]);

    NavListController.$inject = ['$scope', 'tileInfoSrv', '$location', '$timeout', '$window', '$cookieStore', '$cookies', 'navConfig', 'progressBar', '$exceptionHandler'];
    navApp.controller('NavListController', NavListController);

    navApp.directive('runAccordion', function () {
        return {
            link: function (scope, element, attrs) {
                var divId = '#' + attrs.accordionDiv;
                angular.element(divId).slideToggle();
                element.bind('click', function (e) {
                    angular.element(divId).slideToggle();
                    $(this).find('i').toggleClass('glyphicon-chevron-down glyphicon-chevron-up');
                });
            }
        };
    });

    navApp.directive('fieldFocus', function ($timeout) {
        return {
            link: function (scope, element, attrs) {
                element.bind('click', function (e) {
                    e.preventDefault();
                    var inputId = '#' + attrs.focusInput;
                    $timeout(function(){
                        angular.element(inputId).focus();
                    }, 500);
                });
            }
        };
    });

    navApp.directive('enableContainer', function () {
        function link(scope, element) {
            var divTiles = element.children('#tiles');
            divTiles.css('display', '');
        }
        return {
            link: link
        };
    });

    navApp.directive('getBodyDimensions', function () {
        function link(scope) {
            resizeTileDisplay(scope);
        }
        return {
            link: link
        };
    });

    //Added to the top level interest navigation
    navApp.directive('progressBarIncrement', function ($timeout, progressBar) {
        return function (scope, element, attrs) {
            element.bind('click', function (e) {
                e.preventDefault();
                progressBar.set(progressBar.status() + 4);
                $timeout(function () {
                    progressBar.complete();
                }, 500);
            });
        };
    });

    navApp.directive('getElementPosition', function () {
        return {
            link: function (scope, element, attrs) {
                var raw = element[0];
                scope.$watch(function () {
                    return raw.offsetTop;
                }, function (newValue, oldValue) {
                    var winHeight = angular.element(window).height();
                    var headerHeight;
                    if (attrs.skipHeader == 'true') {
                        headerHeight = 0;
                    } else {
                        headerHeight = angular.element('header').height();
                    }
                    var containerHeight = winHeight - (newValue + headerHeight);
                    scope.navListCtrl.bottomContainerStyle.height = containerHeight + 'px';

                    element.bind('scroll', function () {
                        if (raw.scrollTop > 0 && scope.navListCtrl.scrollingUp === false) {
                            scope.navListCtrl.affixed = true;
                        } else {
                            scope.navListCtrl.affixed = false;
                            if (raw.scrollTop === 0) {
                                scope.navListCtrl.scrollingUp = false;
                            }
                        }
                        scope.$apply();
                    });
                });
            }
        };
    });

    navApp.directive('backToTopButton', function () {
        return {
            link: function (scope, element, attrs) {
                scope.$watch(function () {
                    return scope.navListCtrl.affixed;
                }, function (newValue, oldValue) {
                    if (newValue === false) {
                        angular.element('#bottomContainer').scrollTop(0);
                    }
                });
            }
        };
    });

    navApp.directive('enableSearchEnter', function () {
        return function (scope, element, attrs) {
            element.bind('keydown keypress', function (event) {
                if (event.which === 13) {
                    scope.$apply(function () {
                        scope.navListCtrl.searchGlobal();
                    });
                    event.preventDefault();
                }
            });
        };
    });

    navApp.directive('toggleSlide', function ($timeout) {
        return function (scope, element) {
            $timeout(function () {
                var expandBtn = angular.element(element).find('a.expand-collapse');
                expandBtn.bind('click', function () {
                    angular.element(this).next('.expand-collapse-container').slideToggle('800');
                });
            });
        };
    });

    navApp.directive('browseButton', function () {
        return function (scope, element) {
            element.bind('click', function (e) {
                e.preventDefault();
                angular.element('#browseSidebar').toggleClass('in');
                angular.element('body').toggleClass('sidebar-open');
                angular.element('.qp-ui-mask-modal').addClass('qp-ui-mask-visible');
                angular.element('#filterSidebar, #savedSidebar').removeClass('in inMobile');
            });
        };
    });

    navApp.directive('filterSidebar', function () {
        return function (scope, element) {
            element.bind('click', function (e) {
                e.preventDefault();
                angular.element('body').toggleClass('sidebar-open');
                angular.element('.qp-ui-mask-modal').addClass('qp-ui-mask-visible');
                angular.element('#filterSidebar').toggleClass('in');
                angular.element('#browseSidebar, #savedSidebar').removeClass('in inMobile');
            });
        };
    });

    navApp.directive('closeIntroOverlay', function () {
        return function (scope, element, attr) {
            element.bind('click', function (e) {
                e.preventDefault();
                var $body = angular.element('body');
                if (!$body.hasClass('intro-closed')) {
                    if (!$body.hasClass('browseIntro-shown') && !$body.hasClass('interestIntro-shown')) {
                        $body.addClass('intro-closed');
                        scope.$apply(function () {
                            scope.navListCtrl.addIntroCookies();
                        });
                    }
                }
            });
        };
    });

    navApp.directive('swipeCloseRight', function () {
        return function (scope, element) {
            var hammertime = new Hammer(element[0]);
            // hammertime.set({ threshold: 100 });
            hammertime.on('swiperight', function (e) {
                e.preventDefault();
                angular.element(element).removeClass('in');
                angular.element('.qp-ui-mask-modal').removeClass('qp-ui-mask-visible');
                angular.element('body').removeClass('sidebar-open');
            });
        };
    });

    navApp.directive('filterSidebarClose', function () {
        return function (scope, element) {
            element.bind('click', function (e) {
                e.preventDefault();
                angular.element('#filterSidebar').removeClass('in');
                angular.element('.qp-ui-mask-modal').removeClass('qp-ui-mask-visible');
                angular.element('body').removeClass('sidebar-open');
            });
        };
    });

    navApp.directive('wishList', function () {
        return function (scope, element) {
            element.bind('click', function (e) {
                e.preventDefault();
                angular.element('#navSavedBtn, #floatSavedBtn').toggleClass('out');
                angular.element('#savedSidebar').toggleClass('in');
                angular.element('#site-container').toggleClass('out-left');
                angular.element('body').toggleClass('sidebar-open');
                angular.element('.qp-ui-mask-modal').addClass('qp-ui-mask-visible');
                angular.element('#browseSidebar, #filterSidebar').removeClass('in inMobile');
            });
        };
    });

    navApp.directive('wishListClose', function () {
        return function (scope, element) {
            element.bind('click', function (e) {
                e.preventDefault();
                angular.element('#savedSidebar').removeClass('in');
                angular.element('.qp-ui-mask-modal').removeClass('qp-ui-mask-visible');
                angular.element('body').removeClass('sidebar-open');
            });
        };
    });

    //Clicking modal window closes sidebar and removes self
    navApp.directive('maskModal', function ($timeout) {
        return function (scope, element) {
            element.bind('click', function () {
                angular.element('body').toggleClass('sidebar-open');
                angular.element('#browseSidebar, #filterSidebar, #savedSidebar').removeClass('in inMobile');
                $timeout(function () {
                    angular.element('.qp-ui-mask-modal').toggleClass('qp-ui-mask-visible');
                }, 50);
            });
        };
    });

    //Close these sidebars when they are clicked
    // navApp.directive('browseSidebar', function ($timeout) {
    //     return function (scope, element) {
    //         element.bind("click", function () {
    //             angular.element("#browseSidebar, #filterSidebar").removeClass('in');
    //             angular.element("body").removeClass('sidebar-open');
    //             $timeout(function () {
    //                 angular.element(".qp-ui-mask-modal").removeClass('qp-ui-mask-visible');
    //             }, 50);
    //         });
    //     };
    // });

    navApp.directive('closeSubmit', function ($timeout) {
        return function (scope, element) {
            element.bind('click', function (e) {
                e.preventDefault();
                angular.element('#browseSidebar, #filterSidebar').removeClass('in');
                angular.element('body').removeClass('sidebar-open');
                $timeout(function () {
                    angular.element('.qp-ui-mask-modal').removeClass('qp-ui-mask-visible');
                }, 50);
            });
        };
    });

    navApp.filter('unsafe', function ($sce) {
        return function (val) {
            return $sce.trustAsHtml(val);
        };
    });

    navApp.config(['$analyticsProvider', function ($analyticsProvider) {
        $analyticsProvider.registerPageTrack(function (path) {
            var cleanPath = path.replace(/%20/g, ' ');
            var pathArray = cleanPath.split('/');
            var virtualPageUrl;
            var virtualPageTitle;
            _.forEach(pathArray, function (p, ind) {
                //if programfinder.html found in the path, initialize virtualPageTitle and go to next iteration
                if (p.toLowerCase().indexOf(SCRIPTNAME.toLowerCase()) >= 0) {
                    virtualPageTitle = '';
                    return;
                }
                //if virtualPageTitle has been initialized but not filled in
                if (!_.isUndefined(virtualPageTitle) && virtualPageTitle === '') {
                    //if we are at the end of the loop and we still haven't filled in virtualPageUrl, then fill it in with the main interest area
                    //otherwise just initialize the variable for the next iteration
                    //also, fill in the virtualPageTitle variable and then go to next iteration
                    if ((ind + 1) === pathArray.length) {
                        virtualPageUrl = '/' + p;
                    } else {
                        virtualPageUrl = '';
                    }
                    virtualPageTitle = p;
                    return;
                }
                //if virtualPageUrl has been initialized, add in the rest of the path to it
                if (!_.isUndefined(virtualPageUrl)) {
                    virtualPageUrl += '/' + p;
                }
            });
            var dataLayer = window.dataLayer = window.dataLayer || [];
            dataLayer.push({
                'event': 'VirtualPageview',
                'virtual-page-URL': virtualPageUrl,
                'virtual-page-title': virtualPageTitle
            });
        });
    } ]);

    navApp.config(function ($provide) {
        $provide.decorator('$exceptionHandler', function ($delegate) {
            return function (exception, cause) {
                var exObj = _.isString(exception) ? { message: exception } : exception;
                $delegate(exObj, cause);
                logErrorToServer(exObj, cause);
            };
        });
    });

})();