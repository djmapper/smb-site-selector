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
    "../siteLocator/siteLocatorHelper",
    "dijit/focus"

], function (declare, domConstruct, on, topic, lang, array, domStyle, domAttr, dom, query, Locator, domClass, FeatureSet, domGeom, GeometryService, string, html, template, urlUtils, Query, QueryTask, Deferred, DeferredList, ScrollBar, Color, SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, Graphic, Point, registry, BufferParameters, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, GraphicsLayer, HorizontalSlider, SelectList, DropDownSelect, esriRequest, SpatialReference, number, Polygon, HorizontalRule, siteLocatorHelper, focusUtil) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, siteLocatorHelper], {
        templateString: template,
        sharedNls: sharedNls,
        tooltip: null,
        logoContainer: null,
        featureGeometry: [null, null, null],
        totalArray: [],
        revenueData: [],
        employeeData: [],
        salesFinalData: [],
        employeFinalData: [],
        buldingShowOption: null,
        siteShowOption: null,
        arrTabClass: [],
        queryArrayBuildingAND: [],
        queryArrayBuildingOR: [],
        queryArraySitesAND: [],
        queryArraySitesOR: [],
        workflowCount: null,
        arrBussinesResultData: [],
        businessData: [],
        enrichData: null,
        opeartionLayer: null,
        unitValues: [null, null, null, null],
        arrStudyAreas: [null, null, null],
        featureGraphics: [null, null, null, null],
        arrReportDataJson: [null, null, null, null],
        isSharedExtent: false,
        _isSharedDataAvailable: false,

        /**
        * create Site Locator widget
        *
        * @class
        * @name widgets/SiteLocator/SiteLocator
        */
        postCreate: function () {
            var arrSort = [], bufferDistance = null, timeOut, mapPoint, standerdGeoAttribute;
            this.logoContainer = query(".esriControlsBR")[0];
            topic.subscribe("toggleWidget", lang.hitch(this, function (widgetID) {
                if (widgetID !== "siteLocator") {

                    /**
                    * @memberOf widgets/SiteLocator/SiteLocator
                    */
                    if (html.coords(this.applicationHeaderSearchContainer).h > 0) {
                        domClass.replace(this.domNode, "esriCTHeaderSearch", "esriCTHeaderSearchSelected");
                        domClass.replace(this.applicationHeaderSearchContainer, "esriCTHideContainerHeight", "esriCTShowRouteContainerHeight");
                        if (this.logoContainer) {
                            domClass.remove(this.logoContainer, "esriCTMapLogo");
                        }
                    }
                }
            }));
            urlUtils.addProxyRule({
                urlPrefix: dojo.configData.GeoEnrichmentService,
                proxyUrl: dojo.configData.ProxyUrl
            });
            dojo.arrStrAdderss = [null, null, null, null];
            dojo.arrAddressMapPoint = [null, null, null, null];
            dojo.arrBufferDistance = [null, null, null, null];
            dojo.arrWhereClause = [null, null, null, null];
            dojo.selectedObjectIndex = [null, null];
            this.domNode = domConstruct.create("div", { "title": sharedNls.tooltips.reports, "class": "esriCTHeaderSearch" }, null);
            if (window.location.toString().split("$workflowCount=").length > 1 && Number(window.location.toString().split("$workflowCount=")[1].split("$")[0]) === 0 && window.location.toString().split("$address=").length > 1) {
                domAttr.set(this.txtAddressBuilding, "defaultAddress", window.location.toString().split("$address=")[1].split("$")[0].toString().split("%20").join(" "));
                dojo.arrStrAdderss[0] = window.location.toString().split("$address=")[1].split("$")[0].toString().split("%20").join(" ");
            } else {
                this._setDefaultTextboxValue(this.txtAddressBuilding);
            }
            if (window.location.toString().split("$workflowCount=").length > 1 && Number(window.location.toString().split("$workflowCount=")[1].split("$")[0]) === 1 && window.location.toString().split("$address=").length > 1) {
                domAttr.set(this.txtAddressSites, "defaultAddress", window.location.toString().split("$address=")[1].split("$")[0].toString().split("%20").join(" "));
                dojo.arrStrAdderss[1] = window.location.toString().split("$address=")[1].split("$")[0].toString().split("%20").join(" ");
            } else {
                this._setDefaultTextboxValue(this.txtAddressSites);
            }
            if (window.location.toString().split("$workflowCount=").length > 1 && Number(window.location.toString().split("$workflowCount=")[1].split("$")[0]) === 2 && window.location.toString().split("$address=").length > 1) {
                domAttr.set(this.txtAddressBusiness, "defaultAddress", window.location.toString().split("$address=")[1].split("$")[0].toString().split("%20").join(" "));
                dojo.arrStrAdderss[2] = window.location.toString().split("$address=")[1].split("$")[0].toString().split("%20").join(" ");
            } else {
                this._setDefaultTextboxValue(this.txtAddressBusiness);
            }
            if (window.location.toString().split("$workflowCount=").length > 1 && Number(window.location.toString().split("$workflowCount=")[1].split("$")[0]) === 3 && window.location.toString().split("$address=").length > 1) {
                domAttr.set(this.txtAddressCommunities, "defaultAddress", window.location.toString().split("$address=")[1].split("$")[0].toString().split("%20").join(" "));
                dojo.arrStrAdderss[3] = window.location.toString().split("$address=")[1].split("$")[0].toString().split("%20").join(" ");
            } else {
                domAttr.set(this.txtAddressCommunities, "defaultAddress", dojo.configData.Workflows[3].FilterSettings.StandardGeographyQuery.LocatorDefaultAddress);
            }
            domStyle.set(this.txtAddressBuilding, "verticalAlign", "middle");
            this.txtAddressBuilding.value = domAttr.get(this.txtAddressBuilding, "defaultAddress");
            this.lastSearchStringBuilding = lang.trim(this.txtAddressBuilding.value);
            this.txtAddressSites.value = domAttr.get(this.txtAddressSites, "defaultAddress");
            this.lastSearchStringSites = lang.trim(this.txtAddressSites.value);
            this.txtAddressBusiness.value = domAttr.get(this.txtAddressBusiness, "defaultAddress");
            this.lastSearchStringBusiness = lang.trim(this.txtAddressBusiness.value);
            this.txtAddressCommunities.value = domAttr.get(this.txtAddressCommunities, "defaultAddress");
            this.lastSearchStringCommunities = lang.trim(this.txtAddressCommunities.value);
            this._showHideInfoRouteContainer();
            // check the shared URL for "bufferDistance" to create buffer on map
            if (window.location.toString().split("$bufferDistance=").length > 1) {
                bufferDistance = Number(window.location.toString().split("$bufferDistance=")[1].toString().split("$")[0]);
            }
            // check the shared URL for "workflowCount" and workflowCount is equal to 0 and set the buffer distance for buildings tab
            if (window.location.toString().split("$workflowCount=").length > 1 && Number(window.location.toString().split("$workflowCount=")[1].split("$")[0]) === 0) {
                this._createHorizontalSlider(this.horizontalSliderContainerBuliding, this.horizontalRuleContainer, this.sliderDisplayText, this.bufferDistanceUnitBuilding, 0, bufferDistance);
                dojo.arrBufferDistance[0] = bufferDistance;
            } else {
                this._createHorizontalSlider(this.horizontalSliderContainerBuliding, this.horizontalRuleContainer, this.sliderDisplayText, this.bufferDistanceUnitBuilding, 0, null);
            }
            // check the shared URL for "workflowCount" and workflowCount is equal to 1 and set the buffer distance for sites tab
            if (window.location.toString().split("$workflowCount=").length > 1 && Number(window.location.toString().split("$workflowCount=")[1].split("$")[0]) === 1) {
                this._createHorizontalSlider(this.horizontalSliderContainerSites, this.horizontalRuleContainerSites, this.sitesSliderText, this.bufferDistanceUnitSites, 1, bufferDistance);
                dojo.arrBufferDistance[1] = bufferDistance;
            } else {
                this._createHorizontalSlider(this.horizontalSliderContainerSites, this.horizontalRuleContainerSites, this.sitesSliderText, this.bufferDistanceUnitSites, 1, null);
            }
            // check the shared URL for "workflowCount" and workflowCount is equal to 2 and set the buffer distance for business tab
            if (window.location.toString().split("$workflowCount=").length > 1 && Number(window.location.toString().split("$workflowCount=")[1].split("$")[0]) === 2) {
                this._createHorizontalSlider(this.horizontalSliderContainerBusiness, this.horizontalRuleContainerBusiness, this.businessSliderText, this.bufferDistanceUnitBusiness, 2, bufferDistance);
                dojo.arrBufferDistance[2] = bufferDistance;
            } else {
                this._createHorizontalSlider(this.horizontalSliderContainerBusiness, this.horizontalRuleContainerBusiness, this.businessSliderText, this.bufferDistanceUnitBusiness, 2, null);
            }

            arrSort = this._setSelectionOption(dojo.configData.Workflows[2].FilterSettings.BusinesSortOptions.Option.split(","));
            arrSort.splice(0, 0, { "label": sharedNls.titles.select, "value": sharedNls.titles.select });
            this.selectSortOption = new SelectList({ options: arrSort, id: "sortBy" }, this.SortBy);
            /**
            * minimize other open header panel widgets and show search
            */
            dom.byId("esriCTParentDivContainer").appendChild(this.applicationHeaderSearchContainer);
            this._setTabVisibility();
            this._attachLocatorEvents({ divSearch: this.divSearchBuilding, checkBox: this.chkSerachContentBuilding, imgSearchLoader: this.imgSearchLoaderBuilding, txtAddress: this.txtAddressBuilding, close: this.closeBuilding, divAddressResults: this.divAddressResultsBuilding, divAddressScrollContainer: this.divAddressScrollContainerBuilding, divAddressScrollContent: this.divAddressScrollContentBuilding, addressWorkflowCount: 0, searchContent: this.searchContentBuilding, lastSearchString: this.lastSearchStringBuilding, locatorScrollBar: this.locatorScrollbarBuilding });
            this._attachLocatorEvents({ divSearch: this.divSearchSites, checkBox: this.chksearchContentSites, imgSearchLoader: this.imgSearchLoaderSites, txtAddress: this.txtAddressSites, close: this.closeSites, divAddressResults: this.divAddressResultsSites, divAddressScrollContainer: this.divAddressScrollContainerSites, divAddressScrollContent: this.divAddressScrollContentSites, addressWorkflowCount: 1, searchContent: this.searchContentSites, lastSearchString: this.lastSearchStringSites, locatorScrollBar: this.locatorScrollbarSites });
            this._attachLocatorEvents({ divSearch: this.divSearchBusiness, checkBox: { checked: true }, imgSearchLoader: this.imgSearchLoaderBusiness, txtAddress: this.txtAddressBusiness, close: this.closeBusiness, divAddressResults: this.divAddressResultsBusiness, divAddressScrollContainer: this.divAddressScrollContainerBusiness, divAddressScrollContent: this.divAddressScrollContentBusiness, addressWorkflowCount: 2, searchContent: this.searchContentBusiness, lastSearchString: this.lastSearchStringBusiness, locatorScrollBar: this.locatorScrollbarBusiness });
            this._attachLocatorEvents({ divSearch: this.divSearchCommunities, checkBox: this.rdoCommunitiesAddressSearch, imgSearchLoader: this.imgSearchLoaderCommunities, txtAddress: this.txtAddressCommunities, close: this.closeCommunities, divAddressResults: this.divAddressResultsCommunities, divAddressScrollContainer: this.divAddressScrollContainerCommunities, divAddressScrollContent: this.divAddressScrollContentCommunities, addressWorkflowCount: 3, searchContent: this.searchContentCommunities, lastSearchString: this.lastSearchStringCommunities, locatorScrollBar: this.locatorScrollbarCommunities });
            domAttr.set(this.imgSearchLoaderBuilding, "src", dojoConfig.baseURL + "/js/library/themes/images/loader.gif");
            domStyle.set(this.divAddressScrollContainerBuilding, "display", "none");
            domStyle.set(this.divAddressScrollContentBuilding, "display", "none");
            domAttr.set(this.imgSearchLoaderSites, "src", dojoConfig.baseURL + "/js/library/themes/images/loader.gif");
            domStyle.set(this.divAddressScrollContainerSites, "display", "none");
            domStyle.set(this.divAddressScrollContentSites, "display", "none");
            domAttr.set(this.imgSearchLoaderBusiness, "src", dojoConfig.baseURL + "/js/library/themes/images/loader.gif");
            domStyle.set(this.divAddressScrollContainerBusiness, "display", "none");
            domStyle.set(this.divAddressScrollContentBusiness, "display", "none");
            domAttr.set(this.imgSearchLoaderCommunities, "src", dojoConfig.baseURL + "/js/library/themes/images/loader.gif");
            domAttr.set(this.buildingContent, "innerHTML", dojo.configData.Workflows[0].Name);
            domAttr.set(this.buildingContent, "title", dojo.configData.Workflows[0].Name);
            domAttr.set(this.sitesContent, "innerHTML", dojo.configData.Workflows[1].Name);
            domAttr.set(this.sitesContent, "title", dojo.configData.Workflows[1].Name);
            domAttr.set(this.businessContent, "innerHTML", dojo.configData.Workflows[2].Name);
            domAttr.set(this.businessContent, "title", dojo.configData.Workflows[2].Name);
            domAttr.set(this.communitiesContent, "innerHTML", dojo.configData.Workflows[3].Name);
            domAttr.set(this.communitiesContent, "title", dojo.configData.Workflows[3].Name);
            domAttr.set(this.searchBuildingText, "innerHTML", sharedNls.titles.searchBuildingText);
            domAttr.set(this.closeBuilding, "title", sharedNls.tooltips.clearEntry);
            domAttr.set(this.esriCTimgLocateBuilding, "title", sharedNls.tooltips.search);
            domAttr.set(this.serachSiteText, "innerHTML", sharedNls.titles.serachSiteText);
            domAttr.set(this.closeSites, "title", sharedNls.tooltips.clearEntry);
            domAttr.set(this.esriCTimgLocateSites, "title", sharedNls.tooltips.search);
            domAttr.set(this.searchBusinessText, "innerHTML", sharedNls.titles.searchBusinessText);
            domAttr.set(this.closeBusiness, "title", sharedNls.tooltips.clearEntry);
            domAttr.set(this.esriCTimgLocateBusiness, "title", sharedNls.tooltips.search);
            domAttr.set(this.communityText, "innerHTML", sharedNls.titles.communityText);
            domAttr.set(this.closeCommunities, "title", sharedNls.tooltips.clearEntry);
            domAttr.set(this.esriCTimgLocateCommunities, "title", sharedNls.tooltips.search);
            domAttr.set(this.searchCommunityText, "innerHTML", sharedNls.titles.searchCommunityText);
            domStyle.set(this.divAddressScrollContainerCommunities, "display", "none");
            domStyle.set(this.divAddressScrollContentCommunities, "display", "none");
            this.own(on(this.domNode, "click", lang.hitch(this, function () {
                topic.publish("toggleWidget", "siteLocator");
                domStyle.set(this.applicationHeaderSearchContainer, "display", "block");
                this._showHideInfoRouteContainer();
            })));
            if (this.logoContainer) {
                domClass.add(this.logoContainer, "esriCTMapLogo");
            }
            this.own(on(this.esriCTsearchContainerBuilding, "click", lang.hitch(this, function () {
                this._showTab(this.esriCTsearchContainerBuilding, this.searchContentBuilding);
            })));

            this.own(on(this.esriCTsearchContainerSites, "click", lang.hitch(this, function () {
                this._showTab(this.esriCTsearchContainerSites, this.searchContentSites);
            })));

            this.own(on(this.esriCTsearchContainerBusiness, "click", lang.hitch(this, function () {
                this._showTab(this.esriCTsearchContainerBusiness, this.searchContentBusiness);
            })));

            this.own(on(this.esriCTsearchContainerCommunities, "click", lang.hitch(this, function () {
                this._showTab(this.esriCTsearchContainerCommunities, this.searchContentCommunities);
            })));
            this._showBusinessTab();

            this._searchCommunitySelectNames();

            this.own(on(this.ResultBusinessTab, "click", lang.hitch(this, function () {
                this._showBusinessTab();
            })));

            this.own(on(this.resultDemographicTab, "click", lang.hitch(this, function () {
                this._showDemographicInfoTab();
            })));
            this.own(on(this.selectSortOption, "change", lang.hitch(this, function (value) {
                this._selectionChangeForSort(value);
            })));

            this.own(on(this.rdoCommunityPlaceName, "click", lang.hitch(this, function (value) {
                domClass.add(this.divSearchCommunities, "esriCTDisabledAddressColorChange");
                domClass.add(this.txtAddressCommunities, "esriCTDisabledAddressColorChange");
                domClass.add(this.closeCommunities, "esriCTDisabledAddressColorChange");
                domClass.add(this.clearhideCommunities, "esriCTDisabledAddressColorChange");
                this.txtAddressCommunities.disabled = this.rdoCommunityPlaceName.checked;
                this.closeCommunities.disabled = this.rdoCommunityPlaceName.checked;
                this.divSearchCommunities.disabled = this.rdoCommunityPlaceName.checked;
                this.divSearchCommunities.disabled = this.rdoCommunityPlaceName.checked;
                domConstruct.empty(this.divAddressResultsCommunities);
                domStyle.set(this.divAddressScrollContainerCommunities, "display", "none");
                domStyle.set(this.divAddressScrollContentCommunities, "display", "none");
                this.comAreaList.disabled = !this.rdoCommunityPlaceName.checked;
                dojo.standerdGeoQueryAttribute = null;
            })));

            this.own(on(this.rdoCommunitiesAddressSearch, "click", lang.hitch(this, function (value) {
                this._communitiesSearchRadioButtonHandler(this.rdoCommunitiesAddressSearch);
            })));

            this.own(on(this.chkSerachContentBuilding, "click", lang.hitch(this, function (value) {
                this._buildingSearchButtonHandler(this.chkSerachContentBuilding);
            })));

            this.own(on(this.chksearchContentSites, "click", lang.hitch(this, function (value) {
                this._sitesSearchButtonHandler(this.chksearchContentSites);
            })));
            // dynamic UI for tab//
            this._createFilter(dojo.configData.Workflows[1].SearchSettings[0].FilterSettings.FilterRangeFields, this.sitesFromToMainDiv, 1);
            this._createFilterOptionField(dojo.configData.Workflows[1].SearchSettings[0].FilterSettings.RegularFilterOptionFields, this.horizantalruleSites, dojo.configData.Workflows[1].SearchSettings[0].FilterSettings.AdditionalFilterOptions, this.divHideOptionSites, 1);
            this._createFilter(dojo.configData.Workflows[0].SearchSettings[0].FilterSettings.FilterRangeFields, this.buildingAreaToFromDiv, 0);
            this._createFilterOptionField(dojo.configData.Workflows[0].SearchSettings[0].FilterSettings.RegularFilterOptionFields, this.horizantalruleBuliding, dojo.configData.Workflows[0].SearchSettings[0].FilterSettings.AdditionalFilterOptions, this.divHideOptionBuilding, 0);
            this._createFilter(dojo.configData.Workflows[2].FilterSettings.FilterRangeFields, this.revenueEmpFromToDiv, 2);
            // Extent change event for map
            this.map.on("extent-change", lang.hitch(this, function (evt) {
                if (this.map.getLayer("esriFeatureGraphicsLayer").graphics[0]) {
                    if (this.opeartionLayer && this.opeartionLayer.visibleAtMapScale && this.map.getLayer("esriFeatureGraphicsLayer").graphics[0].attributes.layerURL === this.opeartionLayer.url) {
                        this.map.getLayer("esriFeatureGraphicsLayer").graphics[0].show();
                    } else {
                        this.map.getLayer("esriFeatureGraphicsLayer").graphics[0].hide();
                    }
                }
            }));
            // check the shared URL for "addressMapPoint" to perform unified search
            if (window.location.toString().split("$addressMapPoint=").length > 1) {
                mapPoint = new Point(window.location.toString().split("$addressMapPoint=")[1].split("$")[0].split(",")[0], window.location.toString().split("$addressMapPoint=")[1].split("$")[0].split(",")[1], this.map.spatialReference);
                clearTimeout(timeOut);
                timeOut = setTimeout(lang.hitch(this, function () {
                    if (this.workflowCount === 3) {
                        topic.publish("geoLocation-Complete", mapPoint);
                    } else {
                        this.isSharedExtent = true;
                        this._locateAddressOnMap(mapPoint);
                    }
                }, 500));
            }
            // check the shared URL for "strGeoLocationMapPoint" to perform geolocation
            if (window.location.toString().split("$strGeoLocationMapPoint=").length > 1) {
                mapPoint = new Point(window.location.toString().split("$strGeoLocationMapPoint=")[1].split("$")[0].split(",")[0], window.location.toString().split("$strGeoLocationMapPoint=")[1].split("$")[0].split(",")[1], this.map.spatialReference);
                dojo.strGeoLocationMapPoint = window.location.toString().split("$strGeoLocationMapPoint=")[1].split("$")[0];
                this.addPushPin(mapPoint);
            }
            // check the shared URL for "standerdGeoQueryAttribute" to perform  standard geographic query(for defining area or location) in communities tab
            if (window.location.toString().split("$standerdGeoQueryAttribute=").length > 1) {
                standerdGeoAttribute = {};
                standerdGeoAttribute.attributes = {
                    CountryAbbr: window.location.toString().split("$standerdGeoQueryAttribute=")[1].split("$")[0].split(",")[0],
                    DataLayerID: window.location.toString().split("$standerdGeoQueryAttribute=")[1].split("$")[0].split(",")[1],
                    AreaID: window.location.toString().split("$standerdGeoQueryAttribute=")[1].split("$")[0].split(",")[2]
                };
                clearTimeout(timeOut);
                timeOut = setTimeout(lang.hitch(this, function () {
                    topic.publish("showProgressIndicator");
                    this.isSharedExtent = true;
                    this._enrichData(null, this.workflowCount, standerdGeoAttribute);
                }, 500));
            }
            // check the shared URL for "communitySelectionFeature" for setting communities tab control to disable or enable
            if (window.location.toString().split("$communitySelectionFeature=").length > 1) {
                clearTimeout(timeOut);
                timeOut = setTimeout(lang.hitch(this, function () {
                    this.isSharedExtent = true;
                    topic.publish("showProgressIndicator");
                    this.rdoCommunityPlaceName.checked = true;
                    domClass.add(this.divSearchCommunities, "esriCTDisabledAddressColorChange");
                    domClass.add(this.txtAddressCommunities, "esriCTDisabledAddressColorChange");
                    domClass.add(this.closeCommunities, "esriCTDisabledAddressColorChange");
                    domClass.add(this.clearhideCommunities, "esriCTDisabledAddressColorChange");
                    this.txtAddressCommunities.disabled = true;
                    this.closeCommunities.disabled = true;
                    this.divSearchCommunities.disabled = true;
                    this.divSearchCommunities.disabled = true;
                    domConstruct.empty(this.divAddressResultsCommunities);
                    domStyle.set(this.divAddressScrollContainerCommunities, "display", "none");
                    domStyle.set(this.divAddressScrollContentCommunities, "display", "none");
                }, 500));
            }
            // check the shared URL for "whereClause" and "addressMapPoint" to search various filter results in tab
            if (window.location.toString().split("$whereClause=").length > 1 && window.location.toString().split("$addressMapPoint=").length === 1) {
                clearTimeout(timeOut);
                timeOut = setTimeout(lang.hitch(this, function () {
                    topic.publish("showProgressIndicator");
                    this.doLayerQuery(this.workflowCount, null, window.location.href.toString().replace(/%20/g, " ").replace(/%27/g, "'").replace(/%3E/g, ">").replace(/%3C/g, "<").split("$whereClause=")[1].split("$")[0].toString().toString().replace(/PERCENT/g, "%"));
                }, 500));

            }
        },

        /**
        * create filter UI(dynamic) for buildings, sites and business tab based on configuration parameter
        * @param {array}
        * @param {containerNode}
        * @param {array} workflow index
        * @memberOf widgets/SiteLocator/SiteLocator
        */
        _createFilter: function (arrFilter, node, index) {
            //create UI for each value in arrFilter based on config parameter
            array.forEach(arrFilter, lang.hitch(this, function (value) {
                var divBusinessRevenue, leftDivSites, leftDivSitesContainer, checkBoxAreaSites, chkAreaSites, areaText, rightDivSites, spanTextFrom, spanTextFromDes, txtFrom, spanTextTo, spanTextToDes, txtTo, i;
                divBusinessRevenue = domConstruct.create("div", { "class": "esriCTDivFromTo" }, node);
                leftDivSitesContainer = domConstruct.create("div", { "class": "esriCTLeftFromTO" }, divBusinessRevenue);
                leftDivSites = domConstruct.create("div", { "class": "esriCTOptionRow" }, leftDivSitesContainer);
                checkBoxAreaSites = domConstruct.create("div", { "class": "esriCTCheckBox" }, leftDivSites);
                // if filter range fields in filter setting exist (based on config parameter) then create checkbox and label
                if (value.FieldName) {
                    chkAreaSites = domConstruct.create("input", { "type": "checkbox", "class": "esriCTChkBox", id: value.FieldName.toString() + index.toString(), "value": value.FieldName }, checkBoxAreaSites);
                    domConstruct.create("label", { "class": "css-label", "for": value.FieldName.toString() + index.toString() }, checkBoxAreaSites);
                } else {
                    chkAreaSites = domConstruct.create("input", { "type": "checkbox", "class": "esriCTChkBox", id: value.VariableNameSuffix.toString() + index.toString(), "value": value.VariableNameSuffix }, checkBoxAreaSites);
                    domConstruct.create("label", { "class": "css-label", "for": value.VariableNameSuffix.toString() + index.toString() }, checkBoxAreaSites);
                }
                areaText = domConstruct.create("div", { "class": "esriCTChkLabel" }, leftDivSites);
                rightDivSites = domConstruct.create("div", { "class": "esriCTRightFromTO" }, divBusinessRevenue);
                spanTextFrom = domConstruct.create("span", { "class": "esriCTText" }, rightDivSites);
                spanTextFromDes = domConstruct.create("span", {}, rightDivSites);
                txtFrom = domConstruct.create("input", { "type": "text", "class": "esriCTToTextBoxFrom", "maxlength": "15" }, spanTextFromDes);
                spanTextTo = domConstruct.create("span", { "class": "esriCTText" }, rightDivSites);
                spanTextToDes = domConstruct.create("span", {}, rightDivSites);
                txtTo = domConstruct.create("input", { "type": "text", "class": "esriCTToTextBoxTo", "maxlength": "15" }, spanTextToDes);
                domAttr.set(spanTextFrom, "innerHTML", sharedNls.titles.fromText);
                domAttr.set(spanTextTo, "innerHTML", sharedNls.titles.toText);
                domAttr.set(areaText, "innerHTML", value.DisplayText);
                if ((window.location.toString().split(value.FieldName).length > 2 || window.location.toString().split(value.VariableNameSuffix).length > 1) && !dojo.arrWhereClause[this.workflowCount] && Number(window.location.toString().split("$workflowCount=")[1].split("$")[0]) === index) {
                    chkAreaSites.checked = true;
                    if (value.FieldName) {
                        if (window.location.href.toString().replace(/%20/g, " ").replace(/%27/g, "'").replace(/%3E/g, ">").replace(/%3C/g, "<").split(value.FieldName + ">=")[1]) {
                            txtFrom.value = Number(window.location.href.toString().replace(/%20/g, " ").replace(/%27/g, "'").replace(/%3E/g, ">").replace(/%3C/g, "<").split(value.FieldName + ">=")[1].split(" ")[0]);
                            txtTo.value = Number(window.location.href.toString().replace(/%20/g, " ").replace(/%27/g, "'").replace(/%3E/g, ">").replace(/%3C/g, "<").split(value.FieldName + "<=")[1].split(" ")[0].split("$")[0]);
                        }
                    } else if (value.VariableNameSuffix) {
                        dojo.toFromBussinessFilter = window.location.href.toString().split("$toFromBussinessFilter=")[1];
                        for (i = 0; i < window.location.href.toString().split("$toFromBussinessFilter=")[1].split("$").length; i++) {
                            if (window.location.href.toString().split("$toFromBussinessFilter=")[1].split("$")[i].split(value.VariableNameSuffix).length > 1) {
                                txtFrom.value = Number(window.location.href.toString().split("$toFromBussinessFilter=")[1].split("$")[i].split(",")[1]);
                                txtTo.value = Number(window.location.href.toString().split("$toFromBussinessFilter=")[1].split("$")[i].split(",")[2]);
                            }
                        }
                    }
                    txtFrom.setAttribute("FieldValue", Number(txtFrom.value));
                    txtTo.setAttribute("FieldValue", Number(txtTo.value));
                } else {
                    txtFrom.disabled = true;
                    txtTo.disabled = true;
                    domClass.add(txtFrom, "esriCTDisabledAddressColorChange");
                    domClass.add(txtTo, "esriCTDisabledAddressColorChange");
                }

                // click event for FilterRangeFields in filter settings for building, sites and business tab
                this.own(on(chkAreaSites, "click", lang.hitch(this, function (value) {
                    txtFrom.disabled = !chkAreaSites.checked;
                    txtTo.disabled = !chkAreaSites.checked;
                    if (!chkAreaSites.checked) {
                        domClass.add(txtFrom, "esriCTDisabledAddressColorChange");
                        domClass.add(txtTo, "esriCTDisabledAddressColorChange");
                        if (this.workflowCount === 2) {
                            this._fromToDatachangeHandler(txtFrom, txtTo, chkAreaSites);
                            txtFrom.removeAttribute("FieldValue");
                            txtTo.removeAttribute("FieldValue");
                        } else {
                            this._fromToQuery(txtFrom, txtTo, chkAreaSites);
                        }
                        txtFrom.value = "";
                        txtTo.value = "";

                    } else {
                        domClass.remove(txtFrom, "esriCTDisabledAddressColorChange");
                        domClass.remove(txtTo, "esriCTDisabledAddressColorChange");
                    }
                })));
                // keydown event for "from" value of FilterRangeFields in filter settings for building, sites and business tab
                this.own(on(txtFrom, "keydown", lang.hitch(this, function (value) {
                    if (value.keyCode === dojo.keys.ENTER) {
                        // If workflow is 2(business) then set to and from value and pass it to fromToDatachangeHandler and get the filtered result
                        if (this.workflowCount === 2) {
                            txtFrom.setAttribute("FieldValue", Number(txtFrom.value));
                            txtTo.setAttribute("FieldValue", Number(txtTo.value));
                            this.selectSortOption.reset();
                            this._fromToDatachangeHandler(txtFrom, txtTo, chkAreaSites);
                        } else {
                            // If workflows are buildings and sites do fromToQuery and get the filtered result
                            if (this.workflowCount === 0) {
                                this.selectBusinessSortForBuilding.reset();
                                this.selectedValue = null;
                                dojo.sortingData = null;
                            } else {
                                this.selectBusinessSortForSites.reset();
                                this.selectedValue = null;
                                dojo.sortingData = null;
                            }
                            this._fromToQuery(txtFrom, txtTo, chkAreaSites);
                        }
                    }
                })));
                // keydown event for "to" value of FilterRangeFields in filter settings for building, sites and business tab
                this.own(on(txtTo, "keydown", lang.hitch(this, function (value) {
                    if (value.keyCode === dojo.keys.ENTER) {
                        // If workflow is business then set to and from value and pass it to fromToDatachangeHandler and get the filtered result
                        if (this.workflowCount === 2) {
                            txtFrom.setAttribute("FieldValue", Number(txtFrom.value));
                            txtTo.setAttribute("FieldValue", Number(txtTo.value));
                            this.selectSortOption.reset();
                            this._fromToDatachangeHandler(txtFrom, txtTo, chkAreaSites);
                        } else {
                            // if workflows are buildings and sites do fromToQuery and get the filtered result
                            if (this.workflowCount === 0) {
                                if (this.selectBusinessSortForBuilding) {
                                    this.selectBusinessSortForBuilding.set("value", sharedNls.titles.select);
                                    this.selectedValue = null;
                                    dojo.sortingData = null;
                                }
                            } else {
                                if (this.selectBusinessSortForSites) {
                                    this.selectBusinessSortForSites.set("value", sharedNls.titles.select);
                                    this.selectedValue = null;
                                    dojo.sortingData = null;
                                }
                            }
                            this._fromToQuery(txtFrom, txtTo, chkAreaSites);
                        }
                    }
                })));
            }));
        },

        /**
        * create UI(dynamic) of filter option field in buildings, sites and business tab based on config parameter
        * @param {array} number of fields
        * @param {container node} container node
        * @param {array} additional fields
        * @param {object} additional fields node
        * @param {array} workflow index
        * @memberOf widgets/SiteLocator/SiteLocator
        */
        _createFilterOptionField: function (arrFields, node, arrAdditionalFields, additionalFieldsNode, index) {
            var i, j, divBusinessRevenue, checkBoxWithText, divCheckBox, checkBox, fieldContent, showHideText, divHideOptionText, divAdditionalField, checkBoxAdditionalWithText, additionalFieldCheckBox, additionalCheckBox, additionalFieldDisplayText, isShowMoreOptionShared = false;
            // Check length of RegularFilterOptionFields from config and create UI
            for (i = 0; i < arrFields.length; i++) {
                divBusinessRevenue = domConstruct.create("div", { "class": "esriCTDivFilterOption" }, node);
                checkBoxWithText = domConstruct.create("div", { "class": "esriCTCheckBoxWithText" }, divBusinessRevenue);
                divCheckBox = domConstruct.create("div", { "class": "esriCTCheckBox" }, checkBoxWithText);
                checkBox = domConstruct.create("input", { "class": "esriCTChkBox", "type": "checkbox", "name": arrFields[i].FieldName.toString(), "id": arrFields[i].FieldName.toString() + index.toString(), "value": arrFields[i].FieldValue }, divCheckBox);
                domConstruct.create("label", { "class": "css-label", "for": arrFields[i].FieldName.toString() + index.toString() }, divCheckBox);
                if (window.location.toString().split(arrFields[i].FieldName).length > 1 && !dojo.arrWhereClause[this.workflowCount] && Number(window.location.toString().split("$workflowCount=")[1].split("$")[0]) === index) {
                    checkBox.checked = true;
                }
                divCheckBox.setAttribute("isRegularFilterOptionFields", true);
                fieldContent = domConstruct.create("div", { "class": "esriCTChkLabel" }, checkBoxWithText);
                domConstruct.create("div", { "class": "esriCTCheckBoxWithText" }, divBusinessRevenue);
                domAttr.set(fieldContent, "innerHTML", arrFields[i].DisplayText);
                this.own(on(checkBox, "click", lang.hitch(this, this.chkQueryHandler)));
            }
            // Check filter option is enable or disable(based on config parameter) in buildings and sites tab
            if (arrAdditionalFields.Enabled && arrAdditionalFields.FilterOptions.length) {
                showHideText = domConstruct.create("div", { "class": "esriCTshowhideText" }, node);
                divHideOptionText = domConstruct.create("div", { "class": "esriCTTextRight" }, showHideText);
                domAttr.set(divHideOptionText, "innerHTML", sharedNls.titles.hideText);
                this._showHideMoreOption(additionalFieldsNode, divHideOptionText, node);
                this.own(on(divHideOptionText, "click", lang.hitch(this, function (value) {
                    this._showHideMoreOption(additionalFieldsNode, divHideOptionText, node);
                })));
                this._isSharedDataAvailable = false;
                // Create additional filter options UI(dynamic) for configurable fields in buildings and sites tab
                for (j = 0; j < arrAdditionalFields.FilterOptions.length; j++) {
                    divAdditionalField = domConstruct.create("div", { "class": "esriCTDivAdditionalOpt" }, additionalFieldsNode);
                    checkBoxAdditionalWithText = domConstruct.create("div", { "class": "esriCTCheckBoxWithText" }, divAdditionalField);
                    additionalFieldCheckBox = domConstruct.create("div", { "class": "esriCTCheckBox" }, checkBoxAdditionalWithText);
                    additionalCheckBox = domConstruct.create("input", { "class": "esriCTChkBox", "type": "checkbox", "name": arrAdditionalFields.FilterFieldName, "id": arrAdditionalFields.FilterOptions[j].FieldValue.toString() + index.toString(), "value": arrAdditionalFields.FilterOptions[j].FieldValue }, additionalFieldCheckBox);
                    domConstruct.create("label", { "class": "css-label", "for": arrAdditionalFields.FilterOptions[j].FieldValue.toString() + index.toString() }, additionalFieldCheckBox);
                    if (window.location.toString().replace(/%20/g, " ").replace(/%27/g, "'").split("UPPER('PERCENT" + arrAdditionalFields.FilterOptions[j].FieldValue + "PERCENT')").length > 1 && Number(window.location.toString().split("$workflowCount=")[1].split("$")[0]) === index) {
                        additionalCheckBox.checked = true;
                        isShowMoreOptionShared = true;
                        this.chkQueryHandler(additionalCheckBox, false);
                        this._isSharedDataAvailable = true;
                    }
                    additionalFieldCheckBox.setAttribute("isRegularFilterOptionFields", false);
                    additionalFieldDisplayText = domConstruct.create("div", { "class": "esriCTChkLabel" }, checkBoxAdditionalWithText);
                    domAttr.set(additionalFieldDisplayText, "innerHTML", arrAdditionalFields.FilterOptions[j].DisplayText);
                    this.own(on(additionalCheckBox, "click", lang.hitch(this, this.chkQueryHandler)));
                }
                if (this._isSharedDataAvailable) {
                    this.chkQueryHandler(null, true);
                }
                // Execute when shared URL contain additional option fields, set show more options text and call the showHideMoreOption handler
                if (isShowMoreOptionShared) {
                    domAttr.set(divHideOptionText, "innerHTML", sharedNls.titles.showText);
                    this._showHideMoreOption(additionalFieldsNode, divHideOptionText, node);
                }
            } else {
                domClass.replace(node, "esriCTHorizantalruleHide", "esriCTHorizantalrule");
            }
        },

        /**
        * handler for geometry query in communities tab
        * @param {object} feature set(features)
        * @memberOf widgets/SiteLocator/SiteLocator
        */
        _geometryForSelectedArea: function (featureSet) {
            var i, arrPolygon = [], geometryService;
            geometryService = new GeometryService(dojo.configData.GeometryService.toString());
            // loop all features and store the geometry in array
            for (i = 0; i < featureSet.features.length; i++) {
                arrPolygon.push(featureSet.features[i].geometry);
            }
            // union of input geometries and call enrichData handler for communities tab and get the demographic data
            geometryService.union(arrPolygon, lang.hitch(this, function (geometry) {
                this._enrichData([geometry], 3, null);
            }), lang.hitch(this, function (Error) {
                topic.publish("hideProgressIndicator");
            }));
        },

        /**
        * drop down list for county name in communities tab(geometry provided by feature from layer)
        * @memberOf widgets/SiteLocator/SiteLocator
        */
        _searchCommunitySelectNames: function () {
            var queryCommunityNames;
            // use esriRequest method and service parameter to retrieve data from a web server.
            queryCommunityNames = esriRequest({
                url: dojo.configData.Workflows[3].FilterSettings.FilterLayer.LayerURL + "/query",
                content: {
                    f: "pjson",
                    where: '1 = 1',
                    returnGeometry: false,
                    returnDistinctValues: true,
                    outFields: JSON.stringify(dojo.configData.Workflows[3].FilterSettings.FilterLayer.OutFields)
                }
            });
            // success handler for communities county field
            queryCommunityNames.then(lang.hitch(this, this._showResultsearchCommunitySelectNames));
        },

        /**
        * create data provider for drop down in business tab
        * @param {array} list of available record for business tab
        * @memberOf widgets/SiteLocator/SiteLocator
        */
        _setSelectionOption: function (arrOption) {
            var k, arrOpt = [];
            // loop all array element and store it in array as key value
            for (k = 0; k < arrOption.length; k++) {
                if (arrOption.hasOwnProperty(k)) {
                    arrOpt.push({ "label": arrOption[k], "value": arrOption[k] });
                }
            }
            return arrOpt;
        },

        /**
        * selection change event handler for business sort options for business tab
        * @param {object} selected object
        * @memberOf widgets/SiteLocator/SiteLocator
        */
        _selectionChangeForSort: function (value) {
            var isSorted = false;
            dojo.businessSortData = value;
            if (this.currentBussinessData) {
                this.currentBussinessData.sort(lang.hitch(this, function (a, b) {
                    // a greater than b
                    if (a[value] > b[value]) {
                        isSorted = true;
                        return 1;
                    }
                    // a less than b
                    if (a[value] < b[value]) {
                        isSorted = true;
                        return -1;
                    }
                    // a must be equal to b
                    if (a[value] !== 0 && b[value] !== 0) {
                        isSorted = true;
                        return 0;
                    }
                }));
            }
            if (isSorted) {
                this.isSharedSort = true;
                this._setBusinessValues(this.currentBussinessData, this.mainResultDiv, this.enrichData);
            }
        },

        /**
        * validate the numeric text box control
        * @param {object} text change event
        * @memberOf widgets/SiteLocator/SiteLocator
        */
        _isOnlyNumbers: function (evt) {
            var charCode;
            if (!isNaN(evt.which)) {
                charCode = evt.which;
            } else {
                charCode = event.keyCode;
            }
            if (charCode > 31 && (charCode < 48 || charCode > 57)) {
                return false;
            }
            return true;
        },

        /**
        * get distance unit based on unit selection
        * @param {string} input distance unit
        * @memberOf widgets/SiteLocator/SiteLocator
        */
        _getDistanceUnit: function (strUnit) {
            var sliderUnitValue;
            if (strUnit.toLowerCase() === "miles") {
                sliderUnitValue = "UNIT_STATUTE_MILE";
            } else if (strUnit.toLowerCase() === "feet") {
                sliderUnitValue = "UNIT_FOOT";
            } else if (strUnit.toLowerCase() === "meters") {
                sliderUnitValue = "UNIT_METER";
            } else if (strUnit.toLowerCase() === "kilometers") {
                sliderUnitValue = "UNIT_KILOMETER";
            } else {
                sliderUnitValue = "UNIT_STATUTE_MILE";
            }
            return sliderUnitValue;
        },

        /**
        * create buffer based on specified geometry
        * @param {object} input geometry to be used to create buffer
        * @memberOf widgets/SiteLocator/SiteLocator
        */
        _createBuffer: function (geometry) {
            var sliderDistance, slider, selectedPanel, geometryService, params;
            topic.publish("showProgressIndicator");
            dojo.arrAddressMapPoint[this.workflowCount] = geometry.x + "," + geometry.y;
            if (document.activeElement) {
                document.activeElement.blur();
            }
            this.featureGeometry[this.workflowCount] = geometry;
            selectedPanel = query('.esriCTsearchContainerSitesSelected')[0];
            // set slider values for various workflows
            if (domClass.contains(selectedPanel, "esriCTsearchContainerBuilding")) {
                slider = dijit.byId("sliderhorizontalSliderContainerBuliding");
                sliderDistance = slider.value;
            } else if (domClass.contains(selectedPanel, "esriCTsearchContainerSites")) {
                slider = dijit.byId("sliderhorizontalSliderContainerSites");
                sliderDistance = slider.value;
            } else if (domClass.contains(selectedPanel, "esriCTsearchContainerBusiness")) {
                slider = dijit.byId("sliderhorizontalSliderContainerBusiness");
                sliderDistance = slider.value;
            } else {
                sliderDistance = slider.value;
            }
            geometryService = new GeometryService(dojo.configData.GeometryService);
            if (Math.round(sliderDistance) !== 0) {
                if (geometry && geometry.type === "point") {
                    //setup the buffer parameters
                    params = new BufferParameters();
                    params.distances = [Math.round(sliderDistance)];
                    params.bufferSpatialReference = this.map.spatialReference;
                    params.outSpatialReference = this.map.spatialReference;
                    params.geometries = [this.featureGeometry[this.workflowCount]];
                    params.unit = GeometryService[this.unitValues[this.workflowCount]];
                    geometryService.buffer(params, lang.hitch(this, function (geometries) {
                        this.lastGeometry[this.workflowCount] = geometries;
                        // for business tab clear all scrollbar and call enrich data handler
                        if (this.workflowCount === 2) {
                            if (this.DemoInfoMainScrollbar && this.businessTabScrollbar) {
                                this.DemoInfoMainScrollbar = null;
                                this.businessTabScrollbar = null;
                            } else if (this.businessTabScrollbar) {
                                this.businessTabScrollbar = null;
                            }
                            this._enrichData(geometries, this.workflowCount, null);
                        } else {
                            // for buildings and sites tab perform and/or query and get the results
                            if (this.workflowCount === 0) {
                                this._callAndOrQuery(this.queryArrayBuildingAND, this.queryArrayBuildingOR);
                            } else {
                                this._callAndOrQuery(this.queryArraySitesAND, this.queryArraySitesOR);
                            }
                        }
                    }));
                } else {
                    topic.publish("hideProgressIndicator");
                }
            } else {
                topic.publish("hideProgressIndicator");
                if (document.activeElement) {
                    document.activeElement.blur();
                }
                // clear buildings, sites and business tab data
                if (this.workflowCount === 0) {
                    domStyle.set(this.outerDivForPegination, "display", "none");
                    domConstruct.empty(this.outerResultContainerBuilding);
                    domConstruct.empty(this.attachmentOuterDiv);
                    delete this.buildingTabData;
                    this.siteLocatorScrollbarAttributeBuilding = null;
                } else if (this.workflowCount === 1) {
                    domStyle.set(this.outerDivForPeginationSites, "display", "none");
                    domConstruct.empty(this.outerResultContainerSites);
                    domConstruct.empty(this.attachmentOuterDivSites);
                    delete this.sitesTabData;
                    this.siteLocatorScrollbarSites = null;
                } else if (this.workflowCount === 2) {
                    this._clearBusinessData();
                }
                this.lastGeometry[this.workflowCount] = null;
                this.map.graphics.clear();
                this.map.getLayer("esriBufferGraphicsLayer").clear();
                alert(sharedNls.errorMessages.bufferSliderValue);
                this.isSharedExtent = false;
            }
        },

        /**
        * draw geometry shape on the map
        * @param {array} geometry to be shown on map
        * @memberOf widgets/SiteLocator/SiteLocator
        */
        showBuffer: function (bufferedGeometries) {
            var self, symbol;
            this.map.getLayer("esriBufferGraphicsLayer").clear();
            self = this;
            // set the simple fill symbol parameter
            symbol = new SimpleFillSymbol(
                SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(
                    SimpleLineSymbol.STYLE_SOLID,
                    new Color([parseInt(dojo.configData.BufferSymbology.LineSymbolColor.split(",")[0], 10), parseInt(dojo.configData.BufferSymbology.LineSymbolColor.split(",")[1], 10), parseInt(dojo.configData.BufferSymbology.LineSymbolColor.split(",")[2], 10), parseFloat(dojo.configData.BufferSymbology.LineSymbolTransparency.split(",")[0], 10)]),
                    2
                ),
                new Color([parseInt(dojo.configData.BufferSymbology.FillSymbolColor.split(",")[0], 10), parseInt(dojo.configData.BufferSymbology.FillSymbolColor.split(",")[1], 10), parseInt(dojo.configData.BufferSymbology.FillSymbolColor.split(",")[2], 10), parseFloat(dojo.configData.BufferSymbology.FillSymbolTransparency.split(",")[0], 10)])
            );
            // add buffer graphic layer on map
            array.forEach(bufferedGeometries, function (geometry) {
                var graphic = new Graphic(geometry, symbol);
                self.map.getLayer("esriBufferGraphicsLayer").add(graphic);
            });
            if (!this.isSharedExtent && bufferedGeometries) {
                this.map.setExtent(bufferedGeometries[0].getExtent(), true);
            }
            this.isSharedExtent = false;
        },

        /**
        * set default value of locator text box as specified in configuration file
        * @param {array} Locator settings specified in configuration file(dojo.configData.LocatorSettings.Locators)
        * @memberOf widgets/SiteLocator/SiteLocator
        */
        _setDefaultTextboxValue: function (txtAddressParam) {
            var locatorSettings;
            locatorSettings = dojo.configData.LocatorSettings;
            domAttr.set(txtAddressParam, "defaultAddress", locatorSettings.LocatorDefaultAddress);
        },

        /**
        * Show hide widget container
        * @memberOf widgets/SiteLocator/SiteLocator
        */
        _showHideInfoRouteContainer: function () {
            if (html.coords(this.applicationHeaderSearchContainer).h > 0) {
                /**
                * when user clicks on share icon in header panel, close the sharing panel if it is open
                */
                domClass.add(this.applicationHeaderSearchContainer, "esriCTZeroHeight");
                if (this.logoContainer) {
                    domClass.remove(this.logoContainer, "esriCTMapLogo");
                }
                domClass.replace(this.domNode, "esriCTHeaderSearch", "esriCTHeaderSearchSelected");
                domClass.replace(this.applicationHeaderSearchContainer, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                topic.publish("setMaxLegendLength");
            } else {
                /**
                * when user clicks on share icon in header panel, open the sharing panel if it is closed
                */
                domClass.remove(this.applicationHeaderSearchContainer, "esriCTZeroHeight");
                if (this.logoContainer) {
                    domClass.add(this.logoContainer, "esriCTMapLogo");
                }
                domClass.replace(this.domNode, "esriCTHeaderSearchSelected", "esriCTHeaderSearch");
                domClass.replace(this.applicationHeaderSearchContainer, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
            }
        },

        /**
        * Removing child element
        * @param {object} div for result.
        * @memberOf widgets/SiteLocator/SiteLocator
        */
        _removeChild: function (childElement) {
            if (childElement) {
                while (childElement.hasChildNodes()) {
                    if (childElement.lastChild) {
                        childElement.removeChild(childElement.lastChild);
                        if (childElement.firstChild !== null) {
                            childElement.removeChild(childElement.firstChild);
                        }
                    }
                }
            }
        }

    });
});
