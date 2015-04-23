/*global define,dojo,dojoConfig,esri,esriConfig,alert,console,handle:true,dijit */
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
    "esri/tasks/RelationParameters",
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
    "esri/tasks/Geoprocessor",
    "esri/tasks/PrintTask"

], function (declare, domConstruct, on, topic, lang, array, domStyle, domAttr, dom, query, Locator, domClass, FeatureSet, domGeom, GeometryService, RelationParameters, string, html, template, urlUtils, Query, QueryTask, Deferred, DeferredList, ScrollBar, Color, SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, Graphic, Point, registry, BufferParameters, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, GraphicsLayer, HorizontalSlider, SelectList, DropDownSelect, esriRequest, SpatialReference, number, Polygon, HorizontalRule, Geoprocessor, PrintTask) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

        /**
        * Geometry query on drop down selection of communities tab
        * @param {object} selected value from drop down
        * @memberOf widgets/Sitelocator/GeoEnrichment
        */
        _selectionChangeForCommunities: function (value) {
            var queryCommunities, queryTaskCommunities;
            dojo.communitySelectionFeature = value;
            queryTaskCommunities = new QueryTask(dojo.configData.Workflows[3].FilterSettings.FilterLayer.LayerURL);
            queryCommunities = new esri.tasks.Query();
            queryCommunities.where = dojo.configData.Workflows[3].FilterSettings.FilterLayer.OutFields[0].toString() + "='" + value + "'";
            queryCommunities.returnGeometry = true;
            queryCommunities.outFields = dojo.configData.Workflows[3].FilterSettings.FilterLayer.OutFields;
            //execute query on Communities
            queryTaskCommunities.execute(queryCommunities, lang.hitch(this, this._geometryForSelectedArea));
        },

        /**
        * Show available polygon feature from layer perform sorting
        * @param {object} feature set from layer
        * @memberOf widgets/Sitelocator/GeoEnrichment
        */
        _showResultsearchCommunitySelectNames: function (featureSet) {
            var i, resultFeatures = featureSet.features, areaListOptions = [];
            for (i = 0; i < resultFeatures.length; i++) {
                if (resultFeatures[i].attributes[dojo.configData.Workflows[3].FilterSettings.FilterLayer.FilterFieldName] !== " ") {
                    areaListOptions.push({ "label": resultFeatures[i].attributes[dojo.configData.Workflows[3].FilterSettings.FilterLayer.FilterFieldName], "value": resultFeatures[i].attributes[dojo.configData.Workflows[3].FilterSettings.FilterLayer.FilterFieldName] });
                }
            }
            areaListOptions.sort(function (a, b) {
                if (a.label < b.label) {
                    return -1;
                }
                if (a.label > b.label) {
                    return 1;
                }
                return 0;
            });
            areaListOptions.splice(0, 0, { "label": sharedNls.titles.select, "value": sharedNls.titles.select });
            this.comAreaList = new SelectList({
                options: areaListOptions,
                "id": "areaList",
                maxHeight: 100
            }, this.searchContainerComm);

            if (window.location.toString().split("$communitySelectionFeature=").length > 1) {
                this.comAreaList.disabled = false;
                this.comAreaList.set("displayedValue", window.location.toString().split("$communitySelectionFeature=")[1].split("$")[0]);

            } else {
                this.comAreaList.disabled = "disabled";
            }

            this.own(on(this.comAreaList, "change", lang.hitch(this, function (value) {
                if (value.toLowerCase() !== sharedNls.titles.select.toLowerCase()) {
                    this._selectionChangeForCommunities(value);
                    if (document.activeElement) {
                        document.activeElement.blur();
                    }
                    topic.publish("showProgressIndicator");
                }
            })));
        },

        /**
        * Display business tab in business workflow, set the height of business tab scrollbar and call resize scrollbar function in business workflow
        * @memberOf widgets/Sitelocator/GeoEnrichment
        */
        _showBusinessTab: function () {
            if (domStyle.get(this.demographicContainer, "display") === "block") {
                domStyle.set(this.demographicContainer, "display", "none");
                domStyle.set(this.businessContainer, "display", "block");
                domClass.replace(this.ResultBusinessTab, "esriCTAreaOfInterestTabSelected", "esriCTAreaOfInterestTab");
                domClass.replace(this.businessContainer, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
                domClass.replace(this.resultDemographicTab, "esriCTReportTabSelected", "esriCTReportTab");
                // If business tab scrollbar exist then set the height of business tab scrollbar in business workflow
                if (this.businessTabScrollbar) {
                    var esriCTShowDemoResultContainerd, esriCTShowDemoResultStylesd;
                    esriCTShowDemoResultContainerd = document.documentElement.clientHeight - this.mainResultDiv.offsetTop - 10;
                    esriCTShowDemoResultStylesd = { height: esriCTShowDemoResultContainerd + "px" };
                    domAttr.set(this.mainResultDiv, "style", esriCTShowDemoResultStylesd);
                    this.resizeScrollbar(this.businessTabScrollbar, this.mainResultDiv, query(".esriCTSortPanelHead")[0]);
                }
            }
        },

        /**
        * Display demography tab, call geoenrichment service for demographic information in business workflow
        * @memberOf widgets/Sitelocator/GeoEnrichment
        */
        _showDemographicInfoTab: function () {
            var esriInfoPanelStyle, esriInfoPanelHeight;
            if (domStyle.get(this.demographicContainer, "display") === "none") {
                domStyle.set(this.demographicContainer, "display", "block");
                domStyle.set(this.businessContainer, "display", "none");
                domClass.replace(this.ResultBusinessTab, "esriCTAreaOfInterestTab", "esriCTAreaOfInterestTabSelected");
                domClass.replace(this.resultDemographicTab, "esriCTReportTab", "esriCTReportTabSelected");
                // Checking the workflow count for business workflow
                if (this.workflowCount === 2) {
                    // If demographic results not available then call the enrich data request handler(calling geoenrichment service) and set the height of demographic tab in business workflow
                    if (!this.DemoInfoMainScrollbar) {
                        topic.publish("showProgressIndicator");
                        this._enrichDataRequest(this.lastGeometry[this.workflowCount], this.workflowCount, null);
                        esriInfoPanelHeight = document.documentElement.clientHeight - this.ResultDemographicTabTitle.offsetTop - 50;
                        esriInfoPanelStyle = { height: esriInfoPanelHeight + "px" };
                        domAttr.set(this.DemoInfoMainDiv, "style", esriInfoPanelStyle);
                        this.DemoInfoMainScrollbar = new ScrollBar({ domNode: this.DemoInfoMainDiv });
                        this.DemoInfoMainScrollbar.setContent(this.DemoInfoMainDivContent);
                        this.DemoInfoMainScrollbar.createScrollBar();
                        setTimeout(lang.hitch(this, function () {
                            this.resizeScrollbar(this.DemoInfoMainScrollbar, this.DemoInfoMainDiv, this.DemoInfoMainDivContent);
                        }, 500));
                    }
                }
                on(window, "resize", lang.hitch(this, function () {
                    if (this.workflowCount === 2) {
                        var esriCTShowDemoResultContainerd, esriCTShowDemoResultStylesd;
                        esriCTShowDemoResultContainerd = document.documentElement.clientHeight - this.ResultDemographicTabTitle.offsetTop - 55;
                        esriCTShowDemoResultStylesd = { height: esriCTShowDemoResultContainerd + "px" };
                        domAttr.set(this.DemoInfoMainDiv, "style", esriCTShowDemoResultStylesd);
                        this.resizeScrollbar(this.DemoInfoMainScrollbar, this.DemoInfoMainDiv, this.DemoInfoMainDivContent);
                    }
                }));
            }
        },

        /**
        * Validate the numeric text box control
        * @param {object} from node
        * @param {object} to node
        * @param {object} check box
        * @memberOf widgets/Sitelocator/GeoEnrichment
        */
        _fromToDatachangeHandler: function (fromNode, toNode, checkBox) {
            var arrFilter, i;
            if (checkBox.checked) {
                if (!isNaN(Number(fromNode.getAttribute("FieldValue"))) && !isNaN(Number(toNode.getAttribute("FieldValue"))) && Number(fromNode.getAttribute("FieldValue")) >= 0 && Number(toNode.getAttribute("FieldValue")) >= 0 && Number(toNode.getAttribute("FieldValue")) >= Number(fromNode.getAttribute("FieldValue")) && fromNode.value !== "" && toNode.value !== "") {
                    if (!dojo.toFromBussinessFilter) {
                        dojo.toFromBussinessFilter = checkBox.value + "," + fromNode.getAttribute("FieldValue") + "," + toNode.getAttribute("FieldValue");
                    } else {
                        arrFilter = dojo.toFromBussinessFilter.split("$");
                        for (i = 0; i < arrFilter.length; i++) {
                            if (arrFilter[i].toString().split(checkBox.value).length > 1) {
                                arrFilter.splice(i, 1);
                            }
                        }
                        if (arrFilter.length > 0) {
                            dojo.toFromBussinessFilter = arrFilter.join("$");
                            dojo.toFromBussinessFilter += "$" + checkBox.value + "," + fromNode.getAttribute("FieldValue") + "," + toNode.getAttribute("FieldValue");
                        } else {
                            dojo.toFromBussinessFilter = checkBox.value + "," + fromNode.getAttribute("FieldValue") + "," + toNode.getAttribute("FieldValue");
                        }
                    }
                    if (checkBox.value === "_SALES") {
                        this.revenueData.length = 0;
                        this.salesFinalData = this._checkForValue(checkBox.value, fromNode.getAttribute("FieldValue"), toNode.getAttribute("FieldValue"));
                        this._calculateSum(this.salesFinalData);
                        this._setBusinessValues(this.salesFinalData, this.mainResultDiv, this.enrichData);
                    } else {
                        this.employeeData.length = 0;
                        this.employeFinalData = this._checkForValue(checkBox.value, fromNode.getAttribute("FieldValue"), toNode.getAttribute("FieldValue"));
                        this._calculateSum(this.employeFinalData);
                        this._setBusinessValues(this.employeFinalData, this.mainResultDiv, this.enrichData);
                    }
                } else {
                    if (dojo.toFromBussinessFilter) {
                        arrFilter = dojo.toFromBussinessFilter.split("$");
                        for (i = 0; i < arrFilter.length; i++) {
                            if (arrFilter[i].toString().split(checkBox.value).length > 1) {
                                arrFilter.splice(i, 1);
                            }
                        }
                    }
                    toNode.value = "";
                    fromNode.value = "";
                    this._clearCommunitiesAndBusinessResults(this.workflowCount);
                    alert(sharedNls.errorMessages.invalidInput);
                }
            } else if (fromNode.getAttribute("FieldValue") && toNode.getAttribute("FieldValue")) {
                if (dojo.toFromBussinessFilter) {
                    arrFilter = dojo.toFromBussinessFilter.split("$");
                    for (i = 0; i < arrFilter.length; i++) {
                        if (arrFilter[i].toString().split(checkBox.value).length > 1) {
                            arrFilter.splice(i, 1);
                        }
                    }
                    dojo.toFromBussinessFilter = arrFilter.join("$");
                }
                if (checkBox.value === "_SALES") {
                    this.revenueData.length = 0;
                    this.salesFinalData.length = 0;
                    toNode.value = "";
                    fromNode.value = "";
                } else {
                    this.employeeData.length = 0;
                    this.employeFinalData.length = 0;
                    toNode.value = "";
                    fromNode.value = "";
                }
                if (this.salesFinalData.length > 0) {
                    this._calculateSum(this.salesFinalData);
                    this._setBusinessValues(this.salesFinalData, this.mainResultDiv, this.enrichData);
                } else if (this.employeFinalData.length > 0) {
                    this._calculateSum(this.employeFinalData);
                    this._setBusinessValues(this.employeFinalData, this.mainResultDiv, this.enrichData);
                } else if (this.businessData.length > 0) {
                    this._setBusinessValues(this.businessData, this.mainResultDiv, this.enrichData);
                    this._calculateSum(this.businessData);
                }
            }
        },

        /**
        * Validate the check boxvalue
        * @param {object} Check box value
        * @param {object} From text input node
        * @param {object} To text input node
        * @return {array} result data between filtering values
        * @memberOf widgets/Sitelocator/GeoEnrichment
        */
        _checkForValue: function (checkBoxValue, fromNode, toNode) {
            var resultData = [], checkedValue = "", i, fieldName, isLength;
            if (this.employeeData.length === 0 && this.revenueData.length === 0) {
                if (this.totalArray.length > 0) {
                    for (i = 0; i < this.totalArray.length; i++) {
                        if (this.totalArray[i].Revenue.FieldName.indexOf(checkBoxValue) > -1) {
                            fieldName = this.totalArray[i].Revenue;
                            checkedValue = "Revenue";
                        }
                        if (this.totalArray[i].Employe.FieldName.indexOf(checkBoxValue) > -1) {
                            fieldName = this.totalArray[i].Employe;
                            checkedValue = "Employee";
                        }
                        if (fieldName.FieldName.indexOf(checkBoxValue) > -1) {
                            if (fieldName.Value >= parseInt(fromNode, 10) && fieldName.Value <= parseInt(toNode, 10)) {
                                if (checkedValue === "Employee") {
                                    this.employeeData.push(this.totalArray[i]);
                                } else {
                                    this.revenueData.push(this.totalArray[i]);
                                }
                                resultData.push({ DisplayField: this.totalArray[i].Bus.DisplayField, Count: this.totalArray[i].Bus.Value, Revenue: this.totalArray[i].Revenue.Value, Employees: this.totalArray[i].Employe.Value });
                            }
                        }
                    }
                }
            } else if (this.employeeData.length > 0) {
                isLength = true;
                for (i = 0; i < this.employeeData.length; i++) {
                    if (this.employeeData[i].Revenue.FieldName.indexOf(checkBoxValue) > -1) {
                        if (this.employeeData[i].Revenue.Value >= parseInt(fromNode, 10) && this.employeeData[i].Revenue.Value <= parseInt(toNode, 10)) {
                            if (isLength) {
                                this.revenueData.length = 0;
                                isLength = false;
                            }
                            this.revenueData.push(this.employeeData[i]);
                            resultData.push({ DisplayField: this.employeeData[i].Bus.DisplayField, Count: this.employeeData[i].Bus.Value, Revenue: this.employeeData[i].Revenue.Value, Employees: this.employeeData[i].Employe.Value });
                        }
                    }

                }
            } else if (this.revenueData.length > 0) {
                isLength = true;
                for (i = 0; i < this.revenueData.length; i++) {
                    if (this.revenueData[i].Employe.FieldName.indexOf(checkBoxValue) > -1) {
                        if (this.revenueData[i].Employe.Value >= parseInt(fromNode, 10) && this.revenueData[i].Employe.Value <= parseInt(toNode, 10)) {
                            if (isLength) {
                                this.employeeData.length = 0;
                                isLength = false;
                            }
                            this.employeeData.push(this.revenueData[i]);
                            resultData.push({ DisplayField: this.revenueData[i].Bus.DisplayField, Count: this.revenueData[i].Bus.Value, Revenue: this.revenueData[i].Revenue.Value, Employees: this.revenueData[i].Employe.Value });
                        }
                    }
                }

            } else {
                resultData.length = 0;
            }
            return resultData;
        },

        /**
        * Perform spatial analysis to check if geometry for enrichment is intersected by web map extent
        * @param {object} Geometry used to perform enrichment analysis
        * @param {Number} Count of tab(workflow)
        * @param {object} parameter for standard search
        * @memberOf widgets/Sitelocator/GeoEnrichment
        */
        _enrichData: function (geometry, workflowCount, standardSearchCandidate) {
            var geometryService, relationParams, standardGeoQueryURL, standardGeoQueryRequest;
            // If enrich data contain geometry call show buffer function
            if (geometry) {
                // Checking for business workflow
                if (workflowCount === 2) {
                    this.showBuffer(geometry);
                    this._clearBusinessData();
                }
                geometryService = new GeometryService(dojo.configData.GeometryService.toString());
                relationParams = new RelationParameters();
                relationParams.relation = RelationParameters.SPATIAL_REL_INTERSECTION;
                relationParams.geometries1 = geometry;
                relationParams.geometries2 = [dojo.webMapExtent];
                geometryService.relation(relationParams).then(lang.hitch(this, function (obj) {
                    if (obj.length > 0) {
                        this._enrichDataRequest(geometry, workflowCount, standardSearchCandidate);
                    } else {
                        topic.publish("hideProgressIndicator");
                        this._clearCommunitiesAndBusinessResults(workflowCount);
                        alert(sharedNls.errorMessages.geometryIntersectError);
                    }
                }), function (Error) {
                    topic.publish("hideProgressIndicator");
                    this._clearCommunitiesAndBusinessResults(workflowCount);
                    alert(sharedNls.errorMessages.geometryIntersectError);
                });
            } else {
                dojo.standerdGeoQueryAttribute = standardSearchCandidate.attributes.CountryAbbr + "," + standardSearchCandidate.attributes.DataLayerID + "," + standardSearchCandidate.attributes.AreaID;
                standardGeoQueryURL = dojo.configData.GeoEnrichmentService + "/StandardGeographyQuery/execute";
                standardGeoQueryRequest = esriRequest({
                    url: standardGeoQueryURL,
                    content: {
                        f: "pjson",
                        outSR: this.map.spatialReference.wkid,
                        sourceCountry: standardSearchCandidate.attributes.CountryAbbr,
                        geographylayers: standardSearchCandidate.attributes.DataLayerID,
                        geographyids: [standardSearchCandidate.attributes.AreaID],
                        returnGeometry: true
                    },
                    handleAs: "json"
                });
                standardGeoQueryRequest.then(lang.hitch(this, function (data) {
                    var geometryPoly = new Polygon();
                    if (data.results && data.results[0] && data.results[0].value && data.results[0].value.features[0] && data.results[0].value.features[0].geometry) {
                        geometryPoly.rings = data.results[0].value.features[0].geometry.rings;
                        geometryPoly.setSpatialReference(this.map.spatialReference);
                        this.lastGeometry[this.workflowCount] = [geometryPoly];
                        this.map.getLayer("esriGraphicsLayerMapSettings").clear();
                        this.showBuffer([geometryPoly]);
                        this._enrichData([geometryPoly], workflowCount, null);
                    } else {
                        topic.publish("hideProgressIndicator");
                        alert(sharedNls.errorMessages.invalidSearch);
                    }
                }), function (error) {
                    topic.publish("hideProgressIndicator");
                    alert(error.message);
                });
            }

        },
        /**
        * Clear info Panel for Communities and Business Tab
        * @param {Number} index of current tab(workflow)
        * @memberOf widgets/Sitelocator/GeoEnrichment
        */

        _clearCommunitiesAndBusinessResults: function (workflowCount) {
            if (workflowCount === 2) {
                domStyle.set(this.divBusinessResult, "display", "none");
                domStyle.set(this.sortByDiv, "display", "none");
                domStyle.set(this.downloadDiv, "display", "none");
                domStyle.set(this.resultDiv, "display", "none");
            } else {
                domConstruct.empty(this.communityMainDiv);
                this.comunitiesDemoInfoMainScrollbar = null;
                dojo.communitySelectionFeature = null;
            }
        },


        /**
        * Perform data enrichment based on parameters, calling geoenrichment service, setting analysis variables on the basis of workflow count and call geoenrichment handler
        * @param {object} Geometry used to perform enrichment analysis
        * @param {Number} Count of tab(workflow)
        * @param {object} parameter for standard search
        * @memberOf widgets/Sitelocator/GeoEnrichment
        */
        _enrichDataRequest: function (geometry, workflowCount, standardSearchCandidate) {
            var studyAreas, requestContent, enrichUrl, geoEnrichmentRequest, dataCollections, analysisVariables, i, isRetunrnGeometry = true;
            try {
                // Set the study areas for Building, Sites and Business workflow
                if (geometry !== null && workflowCount !== 3) {
                    studyAreas = [{ "geometry": { "rings": geometry[0].rings, "spatialReference": { "wkid": this.map.spatialReference.wkid} }, "attributes": { "id": "Polygon 1", "name": "Optional Name 1"}}];
                    this.arrStudyAreas[this.workflowCount] = studyAreas;
                }
                enrichUrl = dojo.configData.GeoEnrichmentService + "/GeoEnrichment/enrich";
                // Check Workflow count for all workflows
                switch (workflowCount) {
                case 0:
                    //Set the analysis variables for Building workflow
                    analysisVariables = this._setAnalysisVariables(dojo.configData.Workflows[workflowCount].InfoPanelSettings.GeoEnrichmentContents.DisplayFields);
                    geoEnrichmentRequest = esriRequest({
                        url: enrichUrl,
                        content: {
                            f: "pjson",
                            inSR: this.map.spatialReference.wkid,
                            outSR: this.map.spatialReference.wkid,
                            analysisVariables: JSON.stringify(analysisVariables.analysisVariable),
                            studyAreas: JSON.stringify(studyAreas)
                        },
                        handleAs: "json"
                    });
                    break;
                case 1:
                    //Set the analysis variables for Sites workflow
                    analysisVariables = this._setAnalysisVariables(dojo.configData.Workflows[workflowCount].InfoPanelSettings.GeoEnrichmentContents.DisplayFields);
                    geoEnrichmentRequest = esriRequest({
                        url: enrichUrl,
                        content: {
                            f: "pjson",
                            inSR: this.map.spatialReference.wkid,
                            outSR: this.map.spatialReference.wkid,
                            analysisVariables: JSON.stringify(analysisVariables.analysisVariable),
                            studyAreas: JSON.stringify(studyAreas)
                        },
                        handleAs: "json"
                    });
                    break;
                case 2:
                    //Checking whether demographic results exists and setting analysis variables for Demographic tab in Business workflow
                    if (this.businessTabScrollbar && !this.DemoInfoMainScrollbar) {
                        analysisVariables = this._setAnalysisVariables(dojo.configData.Workflows[workflowCount].InfoPanelSettings.GeoEnrichmentContents[1].DisplayFields);
                        requestContent = {
                            f: "pjson",
                            inSR: this.map.spatialReference.wkid,
                            outSR: this.map.spatialReference.wkid,
                            analysisVariables: JSON.stringify(analysisVariables.analysisVariable),
                            studyAreas: JSON.stringify(studyAreas)
                        };
                    } else {
                        //Set analysis variables for business tab in business workflow
                        analysisVariables = {};
                        analysisVariables.analysisVariable = [];
                        for (i = 0; i < dojo.configData.Workflows[workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessSummaryFields.length; i++) {
                            if (dojo.configData.Workflows[workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessSummaryFields[i].FieldName) {
                                analysisVariables.analysisVariable.push(dojo.configData.Workflows[workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessSummaryFields[i].FieldName);
                            }
                        }
                        dataCollections = dojo.configData.Workflows[workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessDataCollectionName;
                        requestContent = {
                            f: "pjson",
                            inSR: this.map.spatialReference.wkid,
                            outSR: this.map.spatialReference.wkid,
                            dataCollections: JSON.stringify(dataCollections),
                            analysisVariables: JSON.stringify(analysisVariables.analysisVariable),
                            studyAreas: JSON.stringify(studyAreas)
                        };
                    }
                    geoEnrichmentRequest = esriRequest({
                        url: enrichUrl,
                        content: requestContent,
                        handleAs: "json"
                    });
                    break;
                case 3:
                    // Setting analysis variables for Communities Tab
                    // If geometry is equal to null then set the study areas for Communities Tab
                    if (geometry === null) {
                        studyAreas = [{ "sourceCountry": standardSearchCandidate.attributes.CountryAbbr, "layer": standardSearchCandidate.attributes.DataLayerID, "ids": [standardSearchCandidate.attributes.AreaID]}];
                        this.arrStudyAreas[this.workflowCount] = studyAreas;
                        this.map.getLayer("esriGraphicsLayerMapSettings").clear();
                        this.featureGeometry[this.workflowCount] = null;
                    } else if (geometry[0].type === "polygon") {
                        isRetunrnGeometry = false;
                        this.lastGeometry[this.workflowCount] = geometry;
                        this.map.getLayer("esriGraphicsLayerMapSettings").clear();
                        this.featureGeometry[this.workflowCount] = null;
                        this.showBuffer(geometry);
                        studyAreas = [{ "geometry": { "rings": geometry[0].rings, "spatialReference": { "wkid": this.map.spatialReference.wkid} }, "attributes": { "id": "Polygon 1", "name": "Optional Name 1"}}];
                        this.arrStudyAreas[this.workflowCount] = studyAreas;
                    } else {
                        studyAreas = [{ "geometry": { "x": geometry[0].x, "y": geometry[0].y }, "spatialReference": { "wkid": this.map.spatialReference.wkid}}];
                        this.arrStudyAreas[this.workflowCount] = studyAreas;
                    }
                    analysisVariables = this._setAnalysisVariables(dojo.configData.Workflows[workflowCount].FilterSettings.InfoPanelSettings.GeoEnrichmentContents.DisplayFields);
                    geoEnrichmentRequest = esriRequest({
                        url: enrichUrl,
                        content: {
                            f: "pjson",
                            inSR: this.map.spatialReference.wkid,
                            outSR: this.map.spatialReference.wkid,
                            analysisVariables: JSON.stringify(analysisVariables.analysisVariable),
                            studyAreas: JSON.stringify(studyAreas),
                            returnGeometry: isRetunrnGeometry
                        },
                        handleAs: "json"
                    });
                    break;
                }
                /**
                * Geoenrichment result handler
                * @param {object} result data for geoenrichment request
                * @memberOf widgets/Sitelocator/GeoEnrichment
                */
                geoEnrichmentRequest.then(lang.hitch(this, this._geoEnrichmentRequestHandler),
                    function (error) {
                        topic.publish("hideProgressIndicator");
                        alert(error.message);
                    }
                        );
            } catch (Error) {
                topic.publish("hideProgressIndicator");
            }

        },

        /**
        * Geoenrichment result handler
        * @param {object} result data for geoenrichment request
        * @memberOf widgets/Sitelocator/GeoEnrichment
        */
        _geoEnrichmentRequestHandler: function (data, id) {
            topic.publish("hideProgressIndicator");
            var headerInfo, enrichGeo, attachMentNode, image, esriCTBuildingSitesResultContainer, geometryService, esriCTSitesResultContainer, esriCTBuildingSitesResultStyles, geoenrichtOuterDiv, geoenrichtOuterDivContent, esriCTSitesResultStyles;
            if (!id && this.arrGeoenrichData[this.workflowCount]) {
                this.arrGeoenrichData[this.workflowCount][this.arrGeoenrichData[this.workflowCount].length - 1].data = data;
            }
            // Set attachment images for buildings and sites tab after clicking the features of building and sites Tab
            if ((this.workflowCount === 0 || this.workflowCount === 1) && data) {
                if (this.workflowCount === 0) {
                    attachMentNode = this.attachmentOuterDiv;
                } else {
                    attachMentNode = this.attachmentOuterDivSites;
                }
                domConstruct.create("div", { "class": "esriCTHorizantalLine" }, attachMentNode);
                headerInfo = domConstruct.create("div", { "class": "esriCTHeaderInfoDiv" }, attachMentNode);
                domAttr.set(headerInfo, "innerHTML", dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents.DisplayTitle);
                geoenrichtOuterDiv = domConstruct.create("div", { "class": "esriCTDemoInfoMainDiv" }, attachMentNode);
                geoenrichtOuterDivContent = domConstruct.create("div", { "class": "esriCTDemoInfoMainDivBuildingContent" }, geoenrichtOuterDiv);
                this._getDemographyResult(data, dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents, geoenrichtOuterDivContent);
                image = query('img', attachMentNode)[0];
                // If attachment image not found in buildings and sites tab then set the height of div
                if (!image) {
                    domStyle.set(geoenrichtOuterDiv, "height", "363px");

                } else {
                    domStyle.set(geoenrichtOuterDiv, "height", "163px");
                }
                if (this.buildingDemoInfoMainScrollbar) {
                    this.buildingDemoInfoMainScrollbar.removeScrollBar();
                }
                if (this.sitesDemoInfoMainScrollbar) {
                    this.sitesDemoInfoMainScrollbar.removeScrollBar();
                }
                if (this.workflowCount === 0) {
                    esriCTBuildingSitesResultContainer = document.documentElement.clientHeight - geoenrichtOuterDiv.offsetTop;
                    esriCTBuildingSitesResultStyles = { height: esriCTBuildingSitesResultContainer + "px" };
                    domAttr.set(geoenrichtOuterDiv, "style", esriCTBuildingSitesResultStyles);
                    this.buildingDemoInfoMainScrollbar = new ScrollBar({ domNode: geoenrichtOuterDiv });
                    this.buildingDemoInfoMainScrollbar.setContent(geoenrichtOuterDivContent);
                    this.buildingDemoInfoMainScrollbar.createScrollBar();
                    on(window, "resize", lang.hitch(this, function () {
                        this._resizeBuildingPanel(geoenrichtOuterDiv, geoenrichtOuterDivContent);
                    }));
                }
                if (this.workflowCount === 1) {
                    esriCTSitesResultContainer = document.documentElement.clientHeight - geoenrichtOuterDiv.offsetTop;
                    esriCTSitesResultStyles = { height: esriCTSitesResultContainer + "px" };
                    domAttr.set(geoenrichtOuterDiv, "style", esriCTSitesResultStyles);
                    this.sitesDemoInfoMainScrollbar = new ScrollBar({ domNode: geoenrichtOuterDiv });
                    this.sitesDemoInfoMainScrollbar.setContent(geoenrichtOuterDivContent);
                    this.sitesDemoInfoMainScrollbar.createScrollBar();
                    on(window, "resize", lang.hitch(this, function () {
                        this._resizeSitesPanel(geoenrichtOuterDiv, geoenrichtOuterDivContent);
                    }));
                }
            }
            if (this.workflowCount === 2) {
                this.ResultBusinessTabTitle.innerHTML = dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].DisplayTitle;
                this.ResultDemographicTabTitle.innerHTML = dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[1].DisplayTitle;
                this.demographicContainerTitle.innerHTML = dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[1].DisplayTitle;
                domStyle.set(this.resultDiv, "display", "block");
                // If business results are available then call the get demographic result handler(set demographic data result) in business workflow
                if (this.businessTabScrollbar) {
                    this._getDemographyResult(data, dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[1], this.DemoInfoMainDivContent);
                } else {
                    // Set the business data in business workflow
                    this._setResultData(data);
                }
            }
            if (this.workflowCount === 3) {
                if (data.results[0].value.FeatureSet[0].features.length > 0) {
                    this.featureGraphics[this.workflowCount] = null;
                    if (data.results[0].value.FeatureSet[0].features[0].geometry) {
                        topic.publish("showProgressIndicator");
                        enrichGeo = new Polygon(data.results[0].value.FeatureSet[0].features[0].geometry);
                        enrichGeo.spatialReference = this.map.spatialReference;
                        geometryService = new GeometryService(dojo.configData.GeometryService.toString());
                        geometryService.intersect([enrichGeo], dojo.webMapExtent, lang.hitch(this, function (interSectGeometry) {
                            topic.publish("hideProgressIndicator");
                            this.lastGeometry[this.workflowCount] = [enrichGeo];
                            this.showBuffer([enrichGeo]);
                            if (interSectGeometry[0].rings.length > 0) {
                                this._setComunitiesEnrichData(data);
                            } else {
                                alert(sharedNls.errorMessages.geometryIntersectError);
                            }
                        }), lang.hitch(this, function (Error) {
                            topic.publish("hideProgressIndicator");
                            alert(sharedNls.errorMessages.geometryIntersectError);
                        }));

                    } else {
                        this._setComunitiesEnrichData(data);
                    }

                } else {
                    this.map.graphics.clear();
                    this.map.getLayer("esriBufferGraphicsLayer").clear();
                    alert(sharedNls.errorMessages.invalidSearch);
                }
            }
        },

        /**
        * Set Geoenrichment data for communities tab
        * @param {object} Geoenrichment result data
        * @memberOf widgets/Sitelocator/GeoEnrichment
        */
        _setComunitiesEnrichData: function (data) {
            var esriCTDemoGraphicContHeight, esriCTDemoGraphicContStyle, geoenrichtOuterDiv, geoenrichtOuterDivContent;
            domConstruct.empty(this.communityMainDiv);
            domConstruct.create("div", { "class": "esriCTCommunityTitleDiv", "innerHTML": dojo.configData.Workflows[this.workflowCount].FilterSettings.InfoPanelSettings.GeoEnrichmentContents.DisplayTitle }, this.communityMainDiv);
            this._downloadDropDown(dojo.configData.Workflows[this.workflowCount].FilterSettings.InfoPanelSettings.DownloadSettings, this.communityMainDiv);
            geoenrichtOuterDiv = domConstruct.create("div", { "class": "esriCTDemoInfoMainDiv" }, this.communityMainDiv);
            geoenrichtOuterDivContent = domConstruct.create("div", { "class": "esriCTDemoInfoMainDivBuildingContent" }, geoenrichtOuterDiv);
            this._getDemographyResult(data, dojo.configData.Workflows[this.workflowCount].FilterSettings.InfoPanelSettings.GeoEnrichmentContents, geoenrichtOuterDivContent);
            if (this.comunitiesDemoInfoMainScrollbar) {
                this.comunitiesDemoInfoMainScrollbar.removeScrollBar();
            }
            esriCTDemoGraphicContHeight = document.documentElement.clientHeight - geoenrichtOuterDiv.offsetTop;
            esriCTDemoGraphicContStyle = { height: esriCTDemoGraphicContHeight + "px" };
            domAttr.set(geoenrichtOuterDiv, "style", esriCTDemoGraphicContStyle);
            this.comunitiesDemoInfoMainScrollbar = new ScrollBar({ domNode: geoenrichtOuterDiv });
            this.comunitiesDemoInfoMainScrollbar.setContent(geoenrichtOuterDivContent);
            this.comunitiesDemoInfoMainScrollbar.createScrollBar();
            on(window, "resize", lang.hitch(this, function () {
                var esriCTDemoResultContainerd, esriCTDemoResultStylesd;
                esriCTDemoResultContainerd = document.documentElement.clientHeight - geoenrichtOuterDiv.offsetTop;
                esriCTDemoResultStylesd = { height: esriCTDemoResultContainerd + "px" };
                domAttr.set(geoenrichtOuterDiv, "style", esriCTDemoResultStylesd);
                this.resizeScrollbar(this.comunitiesDemoInfoMainScrollbar, geoenrichtOuterDiv, geoenrichtOuterDivContent);
            }));

        },

        /**
        * Set analysis variable for Geoenrichment
        * @param {array} Field confugerd in config.js for geoenrichment variables
        * @param {array} Data collection confugerd in config.js for geoenrichment variables
        * @return {Collection} geoenrichment variable for display field
        * @memberOf widgets/Sitelocator/GeoEnrichment
        */
        _setAnalysisVariables: function (arrDisplayFields) {
            var arrStringFields = [], strDisplayFields = [], i;
            for (i = 0; i < arrDisplayFields.length; i++) {
                strDisplayFields.push(arrDisplayFields[i].DisplayText);
                arrStringFields.push(arrDisplayFields[i].FieldName);
            }
            return { analysisVariable: arrStringFields, displayField: strDisplayFields };
        },

        /**
        * Get demographic data from geoenrichment result and add item to specified html node
        * @param {object} Geoenrichment result
        * @param {array} field used to denote demographic information
        * @param {object} HTML node on used to display demography data
        * @memberOf widgets/Sitelocator/GeoEnrichment
        */
        _getDemographyResult: function (geoEnrichData, Geoenerichfield, demoNode) {
            var arrDemographyDataCount = 0, fieldKey, i, displayFieldDiv, valueDiv, demographicInfoContent, field = Geoenerichfield.DisplayFields, aarReportData = [];
            domConstruct.empty(demoNode);
            for (i = 0; i < field.length; i++) {
                fieldKey = field[i].FieldName.split(".")[1];
                if (geoEnrichData.results[0].value.FeatureSet[0].features[0].attributes[fieldKey] !== undefined) {
                    arrDemographyDataCount++;
                    demographicInfoContent = domConstruct.create("div", { "class": "esriCTdemographicInfoPanel" }, demoNode);
                    displayFieldDiv = domConstruct.create("div", { "class": "esriCTDemograpicCollectonName" }, demographicInfoContent);
                    displayFieldDiv.innerHTML = field[i].DisplayText;
                    valueDiv = domConstruct.create("div", { "class": "esriCTDemographicCollectonValue" }, demographicInfoContent);
                    if (isNaN(geoEnrichData.results[0].value.FeatureSet[0].features[0].attributes[fieldKey])) {
                        valueDiv.innerHTML = geoEnrichData.results[0].value.FeatureSet[0].features[0].attributes[fieldKey];
                        aarReportData.push(field[i].DisplayText + ":" + valueDiv.innerHTML);
                    } else {
                        valueDiv.innerHTML = this._getUnit(geoEnrichData, fieldKey) + number.format(geoEnrichData.results[0].value.FeatureSet[0].features[0].attributes[fieldKey], { places: 0 });
                        aarReportData.push(field[i].DisplayText + ":" + valueDiv.innerHTML);
                    }
                }
            }
            if (this.arrReportDataJson[this.workflowCount]) {
                this.arrReportDataJson[this.workflowCount].reportData[Geoenerichfield.DisplayTitle.toString()] = aarReportData;
            }
            if (arrDemographyDataCount === 0) {

                if (this.workflowCount === 3) {
                    domConstruct.empty(this.communityMainDiv);
                    alert(sharedNls.errorMessages.invalidSearch);
                }
            }
        },

        /**
        * Gets units for demography data from geoenrichment result
        * @param {object} Geoenrichment result
        * @param {array} field used to denote demography
        * @return {string} unit for collection ids
        * @memberOf widgets/Sitelocator/GeoEnrichment
        */
        _getUnit: function (data, field) {
            var i, strUnit = "";
            for (i = 0; i < data.results[0].value.FeatureSet[0].fields.length; i++) {
                if (data.results[0].value.FeatureSet[0].fields[i].units !== undefined) {
                    if (data.results[0].value.FeatureSet[0].fields[i].name === field) {
                        if (data.results[0].value.FeatureSet[0].fields[i][data.results[0].value.FeatureSet[0].fields[i].units]) {
                            strUnit = data.results[0].value.FeatureSet[0].fields[i][data.results[0].value.FeatureSet[0].fields[i].units];
                            break;
                        }
                    }
                }
            }
            return strUnit;
        },

        /**
        * Set geoenrichment result
        * @param {object} Geoenrichment result
        * @memberOf widgets/Sitelocator/GeoEnrichment
        */
        _setResultData: function (enrichData) {
            var arrfiledString = [], value, i, j, k, strFieldName, revenue, employee, bus, key, revenueObject = {}, employeeObject = {}, busObject = {}, t, isFromToChecked;
            this.arrBussinesResultData = [];
            this.totalArray = [];
            for (i = 0; i < dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessSummaryFields.length; i++) {
                strFieldName = dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessSummaryFields[i].FieldName.split(".")[1];
                this.divBusinessResult.children[i].children[0].innerHTML = dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessSummaryFields[i].DisplayText;
                this.divBusinessResult.children[i].children[1].innerHTML = this._getUnit(enrichData, strFieldName.toString()) + number.format(enrichData.results[0].value.FeatureSet[0].features[0].attributes[strFieldName.toString()], { places: 0 });
                if (dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessSummaryFields[i].FieldName.split(".")[0] === dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessDataCollectionName) {
                    arrfiledString.push(strFieldName.toString().split("_"));
                }
            }
            for (value in enrichData.results[0].value.FeatureSet[0].features[0].attributes) {
                if (enrichData.results[0].value.FeatureSet[0].features[0].attributes.hasOwnProperty(value)) {
                    for (j = 0; j < arrfiledString.length; j++) {
                        if (value.indexOf(arrfiledString[j][1].toString()) !== -1) {
                            this.arrBussinesResultData.push({ FieldName: value, Value: enrichData.results[0].value.FeatureSet[0].features[0].attributes[value], DisplayField: enrichData.results[0].value.FeatureSet[0].fieldAliases[value] });
                            break;
                        }
                    }
                }
            }
            for (i = 0; i < this.arrBussinesResultData.length; i++) {
                if (i > 2) {
                    for (j = 0; j < this.arrBussinesResultData.length; j++) {
                        if (this.arrBussinesResultData[i].FieldName.indexOf('N0' + j + "_SALES") > -1 || this.arrBussinesResultData[i].FieldName.indexOf('N' + j + "_SALES") > -1) {
                            revenueObject["N" + j] = this.arrBussinesResultData[i];
                            break;
                        }
                        if (this.arrBussinesResultData[i].FieldName.indexOf('N0' + j + "_EMP") > -1 || this.arrBussinesResultData[i].FieldName.indexOf('N' + j + "_EMP") > -1) {
                            employeeObject["N" + j] = this.arrBussinesResultData[i];
                            break;
                        }
                        if (this.arrBussinesResultData[i].FieldName.indexOf('N0' + j + "_BUS") > -1 || this.arrBussinesResultData[i].FieldName.indexOf('N' + j + "_BUS") > -1) {
                            busObject["N" + j] = this.arrBussinesResultData[i];
                            break;
                        }
                    }
                }
            }
            for (key in revenueObject) {
                if (revenueObject.hasOwnProperty(key)) {
                    revenue = revenueObject[key];
                    employee = employeeObject[key];
                    bus = busObject[key];
                    this.totalArray.push({
                        Revenue: revenue,
                        Employe: employee,
                        Bus: bus
                    });
                }
            }
            this.businessData = [];
            for (k = arrfiledString.length; k < this.arrBussinesResultData.length; k += arrfiledString.length) {
                if (this.arrBussinesResultData[k] && this.arrBussinesResultData[k + 1] && this.arrBussinesResultData[k + 2]) {
                    this.businessData.push({ DisplayField: this.arrBussinesResultData[k].DisplayField, Count: this.arrBussinesResultData[k].Value, Revenue: this.arrBussinesResultData[k + 1].Value, Employees: this.arrBussinesResultData[k + 2].Value });
                }
            }
            isFromToChecked = false;
            this.enrichData = enrichData;
            this.salesFinalData = [];
            this.employeFinalData = [];
            this.revenueData = [];
            this.employeFinalData = [];

            for (t = 0; t < query(".esriCTDivFromTo", this.revenueEmpFromToDiv).length; t++) {
                if (window.location.toString().split("$toFromBussinessFilter=").length > 1 && window.location.toString().split("$toFromBussinessFilter=")[1].split("$") && window.location.toString().split("$toFromBussinessFilter=")[1].split("$").length > 0) {
                    for (i = 0; i < window.location.toString().split("$toFromBussinessFilter=")[1].split("$").length; i++) {
                        for (t = 0; t < query(".esriCTDivFromTo", this.revenueEmpFromToDiv).length; t++) {
                            if (window.location.toString().split("$toFromBussinessFilter=")[1].split("$")[i].split(",")[0] === query(".esriCTChkBox", this.revenueEmpFromToDiv)[t].value) {
                                if (query(".esriCTChkBox", this.revenueEmpFromToDiv)[t].checked && Number(query(".esriCTToTextBoxFrom", this.revenueEmpFromToDiv)[t].value) >= 0 && Number(query(".esriCTToTextBoxTo", this.revenueEmpFromToDiv)[t].value) >= 0 && lang.trim(query(".esriCTToTextBoxFrom", this.revenueEmpFromToDiv)[t].value) !== "" && lang.trim(query(".esriCTToTextBoxTo", this.revenueEmpFromToDiv)[t].value) !== "") {
                                    this._fromToDatachangeHandler(query(".esriCTToTextBoxFrom", this.revenueEmpFromToDiv)[t], query(".esriCTToTextBoxTo", this.revenueEmpFromToDiv)[t], query(".esriCTChkBox", this.revenueEmpFromToDiv)[t]);
                                    isFromToChecked = true;
                                }
                            }

                        }
                    }
                }

            }
            if (!isFromToChecked) {
                this._setBusinessValues(this.businessData, this.mainResultDiv, enrichData);
            }
        },

        /**
        * Set geoenrichment result and add it to specified html node
        * @param {array} Aggregated data fromGeoenrichment result
        * @param {object} HTML node to be used to display geoenrichment result
        * @param {object} Geoenrichment result
        * @memberOf widgets/Sitelocator/GeoEnrichment
        */
        _setBusinessValues: function (arrData, node, enrichData) {
            var i, resultpanel, content, countRevenueEmpPanel, esriContainerHeight, esriContainerStyle, countRevenueEmp, count, countName, countValue, revenue, revenueName, revenuevalue, employee, empName, empValue;
            this._showBusinessTab();
            this.currentBussinessData = arrData;
            if (window.location.toString().split("$strBusinessSortData=").length > 1 && !this.isSharedSort) {
                this.isSharedSort = true;
                this.selectSortOption.set("value", window.location.toString().split("$strBusinessSortData=")[1].split("$")[0]);
            }
            domConstruct.empty(node);
            domConstruct.empty(this.downloadDiv);
            this._downloadDropDown(dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.DownloadSettings, this.downloadDiv);
            if (this.currentBussinessData) {
                resultpanel = domConstruct.create("div", { "class": "esriCTSortPanelHead" }, node);
                if (this.currentBussinessData.length !== 0) {
                    domStyle.set(this.divBusinessResult, "display", "block");
                    domStyle.set(this.sortByDiv, "display", "block");
                    domStyle.set(this.downloadDiv, "display", "block");
                    domStyle.set(this.resultDiv, "display", "block");
                    for (i = 0; i < this.currentBussinessData.length; i++) {
                        content = domConstruct.create("div", {}, resultpanel);
                        content.innerHTML = this.currentBussinessData[i].DisplayField;
                        countRevenueEmpPanel = domConstruct.create("div", { "class": "esriCTCountRevenueEmpPanel" }, content);
                        countRevenueEmp = domConstruct.create("div", { "class": "esriCTCountRevenueEmp" }, countRevenueEmpPanel);
                        count = domConstruct.create("div", { "class": "esriCTCount" }, countRevenueEmp);
                        countName = domConstruct.create("div", {}, count);
                        countName.innerHTML = dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].DisplayTextForBusinessCount;
                        countValue = domConstruct.create("div", {}, count);
                        countValue.innerHTML = number.format(this.currentBussinessData[i].Count, { places: 0 });
                        revenue = domConstruct.create("div", { "class": "esriCTRevenue" }, countRevenueEmp);
                        revenueName = domConstruct.create("div", {}, revenue);
                        revenueName.innerHTML = dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessSummaryFields[1].DisplayText;
                        revenuevalue = domConstruct.create("div", {}, revenue);
                        revenuevalue.innerHTML = this._getUnit(enrichData, dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessSummaryFields[1].FieldName.split(".")[1]) + number.format(this.currentBussinessData[i].Revenue, { places: 0 });
                        employee = domConstruct.create("div", { "class": "esriCTEmployee" }, countRevenueEmp);
                        empName = domConstruct.create("div", { "class": "esriCTNoOfEmployeeHeader" }, employee);
                        empName.innerHTML = dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessSummaryFields[2].DisplayText;
                        empValue = domConstruct.create("div", { "class": "esriCTNoOfEmployee" }, employee);
                        empValue.innerHTML = number.format(this.currentBussinessData[i].Employees, { places: 0 });
                    }
                    esriContainerHeight = document.documentElement.clientHeight - node.offsetTop;
                    esriContainerStyle = { height: esriContainerHeight + "px" };
                    domAttr.set(node, "style", esriContainerStyle);
                    this.businessTabScrollbar = new ScrollBar({ domNode: node });
                    this.businessTabScrollbar.setContent(resultpanel);
                    this.businessTabScrollbar.createScrollBar();
                    on(window, "resize", lang.hitch(this, function () {
                        if (node.offsetTop > 0) {
                            var esriCTBusinessResultContainerd, esriCTBusinessResultStylesd;
                            esriCTBusinessResultContainerd = document.documentElement.clientHeight - node.offsetTop - 4;
                            esriCTBusinessResultStylesd = { height: esriCTBusinessResultContainerd + "px" };
                            domAttr.set(node, "style", esriCTBusinessResultStylesd);
                            this.resizeScrollbar(this.businessTabScrollbar, node, resultpanel);
                        }
                    }));
                } else {
                    domStyle.set(this.divBusinessResult, "display", "none");
                    domStyle.set(this.sortByDiv, "display", "none");
                    domStyle.set(this.downloadDiv, "display", "none");
                    domStyle.set(this.resultDiv, "display", "none");
                    dojo.toFromBussinessFilter = null;
                    dojo.businessSortData = null;
                    alert(sharedNls.errorMessages.invalidSearch);
                }
            }
        },


        /**
        * Download drop down for all tab
        * @memberOf widgets/Sitelocator/GeoEnrichment
        */
        _downloadDropDown: function (arrDwnloadDisplayFieldValue, node) {
            var outerDownloadDiv, selectDownloadList, innerDownloadDiv, innerDownloadLabel, selectedValue, sortContentDivDownload, i, selectForDownload, sortingDivDwnload, areaSortBuildingDownload = [];
            outerDownloadDiv = domConstruct.create("div", { "class": "esriCTouterDownloadDiv" }, node);
            sortingDivDwnload = domConstruct.create("div", { "class": "esriCTInnerSelectBoxDiv" }, outerDownloadDiv);
            innerDownloadDiv = domConstruct.create("div", { "class": "esriCTInnerDownloadDiv" }, outerDownloadDiv);
            innerDownloadLabel = domConstruct.create("label", {}, innerDownloadDiv);
            domAttr.set(innerDownloadLabel, "innerHTML", sharedNls.titles.textDownload);

            sortContentDivDownload = domConstruct.create("div", {}, sortingDivDwnload);
            selectForDownload = domConstruct.create("div", { "class": "esriCTSelect" }, sortContentDivDownload);
            areaSortBuildingDownload.push({ "label": sharedNls.titles.select, "value": sharedNls.titles.select });
            for (i = 0; i < arrDwnloadDisplayFieldValue.length; i++) {
                if (arrDwnloadDisplayFieldValue[i].DisplayOptionTitle) {
                    areaSortBuildingDownload.push({ "label": arrDwnloadDisplayFieldValue[i].DisplayOptionTitle, "value": i.toString() });
                }
            }
            selectDownloadList = new SelectList({
                options: areaSortBuildingDownload,
                maxHeight: 50
            }, selectForDownload);

            this.own(on(selectDownloadList, "change", lang.hitch(this, function (value) {
                selectedValue = value;
            })));

            this.own(on(innerDownloadDiv, "click", lang.hitch(this, function () {
                var form, postData, fileTypeInput, reportInput, studyAreasInput, gp, params, webMapJsonData, spatialRefernceData;
                try {
                    if (selectedValue && selectedValue !== sharedNls.titles.select) {
                        if (arrDwnloadDisplayFieldValue[selectedValue].GeoEnrichmentReportName) {
                            form = document.createElement("form");
                            spatialRefernceData = document.createElement("input");
                            postData = document.createElement("input");
                            fileTypeInput = document.createElement("input");
                            reportInput = document.createElement("input");
                            studyAreasInput = document.createElement("input");
                            form.method = "POST";
                            form.action = dojo.configData.ProxyUrl + "?" + dojo.configData.GeoEnrichmentService + "/GeoEnrichment/CreateReport";
                            form.target = "_blank";
                            postData.value = "bin";
                            postData.name = "f";
                            spatialRefernceData.value = this.map.spatialReference.wkid.toString();
                            spatialRefernceData.name = "inSR";
                            fileTypeInput.value = arrDwnloadDisplayFieldValue[selectedValue].Filetype;
                            fileTypeInput.name = "format";
                            reportInput.value = arrDwnloadDisplayFieldValue[selectedValue].GeoEnrichmentReportName.toString();
                            reportInput.name = "report";
                            studyAreasInput.value = JSON.stringify(this.arrStudyAreas[this.workflowCount]);
                            studyAreasInput.name = "studyAreas";
                            form.appendChild(spatialRefernceData);
                            form.appendChild(postData);
                            form.appendChild(fileTypeInput);
                            form.appendChild(reportInput);
                            form.appendChild(studyAreasInput);
                            document.body.appendChild(form);
                            form.submit();
                            selectDownloadList.reset();
                            selectedValue = null;
                        } else {
                            if (arrDwnloadDisplayFieldValue[selectedValue].GeoProcessingServiceURL) {
                                dojo.downloadWindow = window.open(dojoConfig.baseURL.toString() + "/downloadTemplate.htm", "_blank");
                                topic.publish("showProgressIndicator");
                                if (this.featureGraphics[this.workflowCount]) {
                                    this.map.setLevel(dojo.configData.ZoomLevel);
                                    this.map.centerAt(this.featureGraphics[this.workflowCount].geometry);
                                }
                                webMapJsonData = this._createMapJsonData();
                                params = {
                                    "Logo": dojoConfig.baseURL + dojo.configData.ApplicationIcon.toString(),
                                    "WebMap_Json": JSON.stringify(webMapJsonData),
                                    "Report_Title": arrDwnloadDisplayFieldValue[selectedValue].DisplayOptionTitle.toString(),
                                    "Report_Data_Json": JSON.stringify([this.arrReportDataJson[this.workflowCount].reportData])
                                };
                                if (this.arrReportDataJson[this.workflowCount].attachmentData.length > 0) {
                                    params.Attachment_List = JSON.stringify(this.arrReportDataJson[this.workflowCount].attachmentData);
                                }
                                gp = new Geoprocessor(arrDwnloadDisplayFieldValue[selectedValue].GeoProcessingServiceURL);
                                gp.submitJob(params, lang.hitch(this, function (jobInfo) {
                                    topic.publish("hideProgressIndicator");
                                    if (jobInfo.jobStatus !== "esriJobFailed") {
                                        if (arrDwnloadDisplayFieldValue[selectedValue].Filetype.toLowerCase() === "pdf") {
                                            gp.getResultData(jobInfo.jobId, "Report_PDF", this._downloadPDFFile);
                                        } else {
                                            gp.getResultData(jobInfo.jobId, "Report_PDF", this._downloadDataFile);
                                        }
                                    } else if (jobInfo.jobStatus === "esriJobFailed") {
                                        alert(sharedNls.errorMessages.downloadError);
                                    }
                                    selectDownloadList.reset();
                                    selectedValue = null;
                                }), null, function (err) {
                                    selectDownloadList.reset();
                                    selectedValue = null;
                                    topic.publish("hideProgressIndicator");
                                    alert(err.message);
                                });
                            }
                        }
                    }
                } catch (Error) {
                    topic.publish("hideProgressIndicator");
                    console.log(Error.Message);
                }
            })));


        },

        /**
        * Downloads pdf file
        * @param {object} Out put file
        * @memberOf widgets/Sitelocator/GeoEnrichment
        */
        _downloadPDFFile: function (outputFile) {
            dojo.downloadWindow.location = outputFile.value.url;
        },

        /**
        * Downloads data file
        * @param {object} Out put file
        * @memberOf widgets/Sitelocator/GeoEnrichment
        */
        _downloadDataFile: function (outputFile) {
            window.location = outputFile.value.url;
        },

        /**
        * Creates web map json object
        * @return {Object} return web map json data
        * @memberOf widgets/Sitelocator/GeoEnrichment
        */
        _createMapJsonData: function () {
            var printTaskObj = new PrintTask(), jsonObject, i;
            printTaskObj.legendAll = true;
            jsonObject = printTaskObj._getPrintDefinition(this.map);
            // Checking all operational layers and graphic layers exist
            if (printTaskObj.allLayerslegend && printTaskObj.allLayerslegend.length > 0) {
                jsonObject.layoutOptions = {};
                jsonObject.layoutOptions.legendOptions = {
                    operationalLayers: printTaskObj.allLayerslegend
                };
            }
            // Removing graphic layer(Buffer) while generating report for buildings and sites tab
            for (i = 0; i < jsonObject.operationalLayers.length; i++) {
                if (jsonObject.operationalLayers[i].id === "esriBufferGraphicsLayer") {
                    jsonObject.operationalLayers.splice(array.indexOf(jsonObject.operationalLayers, jsonObject.operationalLayers[i]), 1);
                    break;
                }
            }
            jsonObject.exportOptions = { "outputSize": [1366, 412] };
            return jsonObject;
        },


        /**
        * Clears the Business tab data
        * @memberOf widgets/Sitelocator/GeoEnrichment
        */
        _clearBusinessData: function () {
            this.businessData = [];
            this.enrichData = [];
            this.salesFinalData = [];
            this.employeFinalData = [];
            this.revenueData = [];
            this.totalArray = [];
            domStyle.set(this.resultDiv, "display", "none");
        },

        /**
        * Calculates the total of filtered data in business workflow
        * @param {object} Geo enriched data
        * @memberOf widgets/Sitelocator/GeoEnrichment
        */
        _calculateSum: function (Data) {
            var businessCount = 0, employeeCount = 0, revenueCount = 0, arrTotalCounts = [], i;
            if (Data) {
                for (i = 0; i < Data.length; i++) {
                    businessCount = businessCount + parseInt(Data[i].Count, 10);
                    employeeCount = employeeCount + parseInt(Data[i].Employees, 10);
                    revenueCount = revenueCount + parseInt(Data[i].Revenue, 10);
                }
                arrTotalCounts.push(businessCount);
                arrTotalCounts.push(revenueCount);
                arrTotalCounts.push(revenueCount);
                this.divBusinessResult.children[0].children[1].innerHTML = number.format(businessCount, { places: 0 });
                this.divBusinessResult.children[1].children[1].innerHTML = "$" + number.format(revenueCount, { places: 0 });
                this.divBusinessResult.children[2].children[1].innerHTML = number.format(employeeCount, { places: 0 });
            }
        }
    });
});
