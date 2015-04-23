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
    "../siteLocator/featureQuery"

], function (declare, domConstruct, on, topic, lang, array, domStyle, domAttr, dom, query, Locator, domClass, FeatureSet, domGeom, GeometryService, string, html, template, urlUtils, Query, QueryTask, Deferred, DeferredList, ScrollBar, Color, SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, Graphic, Point, registry, BufferParameters, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, GraphicsLayer, HorizontalSlider, SelectList, DropDownSelect, esriRequest, SpatialReference, number, Polygon, HorizontalRule, featureQuery) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, featureQuery], {

        /**
        * attach locator events
        * @param {object} Nodes and other variable for all workflows
        * @memberOf widgets/Sitelocator/UnifiedSearch
        */
        _attachLocatorEvents: function (obj) {
            this.own(on(obj.divSearch, "click", lang.hitch(this, function (evt) {
                domStyle.set(obj.imgSearchLoader, "display", "block");
                domStyle.set(obj.close, "display", "none");
                this._locateAddress(evt, obj);
            })));
            this.own(on(obj.txtAddress, "keyup", lang.hitch(this, function (evt) {
                domStyle.set(obj.close, "display", "block");
                this._submitAddress(evt, false, obj);
            })));
            this.own(on(obj.txtAddress, "paste", lang.hitch(this, function (evt) {
                domStyle.set(obj.close, "display", "block");
                this._submitAddress(evt, true, obj);
            })));
            this.own(on(obj.txtAddress, "cut", lang.hitch(this, function (evt) {
                domStyle.set(obj.close, "display", "block");
                this._submitAddress(evt, true, obj);
            })));
            this.own(on(obj.txtAddress, "dblclick", lang.hitch(this, function (evt) {
                this._clearDefaultText(evt, obj);
            })));
            this.own(on(obj.txtAddress, "blur", lang.hitch(this, function (evt) {
                this._replaceDefaultText(evt, obj);
            })));
            this.own(on(obj.txtAddress, "focus", lang.hitch(this, function () {
                if (domStyle.get(obj.imgSearchLoader, "display") !== "block") {
                    domStyle.set(obj.close, "display", "block");
                }
                domClass.add(obj.txtAddress, "esriCTColorChange");
            })));
            this.own(on(obj.close, "click", lang.hitch(this, function () {
                this._hideText(obj);
            })));

            topic.subscribe("geoLocation-Complete", lang.hitch(this, function (mapPoint) {
                if (this.workflowCount === obj.addressWorkflowCount) {
                    if (this.workflowCount === 0) {
                        this.chkSerachContentBuilding.checked = true;
                        this._buildingSearchButtonHandler(this.chkSerachContentBuilding);
                        this._getBackToTab(query(".esriCTAttachmentOuterDiv")[this.workflowCount], query(".esriCTMainDivBuilding")[0]);
                    } else if (this.workflowCount === 1) {
                        this.chksearchContentSites.checked = true;
                        this._sitesSearchButtonHandler(this.chksearchContentSites);
                        this._getBackToTab(query(".esriCTAttachmentOuterDiv")[this.workflowCount], query(".esriCTMainDivSites")[0]);
                    } else if (this.workflowCount === 3) {
                        this.rdoCommunitiesAddressSearch.checked = true;
                        this._communitiesSearchRadioButtonHandler(this.rdoCommunitiesAddressSearch);
                    }
                    if (html.coords(this.applicationHeaderSearchContainer).h > 0) {
                        dojo.arrAddressMapPoint[this.workflowCount] = mapPoint.x + "," + mapPoint.y;
                        this._geoLocationQuery(obj, mapPoint);
                        dojo.strGeoLocationMapPoint = null;

                    } else {
                        topic.publish("hideProgressIndicator");
                        dojo.strGeoLocationMapPoint = mapPoint.x + "," + mapPoint.y;
                    }
                }
            }));
        },

        /**
        * perform query on GeoLocation
        * @param {object} Nodes and other variable for all workflows
        * @param {object} Geolocation MapPoint
        * @memberOf widgets/Sitelocator/UnifiedSearch
        */
        _geoLocationQuery: function (obj, mapPoint) {
            var locator;
            locator = new Locator(dojo.configData.LocatorSettings.LocatorURL);
            locator.locationToAddress(mapPoint, 100);
            locator.on("location-to-address-complete", lang.hitch(this, function (evt) {
                if (evt.address.address) {
                    domAttr.set(obj.txtAddress, "defaultAddress", evt.address.address.Address);
                    domAttr.set(obj.txtAddress, "value", evt.address.address.Address);
                    domConstruct.empty(obj.divAddressResults, obj.divAddressScrollContent);
                    domStyle.set(obj.divAddressScrollContainer, "display", "none");
                    domStyle.set(obj.divAddressScrollContent, "display", "none");
                    this.featureGeometry[this.workflowCount] = mapPoint;
                    this.addPushPin(this.featureGeometry[this.workflowCount]);
                    if (this.workflowCount === 3) {
                        topic.publish("showProgressIndicator");
                        this._enrichData([mapPoint], this.workflowCount, null);
                    } else {
                        this._createBuffer(mapPoint);
                    }
                    dojo.arrStrAdderss[this.workflowCount] = evt.address.address.Address;

                }
            }));
            locator.on("error", function (error) {
                alert(error.error.details[0]);
            });

        },

        /**
        * perform search by address if search type is address search
        * @param {object} evt Click event
        * @param {object} Nodes and other variable for all workflows
        * @memberOf widgets/Sitelocator/UnifiedSearch
        */
        _locateAddress: function (evt, obj) {
            domConstruct.empty(obj.divAddressResults);
            if (lang.trim(obj.txtAddress.value) === '') {
                domStyle.set(obj.imgSearchLoader, "display", "none");
                domStyle.set(obj.close, "display", "block");
                domStyle.set(obj.divAddressScrollContainer, "display", "none");
                domStyle.set(obj.divAddressScrollContent, "display", "none");
            } else {
                if (obj.checkBox.checked) {
                    if (obj.addressWorkflowCount === 3) {
                        this._standardGeoQuery(obj);
                    } else {
                        this._searchLocation(obj);
                    }
                } else {
                    domStyle.set(obj.imgSearchLoader, "display", "none");
                    domStyle.set(obj.close, "display", "block");
                    domStyle.set(obj.divAddressScrollContainer, "display", "none");
                    domStyle.set(obj.divAddressScrollContent, "display", "none");
                }
            }
        },

        /**
        * perform search by address if search type is address search
        * @param {object} Nodes and other variable for all workflows
        * @memberOf widgets/Sitelocator/UnifiedSearch
        */
        _searchLocation: function (obj) {
            var nameArray, locatorSettings, locator, searchFieldName, addressField, baseMapExtent, options, searchFields, addressFieldValues, addressFieldName, s, deferredArray, locatorDef, deferred, resultLength, deferredListResult, index;
            nameArray = { Address: [] };
            domStyle.set(obj.imgSearchLoader, "display", "block");
            domStyle.set(obj.close, "display", "none");
            domAttr.set(obj.txtAddress, "defaultAddress", obj.txtAddress.value);

            /**
            * call locator service specified in configuration file
            */
            locatorSettings = dojo.configData.LocatorSettings;
            locator = new Locator(locatorSettings.LocatorURL);
            searchFieldName = locatorSettings.LocatorParameters.SearchField;
            addressField = {};
            addressField[searchFieldName] = lang.trim(obj.txtAddress.value);
            if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length !== 0) {
                baseMapExtent = this.map.getLayer(this.map.layerIds[0]).fullExtent;
            } else {
                baseMapExtent = this.map.getLayer(this.map.basemapLayerIds[0]).fullExtent;
            }
            options = {};
            options.address = addressField;
            options.outFields = locatorSettings.LocatorOutFields;
            options[locatorSettings.LocatorParameters.SearchBoundaryField] = baseMapExtent;
            locator.outSpatialReference = this.map.spatialReference;
            searchFields = [];
            addressFieldValues = dojo.configData.LocatorSettings.LocatorFilterFieldValues; //*****pass config seting based on tab selection******//
            addressFieldName = dojo.configData.LocatorSettings.LocatorFilterFieldName.toString();
            for (s in addressFieldValues) {
                if (addressFieldValues.hasOwnProperty(s)) {
                    searchFields.push(addressFieldValues[s]);
                }
            }

            /**
            * get results from locator service
            * @param {object} options Contains address, outFields and basemap extent for locator service
            * @param {object} candidates Contains results from locator service
            * @memberOf widgets/Sitelocator/UnifiedSearch
            */
            deferredArray = [];
            if (dojo.configData.Workflows[this.workflowCount].SearchSettings) {
                for (index = 0; index < dojo.configData.Workflows[this.workflowCount].SearchSettings.length; index++) {
                    this._locateLayersearchResult(deferredArray, dojo.configData.Workflows[this.workflowCount].SearchSettings[index], obj);
                }
            }
            locatorDef = locator.addressToLocations(options);
            locator.on("address-to-locations-complete", lang.hitch(this, function (candidates) {
                deferred = new Deferred();
                deferred.resolve(candidates);
                return deferred.promise;
            }), function () {
                domStyle.set(obj.imgSearchLoader, "display", "none");
                domStyle.set(obj.close, "display", "block");
                this._locatorErrBack(obj);
            });
            deferredArray.push(locatorDef);
            deferredListResult = new DeferredList(deferredArray);
            deferredListResult.then(lang.hitch(this, function (result) {
                var num, i, key, order, resultAttributes;
                domStyle.set(obj.divAddressScrollContainer, "display", "block");
                domStyle.set(obj.divAddressScrollContent, "display", "block");
                if (result) {
                    if (result.length > 0) {
                        for (num = 0; num < result.length; num++) {
                            if (dojo.configData.Workflows[this.workflowCount].SearchSettings && dojo.configData.Workflows[this.workflowCount].SearchSettings[num]) {
                                key = dojo.configData.Workflows[this.workflowCount].SearchSettings[num].SearchDisplayTitle;
                                nameArray[key] = [];
                                for (order = 0; order < result[num][1].features.length; order++) {
                                    resultAttributes = result[num][1].features[order].attributes;
                                    for (i in resultAttributes) {
                                        if (resultAttributes.hasOwnProperty(i)) {
                                            if (!resultAttributes[i]) {
                                                resultAttributes[i] = sharedNls.showNullValue;
                                            }
                                        }
                                    }
                                    if (nameArray[key].length < dojo.configData.LocatorSettings.MaxResults) {
                                        nameArray[key].push({
                                            name: string.substitute(dojo.configData.Workflows[this.workflowCount].SearchSettings[num].SearchDisplayFields, result[num][1].features[order].attributes),
                                            attributes: resultAttributes,
                                            fields: result[num][1].fields,
                                            layer: dojo.configData.Workflows[this.workflowCount].SearchSettings[num],
                                            geometry: result[num][1].features[order].geometry
                                        });
                                    }
                                }
                            } else {
                                this._addressResult(result[num][1], nameArray, searchFields, addressFieldName);
                            }
                            if (result[num][1].length) {
                                resultLength = result[num][1].length;
                            }
                        }
                        this._showLocatedAddress(nameArray, resultLength, obj);
                    }
                } else {
                    this._locatorErrorHandler(obj);
                }
            }));
        },

        /**
        * query layer for searched result
        * @param {array} deferred array to push query result
        * @param {object} an instance of services
        * @memberOf widgets/locator/locatorSetting
        * @memberOf widgets/Sitelocator/UnifiedSearch
        */
        _locateLayersearchResult: function (deferredArray, layerobject, obj) {
            var queryTask, queryLayer, queryTaskResult, deferred;
            domStyle.set(obj.imgSearchLoader, "display", "block");
            domStyle.set(obj.close, "display", "none");
            if (layerobject.QueryURL) {
                queryTask = new QueryTask(layerobject.QueryURL);
                queryLayer = new Query();
                queryLayer.where = string.substitute(layerobject.SearchExpression, [lang.trim(obj.txtAddress.value).toUpperCase()]);
                queryLayer.outSpatialReference = this.map.spatialReference;
                queryLayer.returnGeometry = true;
                queryLayer.maxAllowableOffset = 100;
                queryLayer.outFields = ["*"];
                queryTaskResult = queryTask.execute(queryLayer, lang.hitch(this, function (featureSet) {
                    deferred = new Deferred();
                    deferred.resolve(featureSet);
                    return deferred.promise;
                }), function (err) {
                    alert(err.message);
                });
                deferredArray.push(queryTaskResult);
            }
        },

        /**
        * Search error handler
        * @param {object} Nodes and other variable for all workflows
        * @memberOf widgets/Sitelocator/UnifiedSearch
        */
        _locatorErrorHandler: function (obj) {
            domStyle.set(obj.imgSearchLoader, "display", "none");
            domStyle.set(obj.close, "display", "block");
            this.mapPoint = null;
            this._locatorErrBack(obj);
        },

        /**
        * filter valid results from results returned by locator service
        * @param {object} candidates Contains results from locator service
        * @memberOf widgets/Sitelocator/UnifiedSearch
        */
        _showLocatedAddress: function (candidates, resultLength, obj) {
            var addrListCount = 0, addrList = [], divAddressSearchCell, candidateArray, divAddressCounty, candidate, listContainer, i, candidateName, isCandidate;
            domConstruct.empty(obj.divAddressResults);
            if (lang.trim(obj.txtAddress.value) === "") {
                obj.txtAddress.focus();
                domConstruct.empty(obj.divAddressResults);
                obj.locatorScrollbar = new ScrollBar({ domNode: obj.divAddressScrollContent });
                obj.locatorScrollbar.setContent(obj.divAddressResults);
                obj.locatorScrollbar.createScrollBar();
                domStyle.set(obj.imgSearchLoader, "display", "none");
                domStyle.set(obj.close, "display", "block");
                return;
            }

            /**
            * display all the located address in the address container
            * 'this.divAddressResults' div dom element contains located addresses, created in widget template
            * @memberOf widgets/Sitelocator/UnifiedSearch
            */
            if (obj.locatorScrollbar) {
                domClass.add(obj.locatorScrollbar._scrollBarContent, "esriCTZeroHeight");
                obj.locatorScrollbar.removeScrollBar();
            }
            domStyle.set(obj.divAddressScrollContainer, "display", "block");
            domStyle.set(obj.divAddressScrollContent, "display", "block");
            obj.locatorScrollbar = new ScrollBar({ domNode: obj.divAddressScrollContent });
            obj.locatorScrollbar.setContent(obj.divAddressResults);
            obj.locatorScrollbar.createScrollBar();
            if (resultLength > 0) {
                isCandidate = false;
                for (candidateArray in candidates) {
                    if (candidates.hasOwnProperty(candidateArray)) {
                        if (!isCandidate) {
                            candidateName = dojo.configData.LocatorSettings.DisplayText;
                        } else {
                            candidateName = candidateArray;
                        }
                        if (candidates[candidateArray].length > 0) {
                            isCandidate = true;
                            divAddressCounty = domConstruct.create("div", { "class": "esriCTSearchGroupRow esriCTBottomBorder esriCTResultColor esriCTCursorPointer esriCTAddressCounty" }, obj.divAddressResults);
                            divAddressSearchCell = domConstruct.create("div", { "class": "esriCTSearchGroupCell" }, divAddressCounty);
                            candidate = candidateName + " (" + candidates[candidateArray].length + ")";
                            domConstruct.create("div", { "innerHTML": "+", "class": "esriCTPlusMinus" }, divAddressSearchCell);
                            domConstruct.create("div", { "innerHTML": candidate, "class": "esriCTGroupList" }, divAddressSearchCell);
                            domStyle.set(obj.imgSearchLoader, "display", "none");
                            domStyle.set(obj.close, "display", "block");
                            addrList.push(divAddressSearchCell);
                            this._toggleAddressList(addrList, addrListCount, obj);
                            addrListCount++;
                            listContainer = domConstruct.create("div", { "class": "listContainer esriCTHideAddressList" }, obj.divAddressResults);
                            for (i = 0; i < candidates[candidateArray].length; i++) {
                                this._displayValidLocations(candidates[candidateArray][i], i, candidates[candidateArray], listContainer, obj);
                            }
                        }
                    }
                }
            } else {
                this._locatorErrorHandler(obj);
            }
        },

        /**
        * perform search by address if search type is address search
        * @param {array} array of address
        * @param {number} count of address in address list
        * @param {object} Nodes and other variable for all workflows
        * @memberOf widgets/Sitelocator/UnifiedSearch
        */
        _toggleAddressList: function (addressList, idx, obj) {
            on(addressList[idx], "click", function () {
                var listStatusSymbol, outputContainer, plusMinusContainer;
                outputContainer = query(".listContainer", this.parentElement.parentElement)[idx];
                plusMinusContainer = query(".esriCTPlusMinus", this.parentElement.parentElement)[idx];
                if (outputContainer && plusMinusContainer) {
                    if (domClass.contains(outputContainer, "esriCTShowAddressList")) {
                        domClass.toggle(outputContainer, "esriCTShowAddressList");
                        listStatusSymbol = (domAttr.get(plusMinusContainer, "innerHTML") === "+") ? "-" : "+";
                        domAttr.set(plusMinusContainer, "innerHTML", listStatusSymbol);
                        obj.locatorScrollbar.resetScrollBar();
                        return;
                    }
                    domClass.add(outputContainer, "esriCTShowAddressList");
                    domAttr.set(plusMinusContainer, "innerHTML", "-");
                    obj.locatorScrollbar.resetScrollBar();
                }
            });
        },

        /**
        * search address on every key press
        * @param {object} evt Keyup event
        * @param {string} locator text
        * @param {object} Nodes and other variable for all workflows
        * @memberOf widgets/Sitelocator/UnifiedSearch
        */
        _submitAddress: function (evt, locatorText, obj) {
            if (locatorText) {
                setTimeout(lang.hitch(this, function () {
                    if (obj.locatorScrollbar) {
                        domClass.add(obj.locatorScrollbar._scrollBarContent, "esriCTZeroHeight");
                        obj.locatorScrollbar.removeScrollBar();
                    }
                    this._locateAddress(evt, obj);
                }), 100);
                return;
            }
            if (evt) {
                if (evt.keyCode === dojo.keys.ENTER) {
                    if (obj.txtAddress.value !== '') {
                        domStyle.set(obj.imgSearchLoader, "display", "block");
                        domStyle.set(obj.close, "display", "none");
                        this._locateAddress(evt, obj);
                        return;
                    }
                }

                /**
                * do not perform auto complete search if alphabets,
                * numbers,numpad keys,comma,ctl+v,ctrl +x,delete or
                * backspace is pressed
                */
                if ((!((evt.keyCode >= 46 && evt.keyCode < 58) || (evt.keyCode > 64 && evt.keyCode < 91) || (evt.keyCode > 95 && evt.keyCode < 106) || evt.keyCode === 8 || evt.keyCode === 110 || evt.keyCode === 188)) || (evt.keyCode === 86 && evt.ctrlKey) || (evt.keyCode === 88 && evt.ctrlKey)) {
                    evt.cancelBubble = true;
                    if (evt.stopPropagation) {
                        evt.stopPropagation();
                    }
                    domStyle.set(obj.imgSearchLoader, "display", "none");
                    domStyle.set(obj.close, "display", "block");
                    return;
                }

                /**
                * call locator service if search text is not empty
                */
                domStyle.set(obj.imgSearchLoader, "display", "block");
                domStyle.set(obj.close, "display", "none");
                if (domGeom.getMarginBox(obj.searchContent).h >= 0) {
                    if (lang.trim(obj.txtAddress.value) !== '') {
                        if (obj.lastSearchString !== lang.trim(obj.txtAddress.value)) {
                            obj.lastSearchString = lang.trim(obj.txtAddress.value);
                            domConstruct.empty(obj.divAddressResults);

                            /**
                            * clear any staged search
                            */
                            clearTimeout(this.stagedSearch);
                            if (lang.trim(obj.txtAddress.value).length > 0) {

                                /**
                                * stage a new search, which will launch if no new searches show up
                                * before the timeout
                                */
                                this.stagedSearch = setTimeout(lang.hitch(this, function () {

                                    this.stagedSearch = this._locateAddress(evt, obj);
                                }), 500);
                            }
                        } else {
                            domStyle.set(obj.imgSearchLoader, "display", "none");
                            domStyle.set(obj.close, "display", "block");
                        }
                    } else {
                        obj.lastSearchString = lang.trim(obj.txtAddress.value);
                        domStyle.set(obj.imgSearchLoader, "display", "none");
                        domStyle.set(obj.close, "display", "block");
                        domConstruct.empty(obj.divAddressResults);
                    }
                }
            }
        },

        /**
        * perform search by address if search type is address search
        * @param {object} address candidate
        * @param {number} index of address
        * @param {array} array of candidate address
        * @param {object} container node
        * @param {object} Nodes and other variable for all workflows
        * @memberOf widgets/Sitelocator/UnifiedSearch
        */
        _displayValidLocations: function (candidate, index, candidateArray, listContainer, obj) {
            var _this = this, candidateDate, esriCTSearchList;
            esriCTSearchList = domConstruct.create("div", { "class": "esriCTSearchListPanel" }, listContainer);
            candidateDate = domConstruct.create("div", { "class": "esriCTContentBottomBorder esriCTCursorPointer" }, esriCTSearchList);
            domAttr.set(candidateDate, "index", index);
            try {
                if (candidate.name) {
                    domAttr.set(candidateDate, "innerHTML", candidate.name);
                } else {
                    domAttr.set(candidateDate, "innerHTML", candidate);
                }
                if (candidate.attributes.location) {
                    domAttr.set(candidateDate, "x", candidate.attributes.location.x);
                    domAttr.set(candidateDate, "y", candidate.attributes.location.y);
                    domAttr.set(candidateDate, "address", string.substitute(dojo.configData.LocatorSettings.DisplayField, candidate.attributes.attributes));
                }
            } catch (err) {
                alert(sharedNls.errorMessages.falseConfigParams);
            }
            candidateDate.onclick = function () {
                topic.publish("showProgressIndicator");
                if (obj.addressWorkflowCount === 3) {
                    domConstruct.empty(obj.divAddressResults);
                    _this.txtAddressCommunities.value = candidate.name;
                    dojo.arrStrAdderss[obj.addressWorkflowCount] = lang.trim(_this.txtAddressCommunities.value);
                    domStyle.set(obj.divAddressScrollContainer, "display", "none");
                    domStyle.set(obj.divAddressScrollContent, "display", "none");
                    _this._enrichData(null, obj.addressWorkflowCount, candidate);
                } else {
                    if (_this.map.infoWindow) {
                        _this.map.infoWindow.hide();
                    }
                    obj.txtAddress.value = this.innerHTML;
                    domAttr.set(obj.txtAddress, "defaultAddress", obj.txtAddress.value);
                    if (candidate.attributes.location) {
                        _this.mapPoint = new Point(domAttr.get(this, "x"), domAttr.get(this, "y"), _this.map.spatialReference);
                        _this._locateAddressOnMap(_this.mapPoint, obj);
                    } else if (candidate.geometry) {
                        _this.mapPoint = new Point(candidate.geometry.x, candidate.geometry.y, _this.map.spatialReference);
                        _this._locateAddressOnMap(_this.mapPoint, obj);
                    }
                }
            };
        },

        /**
        * perform search by address if search type is address search
        * @param {object} Map point
        * @param {object} Nodes and other variable for all workflows
        * @memberOf widgets/Sitelocator/UnifiedSearch
        */
        _locateAddressOnMap: function (mapPoint, obj) {
            var geoLocationPushpin, locatorMarkupSymbol, graphic;
            if (!this.isSharedExtent) {
                this.map.centerAt(mapPoint);
            }
            geoLocationPushpin = dojoConfig.baseURL + dojo.configData.LocatorSettings.DefaultLocatorSymbol;
            locatorMarkupSymbol = new esri.symbol.PictureMarkerSymbol(geoLocationPushpin, dojo.configData.LocatorSettings.MarkupSymbolSize.width, dojo.configData.LocatorSettings.MarkupSymbolSize.height);
            graphic = new esri.Graphic(mapPoint, locatorMarkupSymbol, {}, null);
            this.map.getLayer("esriFeatureGraphicsLayer").clear();
            this.map.getLayer("esriGraphicsLayerMapSettings").clear();
            this.map.getLayer("esriGraphicsLayerMapSettings").add(graphic);
            topic.publish("hideProgressIndicator");
            if (obj) {
                obj.lastSearchString = lang.trim(obj.txtAddress.value);
                dojo.arrStrAdderss[this.workflowCount] = obj.lastSearchString;
                domConstruct.empty(obj.divAddressResults, obj.divAddressScrollContent);
                domStyle.set(obj.divAddressScrollContainer, "display", "none");
                domStyle.set(obj.divAddressScrollContent, "display", "none");
            }
            this._createBuffer(mapPoint);

        },

        /**
        * display error message if locator service fails or does not return any results
        * @param {object} Nodes and other variable for all workflows
        * @memberOf widgets/siteLocator/UnifiedSearch
        */
        _locatorErrBack: function (obj) {
            var errorAddressCounty;
            domStyle.set(obj.divAddressScrollContainer, "display", "block");
            domStyle.set(obj.divAddressScrollContent, "display", "block");
            domConstruct.empty(obj.divAddressResults);
            domStyle.set(obj.imgSearchLoader, "display", "none");
            domStyle.set(obj.close, "display", "block");
            errorAddressCounty = domConstruct.create("div", { "class": "esriCTBottomBorder esriCTAddressCounty" }, obj.divAddressResults);
            domAttr.set(errorAddressCounty, "innerHTML", sharedNls.errorMessages.invalidSearch);
        },

        /**
        * clear default value from search textbox
        * @param {object} evt Dblclick event
        * @memberOf widgets/Sitelocator/UnifiedSearch
        */
        _clearDefaultText: function (evt, obj) {
            var target = window.event ? window.event.srcElement : evt ? evt.target : null;
            if (!target) {
                return;
            }
            target.style.color = "#FFF";
            target.value = '';
            obj.txtAddress.value = "";
            domAttr.set(obj.txtAddress, "defaultAddress", obj.txtAddress.value);
        },

        /**
        * set default value to search textbox
        * @param {object} evt Blur event
        * @memberOf widgets/Sitelocator/UnifiedSearch
        */
        _replaceDefaultText: function (evt, obj) {
            var target = window.event ? window.event.srcElement : evt ? evt.target : null;
            if (!target) {
                return;
            }
            this._resetTargetValue(target, "defaultAddress", obj);
        },

        /**
        * adress result handler for unified search
        * @param {object} Address candidate
        * @param {array} array of address name
        * @param {array} search fields
        * @param {string} address field name
        * @memberOf widgets/Sitelocator/UnifiedSearch
        */
        _addressResult: function (candidates, nameArray, searchFields, addressFieldName) {
            var order, j;
            for (order = 0; order < candidates.length; order++) {
                if (candidates[order].attributes[dojo.configData.LocatorSettings.AddressMatchScore.Field] > dojo.configData.LocatorSettings.AddressMatchScore.Value) {
                    for (j in searchFields) {
                        if (searchFields.hasOwnProperty(j)) {
                            if (candidates[order].attributes[addressFieldName] === searchFields[j]) {
                                if (nameArray.Address.length < dojo.configData.LocatorSettings.MaxResults) {
                                    nameArray.Address.push({
                                        name: string.substitute(dojo.configData.LocatorSettings.DisplayField, candidates[order].attributes),
                                        attributes: candidates[order]
                                    });
                                }
                            }
                        }
                    }
                }
            }
        },

        /**
        * reset target value for unified search
        * @param {object} target
        * @param {object} title
        * @param {object} obj
        * @memberOf widgets/Sitelocator/UnifiedSearch
        */
        _resetTargetValue: function (target, title, obj) {
            if (target.value === '' && domAttr.get(target, title)) {
                target.value = target.title;
                if (target.title === "") {
                    target.value = domAttr.get(target, title);
                }
            }
            if (domClass.contains(target, "esriCTColorChange")) {
                domClass.remove(target, "esriCTColorChange");
            }
            domClass.add(target, "esriCTBlurColorChange");
            obj.lastSearchString = lang.trim(obj.txtAddress.value);
        },

        /**
        * hide text for unified search
        * @param {object} obj
        * @memberOf widgets/Sitelocator/UnifiedSearch
        */
        _hideText: function (obj) {
            if (obj.checkBox.checked) {
                obj.txtAddress.value = "";
                obj.lastSearchString = lang.trim(obj.txtAddress.value);
                domConstruct.empty(obj.divAddressResults, obj.divAddressScrollContent);
                domAttr.set(obj.txtAddress, "defaultAddress", obj.txtAddress.value);
                domStyle.set(obj.divAddressScrollContainer, "display", "none");
                domStyle.set(obj.divAddressScrollContent, "display", "none");
                if (obj.locatorScrollbar) {
                    domClass.add(obj.locatorScrollbar._scrollBarContent, "esriCTZeroHeight");
                    obj.locatorScrollbar.removeScrollBar();
                }
                this._resizeBuildingAndSites();
            }
        },

        /**
        * Standard geometry query using enrichment service
        * @param {object} Node and other variables
        * @memberOf widgets/Sitelocator/UnifiedSearch
        */
        _standardGeoQuery: function (obj) {
            var standardGeoQueryURL, standardGeoQueryRequest, arrResult = [];
            domConstruct.empty(this.communityMainDiv);
            domStyle.set(obj.imgSearchLoader, "display", "block");
            domStyle.set(obj.close, "display", "none");
            domAttr.set(obj.txtAddress, "defaultAddress", obj.txtAddress.value);
            standardGeoQueryURL = dojo.configData.GeoEnrichmentService + "/StandardGeographyQuery/execute";
            standardGeoQueryRequest = esriRequest({
                url: standardGeoQueryURL,
                content: {
                    f: "pjson",
                    inSR: this.map.spatialReference.wkid,
                    outSR: this.map.spatialReference.wkid,
                    geographyQuery: lang.trim(obj.txtAddress.value) + "*",
                    sourceCountry: dojo.configData.Workflows[obj.addressWorkflowCount].FilterSettings.StandardGeographyQuery.SourceCountry,
                    featureLimit: dojo.configData.Workflows[obj.addressWorkflowCount].FilterSettings.StandardGeographyQuery.FeatureLimit
                },
                handleAs: "json"
            });
            standardGeoQueryRequest.then(lang.hitch(this, function (data) {
                var i;
                arrResult.Address = [];
                for (i = 0; i < data.results[0].value.features.length; i++) {
                    arrResult.Address.push({
                        attributes: data.results[0].value.features[i].attributes,
                        name: data.results[0].value.features[i].attributes.AreaName + ", " + data.results[0].value.features[i].attributes.MajorSubdivisionAbbr
                    });
                }
                this._showLocatedAddress(arrResult, arrResult.Address.length, obj);
            }), function (error) {
                alert(error.message);
            });
        }
    });
});
