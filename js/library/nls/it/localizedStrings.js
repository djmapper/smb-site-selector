/*global define */
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
define({
    root: {
        showNullValue: "@it@ N/A",
        buttons: {
            okButtonText: "@it@ OK",
            link: "@it@ Link",
            email: "Email",  // Shown next to icon for sharing the current map extents via email; works with shareViaEmail tooltip
            facebook: "Facebook",  // Shown next to icon for sharing the current map extents via a Facebook post; works with shareViaFacebook tooltip
            twitter: "Twitter",  // Shown next to icon for sharing the current map extents via a Twitter tweet; works with shareViaTwitter tooltip
            embedding: "@it@ Embedded URL"
        },
        tooltips: {
            search: "@it@ Search",
            reports: "@it@ Site Selector",
            locate: "@it@ Locate",
            share: "@it@ Share",
            help: "@it@ Help",
            clearEntry: "@it@ Clear",
            previous: "@it@ Previous",
            next: "@it@ Next"
        },
        titles: {
            informationPanelTitle: "@it@ Information for current map view",
            searchBuildingText: "@it@ Search buildings near an address",
            hideText: "@it@ Hide more options",
            showText: "@it@ Show more options",
            sliderDisplayText: "@it@ Show results within ",
            communityText: "@it@ Search communities by city, county or region",
            searchCommunityText: "@it@ Search communities in",
            searchBusinessText: "@it@ Search business near an address",
            serachSiteText: "@it@ Search sites near an address",
            countStatus: "di",
            webpageDisplayText: "@it@ Copy/Paste HTML into your web page",
            textDownload: "@it@ Download",
            result: "@it@ Back To Result",
            sortBy: "@it@  Sort by",
            select: "@it@ Select",
            toText: "@it@ to",
            fromText: "@it@ from"
        },
        errorMessages: {
            invalidSearch: "@it@ No results found",
            downloadError: "@it@ Unable to complete operation",
            geometryIntersectError: "@it@ The searched area is outside the area of interest and will not be analyzed.",
            falseConfigParams: "@it@ Required configuration key values are either null or not exactly matching with layer attributes. This message may appear multiple times",
            invalidLocation: "@it@ Current location not found",
            invalidProjection: "@it@ Unable to plot current location on the map",
            widgetNotLoaded: "@it@ Unable to load widgets.",
            shareLoadingFailed: "@it@ Unable to load share options",
            shareFailed: "@it@ Unable to share",
            invalidBasemapQuery: "@it@ Invalid BasemapQuery",
            noBasemap: "@it@ No Basemap Found",
            disableTab: "@it@ Enable at least one tab",
            bufferSliderValue: "@it@ Buffer slider should not be set to zero distance",
            invalidInput: "@it@ Plese enter valid input",
            unableToSort: "@it@ Unable to sort",
            portalUrlNotFound: "@it@ Portal URL cannot be empty"
        }
    }
});
