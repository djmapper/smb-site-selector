/*global define,dojo,dojoConfig,esri,esriConfig,alert,handle:true,dijit */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true,indent:4 */
/** @license
| Version 10.2
| Copyright 2013 Esri
|
| Licensed under the Apache License, Version 2.0 (the "License");
| you may not use this file except in compliance with the License.
| You may obtain a copy of the License at
|
|    http://www.apache.org/licenses/LICENSE-2.0
|
| Unless required by applicable law or agreed to in writing, software
| distributed under the License is distributed on an "AS IS" BASIS,
| WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
| See the License for the specific language governing permissions and
| limitations under the License.
*/
//============================================================================================================================//
define([
    "dojo/_base/declare",
    "dojo/dom-construct",
    "dojo/on",
    "dojo/topic",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/dom",
    "dojo/query",
    "esri/tasks/locator",
    "dojo/dom-class",
    "esri/tasks/FeatureSet",
    "dojo/dom-geometry",
    "esri/tasks/GeometryService",
    "dojo/string",
    "dojo/_base/html",
    "dojo/text!./templates/siteLocatorTemplate.html",
    "esri/urlUtils",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "dojo/Deferred",
    "dojo/DeferredList",
    "../scrollBar/scrollBar",
    "dojo/_base/Color",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/graphic",
    "esri/geometry/Point",
    "dijit/registry",
    "esri/tasks/BufferParameters",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "esri/layers/GraphicsLayer",
    "dijit/form/HorizontalSlider",
    "dijit/form/Select",
    "dojox/form/DropDownSelect",
    "esri/request",
    "esri/SpatialReference",
    "dojo/number",
    "esri/geometry/Polygon",
    "dijit/form/HorizontalRule",
    "../siteLocator/unifiedSearch"

], function (declare, domConstruct, on, topic, lang, array, domStyle, domAttr, dom, query, Locator, domClass, FeatureSet, domGeom, GeometryService, string, html, template, urlUtils, Query, QueryTask, Deferred, DeferredList, ScrollBar, Color, SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, Graphic, Point, registry, BufferParameters, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, GraphicsLayer, HorizontalSlider, SelectList, DropDownSelect, esriRequest, SpatialReference, number, Polygon, HorizontalRule, unifiedSearch) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, unifiedSearch], {
        sliderDistance: null,
        selectedValue: null,
        areaSortBuilding: null,
        areaSortSites: null,
        lastGeometry: [null, null, null, null],
        arrGeoenrichData: [null, null, null, null],
        isIndexShared: false,

        /**
        * create horizontal slider for all tab and set minimum maximum value of slider
        * @param container node, horizontal rule node and slider value
        * @memberOf widgets/SiteLocator/SiteLocatorHelper
        */
        _createHorizontalSlider: function (sliderContainer, horizontalRuleContainer, divSliderValue, unitContainer, tabCount, bufferDistance) {
            var _self, horizontalSlider, sliderId, horizontalRule, sliderTimeOut;
            sliderId = "slider" + domAttr.get(sliderContainer, "data-dojo-attach-point");
            horizontalRule = new HorizontalRule({
                "class": "horizontalRule"
            }, horizontalRuleContainer);
            horizontalRule.domNode.firstChild.style.border = "none";
            horizontalRule.domNode.lastChild.style.border = "none";
            horizontalRule.domNode.lastChild.style.right = "0" + "px";
            if (!bufferDistance) {
                if (dojo.configData.DistanceUnitSettings.MinimumValue >= 0) {
                    bufferDistance = dojo.configData.DistanceUnitSettings.MinimumValue;
                } else {
                    bufferDistance = 0;
                    dojo.configData.DistanceUnitSettings.MinimumValue = bufferDistance;
                }
            }
            horizontalSlider = new HorizontalSlider({
                intermediateChanges: true,
                "class": "horizontalSlider",
                minimum: dojo.configData.DistanceUnitSettings.MinimumValue,
                value: bufferDistance,
                id: sliderId
            }, sliderContainer);
            horizontalSlider.tabCount = tabCount;
            this.unitValues[tabCount] = this._getDistanceUnit(dojo.configData.DistanceUnitSettings.DistanceUnitName);
            if (dojo.configData.DistanceUnitSettings.MaximumValue > 0) {
                horizontalRule.domNode.lastChild.innerHTML = dojo.configData.DistanceUnitSettings.MaximumValue;
                horizontalSlider.maximum = dojo.configData.DistanceUnitSettings.MaximumValue;
            } else {
                horizontalRule.domNode.lastChild.innerHTML = 1000;
                horizontalSlider.maximum = 1000;
            }
            if (dojo.configData.DistanceUnitSettings.MinimumValue >= 0) {
                horizontalRule.domNode.firstChild.innerHTML = dojo.configData.DistanceUnitSettings.MinimumValue;
            } else {
                horizontalRule.domNode.firstChild.innerHTML = 0;
            }

            domStyle.set(horizontalRule.domNode.lastChild, "text-align", "right");
            domStyle.set(horizontalRule.domNode.lastChild, "width", "334px");
            domStyle.set(horizontalRule.domNode.lastChild, "left", "0");
            domAttr.set(divSliderValue, "distanceUnit", dojo.configData.DistanceUnitSettings.DistanceUnitName.toString());
            domAttr.set(divSliderValue, "innerHTML", horizontalSlider.value.toString() + " " + dojo.configData.DistanceUnitSettings.DistanceUnitName);
            _self = this;

            /**
            * call back for slider change event
            * @param {object} slider value
            * @memberOf widgets/SiteLocator/SiteLocatorHelper
            */
            on(horizontalSlider, "change", function (value) {
                if (Number(value) > Number(horizontalSlider.maximum)) {
                    horizontalSlider.setValue(horizontalSlider.maximum);
                }
                domAttr.set(divSliderValue, "innerHTML", Math.round(value) + " " + domAttr.get(divSliderValue, "distanceUnit"));
                dojo.arrBufferDistance[_self.workflowCount] = Math.round(value);
                clearTimeout(sliderTimeOut);
                sliderTimeOut = setTimeout(function () {
                    if (_self.featureGeometry && _self.featureGeometry[_self.workflowCount]) {
                        _self._createBuffer(_self.featureGeometry[_self.workflowCount]);
                        if (_self.workflowCount === 0 && _self.selectBusinessSortForBuilding) {
                            dojo.sortingData = null;
                            _self.selectBusinessSortForBuilding.set("value", sharedNls.titles.select);
                        }
                        if (_self.workflowCount === 1 && _self.selectBusinessSortForSites) {
                            dojo.sortingData = null;
                            _self.selectBusinessSortForSites.set("value", sharedNls.titles.select);
                        }
                        if (_self.workflowCount === 2 && _self.selectSortOption) {
                            _self.selectSortOption.set("value", sharedNls.titles.select);
                        }
                    }
                }, 500);
            });
        },

        /**
        * set visibility for enabled/disabled tab{work flow}
        * @memberOf widgets/SiteLocator/SiteLocator
        */
        _setTabVisibility: function () {
            var j, countEnabledTab = 0, arrEnabledTab = [];
            // loop all workflows from config file
            for (j = 0; j < dojo.configData.Workflows.length; j++) {
                // check visibility of workflows and accordingly display the container
                if (!dojo.configData.Workflows[j].Enabled) {
                    switch (dojo.configData.Workflows[j].Name) {
                    case dojo.configData.Workflows[0].Name:
                        domStyle.set(this.esriCTsearchContainerBuilding, "display", "none");
                        domStyle.set(this.searchContentBuilding, "display", "none");
                        break;
                    case dojo.configData.Workflows[1].Name:
                        domStyle.set(this.esriCTsearchContainerSites, "display", "none");
                        domStyle.set(this.searchContentSites, "display", "none");
                        break;
                    case dojo.configData.Workflows[2].Name:
                        domStyle.set(this.esriCTsearchContainerBusiness, "display", "none");
                        domStyle.set(this.searchContentBusiness, "display", "none");
                        break;
                    case dojo.configData.Workflows[3].Name:
                        domStyle.set(this.esriCTsearchContainerCommunities, "display", "none");
                        domStyle.set(this.searchContentCommunities, "display", "none");
                        break;
                    }
                } else {
                    // check visibility of workflows and push the data(container and content node) in an array
                    switch (dojo.configData.Workflows[j].Name) {
                    case dojo.configData.Workflows[0].Name:
                        arrEnabledTab.push({ Container: this.esriCTsearchContainerBuilding, Content: this.searchContentBuilding });
                        break;
                    case dojo.configData.Workflows[1].Name:
                        arrEnabledTab.push({ Container: this.esriCTsearchContainerSites, Content: this.searchContentSites });
                        break;
                    case dojo.configData.Workflows[2].Name:
                        arrEnabledTab.push({ Container: this.esriCTsearchContainerBusiness, Content: this.searchContentBusiness });
                        break;
                    case dojo.configData.Workflows[3].Name:
                        arrEnabledTab.push({ Container: this.esriCTsearchContainerCommunities, Content: this.searchContentCommunities });
                        if (!dojo.configData.Workflows[3].EnableSearch) {
                            domStyle.set(this.divAddressSearchCommunities, "display", "none");
                            domStyle.set(this.searchBox, "display", "none");
                        }
                        if (!dojo.configData.Workflows[3].EnableDropdown) {
                            domStyle.set(this.divDropDownSearch, "display", "none");
                        }
                        if (!(dojo.configData.Workflows[3].EnableSearch || dojo.configData.Workflows[3].EnableDropdown)) {
                            domStyle.set(this.esriCTsearchContainerCommunities, "display", "none");
                            domStyle.set(this.searchContentCommunities, "display", "none");
                        }
                        break;
                    }
                    countEnabledTab++;
                }

            }
            if (countEnabledTab === 0) {
                alert(sharedNls.errorMessages.disableTab);
            } else {
                // check the shared URL for "workflowCount" to show selected tab when application is loaded first time while sharing
                if (window.location.toString().split("$workflowCount=").length > 1) {
                    this._showTab(query(".esriCTTab")[window.location.toString().split("$workflowCount=")[1].split("$")[0]], query(".esriCTConetentTab")[window.location.toString().split("$workflowCount=")[1].split("$")[0]]);
                } else {
                    // call show tab
                    this._showTab(arrEnabledTab[0].Container, arrEnabledTab[0].Content);
                }
            }
        },

        /**
        * show tab based on selected tab
        * @param {object} node for tab container
        * @param {object} node for tab content
        * @memberOf widgets/SiteLocator/SiteLocator
        */
        _showTab: function (tabNode, contentNode) {
            var i, srcContainer, srcContent, esriCTDemoResultStylesd;
            // loop all the child element of main container(divDirectionContainer)
            for (i = 0; i < this.divDirectionContainer.children.length; i++) {
                if (contentNode === this.TabContentContainer.children[i]) {
                    domStyle.set(this.TabContentContainer.children[i], "display", "block");
                    this.workflowCount = i;
                    dojo.workflowCount = i;
                    this.map.graphics.clear();
                    this.map.getLayer("esriFeatureGraphicsLayer").clear();
                    this.map.getLayer("esriGraphicsLayerMapSettings").clear();
                    this.map.getLayer("esriBufferGraphicsLayer").clear();
                    if (this.lastGeometry[this.workflowCount]) {
                        this.isSharedExtent = true;
                        this.showBuffer(this.lastGeometry[this.workflowCount]);
                    }
                    if (this.featureGraphics[i]) {
                        this.map.getLayer("esriFeatureGraphicsLayer").add(this.featureGraphics[i]);
                        this.map.setLevel(dojo.configData.ZoomLevel);
                        this.map.centerAt(this.featureGraphics[i].geometry);
                        this.map.getLayer("esriFeatureGraphicsLayer").graphics[0].show();
                    } else if (this.lastGeometry[this.workflowCount]) {
                        this.map.setExtent(this.lastGeometry[this.workflowCount][0].getExtent(), true);
                    }
                    if (this.featureGeometry[this.workflowCount]) {
                        this.addPushPin(this.featureGeometry[this.workflowCount]);
                    }
                    this.opeartionLayer = this.getCuerntOperatiobalLayer(this.workflowCount);
                } else {
                    domStyle.set(this.TabContentContainer.children[i], "display", "none");
                }
                if (this.arrTabClass.length !== this.divDirectionContainer.children.length) {
                    this.arrTabClass[i] = this.divDirectionContainer.children[i].className;
                }
                if (tabNode === this.divDirectionContainer.children[i]) {
                    domClass.add(this.divDirectionContainer.children[i], "esriCTsearchContainerSitesSelected", this.divDirectionContainer.children[i].className);
                } else {
                    if (this.arrTabClass.length === this.divDirectionContainer.children.length) {
                        domClass.replace(this.divDirectionContainer.children[i], this.arrTabClass[i], "esriCTsearchContainerSitesSelected");
                    }
                }
            }
            this._resizeBuildingAndSites();
            if (this.workflowCount === 3 && this.comunitiesDemoInfoMainScrollbar) {
                srcContainer = query('.esriCTDemoInfoMainDiv', this.communityMainDiv)[0];
                if (srcContainer) {
                    srcContent = query('.esriCTDemoInfoMainDivBuildingContent')[query('.esriCTDemoInfoMainDivBuildingContent').length - 1];
                    esriCTDemoResultStylesd = { height: document.documentElement.clientHeight - srcContainer.offsetTop + "px" };
                    domAttr.set(srcContainer, "style", esriCTDemoResultStylesd);
                    this.resizeScrollbar(this.comunitiesDemoInfoMainScrollbar, srcContainer, srcContent);
                }
            }
        },

        /**
        * building and sites scrollbar resize handler
        * @memberOf widgets/SiteLocator/SiteLocatorHelper
        */
        _resizeBuildingAndSites: function () {
            var contentnodeDiv, srcContainer, srcContent;
            if (this.buildingTabData) {
                if (this.workflowCount === 0) {
                    srcContainer = query('.esriCTDemoInfoMainDiv', this.mainDivBuilding)[0];
                    srcContent = srcContainer.childNodes[0];
                    if (srcContainer && srcContent && this.buildingDemoInfoMainScrollbar) {
                        this._resizeBuildingPanel(srcContainer, srcContent);
                    }
                    contentnodeDiv = query('.esriCTResultContentBuilding', this.outerResultContainerBuilding[0])[0];
                    this._resizeBuildingContainer(this.outerResultContainerBuilding, contentnodeDiv);
                }
            }
            if (this.sitesTabData) {
                if (this.workflowCount === 1) {
                    srcContainer = query('.esriCTDemoInfoMainDiv', this.mainDivSites)[0];
                    srcContent = srcContainer.childNodes[0];
                    if (srcContainer && srcContent && this.sitesDemoInfoMainScrollbar) {
                        this._resizeSitesPanel(srcContainer, srcContent);
                    }
                    contentnodeDiv = query('.esriCTResultContentSites', this.outerResultContainerSites[0])[0];
                    this._resizeSitesContainer(this.outerResultContainerSites, contentnodeDiv);
                }
            }
        },
        /**
        * add push pin on map point
        * @param {object} map point for push pin
        * @memberOf widgets/SiteLocator/SiteLocatorHelper
        */
        addPushPin: function (mapPoint) {
            var geoLocationPushpin, locatorMarkupSymbol, graphic;
            geoLocationPushpin = dojoConfig.baseURL + dojo.configData.LocatorSettings.DefaultLocatorSymbol;
            locatorMarkupSymbol = new esri.symbol.PictureMarkerSymbol(geoLocationPushpin, dojo.configData.LocatorSettings.MarkupSymbolSize.width, dojo.configData.LocatorSettings.MarkupSymbolSize.height);
            graphic = new esri.Graphic(mapPoint, locatorMarkupSymbol, {}, null);
            if (this.workflowCount === 3) {
                this.featureGraphics[this.workflowCount] = graphic;
            }
            this.map.getLayer("esriGraphicsLayerMapSettings").clear();
            this.map.getLayer("esriGraphicsLayerMapSettings").add(graphic);
        },

        /**
        * resize building Panel
        * @param {object} container node for Building tab for Demographic container
        * @param {object} content node for Building tab for Demographic container
        * @memberOf widgets/SiteLocator/SiteLocatorHelper
        */
        _resizeBuildingPanel: function (geoenrichtOuterDiv, geoenrichtOuterDivContent) {
            var esriCTBuildingResultContainer, esriCTBuildingSitesResultStylesd;
            if (geoenrichtOuterDiv.offsetHeight > 0) {
                esriCTBuildingResultContainer = document.documentElement.clientHeight - geoenrichtOuterDiv.offsetTop;
                esriCTBuildingSitesResultStylesd = { height: esriCTBuildingResultContainer + "px" };
                domAttr.set(geoenrichtOuterDiv, "style", esriCTBuildingSitesResultStylesd);
                this.resizeScrollbar(this.buildingDemoInfoMainScrollbar, geoenrichtOuterDiv, geoenrichtOuterDivContent);
            }
        },

        /**
        * Resize Sites Panel
        * @param {object} container node for Sites tab for Demographic container
        * @param {object} content node for Sites tab for Demographic container
        * @memberOf widgets/SiteLocator/SiteLocator
        */
        _resizeSitesPanel: function (geoenrichtOuterDiv, geoenrichtOuterDivContent) {
            if (geoenrichtOuterDiv.offsetTop > 0) {
                var esriCTSitesResultContainer, esriCTSitesResultStylesd;
                esriCTSitesResultContainer = document.documentElement.clientHeight - geoenrichtOuterDiv.offsetTop;
                esriCTSitesResultStylesd = { height: esriCTSitesResultContainer + "px" };
                domAttr.set(geoenrichtOuterDiv, "style", esriCTSitesResultStylesd);
                this.resizeScrollbar(this.sitesDemoInfoMainScrollbar, geoenrichtOuterDiv, geoenrichtOuterDivContent);
            }
        },

        /**
        * Resize Building Panel
        * @param {object} Container node for Building tab
        * @param {object} Content node for Building tab
        * @memberOf widgets/SiteLocator/SiteLocator
        */
        _resizeBuildingContainer: function (containerNode, contentNode) {
            // check the number of pixels from the top of the parent element(buildings tab container node) is greater than 0
            if (containerNode.offsetTop > 0) {
                var desriCTBuildingSitesResultContainer, desriCTBuildingSitesResultStyle;
                if (this.buldingShowOption === this.workflowCount + "_" + sharedNls.titles.hideText.toString()) {
                    desriCTBuildingSitesResultContainer = document.documentElement.clientHeight - containerNode.offsetTop;
                } else {
                    desriCTBuildingSitesResultContainer = document.documentElement.clientHeight - containerNode.offsetTop;
                }
                desriCTBuildingSitesResultStyle = { height: desriCTBuildingSitesResultContainer + "px" };
                domAttr.set(containerNode, "style", desriCTBuildingSitesResultStyle);
                this.resizeScrollbar(this.siteLocatorScrollbarAttributeBuilding, containerNode, contentNode);
            }
        },

        /**
        * Resize Sites Panel
        * @param {object} Container node for Sites tab
        * @param {object} Content node for Sites tab
        * @memberOf widgets/SiteLocator/SiteLocator
        */
        _resizeSitesContainer: function (containerNode, contentNode) {
            // check the number of pixels from the top of the parent element(sites tab container node) is greater than 0
            if (containerNode.offsetTop > 0) {
                var desriCTSitesResultContainer, desriCTSitesResultStyle;
                if (this.siteShowOption === this.workflowCount + "_" + sharedNls.titles.hideText.toString()) {
                    desriCTSitesResultContainer = document.documentElement.clientHeight - containerNode.offsetTop;
                } else {
                    desriCTSitesResultContainer = document.documentElement.clientHeight - containerNode.offsetTop;
                }
                desriCTSitesResultStyle = { height: desriCTSitesResultContainer + "px" };
                domAttr.set(containerNode, "style", desriCTSitesResultStyle);
                this.resizeScrollbar(this.siteLocatorScrollbarSites, containerNode, contentNode);
            }
        },

        /**
        * show hide more option callback to check the additional filters in buildings and sites tab
        * @param {object} show node
        * @param {object} text node
        * @param {object} rule node
        * @memberOf widgets/SiteLocator/SiteLocator
        */
        _showHideMoreOption: function (showHideNode, textNode, ruleNode) {
            var esriCTBuildingSitesStyle, newContentnode, esriCTBuildingSitesResultContainer, contentnode, contentNodeSites, esriCTSitesResultContainer, siteLocatorScrollbarBuildingNew, esriCTBuildingSitesResultStyle, esriCTSitesResultStyle;
            if (textNode.innerHTML.toString() === sharedNls.titles.hideText.toString()) {
                domStyle.set(showHideNode, "display", "none");
                domClass.replace(ruleNode, "esriCTHorizantalruleHide", "esriCTHorizantalrule");
                textNode.innerHTML = sharedNls.titles.showText;
                if (this.workflowCount === 0) {
                    this.buldingShowOption = this.workflowCount + "_" + textNode.innerHTML;
                    if (this.buildingTabData) {
                        contentnode = query('.esriCTResultContentBuilding', this.outerResultContainerBuilding[0]);
                        if (this.outerResultContainerBuilding) {
                            while (this.outerResultContainerBuilding.hasChildNodes()) {
                                if (this.outerResultContainerBuilding.lastChild) {
                                    this.outerResultContainerBuilding.removeChild(this.outerResultContainerBuilding.lastChild);
                                }
                            }
                        }
                        if (contentnode[0]) {
                            esriCTBuildingSitesResultContainer = document.documentElement.clientHeight - this.outerResultContainerBuilding.offsetTop;
                            esriCTBuildingSitesStyle = { height: esriCTBuildingSitesResultContainer + "px" };
                            domAttr.set(this.outerResultContainerBuilding, "style", esriCTBuildingSitesStyle);
                            this.siteLocatorScrollbarAttributeBuilding = new ScrollBar(({ domNode: this.outerResultContainerBuilding }));
                            this.siteLocatorScrollbarAttributeBuilding.setContent(contentnode[0]);
                            this.siteLocatorScrollbarAttributeBuilding.createScrollBar();
                        }
                    }
                }
                if (this.workflowCount === 1) {
                    this.siteShowOption = this.workflowCount + "_" + textNode.innerHTML;
                    if (this.sitesTabData) {
                        contentNodeSites = query('.esriCTResultContentSites', this.outerResultContainerSites[0]);
                        if (this.outerResultContainerSites) {
                            while (this.outerResultContainerSites.hasChildNodes()) {
                                if (this.outerResultContainerSites.lastChild) {
                                    this.outerResultContainerSites.removeChild(this.outerResultContainerSites.lastChild);
                                }
                            }
                        }
                        if (contentNodeSites[0]) {
                            esriCTSitesResultContainer = document.documentElement.clientHeight - this.outerResultContainerSites.offsetTop;
                            esriCTSitesResultStyle = { height: esriCTSitesResultContainer + "px" };
                            domAttr.set(this.outerResultContainerSites, "style", esriCTSitesResultStyle);
                            this.siteLocatorScrollbarSites = new ScrollBar(({ domNode: this.outerResultContainerSites }));
                            this.siteLocatorScrollbarSites.setContent(contentNodeSites[0]);
                            this.siteLocatorScrollbarSites.createScrollBar();
                        }
                    }
                }

            } else {
                domStyle.set(showHideNode, "display", "block");
                domClass.replace(ruleNode, "esriCTHorizantalrule", "esriCTHorizantalruleHide");
                textNode.innerHTML = sharedNls.titles.hideText;
                if (this.workflowCount === 0) {
                    this.buldingShowOption = this.workflowCount + "_" + textNode.innerHTML;
                    if (this.buildingTabData) {
                        newContentnode = query('.esriCTResultContentBuilding', this.outerResultContainerBuilding[0]);
                        if (this.outerResultContainerBuilding) {
                            while (this.outerResultContainerBuilding.hasChildNodes()) {
                                if (this.outerResultContainerBuilding.lastChild) {
                                    this.outerResultContainerBuilding.removeChild(this.outerResultContainerBuilding.lastChild);
                                }
                            }
                        }
                        if (newContentnode[0]) {
                            esriCTBuildingSitesResultContainer = document.documentElement.clientHeight - this.outerResultContainerBuilding.offsetTop;
                            esriCTBuildingSitesResultStyle = { height: esriCTBuildingSitesResultContainer + "px" };
                            domAttr.set(this.outerResultContainerBuilding, "style", esriCTBuildingSitesResultStyle);
                            siteLocatorScrollbarBuildingNew = new ScrollBar(({ domNode: this.outerResultContainerBuilding }));
                            siteLocatorScrollbarBuildingNew.setContent(newContentnode[0]);
                            siteLocatorScrollbarBuildingNew.createScrollBar();
                        }
                    }
                }
                if (this.workflowCount === 1) {
                    this.siteShowOption = this.workflowCount + "_" + textNode.innerHTML;
                    if (this.sitesTabData) {
                        contentNodeSites = query('.esriCTResultContentSites', this.outerResultContainerSites[0]);
                        if (this.outerResultContainerSites) {
                            while (this.outerResultContainerSites.hasChildNodes()) {
                                if (this.outerResultContainerSites.lastChild) {
                                    this.outerResultContainerSites.removeChild(this.outerResultContainerSites.lastChild);
                                }
                            }
                        }
                        if (contentNodeSites[0]) {
                            esriCTSitesResultContainer = document.documentElement.clientHeight - this.outerResultContainerSites.offsetTop;
                            esriCTSitesResultStyle = { height: esriCTSitesResultContainer + "px" };
                            domAttr.set(this.outerResultContainerSites, "style", esriCTSitesResultStyle);
                            this.siteLocatorScrollbarSites = new ScrollBar(({ domNode: this.outerResultContainerSites }));
                            this.siteLocatorScrollbarSites.setContent(contentNodeSites[0]);
                            this.siteLocatorScrollbarSites.createScrollBar();
                        }
                    }
                }
            }
        },

        /**
        * Creates list of objects to be displayed in pagination
        * @param {array} list of data for a batch
        * @param {object} Nodes to attach display list
        * @memberOf widgets/SiteLocator/SiteLocatorHelper
        */
        _createDisplayList: function (listData, containerNode) {
            if (listData) {
                var contentNode, i, contentOuter, attchImages, featureInfo, j, k, esriCTBuildingSitesResultContainer, esriCTBuildingSitesResultStyle, esriCTSitesResultContainer, esriCTSitesResultStyle;
                topic.publish("hideProgressIndicator");
                domConstruct.empty(containerNode);
                if (this.workflowCount === 0) {
                    if (this.buldingShowOption === this.workflowCount + "_" + sharedNls.titles.hideText.toString()) {
                        esriCTBuildingSitesResultContainer = document.documentElement.clientHeight - containerNode.offsetTop;
                    } else {
                        esriCTBuildingSitesResultContainer = document.documentElement.clientHeight - containerNode.offsetTop;
                    }
                    contentNode = domConstruct.create("div", { "class": "esriCTResultContentBuilding" }, containerNode);
                    esriCTBuildingSitesResultStyle = { height: esriCTBuildingSitesResultContainer + "px" };
                    domAttr.set(containerNode, "style", esriCTBuildingSitesResultStyle);
                    this.siteLocatorScrollbarAttributeBuilding = new ScrollBar(({ domNode: containerNode }));
                    this.siteLocatorScrollbarAttributeBuilding.setContent(contentNode);
                    this.siteLocatorScrollbarAttributeBuilding.createScrollBar();
                    on(window, "resize", lang.hitch(this, function () {
                        var desriCTBuildingSitesResultContainer, desriCTBuildingSitesResultStyle;
                        if (this.buldingShowOption === this.workflowCount + "_" + sharedNls.titles.hideText.toString()) {
                            desriCTBuildingSitesResultContainer = document.documentElement.clientHeight - containerNode.offsetTop;
                        } else {
                            desriCTBuildingSitesResultContainer = document.documentElement.clientHeight - containerNode.offsetTop;
                        }
                        desriCTBuildingSitesResultStyle = { height: desriCTBuildingSitesResultContainer + "px" };
                        domAttr.set(containerNode, "style", desriCTBuildingSitesResultStyle);
                        this.resizeScrollbar(this.siteLocatorScrollbarAttributeBuilding, containerNode, contentNode);
                    }));
                }
                if (this.workflowCount === 1) {
                    if (this.siteShowOption === this.workflowCount + "_" + sharedNls.titles.hideText.toString()) {
                        esriCTSitesResultContainer = document.documentElement.clientHeight - containerNode.offsetTop;
                    } else {
                        esriCTSitesResultContainer = document.documentElement.clientHeight - containerNode.offsetTop;
                    }
                    contentNode = domConstruct.create("div", { "class": "esriCTResultContentSites" }, containerNode);
                    esriCTSitesResultStyle = { height: esriCTSitesResultContainer + "px" };
                    domAttr.set(containerNode, "style", esriCTSitesResultStyle);
                    this.siteLocatorScrollbarSites = new ScrollBar(({ domNode: containerNode }));
                    this.siteLocatorScrollbarSites.setContent(contentNode);
                    this.siteLocatorScrollbarSites.createScrollBar();

                    on(window, "resize", lang.hitch(this, function () {
                        var desriCTSitesResultContainer, desriCTSitesResultStyle;
                        if (this.siteShowOption === this.workflowCount + "_" + sharedNls.titles.hideText.toString()) {
                            desriCTSitesResultContainer = document.documentElement.clientHeight - containerNode.offsetTop;
                        } else {
                            desriCTSitesResultContainer = document.documentElement.clientHeight - containerNode.offsetTop;
                        }
                        desriCTSitesResultStyle = { height: desriCTSitesResultContainer + "px" };
                        domAttr.set(containerNode, "style", desriCTSitesResultStyle);
                        this.resizeScrollbar(this.siteLocatorScrollbarSites, containerNode, contentNode);
                    }));
                }
                for (i = 0; i < listData.length; i++) {
                    contentOuter = domConstruct.create("div", { "class": "esriCTOuterContent" }, contentNode);
                    domAttr.set(contentOuter, "index", i);
                    if (this.opeartionLayer.hasAttachments && dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.ResultContents.ShowAttachments) {
                        attchImages = domConstruct.create("div", { "class": "esriCTAttchImages" }, contentOuter);
                        if (listData[i].attachmentData) {
                            domConstruct.create("img", { "src": listData[i].attachmentData[0].url }, attchImages);
                        } else {

                            domConstruct.create("img", { "src": dojoConfig.baseURL + "/js/library/themes/images/not-available.png" }, attchImages);
                        }
                        featureInfo = domConstruct.create("div", { "class": "esriCTFeatureInfoAttachment" }, contentOuter);
                        this.own(on(contentOuter, "click", lang.hitch(this, this._getAttchmentImageAndInformation)));

                        for (j = 0; j < dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.ResultContents.DisplayFields.length; j++) {
                            domConstruct.create("div", { "class": "esriCTfeatureField", "innerHTML": dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.ResultContents.DisplayFields[j].DisplayText + " " + listData[i].featureData[dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.ResultContents.DisplayFields[j].FieldName] }, featureInfo);
                        }
                    } else {
                        featureInfo = domConstruct.create("div", { "class": "esriCTFeatureInfo" }, contentOuter);
                        this.own(on(contentOuter, "click", lang.hitch(this, this._getAttchmentImageAndInformation)));
                        for (k = 0; k < dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.ResultContents.DisplayFields.length; k++) {
                            domConstruct.create("div", { "class": "esriCTfeatureField", "innerHTML": dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.ResultContents.DisplayFields[k].DisplayText + " " + listData[i].featureData[dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.ResultContents.DisplayFields[k].FieldName] }, featureInfo);
                        }
                    }
                }
            }
            if (window.location.toString().split("$selectedObjectIndex=").length > 1 && !this.isIndexShared) {
                if (Number(window.location.toString().split("$workflowCount=")[1].split("$")[0]) === dojo.workflowCount) {
                    this.isSharedExtent = true;
                    this.isIndexShared = true;
                    this._getAttchmentImageAndInformation(Number(window.location.toString().split("$selectedObjectIndex=")[1].split("$")[0]));
                }
            }
        },

        /**
        * perform query to get geometry and other data based on object selection from display list
        * @param {object} Scrollbar name
        * @param {object} Scrollbar container node
        * @param {object} scrollbar Content node
        * @memberOf widgets/SiteLocator/SiteLocatorHelper
        */
        resizeScrollbar: function (scrollbarName, containerNode, scrollbarContent) {
            if (scrollbarName && containerNode.offsetTop > 0) {
                domClass.remove(scrollbarName._scrollBarContent, "scrollbar_content");
                domClass.add(scrollbarName._scrollBarContent, "esriCTZeroHeight");
                if (scrollbarName) {
                    scrollbarName.removeScrollBar();
                }
                if (containerNode) {
                    while (containerNode.hasChildNodes()) {
                        if (containerNode.lastChild) {
                            containerNode.removeChild(containerNode.lastChild);
                        }
                    }
                }
                if (scrollbarContent) {
                    scrollbarName = new ScrollBar(({ domNode: containerNode }));
                    scrollbarName.setContent(scrollbarContent);
                    scrollbarName.createScrollBar();
                }
            }
        },

        /**
        * perform query to get geometry and other data based on object selection from display list
        * @param {object} Selected value
        * @memberOf widgets/SiteLocator/SitelocatorHelper
        */
        _getAttchmentImageAndInformation: function (value) {
            var index, dataSelected;
            if (isNaN(value)) {
                index = domAttr.get(value.currentTarget, "index").toString();
            } else {
                index = value.toString();
            }
            dojo.selectedObjectIndex[this.workflowCount] = index;
            topic.publish("showProgressIndicator");
            if (this.workflowCount === 0) {
                dataSelected = this.buildingTabData[index];
                this._attachMentQuery(value, dataSelected, this.attachmentOuterDiv, this.mainDivBuilding, this.searchContentBuilding);
            } else if (this.workflowCount === 1) {
                dataSelected = this.sitesTabData[index];
                this._attachMentQuery(value, dataSelected, this.attachmentOuterDivSites, this.mainDivSites, this.searchContentSites);
            }
        },

        /**
        * perform query to get geometry and other data based on object selection from display list
        * @param {object} Selected value
        * @param {object} Data for selected value
        * @param {object} html node for attachment
        * @param {object} html node for main container
        * @param {object} html node search content
        * @memberOf widgets/SiteLocator/SiteLocatorHelper
        */
        _attachMentQuery: function (value, dataSelected, attachmentNode, mainDivNode, searchContentNode) {
            var backwardImage, backToResultDiv, arrAttachmentURL = [], backToResult, attachmentDiv, attachmentImageClickDiv, imageCount = 0, prevNextdiv, prevdiv, nextdiv, outfields = [], resultSelectionQuerytask, resultSelectQuery, i, j, k, geometryService, params, propertyHeaderInfo, attributedata;
            domConstruct.empty(attachmentNode);
            domStyle.set(attachmentNode, "display", "block");
            domStyle.set(mainDivNode, "display", "none");
            domConstruct.create("div", { "class": "esriCTAttachmentOuterDiv" }, searchContentNode);
            backToResultDiv = domConstruct.create("div", { "class": "esriCTBackToResultImage" }, attachmentNode);
            backwardImage = domConstruct.create("div", { "class": "esriCTBackwardImage" }, backToResultDiv);
            backToResult = domConstruct.create("div", { "class": "esriCTBackToResult" }, backToResultDiv);
            domAttr.set(backToResult, "innerHTML", sharedNls.titles.result);
            if (dataSelected.attachmentData) {
                attachmentDiv = domConstruct.create("div", { "class": "esriCTAttachmentDiv" }, attachmentNode);
                attachmentImageClickDiv = domConstruct.create("img", { "src": dataSelected.attachmentData[0].url }, attachmentDiv);
                if (dataSelected.attachmentData.length > 0) {
                    for (k = 0; k < dataSelected.attachmentData.length; k++) {
                        arrAttachmentURL.push(dataSelected.attachmentData[k].url);
                    }
                    // If attachment length is greater than one then display previous and next arrow
                    if (dataSelected.attachmentData.length > 1) {
                        prevNextdiv = domConstruct.create("div", { "class": "esriCTPrevNext" }, attachmentNode);
                        prevdiv = domConstruct.create("div", { "class": "esriCTPrev" }, prevNextdiv);
                        nextdiv = domConstruct.create("div", { "class": "esriCTNext" }, prevNextdiv);

                        this.own(on(prevdiv, "click", lang.hitch(this, function (value) {
                            imageCount--;
                            if (imageCount < 0) {
                                imageCount = dataSelected.attachmentData.length - 1;
                            }
                            domAttr.set(attachmentImageClickDiv, "src", dataSelected.attachmentData[imageCount].url);
                        })));
                        this.own(on(nextdiv, "click", lang.hitch(this, function (value) {
                            imageCount++;
                            if (imageCount === dataSelected.attachmentData.length) {
                                imageCount = 0;
                            }
                            domAttr.set(attachmentImageClickDiv, "src", dataSelected.attachmentData[imageCount].url);
                        })));
                    }
                }
            }
            this._downloadDropDown(dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.DownloadSettings, attachmentNode);
            resultSelectionQuerytask = new QueryTask(this.opeartionLayer.url);
            resultSelectQuery = new esri.tasks.Query();
            resultSelectQuery.returnGeometry = true;
            resultSelectQuery.outSpatialReference = this.map.spatialReference;
            resultSelectQuery.objectIds = [dataSelected.featureData[this.opeartionLayer.objectIdField]];
            for (i = 0; i < dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields.length; i++) {
                outfields.push(dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields[i].FieldName);
            }
            resultSelectQuery.outFields = outfields;
            resultSelectionQuerytask.execute(resultSelectQuery, lang.hitch(this, function (featureSet) {
                var symbol, graphic, arraProperyDisplayData = [], isGeoenriched = false, enrichIndex;
                if (featureSet.features[0].geometry.getExtent()) {
                    symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0, 0.65]), 3), new Color([255, 0, 0, 0.35]));
                    graphic = new Graphic(featureSet.features[0].geometry, symbol, {}, null);
                    graphic.attributes.layerURL = this.opeartionLayer.url;
                    if (!this.isSharedExtent) {
                        this.map.setExtent(featureSet.features[0].geometry.getExtent());
                    }
                    this.isSharedExtent = false;

                } else {
                    symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, dojo.configData.LocatorRippleSize, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([parseInt(dojo.configData.RippleColor.split(",")[0], 10), parseInt(dojo.configData.RippleColor.split(",")[1], 10), parseInt(dojo.configData.RippleColor.split(",")[2], 10), 0.65]), 4), new dojo.Color([0, 0, 0, 0.2]));
                    graphic = new Graphic(featureSet.features[0].geometry, symbol, {}, null);
                    graphic.attributes.layerURL = this.opeartionLayer.url;
                    if (!this.isSharedExtent) {
                        this.map.setLevel(dojo.configData.ZoomLevel);
                        this.map.centerAt(featureSet.features[0].geometry);
                    }
                    this.isSharedExtent = false;
                }
                this.map.getLayer("esriFeatureGraphicsLayer").clear();
                this.featureGraphics[this.workflowCount] = graphic;
                this.map.getLayer("esriFeatureGraphicsLayer").add(graphic);
                if (this.opeartionLayer && this.opeartionLayer.visibleAtMapScale) {
                    this.map.getLayer("esriFeatureGraphicsLayer").graphics[0].show();
                } else {
                    this.map.getLayer("esriFeatureGraphicsLayer").graphics[0].hide();
                }
                propertyHeaderInfo = domConstruct.create("div", { "class": "esriCTHeaderInfoDiv" }, attachmentNode);
                domAttr.set(propertyHeaderInfo, "innerHTML", dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.DownloadSettings[0].DisplayOptionTitle);
                for (j = 0; j < dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields.length; j++) {
                    attributedata = domConstruct.create("div", { "class": "esriCTSelectedfeatureField" }, attachmentNode);
                    if (isNaN(featureSet.features[0].attributes[dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields[j].FieldName])) {
                        arraProperyDisplayData.push(dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields[j].DisplayText + featureSet.features[0].attributes[dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields[j].FieldName]);
                        domAttr.set(attributedata, "innerHTML", dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields[j].DisplayText + " " + featureSet.features[0].attributes[dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields[j].FieldName]);
                    } else {
                        if (Number(featureSet.features[0].attributes[dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields[j].FieldName]) % 1 === 0) {
                            arraProperyDisplayData.push(dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields[j].DisplayText + featureSet.features[0].attributes[dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields[j].FieldName]);
                            domAttr.set(attributedata, "innerHTML", dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields[j].DisplayText + " " + featureSet.features[0].attributes[dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields[j].FieldName]);
                        } else {
                            arraProperyDisplayData.push(dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields[j].DisplayText + Number(featureSet.features[0].attributes[dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields[j].FieldName]).toFixed(2));
                            domAttr.set(attributedata, "innerHTML", dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields[j].DisplayText + " " + Number(featureSet.features[0].attributes[dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields[j].FieldName]).toFixed(2));
                        }
                    }
                }
                this.arrReportDataJson[this.workflowCount] = {};
                this.arrReportDataJson[this.workflowCount].reportData = {};
                this.arrReportDataJson[this.workflowCount].reportData[dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.DownloadSettings[0].DisplayOptionTitle.toString()] = arraProperyDisplayData;
                this.arrReportDataJson[this.workflowCount].attachmentData = arrAttachmentURL;
                if (this.arrGeoenrichData[this.workflowCount] !== null) {
                    for (enrichIndex = 0; enrichIndex < this.arrGeoenrichData[this.workflowCount].length; enrichIndex++) {
                        if (this.arrGeoenrichData[this.workflowCount][enrichIndex].ID === dataSelected.featureData[this.opeartionLayer.objectIdField]) {
                            this._geoEnrichmentRequestHandler(this.arrGeoenrichData[this.workflowCount][enrichIndex].data, this.arrGeoenrichData[this.workflowCount][enrichIndex].ID);
                            isGeoenriched = true;
                            break;
                        }
                    }
                    if (!isGeoenriched) {
                        this.arrGeoenrichData[this.workflowCount].push({ ID: dataSelected.featureData[this.opeartionLayer.objectIdField] });
                    }

                } else {
                    this.arrGeoenrichData[this.workflowCount] = [];
                    this.arrGeoenrichData[this.workflowCount].push({ ID: dataSelected.featureData[[this.opeartionLayer.objectIdField]] });
                }

                if (!isGeoenriched) {
                    geometryService = new GeometryService(dojo.configData.GeometryService);
                    params = new BufferParameters();
                    params.distances = [dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoenrichmentDistance.BufferDistance];
                    params.bufferSpatialReference = this.map.spatialReference;
                    params.outSpatialReference = this.map.spatialReference;
                    params.geometries = [featureSet.features[0].geometry];
                    params.unit = GeometryService[dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoenrichmentDistance.Unit];
                    geometryService.buffer(params, lang.hitch(this, function (geometries) {
                        topic.publish("showProgressIndicator");
                        this._enrichData(geometries, this.workflowCount, null);
                    }), function (error) {
                        topic.publish("hideProgressIndicator");
                    });
                }
            }));
            this.own(on(backToResult, "click", lang.hitch(this, function () {
                this._getBackToTab(attachmentNode, mainDivNode);
            })));
            this.own(on(backwardImage, "click", lang.hitch(this, function () {
                this._getBackToTab(attachmentNode, mainDivNode);
            })));
        },

        /**
        * Back button handler building tab
        * @param {object} Attachment div node
        * @param {object} Parent div node for attachment
        * @memberOf widgets/SiteLocator/SiteLocatorHelper
        */
        _getBackToTab: function (attachmentNode, mainDivNode) {
            domStyle.set(attachmentNode, "display", "none");
            domStyle.set(mainDivNode, "display", "block");
            this.map.getLayer("esriFeatureGraphicsLayer").clear();
            this.featureGraphics[this.workflowCount] = null;
            dojo.selectedObjectIndex[this.workflowCount] = undefined;
            if (this.workflowCount === 0) {
                if (this.outerResultContainerBuilding) {
                    while (this.outerResultContainerBuilding.hasChildNodes()) {
                        if (this.outerResultContainerBuilding.lastChild) {
                            this.outerResultContainerBuilding.removeChild(this.outerResultContainerBuilding.lastChild);
                            if (this.outerResultContainerBuilding.firstChild !== null) {
                                this.outerResultContainerBuilding.removeChild(this.outerResultContainerBuilding.firstChild);
                            }
                        }
                    }
                }
                this._createDisplayList(this.buildingTabData, this.outerResultContainerBuilding);
            } else if ((this.workflowCount === 1)) {
                if (this.outerResultContainerSites) {
                    while (this.outerResultContainerSites.hasChildNodes()) {
                        if (this.outerResultContainerSites.lastChild) {
                            this.outerResultContainerSites.removeChild(this.outerResultContainerSites.lastChild);
                            if (this.outerResultContainerSites.firstChild !== null) {
                                this.outerResultContainerSites.removeChild(this.outerResultContainerSites.firstChild);
                            }
                        }
                    }
                }
                this._createDisplayList(this.sitesTabData, this.outerResultContainerSites);
            }
        },

        /**
        * Enables and disables search for communities tab
        * @param {object} Search check box
        * @memberOf widgets/SiteLocator/SiteLocatorHelper
        */
        _communitiesSearchRadioButtonHandler: function (rdoCommunitiesAddressSearch) {
            domClass.remove(this.divSearchCommunities, "esriCTDisabledAddressColorChange");
            domClass.remove(this.txtAddressCommunities, "esriCTDisabledAddressColorChange");
            domClass.remove(this.closeCommunities, "esriCTDisabledAddressColorChange");
            domClass.remove(this.clearhideCommunities, "esriCTDisabledAddressColorChange");
            this.txtAddressCommunities.disabled = !rdoCommunitiesAddressSearch.checked;
            this.closeCommunities.disabled = !rdoCommunitiesAddressSearch.checked;
            this.esriCTimgLocateCommunities.disabled = !rdoCommunitiesAddressSearch.checked;
            this.divSearchCommunities.disabled = !rdoCommunitiesAddressSearch.checked;
            if (this.comAreaList) {
                this.comAreaList.disabled = rdoCommunitiesAddressSearch.checked;
                this.comAreaList.reset();
            }
            dojo.communitySelectionFeature = null;

        },

        /**
        * Enables and disables search for building tab
        * @param {object} Search check box
        * @memberOf widgets/SiteLocator/SiteLocatorHelper
        */
        _buildingSearchButtonHandler: function (chkSerachContentBuilding) {
            var slider, sliderStartPoint, imageSlider = query('.dijitSliderImageHandleH')[0],
                sliderProgressBar = query('.dijitSliderProgressBar')[0];
            sliderStartPoint = query('.claro .dijitSlider .dijitSliderLeftBumper')[0];
            this.txtAddressBuilding.disabled = !chkSerachContentBuilding.checked;
            this.closeBuilding.disabled = !chkSerachContentBuilding.checked;
            this.esriCTimgLocateBuilding.disabled = !chkSerachContentBuilding.checked;
            this.divSearchBuilding.disabled = !chkSerachContentBuilding.checked;
            this.esriCTimgLocateBuilding.disabled = !chkSerachContentBuilding.checked;
            slider = dijit.byId("sliderhorizontalSliderContainerBuliding");
            slider.disabled = !chkSerachContentBuilding.checked;
            if (!chkSerachContentBuilding.checked) {
                domConstruct.empty(this.divAddressResultsBuilding);
                domStyle.set(this.divAddressScrollContainerBuilding, "display", "none");
                domStyle.set(this.divAddressScrollContentBuilding, "display", "none");
                this.lastGeometry[this.workflowCount] = null;
                this.featureGeometry[this.workflowCount] = null;
                this.map.graphics.clear();
                this.map.getLayer("esriBufferGraphicsLayer").clear();
                this.map.getLayer("esriGraphicsLayerMapSettings").clear();
                dojo.arrAddressMapPoint[this.workflowCount] = null;
                this._callAndOrQuery(this.queryArrayBuildingAND, this.queryArrayBuildingOR);
                //Disable the slider value and slider in buildings tab
                domClass.add(this.divSearchBuilding, "esriCTDisabledAddressColorChange");
                domClass.add(this.txtAddressBuilding, "esriCTDisabledAddressColorChange");
                domClass.add(this.closeBuilding, "esriCTDisabledAddressColorChange");
                domClass.add(this.clearhideBuilding, "esriCTDisabledAddressColorChange");
                domClass.add(imageSlider, "esriCTGrayThumb");
                domClass.add(this.sliderDisplayText, "esriCTesriCTsliderDisplayGrayText");
                domClass.add(sliderProgressBar, "esriCTSliderProgressBar");
                domClass.add(sliderStartPoint, "esriCTSliderProgressBar");

            } else {
                domClass.remove(this.divSearchBuilding, "esriCTDisabledAddressColorChange");
                domClass.remove(this.txtAddressBuilding, "esriCTDisabledAddressColorChange");
                domClass.remove(this.closeBuilding, "esriCTDisabledAddressColorChange");
                domClass.remove(this.clearhideBuilding, "esriCTDisabledAddressColorChange");
                domClass.remove(imageSlider, "esriCTGrayThumb");
                domClass.remove(this.sliderDisplayText, "esriCTesriCTsliderDisplayGrayText");
                domClass.remove(sliderProgressBar, "esriCTSliderProgressBar");
                domClass.remove(sliderStartPoint, "esriCTSliderProgressBar");
            }
        },

        /**
        * Enables and disables search for sites tab
        * @param {object} Search check box
        * @memberOf widgets/SiteLocator/SiteLocatorHelper
        */
        _sitesSearchButtonHandler: function (chksearchContentSites) {
            var slider, imageSlider = query('.dijitSliderImageHandleH')[1], sliderProgressBar, sliderStartPoint;
            sliderStartPoint = query('.claro .dijitSlider .dijitSliderLeftBumper')[1];
            sliderProgressBar = query('.dijitSliderProgressBar')[1];
            this.txtAddressSites.disabled = !chksearchContentSites.checked;
            this.closeSites.disabled = !chksearchContentSites.checked;
            this.esriCTimgLocateSites.disabled = !chksearchContentSites.checked;
            this.divSearchSites.disabled = !chksearchContentSites.checked;
            slider = dijit.byId("sliderhorizontalSliderContainerSites");
            slider.disabled = !chksearchContentSites.checked;
            if (!chksearchContentSites.checked) {
                domConstruct.empty(this.divAddressResultsSites);
                domStyle.set(this.divAddressScrollContainerSites, "display", "none");
                domStyle.set(this.divAddressScrollContentSites, "display", "none");
                this.lastGeometry[this.workflowCount] = null;
                this.featureGeometry[this.workflowCount] = null;
                this.map.graphics.clear();
                this.map.getLayer("esriBufferGraphicsLayer").clear();
                this.map.getLayer("esriGraphicsLayerMapSettings").clear();
                dojo.arrAddressMapPoint[this.workflowCount] = null;
                this._callAndOrQuery(this.queryArraySitesAND, this.queryArraySitesOR);
                //Disable the slider value and slider in sites tab
                domClass.add(this.divSearchSites, "esriCTDisabledAddressColorChange");
                domClass.add(this.txtAddressSites, "esriCTDisabledAddressColorChange");
                domClass.add(this.closeSites, "esriCTDisabledAddressColorChange");
                domClass.add(this.clearhideSites, "esriCTDisabledAddressColorChange");
                domClass.add(imageSlider, "esriCTGrayThumb");
                domClass.add(this.sitesSliderText, "esriCTesriCTsliderDisplayGrayText");
                domClass.add(sliderProgressBar, "esriCTSliderProgressBar");
                domClass.add(sliderStartPoint, "esriCTSliderProgressBar");
            } else {
                domClass.remove(this.divSearchSites, "esriCTDisabledAddressColorChange");
                domClass.remove(this.txtAddressSites, "esriCTDisabledAddressColorChange");
                domClass.remove(this.closeSites, "esriCTDisabledAddressColorChange");
                domClass.remove(this.clearhideSites, "esriCTDisabledAddressColorChange");
                domClass.remove(imageSlider, "esriCTGrayThumb");
                domClass.remove(this.sitesSliderText, "esriCTesriCTsliderDisplayGrayText");
                domClass.remove(sliderProgressBar, "esriCTSliderProgressBar");
                domClass.remove(sliderStartPoint, "esriCTSliderProgressBar");
            }

        },

        /**
        * Get operational layer based on tab(work flow) selection
        * @param {number} count of tab(workflow)
        * @memberOf widgets/SiteLocator/SiteLocatorHelper
        */
        getCuerntOperatiobalLayer: function (tabCount) {
            var layer, opeartionLayer;
            for (opeartionLayer in this.map._layers) {
                if (this.map._layers.hasOwnProperty(opeartionLayer) && this.map._layers[opeartionLayer].url && dojo.configData.Workflows[tabCount].SearchSettings) {
                    if (this.map._layers[opeartionLayer].url === dojo.configData.Workflows[tabCount].SearchSettings[0].QueryURL) {
                        layer = this.map._layers[opeartionLayer];
                        break;
                    }
                }
            }
            return layer;
        }
    });
});
