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
    "../siteLocator/geoEnrichment"

], function (declare, domConstruct, on, topic, lang, array, domStyle, domAttr, dom, query, Locator, domClass, FeatureSet, domGeom, GeometryService, string, html, template, urlUtils, Query, QueryTask, Deferred, DeferredList, ScrollBar, Color, SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, Graphic, Point, registry, BufferParameters, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, GraphicsLayer, HorizontalSlider, SelectList, DropDownSelect, esriRequest, SpatialReference, number, Polygon, HorizontalRule, geoEnrichment) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, geoEnrichment], {
        isSharedSort: false,

        /**
        * Performs from to filter query
        * @param {object}From container node
        * @param {object}To container node
        * @param {object}Check box object
        * @memberOf widgets/Sitelocator/FeatureQuery
        */
        _fromToQuery: function (fromNode, toNode, chkBox) {
            var isfilterRemoved = false;
            if (Number(fromNode.value) >= 0 && Number(toNode.value) >= 0 && Number(fromNode.value) < Number(toNode.value) && lang.trim(fromNode.value) !== "" && lang.trim(toNode.value) !== "") {
                if (this.workflowCount === 0) {
                    if (Number(fromNode.getAttribute("FieldValue")) <= Number(toNode.getAttribute("FieldValue")) && array.indexOf(this.queryArrayBuildingAND, chkBox.value + ">=" + fromNode.getAttribute("FieldValue") + " AND " + chkBox.value + "<=" + toNode.getAttribute("FieldValue")) !== -1) {
                        this.queryArrayBuildingAND.splice(array.indexOf(this.queryArrayBuildingAND, chkBox.value + ">=" + fromNode.getAttribute("FieldValue") + " AND " + chkBox.value + "<=" + toNode.getAttribute("FieldValue")), 1);
                        isfilterRemoved = true;
                    }
                    if (chkBox.checked) {
                        if (fromNode.value !== "" && toNode.value !== 0 && Number(fromNode.value) <= Number(toNode.value)) {
                            this.queryArrayBuildingAND.push(chkBox.value + ">=" + Number(fromNode.value) + " AND " + chkBox.value + "<=" + Number(toNode.value));
                            fromNode.setAttribute("FieldValue", Number(fromNode.value));
                            toNode.setAttribute("FieldValue", Number(toNode.value));
                        } else {
                            alert(sharedNls.errorMessages.invalidInput);
                        }
                    } else {
                        fromNode.value = "";
                        toNode.value = "";
                        fromNode.setAttribute("FieldValue", null);
                        toNode.setAttribute("FieldValue", null);
                    }
                    if ((fromNode.value !== "" && toNode.value !== "") || isfilterRemoved) {
                        if (this.featureGeometry[this.workflowCount] && !this.lastGeometry[this.workflowCount]) {
                            topic.publish("hideProgressIndicator");
                            alert(sharedNls.errorMessages.bufferSliderValue);
                        } else {
                            this._callAndOrQuery(this.queryArrayBuildingAND, this.queryArrayBuildingOR);
                        }
                    }
                } else {
                    if (Number(fromNode.getAttribute("FieldValue")) <= Number(toNode.getAttribute("FieldValue")) && array.indexOf(this.queryArraySitesAND, chkBox.value + ">=" + fromNode.getAttribute("FieldValue") + " AND " + chkBox.value + "<=" + toNode.getAttribute("FieldValue")) !== -1) {
                        this.queryArraySitesAND.splice(array.indexOf(this.queryArraySitesAND, chkBox.value + ">=" + fromNode.getAttribute("FieldValue") + " AND " + chkBox.value + "<=" + toNode.getAttribute("FieldValue")), 1);
                        isfilterRemoved = true;
                    }
                    if (chkBox.checked) {
                        if (fromNode.value !== "" && toNode.value !== 0 && Number(fromNode.value) <= Number(toNode.value)) {
                            this.queryArraySitesAND.push(chkBox.value + ">=" + Number(fromNode.value) + " AND " + chkBox.value + "<=" + Number(toNode.value));
                            fromNode.setAttribute("FieldValue", Number(fromNode.value));
                            toNode.setAttribute("FieldValue", Number(toNode.value));
                        } else {
                            alert(sharedNls.errorMessages.invalidInput);
                        }
                    } else {
                        fromNode.value = "";
                        toNode.value = "";
                        fromNode.setAttribute("FieldValue", null);
                        toNode.setAttribute("FieldValue", null);
                    }
                    if ((fromNode.value !== "" && toNode.value !== "") || isfilterRemoved) {

                        if (this.featureGeometry[this.workflowCount] && !this.lastGeometry[this.workflowCount]) {
                            topic.publish("hideProgressIndicator");
                            alert(sharedNls.errorMessages.bufferSliderValue);
                        } else {
                            this._callAndOrQuery(this.queryArraySitesAND, this.queryArraySitesOR);
                        }
                    }
                }
            } else {
                fromNode.value = "";
                toNode.value = "";
                if (this.workflowCount === 0) {
                    if (Number(fromNode.getAttribute("FieldValue")) <= Number(toNode.getAttribute("FieldValue")) && array.indexOf(this.queryArrayBuildingAND, chkBox.value + ">=" + fromNode.getAttribute("FieldValue") + " AND " + chkBox.value + "<=" + toNode.getAttribute("FieldValue")) !== -1) {

                        this.queryArrayBuildingAND.splice(array.indexOf(this.queryArrayBuildingAND, chkBox.value + ">=" + fromNode.getAttribute("FieldValue") + " AND " + chkBox.value + "<=" + toNode.getAttribute("FieldValue")), 1);
                        this._callAndOrQuery(this.queryArrayBuildingAND, this.queryArrayBuildingOR);
                    }
                } else {
                    if (Number(fromNode.getAttribute("FieldValue")) <= Number(toNode.getAttribute("FieldValue")) && array.indexOf(this.queryArraySitesAND, chkBox.value + ">=" + fromNode.getAttribute("FieldValue") + " AND " + chkBox.value + "<=" + toNode.getAttribute("FieldValue")) !== -1) {
                        this.queryArraySitesAND.splice(array.indexOf(this.queryArraySitesAND, chkBox.value + ">=" + fromNode.getAttribute("FieldValue") + " AND " + chkBox.value + "<=" + toNode.getAttribute("FieldValue")), 1);
                        this._callAndOrQuery(this.queryArraySitesAND, this.queryArraySitesOR);
                    }
                }
                if (chkBox.checked) {
                    alert(sharedNls.errorMessages.invalidInput);
                }
            }
        },

        /**
        * Check box query handler
        * @param {object} check box node
        * @memberOf widgets/Sitelocator/FeatureQuery
        */
        chkQueryHandler: function (chkBoxNode, isExecuteQuery) {
            var arrAndQuery = [], arrOrQuery = [];
            if (!isExecuteQuery && isExecuteQuery !== false) {
                isExecuteQuery = true;
            }
            topic.publish("showProgressIndicator");
            dojo.sortingData = null;
            if (this.workflowCount === 0) {
                if (this.selectBusinessSortForBuilding) {
                    this.selectBusinessSortForBuilding.set("value", sharedNls.titles.select);
                    this.selectedValue = null;
                }
                arrAndQuery = this.queryArrayBuildingAND;
                arrOrQuery = this.queryArrayBuildingOR;
            } else {
                if (this.selectBusinessSortForSites) {
                    this.selectBusinessSortForSites.set("value", sharedNls.titles.select);
                    this.selectedValue = null;
                }
                arrAndQuery = this.queryArraySitesAND;
                arrOrQuery = this.queryArraySitesOR;
            }
            if (chkBoxNode && chkBoxNode.target && chkBoxNode.target.checked) {
                if (chkBoxNode.target.parentElement.getAttribute("isRegularFilterOptionFields") === "true") {
                    if (array.indexOf(arrAndQuery, chkBoxNode.target.name + "='" + chkBoxNode.target.value + "'") === -1) {
                        arrAndQuery.push(chkBoxNode.target.name + "='" + chkBoxNode.target.value + "'");
                    }
                } else {
                    if (array.indexOf(arrOrQuery, "UPPER(" + chkBoxNode.target.name + ") LIKE UPPER('%" + chkBoxNode.target.value + "%')") === -1) {
                        arrOrQuery.push("UPPER(" + chkBoxNode.target.name + ") LIKE UPPER('%" + chkBoxNode.target.value + "%')");
                    }
                }
            } else if (chkBoxNode && chkBoxNode.checked) {
                if (array.indexOf(arrOrQuery, "UPPER(" + chkBoxNode.name + ") LIKE UPPER('%" + chkBoxNode.value + "%')") === -1) {
                    arrOrQuery.push("UPPER(" + chkBoxNode.name + ") LIKE UPPER('%" + chkBoxNode.value + "%')");
                }
            } else {
                if (chkBoxNode && chkBoxNode.target.parentElement.getAttribute("isRegularFilterOptionFields") === "true") {
                    arrAndQuery.splice(array.indexOf(arrAndQuery, chkBoxNode.target.name + "='" + chkBoxNode.target.value + "'"), 1);
                } else if (chkBoxNode) {
                    arrOrQuery.splice(array.indexOf(arrOrQuery, "UPPER(" + chkBoxNode.target.name + ") LIKE UPPER('%" + chkBoxNode.target.value + "%')"), 1);
                }
            }

            if (this.workflowCount === 0) {
                this.queryArrayBuildingAND = arrAndQuery;
                this.queryArrayBuildingOR = arrOrQuery;
            } else {
                this.queryArraySitesAND = arrAndQuery;
                this.queryArraySitesOR = arrOrQuery;
            }
            if (this.featureGeometry[this.workflowCount] && !this.lastGeometry[this.workflowCount]) {
                topic.publish("hideProgressIndicator");
                alert(sharedNls.errorMessages.bufferSliderValue);
            } else if (isExecuteQuery) {
                this._callAndOrQuery(arrAndQuery, arrOrQuery);
            }
        },

        /**
        * perform and/or query
        * @param {object} and query parameter
        * @param {object} or query parameter
        * @memberOf widgets/Sitelocator/FeatureQuery
        */
        _callAndOrQuery: function (arrAndQuery, arrOrQuery) {
            var geometry, andString, orString, queryString;
            geometry = this.lastGeometry[this.workflowCount];
            if (arrAndQuery.length > 0) {
                andString = arrAndQuery.join(" AND ");
            }
            if (arrOrQuery.length > 0) {
                orString = arrOrQuery.join(" OR ");
            }
            if (andString) {
                queryString = andString;
            }
            if (orString) {
                orString = "(" + orString + ")";
                if (queryString) {
                    queryString += " AND " + orString;
                } else {
                    queryString = orString;
                }
            }
            if (queryString) {
                this.doLayerQuery(this.workflowCount, geometry, queryString);
            } else if (geometry !== null) {
                this.doLayerQuery(this.workflowCount, geometry, null);
            } else {
                topic.publish("hideProgressIndicator");
                dojo.arrWhereClause[this.workflowCount] = null;
                if (this.workflowCount === 0) {
                    domStyle.set(this.outerDivForPegination, "display", "none");
                    domConstruct.empty(this.outerResultContainerBuilding);
                    domConstruct.empty(this.attachmentOuterDiv);
                    delete this.buildingTabData;
                    this.siteLocatorScrollbarAttributeBuilding = null;
                } else {
                    domStyle.set(this.outerDivForPeginationSites, "display", "none");
                    domConstruct.empty(this.outerResultContainerSites);
                    domConstruct.empty(this.attachmentOuterDivSites);
                    delete this.sitesTabData;
                    this.siteLocatorScrollbarSites = null;
                }
            }
        },

        /**
        * perform search by addess if search type is address search
        * @param {number} tab count
        * @param {object} Geometry to perform query
        * @param {string} where clause for query
        * @memberOf widgets/Sitelocator/FeatureQuery
        */
        doLayerQuery: function (tabCount, geometry, where) {
            var queryLayer, queryLayerTask, geometryService, dateObj;
            dateObj = new Date().getTime().toString();
            this.lastGeometry[this.workflowCount] = geometry;
            this.showBuffer(geometry);
            queryLayerTask = new QueryTask(this.opeartionLayer.url);
            queryLayer = new esri.tasks.Query();
            queryLayer.returnGeometry = false;
            if (where !== null) {
                queryLayer.where = dateObj + "=" + dateObj + " AND " + where;
                dojo.arrWhereClause[this.workflowCount] = where;
                dojo.arrWhereClause[this.workflowCount] = dojo.arrWhereClause[this.workflowCount].toString().replace(/%/g, "PERCENT");
            } else {
                dojo.arrWhereClause[this.workflowCount] = "1=1";
                queryLayer.where = dateObj + "=" + dateObj;
            }
            if (geometry !== null) {
                geometryService = new GeometryService(dojo.configData.GeometryService.toString());
                geometryService.intersect(geometry, dojo.webMapExtent, lang.hitch(this, function (interSectGeometry) {
                    if (interSectGeometry[0].rings.length > 0) {
                        queryLayer.geometry = geometry[0];
                        queryLayerTask.executeForIds(queryLayer, lang.hitch(this, this._queryLayerhandler), lang.hitch(this, this._queryErrorHandler));
                    } else {
                        topic.publish("hideProgressIndicator");
                        if (this.workflowCount === 0) {
                            domStyle.set(this.outerDivForPegination, "display", "none");
                            domConstruct.empty(this.outerResultContainerBuilding);
                            domConstruct.empty(this.attachmentOuterDiv);
                            delete this.buildingTabData;
                            this.siteLocatorScrollbarAttributeBuilding = null;
                        } else {
                            domStyle.set(this.outerDivForPeginationSites, "display", "none");
                            domConstruct.empty(this.outerResultContainerSites);
                            domConstruct.empty(this.attachmentOuterDivSites);
                            delete this.sitesTabData;
                            this.siteLocatorScrollbarSites = null;
                        }
                        alert(sharedNls.errorMessages.geometryIntersectError);
                    }
                }), lang.hitch(this, function (Error) {
                    topic.publish("hideProgressIndicator");
                    alert(sharedNls.errorMessages.geometryIntersectError);
                }));
            } else {
                queryLayerTask.executeForIds(queryLayer, lang.hitch(this, this._queryLayerhandler), lang.hitch(this, this._queryErrorHandler));
            }
        },

        /**
        * Error call back for query performed on selected layer
        * @param {object} Error object
        * @memberOf widgets/Sitelocator/FeatureQuery
        */
        _queryErrorHandler: function (error) {
            topic.publish("hideProgressIndicator");
        },

        /**
        * Call back for query performed on selected layer
        * @param {object} result data of query
        * @memberOf widgets/Sitelocator/FeatureQuery
        */
        _queryLayerhandler: function (featureSet) {
            if (featureSet !== null && featureSet.length > 0) {
                if (this.workflowCount === 0) {
                    domStyle.set(this.outerDivForPegination, "display", "block");
                    this.buildingResultSet = featureSet;
                    if (window.location.toString().split("$paginationIndex=").length > 1 && !dojo.paginationIndex) {
                        this._paginationForResults(Number(window.location.toString().split("$paginationIndex=")[1].split("$")[0]));
                    } else {
                        this._paginationForResults(0);
                    }
                } else {
                    domStyle.set(this.outerDivForPeginationSites, "display", "block");
                    this.sitesResultSet = featureSet;
                    if (window.location.toString().split("$paginationIndex=").length > 1 && !dojo.paginationIndex) {
                        this._paginationForResultsSites(Number(window.location.toString().split("$paginationIndex=")[1].split("$")[0]));
                    } else {
                        this._paginationForResultsSites(0);
                    }
                }
                if (window.location.toString().split("$paginationIndex=").length > 1 && !dojo.paginationIndex) {
                    this.performQuery(this.opeartionLayer, featureSet, Number(window.location.toString().split("$paginationIndex=")[1].split("$")[0]));
                } else {
                    this.performQuery(this.opeartionLayer, featureSet, 0);
                }
            } else {
                if (this.workflowCount === 0) {
                    domStyle.set(this.outerDivForPegination, "display", "none");
                    domConstruct.empty(this.outerResultContainerBuilding);
                    domConstruct.empty(this.attachmentOuterDiv);
                    delete this.buildingTabData;
                    this.siteLocatorScrollbarAttributeBuilding = null;
                    if (this.selectedValue) {
                        this.selectedValue = null;
                        this.selectBusinessSortForBuilding.set("value", sharedNls.titles.select);
                    }
                } else {
                    domStyle.set(this.outerDivForPeginationSites, "display", "none");
                    domConstruct.empty(this.outerResultContainerSites);
                    domConstruct.empty(this.attachmentOuterDivSites);
                    delete this.sitesTabData;
                    this.siteLocatorScrollbarSites = null;
                    if (this.selectedValue) {
                        this.selectedValue = null;
                        this.selectBusinessSortForSites.set("value", sharedNls.titles.select);
                    }
                }
                topic.publish("hideProgressIndicator");
                alert(sharedNls.errorMessages.invalidSearch);
            }
        },

        /**
        * perform query to get data (attachments) for batches of 10 based on curent index
        * @param {object} Layer on which query need to be performed
        * @param {object} total features from query
        * @param {number} index of feature
        * @memberOf widgets/Sitelocator/FeatureQuery
        */
        performQuery: function (layer, featureSet, curentIndex) {
            var onCompleteArray, i, arrIds = [], finalIndex, layerFeatureSet, layerAttachmentInfos = [], deferredListResult, j;
            try {
                if (dojo.paginationIndex) {
                    dojo.paginationIndex[this.workflowCount] = curentIndex;
                } else {
                    dojo.paginationIndex = [null, null, null, null];
                    dojo.paginationIndex[this.workflowCount] = curentIndex;
                }
                if (featureSet.length !== 0) {
                    topic.publish("showProgressIndicator");
                    onCompleteArray = [];
                    finalIndex = curentIndex + 10;
                    if (curentIndex + 10 > featureSet.length) {
                        finalIndex = featureSet.length;
                    }
                    for (i = curentIndex; i < finalIndex; i++) {
                        arrIds.push(featureSet[i]);
                        if (layer.hasAttachments && dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.ResultContents.ShowAttachments) {
                            this.itemquery(null, featureSet[i], layer, onCompleteArray);
                        }
                    }
                    this.itemquery(arrIds, null, layer, onCompleteArray);
                    deferredListResult = new DeferredList(onCompleteArray);
                    deferredListResult.then(lang.hitch(this, function (result) {
                        if (result) {
                            for (j = 0; j < result.length; j++) {
                                if (result[j][1]) {
                                    if (result[j][1].features) {
                                        layerFeatureSet = result[j][1];
                                    } else {
                                        layerAttachmentInfos.push(result[j][1]);
                                    }
                                }
                            }
                        }
                        this.mergeItemData(layerFeatureSet, layerAttachmentInfos, layer);
                    }), function (err) {
                        alert(err.message);
                    });


                } else {
                    if (this.workflowCount === 0) {
                        domConstruct.empty(this.outerResultContainerBuilding);
                    }
                }
            } catch (Error) {
                topic.publish("hideProgressIndicator");
            }
        },

        /**
        * perform query for attachment and data
        * @param {array} array of Ids
        * @param {number} objectID of a feature
        * @param {object} layer on which query is performed
        * @memberOf widgets/Sitelocator/FeatureQuery
        */
        itemquery: function (arrIds, objectId, layer, onCompleteArray) {
            var queryobject, queryObjectTask, oufields = [], i, queryOnRouteTask;
            if (arrIds !== null) {
                queryObjectTask = new QueryTask(layer.url);
                queryobject = new esri.tasks.Query();
                for (i = 0; i < dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.ResultContents.DisplayFields.length; i++) {
                    oufields.push(dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.ResultContents.DisplayFields[i].FieldName);
                }
                oufields.push(layer.fields[0].name);
                queryobject.outFields = oufields;
                queryobject.returnGeometry = false;
                queryobject.objectIds = arrIds;
                if (this.selectedValue) {
                    queryobject.orderByFields = [this.selectedValue];
                }
                queryOnRouteTask = queryObjectTask.execute(queryobject);
            } else if (objectId !== null) {
                queryOnRouteTask = layer.queryAttachmentInfos(objectId);
            }
            onCompleteArray.push(queryOnRouteTask);
        },

        /**
        * Merge attachment with coresponding objectid
        * @param {object} featureset for batch query
        * @param {array} array of attachments
        * @memberOf widgets/Sitelocator/FeatureQuery
        */
        mergeItemData: function (layerFeatureSet, layerAttachmentInfos, layer) {
            var arrTabData = [], i, j;
            topic.publish("hideProgressIndicator");
            for (i = 0; i < layerFeatureSet.features.length; i++) {
                arrTabData.push({ featureData: layerFeatureSet.features[i].attributes });
                for (j = 0; j < layerAttachmentInfos.length; j++) {
                    if (layerAttachmentInfos[j][0] && layerFeatureSet.features[i].attributes[layer.objectIdField] === layerAttachmentInfos[j][0].objectId) {
                        arrTabData[i].attachmentData = layerAttachmentInfos[j];
                        break;
                    }
                }
            }
            if (this.workflowCount === 0) {
                this.buildingTabData = arrTabData;
                this._createDisplayList(this.buildingTabData, this.outerResultContainerBuilding);
            } else {
                this.sitesTabData = arrTabData;
                this._createDisplayList(this.sitesTabData, this.outerResultContainerSites);
            }
        },

        /**
        * create pagination for batch query
        * @memberOf widgets/Sitelocator/FeatureQuery
        */
        _paginationForResults: function (index) {
            var rangeDiv, paginationCountDiv, leftArrow, firstIndex, selectSortBox, lastIndex, rightArrow, sortingDiv, sortContentDiv, spanContent, selectForBuilding, currentIndexNode, hyphen, tenthIndex, ofTextDiv, TotalCount, currentPage = 1, total, result, i, timeOut, currentIndex = index, strLastUpdate;
            domConstruct.empty(this.outerDivForPegination);
            rangeDiv = domConstruct.create("div", { "class": "esriCTRangeDiv" }, this.outerDivForPegination);
            currentIndexNode = domConstruct.create("div", { "class": "esriCTIndex" }, rangeDiv);
            hyphen = domConstruct.create("div", { "class": "esriCTIndex" }, rangeDiv);
            tenthIndex = domConstruct.create("div", { "class": "esriCTIndex" }, rangeDiv);
            ofTextDiv = domConstruct.create("div", { "class": "esriCTIndex" }, rangeDiv);
            TotalCount = domConstruct.create("div", { "class": "esriCTIndex" }, rangeDiv);
            paginationCountDiv = domConstruct.create("div", { "class": "esriCTPaginationCount" }, this.outerDivForPegination);
            leftArrow = domConstruct.create("div", { "class": "esriCTLeftArrow" }, paginationCountDiv);
            firstIndex = domConstruct.create("div", { "class": "esriCTFirstIndex" }, paginationCountDiv);
            domConstruct.create("div", { "class": "esriCTseparator" }, paginationCountDiv);
            lastIndex = domConstruct.create("div", { "class": "esriCTLastIndex" }, paginationCountDiv);
            rightArrow = domConstruct.create("div", { "class": "esriCTRightArrow" }, paginationCountDiv);
            sortingDiv = domConstruct.create("div", { "class": "esriCTSortingDiv" }, this.outerDivForPegination);
            sortContentDiv = domConstruct.create("div", { "class": "esriCTSortDiv" }, sortingDiv);
            spanContent = domConstruct.create("div", { "class": "esriCTSpan" }, sortContentDiv);
            selectSortBox = domConstruct.create("div", { "class": "esriCTSelectSortBox" }, sortContentDiv);
            selectForBuilding = domConstruct.create("div", { "class": "esriCTSelect" }, selectSortBox);
            domAttr.set(currentIndexNode, "innerHTML", currentIndex + 1);
            domAttr.set(hyphen, "innerHTML", "-");
            if (this.buildingResultSet.length < currentIndex + 10) {
                domAttr.set(tenthIndex, "innerHTML", this.buildingResultSet.length);
            } else {
                domAttr.set(tenthIndex, "innerHTML", currentIndex + 10);
            }
            domAttr.set(ofTextDiv, "innerHTML", sharedNls.titles.countStatus);
            domAttr.set(TotalCount, "innerHTML", this.buildingResultSet.length);
            domAttr.set(spanContent, "innerHTML", sharedNls.titles.sortBy);
            domAttr.set(firstIndex, "innerHTML", Math.floor(currentIndex / 10) + 1);
            currentPage = Math.floor(currentIndex / 10) + 1;
            domAttr.set(firstIndex, "contentEditable", true);
            total = this.buildingResultSet.length;
            result = Math.ceil(total / 10);
            domAttr.set(lastIndex, "innerHTML", result);
            if (Math.ceil((currentIndex / 10) + 1) === result) {
                domClass.replace(rightArrow, "esriCTRightArrowBlue", "esriCTRightArrow");
                domClass.replace(leftArrow, "esriCTLeftArrowBlue", "esriCTLeftArrow");
            } else if (Math.ceil((currentIndex / 10) + 1) > 1) {
                domClass.replace(rightArrow, "esriCTRightArrow", "esriCTRightArrowBlue");
                domClass.replace(leftArrow, "esriCTLeftArrowBlue", "esriCTLeftArrow");
            }
            if (total <= 10) {
                domClass.replace(leftArrow, "esriCTLeftArrow", "esriCTLeftArrowBlue");
            }
            this.own(on(firstIndex, "keyup", lang.hitch(this, function (value) {
                if (value.keyCode === 13) {
                    domAttr.set(firstIndex, "innerHTML", strLastUpdate);
                    topic.publish("showProgressIndicator");
                } else {
                    strLastUpdate = firstIndex.innerHTML;
                }
                if (Number(firstIndex.innerHTML).toString().length <= 10) {

                    clearTimeout(timeOut);
                    timeOut = setTimeout(lang.hitch(this, function () {
                        if (!isNaN(Number(firstIndex.innerHTML)) && Number(firstIndex.innerHTML) > 0 && Math.ceil(Number(firstIndex.innerHTML)) <= result) {
                            currentIndex = Math.ceil(Number(firstIndex.innerHTML)) * 10 - 10;
                            currentPage = Math.ceil((currentIndex / 10) + 1);
                            domAttr.set(firstIndex, "innerHTML", currentPage);
                            domAttr.set(currentIndexNode, "innerHTML", currentIndex + 1);
                            if (this.buildingResultSet.length < currentIndex + 10) {
                                domAttr.set(tenthIndex, "innerHTML", this.buildingResultSet.length);
                            } else {
                                domAttr.set(tenthIndex, "innerHTML", currentIndex + 10);
                            }
                            if (currentPage > 1) {
                                domClass.replace(leftArrow, "esriCTLeftArrowBlue", "esriCTLeftArrow");
                            } else {
                                domClass.replace(leftArrow, "esriCTLeftArrow", "esriCTLeftArrowBlue");
                                domClass.replace(rightArrow, "esriCTRightArrow", "esriCTRightArrowBlue");
                            }
                            if (currentPage === result) {
                                domClass.replace(rightArrow, "esriCTRightArrowBlue", "esriCTRightArrow");
                            } else {
                                domClass.replace(rightArrow, "esriCTRightArrow", "esriCTRightArrowBlue");
                            }
                            this.performQuery(this.opeartionLayer, this.buildingResultSet, currentIndex);
                        } else {
                            topic.publish("hideProgressIndicator");
                            domAttr.set(firstIndex, "innerHTML", currentPage);
                        }
                    }), 2000);

                } else {
                    domAttr.set(firstIndex, "innerHTML", currentPage);
                }
            })));
            if (!this.areaSortBuilding) {
                this.areaSortBuilding = [];
                this.areaSortBuilding.push({ "label": sharedNls.titles.select, "value": sharedNls.titles.select, "selected": true });
                for (i = 0; i < dojo.configData.Workflows[0].InfoPanelSettings.ResultContents.DisplayFields.length; i++) {
                    if (dojo.configData.Workflows[0].InfoPanelSettings.ResultContents.DisplayFields[i].SortingEnabled) {
                        this.areaSortBuilding.push({ "label": dojo.configData.Workflows[0].InfoPanelSettings.ResultContents.DisplayFields[i].DisplayText.substring(0, dojo.configData.Workflows[0].InfoPanelSettings.ResultContents.DisplayFields[i].DisplayText.length - 1), "value": dojo.configData.Workflows[0].InfoPanelSettings.ResultContents.DisplayFields[i].FieldName });
                    }
                }
            }
            this.selectBusinessSortForBuilding = new SelectList({
                options: this.areaSortBuilding,
                maxHeight: 100
            }, selectForBuilding);

            if (window.location.toString().split("$strSortingData=").length > 1 && !this.isSharedSort) {
                this.isSharedSort = true;
                this.siteLocatorScrollbarAttributeBuilding = null;
                this.buildingResultSet = null;
                this.selectBusinessSortForBuilding.set("value", window.location.toString().split("$strSortingData=")[1].split("$")[0]);
            }

            this.own(on(this.selectBusinessSortForBuilding, "change", lang.hitch(this, function (value) {
                if (value.toLowerCase() !== sharedNls.titles.select.toLowerCase()) {
                    this._selectionChangeForBuildingSort(value);
                }
            })));

            this.own(on(leftArrow, "click", lang.hitch(this, function () {
                if (currentIndex !== 0) {
                    currentIndex -= 10;
                    this.performQuery(this.opeartionLayer, this.buildingResultSet, currentIndex);
                    domAttr.set(currentIndexNode, "innerHTML", currentIndex + 1);
                    if (this.buildingResultSet.length < currentIndex + 10) {
                        domAttr.set(tenthIndex, "innerHTML", this.buildingResultSet.length);
                    } else {
                        domAttr.set(tenthIndex, "innerHTML", currentIndex + 10);
                    }
                    currentPage = currentPage - 1;
                    domAttr.set(firstIndex, "innerHTML", currentPage);
                    if (currentPage === 1) {
                        domClass.replace(leftArrow, "esriCTLeftArrow", "esriCTLeftArrowBlue");
                    }
                    if (currentPage < result) {
                        domClass.replace(rightArrow, "esriCTRightArrow", "esriCTRightArrowBlue");
                    }
                }
            })));

            this.own(on(rightArrow, "click", lang.hitch(this, function () {
                if (result >= Number(firstIndex.innerHTML) + 1) {
                    currentIndex += 10;
                    this.performQuery(this.opeartionLayer, this.buildingResultSet, currentIndex);
                    domAttr.set(currentIndexNode, "innerHTML", currentIndex + 1);
                    if (this.buildingResultSet.length < currentIndex + 10) {
                        domAttr.set(tenthIndex, "innerHTML", this.buildingResultSet.length);
                    } else {
                        domAttr.set(tenthIndex, "innerHTML", currentIndex + 10);
                    }
                    currentPage = Math.ceil((currentIndex / 10) + 1);
                    domAttr.set(firstIndex, "innerHTML", currentPage);
                    if (currentPage > 1) {
                        domClass.replace(leftArrow, "esriCTLeftArrowBlue", "esriCTLeftArrow");
                    }
                    if (currentPage === result) {
                        domClass.replace(rightArrow, "esriCTRightArrowBlue", "esriCTRightArrow");
                    }
                }
            })));
        },

        /**
        * create pagination for batch query
        * @memberOf widgets/Sitelocator/FeatureQuery
        */
        _paginationForResultsSites: function (index) {
            var rangeDiv, paginationCountDiv, leftArrow, firstIndex, selectSortBox, lastIndex, rightArrow, sortingDiv, sortContentDiv, spanContent, selectForSites, currentIndexNode, hyphen, tenthIndex, ofTextDiv, TotalCount, currentPage = 1, total, result, i, timeOut, currentIndexSites = index, strLastUpdate;
            domConstruct.empty(this.outerDivForPeginationSites);
            rangeDiv = domConstruct.create("div", { "class": "esriCTRangeDiv" }, this.outerDivForPeginationSites);
            currentIndexNode = domConstruct.create("div", { "class": "esriCTIndex" }, rangeDiv);
            hyphen = domConstruct.create("div", { "class": "esriCTIndex" }, rangeDiv);
            tenthIndex = domConstruct.create("div", { "class": "esriCTIndex" }, rangeDiv);
            ofTextDiv = domConstruct.create("div", { "class": "esriCTIndex" }, rangeDiv);
            TotalCount = domConstruct.create("div", { "class": "esriCTIndex" }, rangeDiv);
            paginationCountDiv = domConstruct.create("div", { "class": "esriCTPaginationCount" }, this.outerDivForPeginationSites);
            leftArrow = domConstruct.create("div", { "class": "esriCTLeftArrow" }, paginationCountDiv);
            firstIndex = domConstruct.create("div", { "class": "esriCTFirstIndex" }, paginationCountDiv);
            domConstruct.create("div", { "class": "esriCTseparator" }, paginationCountDiv);
            lastIndex = domConstruct.create("div", { "class": "esriCTLastIndex" }, paginationCountDiv);
            rightArrow = domConstruct.create("div", { "class": "esriCTRightArrow" }, paginationCountDiv);
            sortingDiv = domConstruct.create("div", { "class": "esriCTSortingDiv" }, this.outerDivForPeginationSites);
            sortContentDiv = domConstruct.create("div", { "class": "esriCTSortDiv" }, sortingDiv);
            spanContent = domConstruct.create("div", { "class": "esriCTSpan" }, sortContentDiv);
            selectSortBox = domConstruct.create("div", { "class": "esriCTSelectSortBox" }, sortContentDiv);
            selectForSites = domConstruct.create("div", { "class": "esriCTSelect" }, selectSortBox);
            domAttr.set(currentIndexNode, "innerHTML", currentIndexSites + 1);
            domAttr.set(hyphen, "innerHTML", "-");
            if (this.sitesResultSet.length < currentIndexSites + 10) {
                domAttr.set(tenthIndex, "innerHTML", this.sitesResultSet.length);
            } else {
                domAttr.set(tenthIndex, "innerHTML", currentIndexSites + 10);
            }
            domAttr.set(ofTextDiv, "innerHTML", sharedNls.titles.countStatus);
            domAttr.set(TotalCount, "innerHTML", this.sitesResultSet.length);
            domAttr.set(spanContent, "innerHTML", sharedNls.titles.sortBy);
            domAttr.set(firstIndex, "innerHTML", Math.floor(currentIndexSites / 10) + 1);
            currentPage = Math.floor(currentIndexSites / 10) + 1;
            domAttr.set(firstIndex, "contentEditable", true);
            total = this.sitesResultSet.length;
            result = Math.ceil(total / 10);
            domAttr.set(lastIndex, "innerHTML", result);
            if (Math.ceil((currentIndexSites / 10) + 1) === result) {
                domClass.replace(rightArrow, "esriCTRightArrowBlue", "esriCTRightArrow");
                domClass.replace(leftArrow, "esriCTLeftArrowBlue", "esriCTLeftArrow");
            } else if (Math.ceil((currentIndexSites / 10) + 1) > 1) {
                domClass.replace(rightArrow, "esriCTRightArrow", "esriCTRightArrowBlue");
                domClass.replace(leftArrow, "esriCTLeftArrowBlue", "esriCTLeftArrow");
            }
            if (total <= 10) {
                domClass.replace(leftArrow, "esriCTLeftArrow", "esriCTLeftArrowBlue");
            }
            this.own(on(firstIndex, "keyup", lang.hitch(this, function (value) {
                if (value.keyCode === 13) {
                    domAttr.set(firstIndex, "innerHTML", strLastUpdate);
                    topic.publish("showProgressIndicator");
                } else {
                    strLastUpdate = firstIndex.innerHTML;
                }
                if (Number(firstIndex.innerHTML).toString().length <= 10) {
                    clearTimeout(timeOut);
                    timeOut = setTimeout(lang.hitch(this, function () {
                        if (!isNaN(Number(firstIndex.innerHTML)) && Number(firstIndex.innerHTML) > 0 && Math.ceil(Number(firstIndex.innerHTML)) <= result) {
                            currentIndexSites = Math.ceil(Number(firstIndex.innerHTML)) * 10 - 10;
                            currentPage = Math.ceil((currentIndexSites / 10) + 1);
                            domAttr.set(firstIndex, "innerHTML", currentPage);
                            domAttr.set(currentIndexNode, "innerHTML", currentIndexSites + 1);
                            if (this.sitesResultSet.length < currentIndexSites + 10) {
                                domAttr.set(tenthIndex, "innerHTML", this.sitesResultSet.length);
                            } else {
                                domAttr.set(tenthIndex, "innerHTML", currentIndexSites + 10);
                            }
                            if (currentPage > 1) {
                                domClass.replace(leftArrow, "esriCTLeftArrowBlue", "esriCTLeftArrow");
                            } else {
                                domClass.replace(leftArrow, "esriCTLeftArrow", "esriCTLeftArrowBlue");
                                domClass.replace(rightArrow, "esriCTRightArrow", "esriCTRightArrowBlue");
                            }
                            if (currentPage === result) {
                                domClass.replace(rightArrow, "esriCTRightArrowBlue", "esriCTRightArrow");
                            } else {
                                domClass.replace(rightArrow, "esriCTRightArrow", "esriCTRightArrowBlue");
                            }
                            this.performQuery(this.opeartionLayer, this.sitesResultSet, currentIndexSites);
                        } else {
                            topic.publish("hideProgressIndicator");
                            domAttr.set(firstIndex, "innerHTML", currentPage);
                        }
                    }), 2000);

                } else {
                    domAttr.set(firstIndex, "innerHTML", currentPage);
                }
            })));
            if (!this.areaSortSites) {
                this.areaSortSites = [];
                this.areaSortSites.push({ "label": sharedNls.titles.select, "value": sharedNls.titles.select, "selected": true });
                for (i = 0; i < dojo.configData.Workflows[1].InfoPanelSettings.ResultContents.DisplayFields.length; i++) {
                    if (dojo.configData.Workflows[1].InfoPanelSettings.ResultContents.DisplayFields[i].SortingEnabled) {
                        this.areaSortSites.push({ "label": dojo.configData.Workflows[1].InfoPanelSettings.ResultContents.DisplayFields[i].DisplayText.substring(0, dojo.configData.Workflows[1].InfoPanelSettings.ResultContents.DisplayFields[i].DisplayText.length - 1),
                            "value": dojo.configData.Workflows[1].InfoPanelSettings.ResultContents.DisplayFields[i].FieldName
                            });
                    }
                }
            }
            this.selectBusinessSortForSites = new SelectList({
                options: this.areaSortSites,
                maxHeight: 100
            }, selectForSites);

            if (window.location.toString().split("$strSortingData=").length > 1 && !this.isSharedSort) {
                this.isSharedSort = true;
                this.siteLocatorScrollbarSites = null;
                this.sitesResultSet = null;
                this.selectBusinessSortForSites.set("value", window.location.toString().split("$strSortingData=")[1].split("$")[0]);
            }

            this.own(on(this.selectBusinessSortForSites, "change", lang.hitch(this, function (value) {
                if (value.toLowerCase() !== sharedNls.titles.select.toLowerCase()) {
                    this._selectionChangeForBuildingSort(value);
                }
            })));
            this.own(on(leftArrow, "click", lang.hitch(this, function () {
                if (currentIndexSites !== 0) {
                    currentIndexSites -= 10;
                    this.performQuery(this.opeartionLayer, this.sitesResultSet, currentIndexSites);
                    domAttr.set(currentIndexNode, "innerHTML", currentIndexSites + 1);
                    if (this.sitesResultSet.length < currentIndexSites + 10) {
                        domAttr.set(tenthIndex, "innerHTML", this.sitesResultSet.length);
                    } else {
                        domAttr.set(tenthIndex, "innerHTML", currentIndexSites + 10);
                    }
                    currentPage = currentPage - 1;
                    domAttr.set(firstIndex, "innerHTML", currentPage);
                    if (currentPage === 1) {
                        domClass.replace(leftArrow, "esriCTLeftArrow", "esriCTLeftArrowBlue");
                    }
                    if (currentPage < result) {
                        domClass.replace(rightArrow, "esriCTRightArrow", "esriCTRightArrowBlue");
                    }
                }
            })));
            this.own(on(rightArrow, "click", lang.hitch(this, function () {
                if (result >= Number(firstIndex.innerHTML) + 1) {
                    currentIndexSites += 10;
                    this.performQuery(this.opeartionLayer, this.sitesResultSet, currentIndexSites);
                    domAttr.set(currentIndexNode, "innerHTML", currentIndexSites + 1);
                    if (this.sitesResultSet.length < currentIndexSites + 10) {
                        domAttr.set(tenthIndex, "innerHTML", this.sitesResultSet.length);
                    } else {
                        domAttr.set(tenthIndex, "innerHTML", currentIndexSites + 10);
                    }
                    currentPage = Math.ceil((currentIndexSites / 10) + 1);
                    domAttr.set(firstIndex, "innerHTML", currentPage);
                    if (currentPage > 1) {
                        domClass.replace(leftArrow, "esriCTLeftArrowBlue", "esriCTLeftArrow");
                    }
                    if (currentPage === result) {
                        domClass.replace(rightArrow, "esriCTRightArrowBlue", "esriCTRightArrow");
                    }
                }
            })));
        },

        /**
        * Sorting based on configured outfields
        * @param {object} selection object
        * @memberOf widgets/Sitelocator/FeatureQuery
        */
        _selectionChangeForBuildingSort: function (value) {
            var querySort, queryTask, andString, orString, queryString;
            this.siteLocatorScrollbarAttributeBuilding = null;
            this.siteLocatorScrollbarSites = null;
            this.buildingResultSet = null;
            this.sitesResultSet = null;
            this.selectedValue = value;
            dojo.sortingData = this.selectedValue;
            queryTask = new QueryTask(this.opeartionLayer.url);
            querySort = new esri.tasks.Query();
            if (this.lastGeometry[this.workflowCount]) {
                querySort.geometry = this.lastGeometry[this.workflowCount][0];
            }
            if (this.queryArrayBuildingAND.length > 0 && this.workflowCount === 0) {
                andString = this.queryArrayBuildingAND.join(" AND ");
            }
            if (this.queryArrayBuildingOR.length > 0 && this.workflowCount === 0) {
                orString = this.queryArrayBuildingOR.join(" OR ");
            }
            if (this.queryArraySitesAND.length > 0 && this.workflowCount === 1) {
                andString = this.queryArraySitesAND.join(" AND ");
            }

            if (this.queryArraySitesOR.length > 0 && this.workflowCount === 1) {
                andString = this.queryArraySitesOR.join(" OR ");
            }

            if (andString) {
                queryString = andString;
            }
            if (orString) {
                if (queryString) {
                    queryString += " AND " + orString;
                } else {
                    queryString = orString;
                }
            }
            if (queryString) {
                queryString += " AND " + this.selectedValue + " <> '' AND " + this.selectedValue + " is not null";
            } else {
                queryString = this.selectedValue + " <> '' AND " + this.selectedValue + " is not null";
            }
            querySort.where = queryString;
            querySort.returnGeometry = false;
            querySort.orderByFields = [this.selectedValue];
            queryTask.executeForIds(querySort, lang.hitch(this, this._queryLayerhandler), function (error) {
                alert(sharedNls.errorMessages.unableToSort);
            });
        }
    });
});
