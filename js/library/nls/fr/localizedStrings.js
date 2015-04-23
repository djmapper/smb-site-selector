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
        showNullValue: "@fr@ N/A",
        buttons: {
            okButtonText: "@fr@ OK",
            link: "@fr@ Link",
            email: "Email",  // Shown next to icon for sharing the current map extents via email; works with shareViaEmail tooltip
            facebook: "Facebook",  // Shown next to icon for sharing the current map extents via a Facebook post; works with shareViaFacebook tooltip
            twitter: "Twitter",  // Shown next to icon for sharing the current map extents via a Twitter tweet; works with shareViaTwitter tooltip
            embedding: "@fr@ Embedded URL"
        },
        tooltips: {
            search: "Rechercher",
            reports: "@fr@ Site Selector",
            locate: "Emplacement actuel",
            share: "Partager",
            help: "Aide",
            clearEntry: "@fr@ Clear",
            previous: "@fr@ Previous",
            next: "@fr@ Next"
        },
        titles: {
            informationPanelTitle: "@fr@ Information for current map view",
            searchBuildingText: "@fr@ Search buildings near an address",
            hideText: "@fr@ Hide more options",
            showText: "@fr@ Show more options",
            sliderDisplayText: "@fr@ Show results within ",
            communityText: "@fr@ Search communities by city, county or region",
            searchCommunityText: "@fr@ Search communities in",
            searchBusinessText: "@fr@ Search business near an address",
            serachSiteText: "@fr@ Search sites near an address",
            countStatus: "de",
            webpageDisplayText: "@fr@ Copy/Paste HTML into your web page",
            textDownload: "@fr@ Download",
            result: "@fr@ Back To Result",
            sortBy: "@fr@  Sort by",
            select: "@fr@ Select",
            toText: "@fr@ to",
            fromText: "@fr@ from"
        },
        errorMessages: {
            invalidSearch: "@fr@ No results found",
            downloadError: "@fr@ Unable to complete operation",
            geometryIntersectError: "@fr@ The searched area is outside the area of interest and will not be analyzed.",
            falseConfigParams: "@fr@ Required configuration key values are either null or not exactly matching with layer attributes. This message may appear multiple times",
            invalidLocation: "@fr@ Current location not found",
            invalidProjection: "@fr@ Unable to plot current location on the map",
            widgetNotLoaded: "@fr@ Unable to load widgets.",
            shareLoadingFailed: "@fr@ Unable to load share options",
            shareFailed: "@fr@ Unable to share",
            invalidBasemapQuery: "@fr@ Invalid BasemapQuery",
            noBasemap: "@fr@ No Basemap Found",
            disableTab: "@fr@ Enable at least one tab",
            bufferSliderValue: "@fr@ Buffer slider should not be set to zero distance",
            invalidInput: "@fr@ Plese enter valid input",
            unableToSort: "@fr@ Unable to sort",
            portalUrlNotFound: "@fr@ Portal URL cannot be empty"
        }
    }
});
