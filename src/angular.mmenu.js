angular.module('angular-mmenu', [])
    .directive('mmenu', function () {
        var angularMmenuIdAttr = 'angular-mmenu-id';
        var getValue = function (scope, field) {
            if (field === undefined || field === null) {
                field = null;
            } else if (scope[field] !== null && scope[field] !== undefined) {
                field = scope[field];
            }
            return field;
        };
        var fillMenuItemControl = function (ctrl, menuItem) {
            var contentCtrl = null;
            if (menuItem.href === null || menuItem.href === undefined) {
                contentCtrl = $('<span />');
            } else {
                var href = $('<a />');
                if (typeof menuItem.href === "function") {
                    href.attr('href', 'javascript:void(0);')
                        .click(function (e) {
                            e.preventDefault();
                            var proc = menuItem.href;
                            proc();
                        });
                } else if (menuItem.href === '#' || menuItem.href === '') {
                    href.attr('href', 'javascript:void(0);');
                } else {
                    href.attr('href', menuItem.href);
                }
                contentCtrl = href;
            }
            if (angular.isString(menuItem.text)) {
                contentCtrl.text(menuItem.text);
            } else {
                var obj = menuItem.text;
                contentCtrl.html(obj.getText());
                var listener = obj.onTextChanged(function (newValue) {
                    contentCtrl.html(newValue);
                });
                contentCtrl.data('mmenu-dynamic-text', obj)
                    .data('mmenu-dynamic-text-listener', listener);
                contentCtrl.on("remove", function () {
                    var handler = contentCtrl.data('mmenu-dynamic-text');
                    if (handler === null || handler === undefined) {
                        return null;
                    }
                    var currListener = contentCtrl.data('mmenu-dynamic-text-listener');
                    handler.detachHandler(currListener);
                });
            }
            ctrl.append(contentCtrl);
            if (menuItem.items !== null && menuItem.items !== undefined &&
                angular.isArray(menuItem.items) && menuItem.items.length > 0) {
                var root = $('<ul />');
                menuItem.items.forEach(function (x) {
                    renderMenuItem(root, x);
                });
                ctrl.append(root);
            }
        };
        var renderMenuItem = function (rootControl, menuItem) {
            var menuItemControl = $('<li/>');
            if (menuItem !== null && menuItem !== undefined) {
                fillMenuItemControl(menuItemControl, menuItem);
                if (menuItem.$class !== null && menuItem.$class !== undefined) {
                    menuItemControl.addClass(menuItem.$class);
                }
            }
            rootControl.append(menuItemControl);
        };
        var recreateMenu = function (scope, attrs) {
            var id = attrs.mmenuId;
            if (id === null || id === undefined || id === '') {
                console.warn('No angular-mmenu id is specified');
                return;
            }
            var newMenu = null;
            var existingMmenu = null;
            var jElement = $('[' + angularMmenuIdAttr + '=' + id + ']');
            if (jElement.length === 0) {
                console.warn('No angular-mmenu host was found');
                return;
            }
            var value = scope[attrs.mmenuItems];
            if (value === null || value === undefined || value.length === 0) {
                //value = new Array();
                //-djf have creation of menu being cancelled if there are no menu items
                return;
            }

            if (jElement[0].localName === 'nav') {
                jElement.empty();
                existingMmenu = jElement.data('mmenu');
                newMenu = jElement;
            } else {
                newMenu = $('<nav id="' + id + '" />');
            }
            var menu = $('<ul />');
            newMenu.append(menu);
            value.forEach(function (x) {
                renderMenuItem(menu, x);
            });
            if (existingMmenu === null || existingMmenu === undefined) {
                var newMenuElement = angular.element(newMenu);
                var oldMenuElement = angular.element(jElement);
                oldMenuElement.replaceWith(newMenuElement);
                var opts = getValue(scope, attrs.mmenuOptions);
                var params = getValue(scope, attrs.mmenuParams);
                //console.log('mmenu', id, opts, params);
                newMenu.attr(angularMmenuIdAttr, id);
                $(document).ready(function () {
                    newMenu.mmenu(opts, params);
                });
            } else if (existingMmenu._init != null && existingMmenu._init !== undefined) {
                existingMmenu._init();
            } else if (existingMmenu.init != null && existingMmenu.init !== undefined) {
                existingMmenu.init(menu);
            } else {
                console.error('angular mmenu could not be reinitialized due to missing init api method.');
            }
            //-djf start
            var mmenuApi = newMenu.data('mmenu');
            buildUpMenuFromScratch(mmenuApi, window.location.hash);
            // if menu closing, display selected on top in case "subcategories" was clicked but nothing selected
            mmenuApi.bind('closing', function () {
                var lastPanelSelected = $("div.mm-opened").has("li.mm-selected").last();
                var lastPanelOpened = $("div.mm-opened").last();
                if (lastPanelSelected.length) {
                    if (lastPanelOpened.prop("id") !== lastPanelSelected.prop("id")) {
                        lastPanelOpened.removeClass("mm-highest mm-current mm-iconpanel-1 mm-opened").addClass("mm-hidden");
                        lastPanelSelected.addClass("mm-highest mm-current").removeClass("mm-subopened");
                    }
                }
            });
            var whichButtonWasClicked;
            mmenuApi.bind('opening', function () {
                // due to some weirdness with how menu is displaying for subcategories
                // we will manually set all the parent categories to being grayed out when mmenu is opening
                $("div.mm-opened:not(:last)").addClass("mm-subopened");
            });
            mmenuApi.bind('opened', function () {
                //if "subcategories" button was clicked, then open the subcategory panel for viewing
                if (whichButtonWasClicked === "subs") {
                    var nextPanelId = $("a#mmenuSubs").attr("sub-to-open");
                    if (typeof nextPanelId !== "undefined") {
                        this.openPanel($('div.mm-panel' + nextPanelId));
                    }
                }
            });
            // if "subcategories" is clicked, open up to subcategories when mmenu displays
            mmenuApi.bind('setSelected', function (li) {
                setAttributeOnSubcategoriesButton(li);
            });
            // button clicks manually controlled so we can see which has been clicked
            $("a#interest-list-mobile").click(function (e) {
                whichButtonWasClicked = "interests";
                e.preventDefault();
                setTimeout(function () { mmenuApi.open(); }, 1);
            });
            $("a#mmenuSubs").click(function (e) {
                whichButtonWasClicked = "subs";
                e.preventDefault();
                setTimeout(function () { mmenuApi.open(); }, 1);
            });
            // listen if this has been broadcasted
            // if it has then the url is different so change the mmenu
            scope.$on("urlChanged", function (event, args) {
                buildUpMenuFromScratch(mmenuApi, args);
            });
            //-djf end
        };
        //-djf start
        var buildUpMenuFromScratch = function (api, url) {
            // open menu to a panel indicated by URL
            api.closeAllPanels();
            var cleanedUrl = seperateSlicersFromUrl(url).path;
            var folderPath = cleanedUrl.split("/");
            folderPath[0] = "All Programs";
            folderPath = _.compact(folderPath);
            var panelToOpen;
            var liToSelect;
            var parentPanel;
            for (var fp = 0; fp < folderPath.length; fp++) {
                if (fp === 0) {
                    panelToOpen = $("#mm-0");
                    liToSelect = panelToOpen.find("li");
                    api.openPanel(panelToOpen);
                    api.setSelected(liToSelect, true);
                    setAttributeOnSubcategoriesButton(liToSelect);
                } else {
                    parentPanel = panelToOpen.prop('id');
                    // find panel that has a child with a data-target that points to parent id 
                    // and that has a link that has the text of the parent
                    // and that has a link that has text from the URL
                    if (fp < folderPath.length) {
                        panelToOpen = $('div.mm-panel').has('a.mm-btn[data-target="#' + parentPanel + '"]')
                            .has('a.mm-title:contains("' + decodeURI(folderPath[fp - 1]) + '")')
                            .has('a:contains("' + decodeURI(folderPath[fp]) + '")');
                        liToSelect = panelToOpen.find("li").has('a:contains("' + decodeURI(folderPath[fp]) + '")');
                        api.openPanel(panelToOpen);
                        api.setSelected(liToSelect, true);
                        setAttributeOnSubcategoriesButton(liToSelect);
                    }
                }
            }
        };
        var setAttributeOnSubcategoriesButton = function (li) {
            // set the "sub-to-open" attribute on the "subcategories" button
            // so we know which subcategory to open when clicked
            var nextPanelId = li.children("a.mm-next").attr("href");
            if (typeof nextPanelId === "undefined") {
                $("a#mmenuSubs").removeAttr("sub-to-open");
            } else {
                $("a#mmenuSubs").attr("sub-to-open", nextPanelId);
            }
        };
        //-djf end
        var linker = function (id, scope, attrs) {
            if (attrs.mmenuInvalidate !== null && attrs.mmenuInvalidate !== undefined && attrs.mmenuInvalidate !== '') {
                scope[attrs.mmenuInvalidate] = function () {
                    recreateMenu(scope, attrs);
                };
            }
            scope.$watchCollection(attrs.mmenuItems, function (value) {
                recreateMenu(scope, attrs);
            });
        };
        return {
            restrict: 'E',
            replace: true,
            link: function (scope, element, attrs) {
                if (attrs.mmenuItems == null || attrs.mmenuItems == undefined) {
                    console.warn('mmenu-items attribute is not specified. No MMenu is created.');
                    element.remove();
                    return;
                }
                if (attrs.mmenuId == null || attrs.mmenuId == undefined) {
                    console.warn('mmenu-id attribute is not specified. No MMenu is created.');
                    element.remove();
                    return;
                }
                element.attr(angularMmenuIdAttr, attrs.mmenuId);
                linker(attrs.mmenuId, scope, attrs);
            }
        };
    });
//# sourceMappingURL=angular.mmenu.js.map