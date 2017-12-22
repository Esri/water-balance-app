"use strict";

require(["esri/graphic", "esri/geometry/Point", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/Color", "esri/arcgis/utils", "esri/TimeExtent", "esri/layers/MosaicRule", "esri/tasks/ImageServiceIdentifyTask", "esri/tasks/ImageServiceIdentifyParameters", "esri/dijit/Search", "esri/request", "esri/geometry/webMercatorUtils", "dojo/on", "dojo/dom-class", "dojo/_base/connect", "dojo/Deferred"], function (Graphic, Point, SimpleMarkerSymbol, SimpleLineSymbol, Color, arcgisUtils, TimeExtent, MosaicRule, ImageServiceIdentifyTask, ImageServiceIdentifyParameters, Search, esriRequest, webMercatorUtils, on, domClass, connect, Deferred) {
    // Enforce strict mode
    'use strict';

    var app = { "webMapID": "c132c7e396f64a11bfa1c24082bdb0c5" };

    //initiate the app
    arcgisUtils.createMap(app.webMapID, "mapDiv").then(function (response) {
        app.map = response.map;
        app.webMapItems = response.itemInfo.itemData;
        app.operationalLayersURL = getOperationalLayersURL(app.webMapItems);
        app.isWaterStorageChartVisible = true;
        connect.disconnect(response.clickEventHandle);

        //get the list of StdTime values from the image service's multidimensionalInfo
        getStdTimeInfo().then(function (stdTimeInfo) {
            app.stdTimeInfo = stdTimeInfo;
            app.map.on("click", function (event) {
                if (!$("body").hasClass("app-loading")) {
                    getImageLayerDataByLocation(event.mapPoint);
                }
            });
            setOperationalLayersVisibility();
            initializeMapTimeAndZExtent();
        });
        initSearchWidget();
    });

    function getStdTimeInfo(url) {
        domClass.add(document.body, "app-loading");
        var deferred = new Deferred();
        var layerUrl = app.webMapItems.operationalLayers[0].url;
        var layersRequest = esriRequest({
            url: layerUrl + "/multiDimensionalInfo",
            content: {
                f: "json"
            },
            handleAs: "json",
            callbackParamName: "callback"
        });

        function requestSuccessHandler(response) {
            var stdTime = response.multidimensionalInfo.variables[0].dimensions.filter(function (d) {
                return d.name === "StdTime";
            })[0];
            domClass.remove(document.body, "app-loading");
            deferred.resolve(stdTime.values);
        }

        function requestErrorHandler(error) {
            domClass.remove(document.body, "app-loading");
            showErrorMessageDialog();
            console.log("Error: ", error.message);
        }

        layersRequest.then(requestSuccessHandler, requestErrorHandler);
        return deferred.promise;
    }

    function initSearchWidget() {
        var search = new Search({
            map: app.map,
            autoNavigate: false,
            enableInfoWindow: false,
            enableHighlight: false
        }, "search");
        search.on('search-results', function (response) {
            if (response.results["0"] && response.results["0"][0]) {
                var resultGeom = response.results["0"][0].feature.geometry;
                getImageLayerDataByLocation(resultGeom);
            }
        });
        search.startup();
    }

    function getImageLayerDataByLocation(inputGeom) {
        var identifyTaskInputGeometry = inputGeom;
        var chartData = [];
        var identifyTaskOnSuccessHandler = function identifyTaskOnSuccessHandler(results) {
            chartData.push(results);
            if (results.key === "Runoff") {
                app.runoffData = results;
            }
            if (chartData.length === app.operationalLayersURL.length) {
                domClass.remove(document.body, "app-loading");
                toggleBottomPane(true);
                chartData = getValidateChartData(chartData);
                app.monthlyTrendChart = new MonthlyTrendChart(chartData);
                app.mainChart = new MainChart(chartData);
            }
        };
        domClass.add(document.body, "app-loading");
        // app.map.centerAt(identifyTaskInputGeometry);
        toggleBottomPane(false);
        addPointToMAp(identifyTaskInputGeometry);
        app.operationalLayersURL.forEach(function (d) {
            executeIdentifyTask(identifyTaskInputGeometry, d.url, d.title).then(function (results) {
                identifyTaskOnSuccessHandler(results);
            });
        });
    }

    // for some reason the server is not working properly that can return data with inconsistent number of elements,
    // therefore, need to call this function to make sure each item in chart data array contains the same number elements
    function getValidateChartData(chartData) {
        console.log('chartData', chartData);
        var minLength = Number.POSITIVE_INFINITY;
        chartData.forEach(function (d, i) {
            if (d.values.length < minLength) {
                minLength = d.values.length;
            }
        });
        chartData.forEach(function (d, i) {
            if (d.values.length > minLength) {
                var numOfItemsToRemove = d.values.length - minLength;
                d.values.splice(minLength, numOfItemsToRemove);
            }
        });
        return chartData;
    }

    function executeIdentifyTask(inputGeometry, identifyTaskURL, imageServiceTitle) {

        var deferred = new Deferred();
        var imageServiceIdentifyTask = new ImageServiceIdentifyTask(identifyTaskURL);
        var imageServiceIdentifyTaskParams = new ImageServiceIdentifyParameters();
        imageServiceIdentifyTaskParams.returnCatalogItems = true;
        imageServiceIdentifyTaskParams.returnGeometry = false;
        imageServiceIdentifyTaskParams.geometry = inputGeometry;
        imageServiceIdentifyTaskParams.mosaicRule = getMosaicRule(imageServiceTitle);

        imageServiceIdentifyTask.execute(imageServiceIdentifyTaskParams).then(function (response) {
            if (response.value !== "NoData" || imageServiceTitle === "Snowpack") {
                var processedResults = processIdentifyTaskResults(response, imageServiceTitle);
                deferred.resolve(processedResults);
            } else {
                console.error("no data found for this location");
                domClass.remove(document.body, "app-loading");
                showErrorMessageDialog(true);
                return;
            }
        });
        return deferred.promise;
    }

    function processIdentifyTaskResults(results, imageServiceTitle) {
        var processedResults = {
            "key": imageServiceTitle,
            "values": []
        };
        var mergedResults = [];
        var variableName;

        results.catalogItems.features.forEach(function (d, i) {
            var values = results.properties.Values[i];
            if (!variableName) {
                variableName = d.attributes.Variable;
                mergedResults.push([values]);
            } else {
                if (variableName === d.attributes.Variable) {
                    mergedResults[mergedResults.length - 1].push(values);
                } else {
                    mergedResults.push([values]);
                    variableName = d.attributes.Variable;
                }
            }
        });

        mergedResults = mergedResults.map(function (d) {
            var joinedValues = d.join(" ");
            var joinedValuesInArray = joinedValues.split(" ");
            return joinedValuesInArray;
        });

        if (mergedResults.length > 1) {
            mergedResults.forEach(function (d, i) {
                if (i === 0) {
                    processedResults.values = d.map(function (item, index) {
                        return {
                            "stdTime": app.stdTimeInfo[index],
                            "value": +item
                        };
                    });
                } else {
                    d.forEach(function (item, index) {
                        processedResults.values[index].value += +item;
                    });
                }
            });
        } else {
            processedResults.values = mergedResults[0].map(function (item, index) {
                return {
                    "stdTime": app.stdTimeInfo[index],
                    "value": +item
                };
            });
        }
        return processedResults;
    }

    function getMosaicRule(imageServiceTitle) {
        var mosaicRule = new MosaicRule();
        mosaicRule.where = "tag = 'Composite'";
        return mosaicRule;
    }

    function addPointToMAp(geometry) {
        app.map.graphics.clear();
        var markerSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 12, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 255, 255, 0.7]), 2), new Color([207, 34, 171, 0.8]));
        var pointGraphic = new Graphic(geometry, markerSymbol);
        app.pointGeom = webMercatorUtils.webMercatorToGeographic(geometry);
        app.map.graphics.add(pointGraphic);
    }

    function initializeMapTimeAndZExtent() {
        var startTime = convertUnixValueToTime(app.stdTimeInfo[app.stdTimeInfo.length - 1]);
        var endTime = getEndTimeValue(startTime);
        updateMapTimeInfo(startTime, endTime);
    }

    function setOperationalLayersVisibility() {
        var selectedMapLayerName = $(".map-layer-select").val();
        app.webMapItems.operationalLayers.forEach(function (d) {
            if (d.layerType === "ArcGISImageServiceLayer") {
                d.layerObject.hide();
            }
        });
        var selectedMapLayer = app.webMapItems.operationalLayers.filter(function (d) {
            return d.title === selectedMapLayerName;
        })[0];
        selectedMapLayer.layerObject.show();
        setLegendForSelectedLayer(selectedMapLayer);
    }

    function setLegendForSelectedLayer(layer) {
        // console.log(layer);

        var legendContainer = $('.map-legend-wrapper');
        legendContainer.addClass('hide');
        legendContainer.empty();

        var legendRequest = esriRequest({
            url: layer.url + "/legend",
            content: {
                renderingRule: JSON.stringify(layer.renderingRule),
                f: "json"
            },
            handleAs: "json",
            callbackParamName: "callback"
        });

        function requestSuccessHandler(response) {
            // console.log(response);

            if (response.layers.length) {
                var legendStr = '';
                var legendData = response.layers[0].legend;
                legendData.forEach(function (d) {
                    legendStr += "\n                        <div>\n                            <div class=\"legend-image\"><img src=\"data:image/png;base64," + d.imageData + "\"></div>\n                            <div class='legend-text margin-left-half'>" + d.label + "</div>\n                        </div>\n                    ";
                });
                legendContainer.append($(legendStr));
                legendContainer.removeClass('hide');
            } else {
                requestErrorHandler();
            }
        }

        function requestErrorHandler(error) {
            console.log("Error: ", error.message);
        }

        legendRequest.then(requestSuccessHandler, requestErrorHandler);
    }

    function getOperationalLayersURL(webMapItems) {
        var operationalLayersURL = webMapItems.operationalLayers.map(function (d) {
            return {
                "title": d.title,
                "url": d.url,
                "layerType": d.layerType
            };
        });
        operationalLayersURL = operationalLayersURL.filter(function (d) {
            return d.layerType === "ArcGISImageServiceLayer";
        });
        return operationalLayersURL;
    }

    function updateMapTimeInfo(startTime, endTime) {
        var timeExtent = new TimeExtent();
        timeExtent.startTime = startTime;
        timeExtent.endTime = endTime;
        app.map.setTimeExtent(timeExtent);
    }

    function getEndTimeValue(startTime, timeInterval, esriTimeUnit) {
        var formatedTimeUnit;
        timeInterval = timeInterval || 1;
        formatedTimeUnit = formatedTimeUnit || "days";
        return new Date(moment(startTime).add(timeInterval, formatedTimeUnit).format());
    }

    function convertUnixValueToTime(unixValue) {
        return new Date(moment(unixValue).format());
    }

    function getClosestValue(num, arr) {
        var curr = arr[0];
        var diff = Math.abs(num - curr);
        for (var val = 0; val < arr.length; val++) {
            var newdiff = Math.abs(num - arr[val]);
            if (newdiff < diff) {
                diff = newdiff;
                curr = arr[val];
            }
        }
        return curr;
    }

    function toggleBottomPane(isVisible) {
        var bottomPane = $(".bottom-pane");
        var mapPane = $("#mapDiv");
        if (isVisible) {
            bottomPane.addClass("visible");
            mapPane.addClass("narrow");
        } else {
            bottomPane.removeClass("visible");
            mapPane.removeClass("narrow");
        }
    }

    function trendChartDropdownSelectOnChangeHandler() {
        var selectedMonth = $(".month-select").val();
        // var selectedDataLayer = $(".data-layer-select").val();
        var selectedDataLayer = $(".map-layer-select option:selected").attr("value");
        app.monthlyTrendChart.highlightTrendLineByMonth(selectedMonth);
        app.monthlyTrendChart.updateChartScale();
        setOptionLabelForMonthSelect(selectedDataLayer);
    }

    function setDataLayerSelectValue(value) {
        // $(".data-layer-select option").removeAttr("selected");
        // $(".data-layer-select ").val(value);
        // $('.data-layer-select option[value="' + value + '"]').attr('selected', 'selected');
        setOptionLabelForMonthSelect(value);
    }

    function setOptionLabelForMonthSelect(selectedDataLayer) {
        if (selectedDataLayer === "Soil Moisture" || selectedDataLayer === "Snowpack") {
            $('.month-select option[value="Annual"]').text("Annual Average");
        } else {
            $('.month-select option[value="Annual"]').text("Annual Total");
        }
    }

    function showErrorMessageDialog(isNoDataFound) {
        var errorMessageTitle = isNoDataFound ? "No Data Found!" : "Error";
        var errorMessageContent = isNoDataFound ? "Cannot find any GLDAS data for the selected location. Use a different location and try again." : "The GLDAS Layers cannot be added to the app";
        $(".app-message-title").text(errorMessageTitle);
        $(".app-message-content").text(errorMessageContent);
        $("#alert-no-data").addClass("show");
    }

    function toggleSummaryInfoTooltip(isVisible) {
        if (isVisible) {
            $("div.summary-info-tooltip").show();
        } else {
            $("div.summary-info-tooltip").hide();
        }
    }

    function toggleMainChartInfoTooltip(isVisible) {
        if (isVisible) {
            $("div.main-chart-info-tooltip").show();
        } else {
            $("div.main-chart-info-tooltip").hide();
        }
    }

    function MainChart(data) {

        this.rawData = data;

        var containerID = ".line-chart-div";
        var container = $(containerID);
        container.empty();
        $(".tooltip").remove();

        var timeFormat = d3.time.format("%Y");
        var timeFormatWithMonth = d3.time.format("%b %Y");
        var timeFormatWithMonthAndDate = d3.time.format("%Y %b-%d");
        var timeFormatFullMonthName = d3.time.format("%B");
        var timeFormatMulti = d3.time.format.multi([[".%L", function (d) {
            return d.getMilliseconds();
        }], [":%S", function (d) {
            return d.getSeconds();
        }], ["%I:%M", function (d) {
            return d.getMinutes();
        }], ["%I %p", function (d) {
            return d.getHours();
        }], ["%a %d", function (d) {
            return d.getDay() && d.getDate() != 1;
        }], ["%b %d", function (d) {
            return d.getDate() != 1;
        }], ["%b", function (d) {
            return d.getMonth();
        }], ["%Y", function () {
            return true;
        }]]);

        var uniqueTimeValues = data[0].values.map(function (d) {
            return d.stdTime;
        });
        var uniqueYearValues = uniqueTimeValues.map(function (d) {
            return timeFormat(new Date(d));
        });
        uniqueYearValues = uniqueYearValues.filter(function (item, pos, self) {
            return self.indexOf(item) == pos;
        });
        var xAxisWidthOffset = 10;
        var prevMouseXPosition = 0;
        var currentTimeValueByMousePosition;
        var highlightTimeValue = uniqueTimeValues[uniqueTimeValues.length - 1];
        var highlightRefLineColor = "#a00000";

        var getDomainFromData = function getDomainFromData(values, key) {
            var domain = [];
            var lowest = Number.POSITIVE_INFINITY;
            var highest = Number.NEGATIVE_INFINITY;
            var tmp;
            for (var i = values.length - 1; i >= 0; i--) {
                tmp = +values[i][key];
                if (tmp < lowest) {
                    lowest = +tmp;
                }
                if (tmp > highest) {
                    highest = +tmp;
                }
            }
            domain.push(lowest, Math.ceil(highest));
            return domain;
        };

        var precipData = data.filter(function (d) {
            return d.key === "Precipitation";
        });
        var evapoData = data.filter(function (d) {
            return d.key === "Evapotranspiration";
        });
        var snowpackData = data.filter(function (d) {
            return d.key === "Snowpack";
        });
        var soilMoistureData = data.filter(function (d) {
            return d.key === "Soil Moisture";
        });
        var runoffData = data.filter(function (d) {
            return d.key === "Runoff";
        });

        var xScaleDomain = getDomainFromData(precipData[0].values, "stdTime");
        // Set the dimensions of the canvas / graph
        var margin = { top: 25, right: 10, bottom: 5, left: 40 };
        var width = container.width() - margin.left - margin.right;
        var height = container.height() - margin.top - margin.bottom;

        // Adds the svg canvas
        var svg = d3.select(containerID).append("svg").attr('class', 'line-chart-svg').attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr('class', 'canvas-element').attr("transform", "translate(" + margin.left + "," + (margin.top + margin.bottom) + ")");

        var chartAreaClip = svg.append('clipPath').attr('id', 'chartAreaClip').append('rect').attr("width", width - margin.right - xAxisWidthOffset).attr("height", height);

        var xScale = d3.time.scale().domain(getXScaleDomainByContainerSize()).range([0, width - margin.right - xAxisWidthOffset]);

        var yScale = d3.scale.linear().domain(getDomainFromData(soilMoistureData[0].values.concat(snowpackData[0].values), "value")).range([height - margin.top, 0]);

        var xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickPadding(10).outerTickSize(0).innerTickSize(-(height - margin.top)).tickFormat(timeFormatMulti);

        var yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(7).tickPadding(10).outerTickSize(0).innerTickSize(-(width - margin.right - xAxisWidthOffset));

        var createLine = d3.svg.line().x(function (d) {
            return xScale(d.stdTime);
        }).y(function (d) {
            return yScale(d.value);
        }).interpolate("monotone"); //interpolate the straight lines into curve lines

        var barWidth = getBarChartWidth();

        var bars = svg.selectAll("bar").data(precipData[0].values).enter().append("rect").attr("clip-path", "url(#chartAreaClip)").style("fill", getColorByKey("Precipitation")).style("opacity", 0.7).attr("x", function (d) {
            return xScale(d.stdTime) - barWidth / 2;
        }).attr("width", barWidth).attr("y", function (d) {
            return yScale(d.value);
        }).attr("height", function (d) {
            return height - margin.top - yScale(d.value);
        });

        var lineFeatures = svg.selectAll('line-features').data(runoffData.concat(evapoData)).enter().append('g').attr('class', 'line-features');

        var haloLines = lineFeatures.append('path').attr('class', 'line-halo').attr("clip-path", "url(#chartAreaClip)").attr('d', function (d) {
            return createLine(d.values);
        }).attr('stroke', "#fff").attr('stroke-width', 4).attr('fill', 'none');

        var lines = lineFeatures.append('path').attr('class', 'line').attr("clip-path", "url(#chartAreaClip)").attr('d', function (d) {
            return createLine(d.values);
        }).attr('stroke', function (d) {
            return getColorByKey(d.key);
        }).attr('stroke-width', 2).attr('fill', 'none');

        snowpackData = snowpackData[0].values.map(function (d) {
            d.key = "Snowpack";
            return d;
        });

        soilMoistureData = soilMoistureData[0].values.map(function (d) {
            d.key = "Soil Moisture";
            return d;
        });

        var areaChartData = soilMoistureData.concat(snowpackData);

        var stack = d3.layout.stack().offset("zero").values(function (d) {
            return d.values;
        }).x(function (d) {
            return d.stdTime;
        }).y(function (d) {
            return d.value;
        });

        var nest = d3.nest().key(function (d) {
            return d.key;
        });
        var areaChartLayers = stack(nest.entries(areaChartData));

        var createArea = d3.svg.area().x(function (d) {
            return xScale(d.stdTime);
        }).y0(function (d) {
            return yScale(d.y0);
        }).y1(function (d) {
            return yScale(d.y0 + d.y);
        });

        var areasG = svg.append('g').attr("class", "area-layers-group").attr("clip-path", "url(#chartAreaClip)");

        var areas = areasG.selectAll(".area-layer").data(areaChartLayers).enter().append("path").attr("class", "area-layer").attr("d", function (d) {
            return createArea(d.values);
        }).style("fill", function (d, i) {
            return getColorByKey(d.key);
        });

        var xAxisG = svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + (height - margin.top) + ")").call(xAxis);

        var yAxisG = svg.append("g").attr("class", "y axis").call(yAxis);

        var tooltipDiv = d3.select("body").append("div").attr("class", "tooltip").style("display", "none");

        var verticalLine = svg.append('line').attr({ 'x1': 0, 'y1': 0, 'x2': 0, 'y2': height - margin.top }).style("display", "none").attr("stroke", "#e9e9e9").attr('class', 'verticalLine');

        var drag = d3.behavior.drag().on("drag", dragmove).on("dragend", dragend);

        var highlightRefLine = svg.append('line').attr({
            'x1': 0,
            'y1': 0,
            'x2': 0,
            'y2': height - margin.top
        }).style("display", "none").attr("stroke", highlightRefLineColor).attr("stroke-width", "0.5").attr('class', 'highlightRefLine');

        var highlightRefLineLabel = svg.append("g").attr("class", "highlightRefLineLabel").attr("transform", "translate(0, -20)").call(drag);

        var highlightRefLineLabelRect = highlightRefLineLabel.append('rect').attr('width', 60).attr('height', 20).attr("transform", "translate(-30, 0)").attr('class', 'highlightRefLineLabelRect').style('opacity', 0.7).style('fill', highlightRefLineColor);

        var highlightRefLineLabelText = highlightRefLineLabel.append("text").attr('class', 'highlightRefLineLabeltext').attr("dy", "15").attr("text-anchor", "middle").style('fill', '#fff').style("cursor", 'w-resize');

        var zoom = d3.behavior.zoom().x(xScale).scaleExtent(getScaleExtentByContainerSize()).on("zoomstart", function () {
            verticalLine.style("display", "none");
            tooltipDiv.style("display", "none");
        }).on("zoomend", function () {
            verticalLine.style("display", null);
            tooltipDiv.style("display", null);
        }).on("zoom", zoomed);

        function nozoom() {
            d3.event.preventDefault();
        }

        var overlay = svg.append("rect").attr("class", "main-chart-overlay").attr("width", width - margin.right - xAxisWidthOffset).attr("height", height - margin.top).on("touchstart", nozoom).on("touchmove", nozoom).on("mouseover", function () {
            verticalLine.style("display", null);
            tooltipDiv.style("display", null);
        }).on("mouseout", function () {
            verticalLine.style("display", "none");
            tooltipDiv.style("display", "none");
            updateMapAndChartByTime(highlightTimeValue);
        }).on("mousemove", mousemove).on('click', function () {
            if (d3.event.defaultPrevented) return; // zoomed                
            highlightTimeValue = currentTimeValueByMousePosition;
            updateMapAndChartByTime(highlightTimeValue);
        }).call(zoom);

        function getBarChartWidth() {
            var currentZoomExtentMin = xScale.invert(0);
            var currentZoomExtentMax = xScale.invert(width);
            var uniqueTimeValuesInZoomExtent = uniqueTimeValues.filter(function (d) {
                var formatedTimeValue = new Date(d);
                return formatedTimeValue >= currentZoomExtentMin && formatedTimeValue <= currentZoomExtentMax;
            });
            return width / uniqueTimeValuesInZoomExtent.length * 0.7;
        }

        function zoomed() {
            var minDate = xScaleDomain[0];
            var maxDate = xScaleDomain[1];
            var zoomTranslateX;

            if (xScale.domain()[0] < minDate) {
                zoomTranslateX = zoom.translate()[0] - xScale(minDate) + xScale.range()[0];
                zoom.translate([zoomTranslateX, 0]);
            } else if (xScale.domain()[1] > maxDate) {
                zoomTranslateX = zoom.translate()[0] - xScale(maxDate) + xScale.range()[1];
                zoom.translate([zoomTranslateX, 0]);
            }

            xAxisG.call(xAxis);
            lines.attr('d', function (d) {
                return createLine(d.values);
            });
            haloLines.attr('d', function (d) {
                return createLine(d.values);
            });
            areas.attr("d", function (d) {
                return createArea(d.values);
            });
            var newBarWidth = getBarChartWidth();
            bars.attr("x", function (d) {
                return xScale(d.stdTime) - newBarWidth / 2;
            }).attr("width", newBarWidth).attr("y", function (d) {
                return yScale(d.value);
            }).attr("height", function (d) {
                return height - margin.top - yScale(d.value);
            });
            setHighlightRefLineByTime(highlightTimeValue);
        }

        function dragmove(d) {
            var xPos = d3.event.x;
            var yPos = d3.event.y;
            var xValueByMousePosition = xScale.invert(xPos).getTime();
            var closestTimeValue = getClosestValue(xValueByMousePosition, uniqueTimeValues);
            var xPosByClosestTimeValue = xScale(closestTimeValue);

            highlightTimeValue = closestTimeValue;
            d3.select(".highlightRefLineLabel").attr("transform", function () {
                return "translate(" + xPosByClosestTimeValue + ", -20)";
            });
            d3.select(".highlightRefLine").attr("transform", function () {
                return "translate(" + xPosByClosestTimeValue + ", 0)";
            });
            d3.select(".highlightRefLineLabeltext").text(timeFormatWithMonth(new Date(closestTimeValue)));
        }

        function dragend(d) {
            updateMapAndChartByTime(highlightTimeValue);
        }

        function mousemove() {
            var mousePositionX = d3.mouse(this)[0];
            var xValueByMousePosition = xScale.invert(mousePositionX).getTime();
            var closestTimeValue = getClosestValue(xValueByMousePosition, uniqueTimeValues);
            var tooltipData = getChartDataByTime(closestTimeValue);
            var tooltipContent = '<span class="main-chart-tooltip-header">' + timeFormatWithMonth(new Date(closestTimeValue)) + '</span><hr>';
            var tooltipX = mousePositionX > prevMouseXPosition ? d3.event.pageX - 185 : d3.event.pageX + 175 < container.width() ? d3.event.pageX + 20 : d3.event.pageX - 185;
            var monthlySelectValue = $(".month-select").val();

            currentTimeValueByMousePosition = closestTimeValue;
            d3.select(".verticalLine").attr("transform", function () {
                return "translate(" + xScale(closestTimeValue) + ", 0)";
            });
            tooltipData = tooltipData.filter(function (d) {
                if (app.isWaterStorageChartVisible) {
                    return d.key === "Soil Moisture" || d.key === "Snowpack";
                } else {
                    return d.key === "Precipitation" || d.key === "Runoff" || d.key === "Evapotranspiration";
                }
            });
            tooltipData.sort(function (a, b) {
                return b.value - a.value;
            });
            tooltipData.forEach(function (d) {
                var textColor = getColorByKey(d.key);
                var isElementVisible = $(".legend-wrapper[value='" + d.key + "']").is(':visible');
                if (isElementVisible) {
                    tooltipContent += '<span class="with-unit tooltip-text-bold" style="color:' + textColor + '">' + d.key + ': ' + parseInt(d.value) + '</span><br>';
                }
            });
            tooltipDiv.html(tooltipContent).style("left", Math.max(0, tooltipX) + "px").style("top", d3.event.pageY - 50 + "px");

            if (monthlySelectValue !== "MonthlyNormals" && monthlySelectValue !== "Annual") {
                app.monthlyTrendChart.highlightTrendLineByMonth(timeFormatFullMonthName(new Date(closestTimeValue)));
            }
            getSummaryDataByTime(closestTimeValue);
            setTimeout(function () {
                prevMouseXPosition = mousePositionX;
            }, 500);
        }

        function updateMapAndChartByTime(time, isInitialSetup) {
            var startDate = new Date(time);
            var endDate = getEndTimeValue(time);
            var monthlySelectValue = $(".month-select").val();
            app.selectedMonth = timeFormatFullMonthName(startDate);
            updateMapTimeInfo(startDate, endDate);
            if (isInitialSetup) {
                app.monthlyTrendChart.highlightTrendLineByMonth(app.selectedMonth);
                app.monthlyTrendChart.updateChartScale();
            } else {
                if (monthlySelectValue !== "MonthlyNormals" && monthlySelectValue !== "Annual") {
                    app.monthlyTrendChart.highlightTrendLineByMonth(app.selectedMonth);
                }
            }
            setHighlightRefLineByTime(time);
            getSummaryDataByTime(time);
        }

        function setHighlightRefLineByTime(time) {
            var xPosByTime = xScale(time);
            var xScaleRange = xScale.range();

            if (xPosByTime >= xScaleRange[0] && xPosByTime <= xScaleRange[1]) {
                highlightRefLine.style("display", null);
                highlightRefLineLabel.style("display", null);
                highlightRefLine.attr("transform", function () {
                    return "translate(" + xPosByTime + ", 0)";
                });
                highlightRefLineLabel.attr("transform", function () {
                    return "translate(" + xPosByTime + ", -20)";
                });
                highlightRefLineLabelText.text(timeFormatWithMonth(new Date(time)));
            } else {
                highlightRefLine.style("display", "none");
                highlightRefLineLabel.style("display", "none");
            }
        }

        function getChartDataByTime(time, inputData) {
            var chartData = [];
            var selectedItem;
            inputData = inputData || data;
            for (var i = 0, len = inputData.length; i < len; i++) {
                selectedItem = inputData[i].values.filter(function (d) {
                    return d.stdTime === time;
                });
                chartData.push({
                    key: inputData[i].key,
                    value: selectedItem[0].value
                });
            }
            return chartData;
        }

        function getSummaryDataByTime(time) {
            var inputTime = new Date(time);
            var formatedTimeValue = timeFormatWithMonth(inputTime);
            var fullMonthName = timeFormatFullMonthName(inputTime);
            var summaryDataByTime = getChartDataByTime(time);
            var precipDataByTime = summaryDataByTime.filter(function (d) {
                return d.key === "Precipitation";
            });
            var evapoDataByTime = summaryDataByTime.filter(function (d) {
                return d.key === "Evapotranspiration";
            });
            var runoffDataByTime = summaryDataByTime.filter(function (d) {
                return d.key === "Runoff";
            });
            var soildMoistureDataByTime = summaryDataByTime.filter(function (d) {
                return d.key === "Soil Moisture";
            });
            var snowpackDataByTime = summaryDataByTime.filter(function (d) {
                return d.key === "Snowpack";
            });
            var changeInStorageDataByTime = summaryDataByTime.filter(function (d) {
                return d.key === "ChangeInStorage";
            });
            var changeInStorageData = app.monthlyTrendChart.getChangeInStorageDataByMonth(fullMonthName);

            $(".summary-info-title-text").text(formatedTimeValue);

            //update the summary table values            
            $("span.precip-value").text(precipDataByTime[0].value);
            $("span.runoff-value").text(runoffDataByTime[0].value);
            $("span.evapo-value").text(evapoDataByTime[0].value);
            $("span.soilmoisture-value").text(soildMoistureDataByTime[0].value);
            $("span.snowpack-value").text(snowpackDataByTime[0].value);

            //update the scale chart tooltip position
            setScaleChartTooltipPosition(changeInStorageDataByTime[0].value, changeInStorageData.values);
            setSummaryDescTextValue(changeInStorageDataByTime[0].value, soildMoistureDataByTime[0].value, fullMonthName);
        }

        function setScaleChartTooltipPosition(changeInStorageValue, arrOfValues) {
            //update the value of the scale chart tooltip first, 
            //as this will affect the width of div.scale-chart-tooltip-text element
            $(".scale-chart-tooltip-text > span").text(changeInStorageValue);
            var changeInStorageValues = arrOfValues.map(function (d) {
                return d.value;
            });
            var absMaxValue = d3.max(changeInStorageValues, function (d) {
                return Math.abs(d);
            });
            var aveChangeInStorage = round(average(changeInStorageValues), 0);
            var ratioToAbsMaxValue = changeInStorageValue / (absMaxValue * 1.05);
            var aveToAbsMaxValue = aveChangeInStorage / (absMaxValue * 1.05);
            setVericalPosition("scale-chart-rect", "scale-chart-tooltip", ratioToAbsMaxValue);
            setVericalPosition("scale-chart-rect", "scale-chart-normal-value-indicator", aveToAbsMaxValue);
        }

        function setVericalPosition(containerElementClassName, floatingElementClassName, ratio) {

            var containerElement = $("." + containerElementClassName);
            var floatingElement = $("." + floatingElementClassName);
            var containerElementHeightHalf = containerElement.height() / 2;
            var floatingElementHeightHalf = floatingElement.height() / 2;
            var topMarginValue = ratio >= 0 ? containerElementHeightHalf + containerElementHeightHalf * ratio - floatingElementHeightHalf : containerElementHeightHalf * (1 + ratio) - floatingElementHeightHalf;

            topMarginValue = containerElement.height() - topMarginValue;

            //update the position of scale chart tooltip
            floatingElement.css("margin-top", topMarginValue + "px");
        }

        function setSummaryDescTextValue(changeInStorageValue, soilmoistureValue, monthName) {

            var absValueOfChangeInStorage = Math.abs(changeInStorageValue);
            var addedOrLost = changeInStorageValue >= 0 ? "recharged into storage" : "depleted from storage";
            var soilMoistureData = app.monthlyTrendChart.getSoilMoistureDataByMonth(monthName);
            var arrayOfSoilMoistureValues = soilMoistureData.values.map(function (d) {
                return d.value;
            });
            var avgOfSoilMoistureValues = average(arrayOfSoilMoistureValues);
            var pctSoilMoistureFromAve = round((soilmoistureValue - avgOfSoilMoistureValues) / avgOfSoilMoistureValues * 100, 0);
            var soilMoisturePctText = Math.abs(pctSoilMoistureFromAve) + "%" + (soilmoistureValue >= avgOfSoilMoistureValues ? " above" : " below");
            var isSoilMoistureAboveNormal;

            if (changeInStorageValue >= 0) {
                if (soilmoistureValue > avgOfSoilMoistureValues) {
                    isSoilMoistureAboveNormal = "now";
                } else {
                    isSoilMoistureAboveNormal = "still";
                }

                if (changeInStorageValue === 0) {
                    isSoilMoistureAboveNormal = "now";
                }
            } else {
                if (soilmoistureValue > avgOfSoilMoistureValues) {
                    isSoilMoistureAboveNormal = "still";
                } else {
                    isSoilMoistureAboveNormal = "now";
                }
            }

            var descTextElements = ["<span class='change-in-storage-value'>" + absValueOfChangeInStorage + " mm</span>", "of water was", addedOrLost, " this month."];

            var descTextElements1 = ["Total soil moisture is", isSoilMoistureAboveNormal, "<span class='soil-moisture-value'>" + soilMoisturePctText, "average</span> for", monthName + "."];

            var descText1 = pctSoilMoistureFromAve ? descTextElements1.join(" ") : " Total soil moisture is about the average for " + monthName + ".";
            var descText = descTextElements.join(" ") + " " + descText1;
            var summaryInfoTooltipText = "Change in storage (" + changeInStorageValue + " mm) is precipitation minus runoff and evapotranspiration.";

            $(".summary-desc-text-div").html("<span>" + descText + "</span>");
            $("div.summary-info-tooltip").html("<span>" + summaryInfoTooltipText + "</span>");
            if (changeInStorageValue >= 0) {
                $(".change-in-storage-value").addClass("scale-chart-blue");
            }
            if (soilmoistureValue >= avgOfSoilMoistureValues) {
                $(".soil-moisture-value").addClass("scale-chart-blue");
            } else {
                $(".soil-moisture-value").addClass("scale-chart-red");
            }
            $(".change-in-storage-value").on("mouseover", function () {
                toggleSummaryInfoTooltip(true);
            });
            $(".change-in-storage-value").on("mouseout", function () {
                toggleSummaryInfoTooltip(false);
            });
        }

        this.toggleChartViews = function () {
            this.unhighlightChartItems();
            xScale.domain(getXScaleDomainByContainerSize());
            var selectedMapLayerName = $(".map-layer-select").val();
            var barWidth = getBarChartWidth();
            if (app.isWaterStorageChartVisible) {
                yScale.domain([0, d3.max(areaChartData, function (d) {
                    return d.y0 + d.y;
                })]);
                areas.style("opacity", ".8");
                lines.style("opacity", "0");
                haloLines.style("opacity", "0");
                bars.style("opacity", "0");
                verticalLine.style("stroke", "#efefef");
                $(".main-chart-title").text("Water Storage ");
            } else {
                yScale.domain(getDomainFromData(precipData[0].values.concat(runoffData[0].values, evapoData[0].values), "value"));
                areas.style("opacity", "0");
                lines.style("opacity", ".8");
                haloLines.style("opacity", ".8");
                bars.style("opacity", ".8");
                verticalLine.style("stroke", "#909090");
                $(".main-chart-title").text("Water Flux ");
            }
            yAxisG.transition().duration(1000).ease("sin-in-out").call(yAxis);
            xAxisG.transition().duration(1000).ease("sin-in-out").call(xAxis);
            lines.transition().duration(1000).attr('d', function (d) {
                return createLine(d.values);
            });
            haloLines.transition().duration(1000).attr('d', function (d) {
                return createLine(d.values);
            });
            areas.transition().duration(1000).attr("d", function (d) {
                return createArea(d.values);
            });
            bars.transition().duration(1000).attr("y", function (d) {
                return yScale(d.value);
            }).attr("x", function (d) {
                return xScale(d.stdTime) - barWidth / 2;
            }).attr("width", barWidth).attr("height", function (d) {
                return height - margin.top - yScale(d.value);
            });

            if (!app.isWaterStorageChartVisible) {
                var visibleLineFeatureKey;
                if (selectedMapLayerName !== "Precipitation") {
                    visibleLineFeatureKey = selectedMapLayerName;
                    $(".legend-wrapper[value='Runoff']").hide();
                    $(".legend-wrapper[value='Evapotranspiration']").hide();
                    $(".legend-wrapper[value='" + selectedMapLayerName + "']").show();
                } else {
                    visibleLineFeatureKey = "Runoff";
                    $(".legend-wrapper[value='Runoff']").show();
                    $(".legend-wrapper[value='Evapotranspiration']").hide();
                }
                lines.each(function (d) {
                    var lineElement = d3.select(this).node();
                    if (d.key === visibleLineFeatureKey) {
                        d3.select(lineElement).style("opacity", 0.8);
                    } else {
                        d3.select(lineElement).style("opacity", 0);
                    }
                });
                haloLines.each(function (d) {
                    var lineElement = d3.select(this).node();
                    if (d.key === visibleLineFeatureKey) {
                        d3.select(lineElement).style("opacity", 0.8);
                    } else {
                        d3.select(lineElement).style("opacity", 0);
                    }
                });
            }
            setHighlightRefLineByTime(highlightTimeValue);
        };

        this.highlightChartItemByLegendValue = function (legendValue) {
            if (legendValue) {
                if (app.isWaterStorageChartVisible) {
                    var areaChartDataByLegendValue = areaChartData.filter(function (d) {
                        return d.key === legendValue;
                    });
                    var areaChartLayersByLegendValue = stack(nest.entries(areaChartDataByLegendValue));
                    yScale.domain([0, d3.max(areaChartDataByLegendValue, function (d) {
                        return d.y0 + d.y;
                    })]);
                    yAxisG.transition().duration(1000).ease("sin-in-out").call(yAxis);
                    // areas.data(areaChartLayersByLegendValue)
                    //     .attr("d", function(d) {
                    //         return createArea(d.values);
                    //     })
                    //     .style("fill", function(d, i) {
                    //         return getColorByKey(d.key);
                    //     })
                    //     .exit().remove();
                    areas.remove();
                    areas = areasG.selectAll(".area-layer").data(areaChartLayersByLegendValue).enter().append("path").attr("class", "area-layer").attr("d", function (d) {
                        return createArea(d.values);
                    }).style("fill", function (d, i) {
                        return getColorByKey(d.key);
                    });
                } else {
                    var visibleLineFeatureKey;
                    //toggle precip bars or evapo lines
                    if (legendValue === "Precipitation") {
                        var isRunoffLayerVisible = $(".legend-wrapper[value='Runoff']").is(':visible');
                        visibleLineFeatureKey = isRunoffLayerVisible ? "Runoff" : "Evapotranspiration";
                        bars.style("opacity", ".8");
                    } else if (legendValue === "Runoff" || legendValue === "Evapotranspiration") {
                        visibleLineFeatureKey = legendValue;
                        bars.style("opacity", ".2");
                    }
                    haloLines.each(function (d) {
                        var lineElement = d3.select(this).node();
                        if (d.key === visibleLineFeatureKey) {
                            var visibleLineOpacity = legendValue === "Precipitation" ? 0.2 : 0.8;
                            d3.select(lineElement).style("opacity", visibleLineOpacity);
                        } else {
                            d3.select(lineElement).style("opacity", 0);
                        }
                    });
                    lines.each(function (d) {
                        var lineElement = d3.select(this).node();
                        if (d.key === visibleLineFeatureKey) {
                            var visibleLineOpacity = legendValue === "Precipitation" ? 0.2 : 0.8;
                            d3.select(lineElement).style("opacity", visibleLineOpacity);
                        } else {
                            d3.select(lineElement).style("opacity", 0);
                        }
                    });
                }
            } else {
                this.unhighlightChartItems();
            }
        };

        this.unhighlightChartItems = function () {
            $(".legend-wrapper").css("opacity", 1);
            if (app.isWaterStorageChartVisible) {
                areaChartLayers = stack(nest.entries(areaChartData));
                areas.remove();
                areas = areasG.selectAll(".area-layer").data(areaChartLayers).enter().append("path").attr("class", "area-layer").attr("d", function (d) {
                    return createArea(d.values);
                }).style("fill", function (d, i) {
                    return getColorByKey(d.key);
                });
            } else {
                bars.style("opacity", ".8");
                lines.style("opacity", ".8");
            }
        };

        this.resize = function () {
            var xScaleDomainByContainerSize = getXScaleDomainByContainerSize();
            width = container.width() - margin.left - margin.right - 5;
            height = container.height() - margin.top - margin.bottom - 5;
            xScale.range([0, width - margin.right - xAxisWidthOffset]);
            xScale.domain(xScaleDomainByContainerSize);
            zoom.x(xScale).scaleExtent(getScaleExtentByContainerSize());
            yScale.range([height - margin.top, 0]);
            xAxis.innerTickSize(-(height - margin.top));
            yAxis.innerTickSize(-(width - margin.right - xAxisWidthOffset));
            chartAreaClip.attr("width", width - margin.right - xAxisWidthOffset);

            // Update the axis and text with the new scale
            xAxisG.attr("transform", "translate(0," + (height - margin.top) + ")").call(xAxis);
            yAxisG.call(yAxis);
            d3.select(".line-chart-svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom);
            lines.attr('d', function (d) {
                return createLine(d.values);
            });
            haloLines.attr('d', function (d) {
                return createLine(d.values);
            });
            areas.attr("d", function (d) {
                return createArea(d.values);
            });
            var newBarWidth = getBarChartWidth();
            bars.attr("x", function (d) {
                return xScale(d.stdTime) - newBarWidth / 2;
            }).attr("width", newBarWidth).attr("y", function (d) {
                return yScale(d.value);
            }).attr("height", function (d) {
                return height - margin.top - yScale(d.value);
            });
            overlay.attr("width", width - margin.right - xAxisWidthOffset).attr("height", height - margin.top);

            setHighlightRefLineByTime(highlightTimeValue);
        };

        function getXScaleDomainByContainerSize() {
            var containerSize = container.width();
            var xScaleDomainByWindowSize;
            var xScaleDomainByWindowSize = containerSize <= 900 ? [uniqueTimeValues[uniqueTimeValues.length - 61], uniqueTimeValues[uniqueTimeValues.length - 1]] : xScaleDomain;
            if (!app.isWaterStorageChartVisible) {
                var xScaleDomainStart = +moment(xScaleDomainByWindowSize[0]).subtract(1, "months").valueOf();
                var xScaleDomainEnd = +moment(xScaleDomainByWindowSize[1]).add(1, "months").valueOf();
                xScaleDomainByWindowSize = [xScaleDomainStart, xScaleDomainEnd];
            }
            return xScaleDomainByWindowSize;
        }

        function getScaleExtentByContainerSize() {
            var containerSize = container.width();
            var scaleExtent = containerSize <= 900 ? [1, 10] : [1, 20];
            return scaleExtent;
        }

        updateMapAndChartByTime(highlightTimeValue, true);
        this.toggleChartViews();
    }

    function MonthlyTrendChart(data) {
        var getMonthFromTime = d3.time.format("%B");
        var getYearFromTime = d3.time.format("%y");
        var precipData = data.filter(function (d) {
            return d.key === "Precipitation";
        });
        var evapoData = data.filter(function (d) {
            return d.key === "Evapotranspiration";
        });
        var soilMoistureData = data.filter(function (d) {
            return d.key === "Soil Moisture";
        });
        var snowpackData = data.filter(function (d) {
            return d.key === "Snowpack";
        });
        var runoffData = data.filter(function (d) {
            return d.key === "Runoff";
        });
        var chartColor;
        var changeInStorageData = {
            "key": "ChangeInStorage",
            "values": precipData[0].values.map(function (d, i) {
                return {
                    "stdTime": d.stdTime,
                    "value": d.value - evapoData[0].values[i].value - runoffData[0].values[i].value
                };
            })
        };
        data.push(changeInStorageData);

        var chartData = data.map(function (d) {
            d.values.forEach(function (k) {
                var stdTime = new Date(k.stdTime);
                k.month = getMonthFromTime(stdTime);
                k.year = getYearFromTime(stdTime);
            });

            var entries = d3.nest().key(function (d) {
                return d.month;
            }).entries(d.values);

            var annualValues = [];

            entries.forEach(function (i) {
                i.dataType = d.key;

                i.values.forEach(function (item, index) {
                    if (typeof annualValues[index] === 'undefined') {
                        annualValues[index] = [];
                    }
                    annualValues[index].push(item.value);
                });
            });

            var annualTotalEntry = {
                "dataType": d.key,
                "key": "Annual",
                "values": []
            };

            var annualValuesSum = annualValues.map(function (k) {
                var sum = 0;
                k.forEach(function (v) {
                    sum += v;
                });
                return sum;
            });

            annualValuesSum.forEach(function (item, index) {
                var year = entries[0].values[index].year;
                var value = d.key === "Soil Moisture" || d.key === "Snowpack" ? item / 12 : item;
                var annualValObj = {
                    "month": "Annual",
                    "value": value,
                    "year": year
                };

                if (annualValues[index].length >= 12) {
                    annualTotalEntry.values.push(annualValObj);
                }
            });

            entries.push(annualTotalEntry);

            return {
                "key": d.key,
                "values": entries
            };
        });

        var uniqueYearValues = chartData[0].values[0].values.map(function (d, i) {
            return d.year;
        });
        var uniqueMonthValues = chartData[0].values.map(function (d, i) {
            return d.key;
        });
        uniqueMonthValues = uniqueMonthValues.filter(function (d) {
            return d !== "Annual";
        });

        chartData.forEach(function (d) {
            d.values.forEach(function (k) {
                var allYearsValue = k.values.filter(function (value) {
                    return value.month !== "Annual";
                });
                var sumOfAllYearsValue = allYearsValue.reduce(function (acc, obj) {
                    return acc + obj.value;
                }, 0);
                k.normalizedValue = sumOfAllYearsValue / uniqueYearValues.length;
            });
        });

        var containerID = ".monthly-trend-chart-div";
        var container = $(containerID);
        container.empty();
        $(".tooltip-monthly-trend-chart").remove();

        var margin = { top: 15, right: 10, bottom: 12, left: 20 };
        var width = container.width() - margin.left - margin.right;
        var height = container.height() - margin.top - margin.bottom;

        var svg = d3.select(containerID).append("svg").attr('class', 'monthly-trend-chart-svg').attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr('class', 'canvas-element-monthly-trend-chart').attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var xScale = d3.scale.ordinal().domain(uniqueYearValues)
        // .rangeRoundBands([margin.left, width - margin.right]);
        .rangeRoundBands([margin.left, width - margin.right], 1);

        var xScaleForMonthlyNormals = d3.scale.ordinal().domain(uniqueMonthValues)
        // .rangeRoundBands([margin.left, width - margin.right]);
        .rangeRoundBands([margin.left, width - margin.right], 1);

        var yScale = d3.scale.linear().range([height - margin.top, 0]).domain([0, d3.max(soilMoistureData[0].values.concat(snowpackData[0].values), function (d) {
            return d.value;
        })]);

        var xAxis = d3.svg.axis().innerTickSize(-(height - margin.top)).tickPadding(10).scale(xScale).outerTickSize(0).tickValues(xScale.domain().filter(function (d, i) {
            return !(i % 2);
        })).orient("bottom");

        var xAxisForMonthlyNormals = d3.svg.axis().innerTickSize(-(height - margin.top)).tickPadding(10).outerTickSize(0).scale(xScaleForMonthlyNormals).tickValues(xScaleForMonthlyNormals.domain().filter(function (d, i) {
            return !(i % 2);
        })).tickFormat(function (d) {
            return d.substring(0, 3);
        }).orient("bottom");

        var yAxis = d3.svg.axis().scale(yScale).innerTickSize(-(width - margin.left - margin.right)).ticks(6).tickPadding(5).outerTickSize(0).orient("left");

        var xAxisG = svg.append("svg:g").attr("class", "x axis").attr("transform", "translate(0," + (height - margin.top) + ")").call(xAxis);

        var xAxisGForMonthlyNormals = svg.append("svg:g").attr("class", "x axis").attr("transform", "translate(0," + (height - margin.top) + ")").call(xAxisForMonthlyNormals);

        var yAxisG = svg.append("svg:g").attr("class", "y axis").attr("transform", "translate(" + margin.left + ",0)").call(yAxis);

        var createLine = d3.svg.line().x(function (d) {
            return xScale(d.year);
        }).y(function (d) {
            return yScale(+d.value);
        }).interpolate("monotone");

        var createLineForMonthlyNormals = d3.svg.line().x(function (d) {
            return xScaleForMonthlyNormals(d.key);
        }).y(function (d) {
            return yScale(+d.normalizedValue);
        }).interpolate("monotone");

        var precipDataNested = chartData.filter(function (d) {
            return d.key === "Precipitation";
        });
        var evapoDataNested = chartData.filter(function (d) {
            return d.key === "Evapotranspiration";
        });
        var soilMoistureDataNested = chartData.filter(function (d) {
            return d.key === "Soil Moisture";
        });
        var snowpackDataNested = chartData.filter(function (d) {
            return d.key === "Snowpack";
        });
        var runoffDataNested = chartData.filter(function (d) {
            return d.key === "Runoff";
        });
        var changeInStorageDataNested = chartData.filter(function (d) {
            return d.key === "ChangeInStorage";
        });

        var waterStorageData = snowpackDataNested[0].values.concat(soilMoistureDataNested[0].values);
        var waterFluxData = precipDataNested[0].values.concat(evapoDataNested[0].values, runoffDataNested[0].values, changeInStorageDataNested[0].values);

        //create features group for each data group
        var features = svg.selectAll('features').data(waterStorageData.concat(waterFluxData)).enter().append('g').attr('class', 'features');

        //append the line graphic
        var lines = features.append('path').attr('class', 'monthly-trend-line').attr('d', function (d) {
            return createLine(d.values);
        }).attr('stroke', function (d, i) {
            return getColorByKey(d.dataType);
        }).style('opacity', "0.2").attr('stroke-width', 1).attr('fill', 'none');

        //create features group for each data group
        var featuresForMonthlyNormals = svg.selectAll('features').data(chartData).enter().append('g').attr('class', 'features-for-monthly-normals');

        //append the line graphic
        var linesForMonthlyNormal = featuresForMonthlyNormals.append('path').attr('class', 'monthly-normal-trend-line').attr('d', function (d) {
            return createLineForMonthlyNormals(getMonthlyNormalsData(d));
        }).attr('stroke', function (d, i) {
            return getColorByKey(d.key);
        }).style('opacity', "0.2").attr('stroke-width', 1).attr('fill', 'none');

        function getMonthlyNormalsData(data) {
            return data.values.filter(function (k) {
                return k.key !== "Annual";
            });
        }

        var verticalLine = svg.append('line').attr({ 'x1': 0, 'y1': 0, 'x2': 0, 'y2': height - margin.top }).style("display", "none").attr("stroke", "#909090").attr('class', 'monthly-trend-chart-verticalLine');

        var tooltipWrapperRectHeight = 15;
        var tooltipWrapperRectWidth = 60;
        var tooltipWrapperRectForYValueWidth = 50;

        var tooltipGroupForXValue = svg.append("g").attr("class", "tooltip-group").style("display", "none").attr("transform", "translate(0, 0)");

        var tooltipTextForXValue = tooltipGroupForXValue.append("text").attr('class', 'tooltip-text tooltip-text-bold').attr('x', tooltipWrapperRectWidth / 2).attr('y', tooltipWrapperRectHeight / 2).attr("text-anchor", "middle").attr("alignment-baseline", "central").style('fill', chartColor);

        var tooltipGroupForYValue = svg.append("g").attr("class", "tooltip-group").style("display", "none").attr("transform", "translate(0, 60)");

        var tooltipWrapperRectForYValue = tooltipGroupForYValue.append('rect').attr('width', tooltipWrapperRectForYValueWidth).attr('height', tooltipWrapperRectHeight).attr("transform", "translate(0, 0)").attr('class', 'tooltip-wrapper-rect').style('opacity', 1).style('fill', '#333');

        var tooltipTextForYValue = tooltipGroupForYValue.append("text").attr('class', 'tooltip-text tooltip-text-bold').attr('x', tooltipWrapperRectForYValueWidth / 2).attr('y', tooltipWrapperRectHeight / 2).attr("text-anchor", "middle").attr("alignment-baseline", "central").style('fill', chartColor);

        var overlay = svg.append("rect").attr("class", "overlay").attr("width", width).attr("height", height).on("mouseover", function () {
            toggleTootip(true);
        }).on("mouseout", function () {
            toggleTootip(false);
        }).on("mousemove", mousemove);

        function mousemove() {
            // var dataLayerType = $(".data-layer-select").val();
            var dataLayerType = $(".map-layer-select option:selected").attr("value");
            var monthSelectValue = $(".month-select").val();

            var tickPos = monthSelectValue === "MonthlyNormals" ? xScaleForMonthlyNormals.range() : xScale.range();

            var m = d3.mouse(this),
                lowDiff = 1e99,
                //positive infinite
            xI = null;
            for (var i = 0; i < tickPos.length; i++) {
                var diff = Math.abs(m[0] - tickPos[i]);
                if (diff < lowDiff) {
                    lowDiff = diff;
                    xI = i;
                }
            }
            verticalLine.attr("transform", function () {
                return "translate(" + tickPos[xI] + ", 0)";
            });
            var chartDataByLayerType = chartData.filter(function (d) {
                return d.key === dataLayerType;
            })[0];
            var chartDataByLayerTypeAndMonth;

            if (monthSelectValue !== "MonthlyNormals") {
                chartDataByLayerTypeAndMonth = chartDataByLayerType.values.filter(function (d) {
                    return d.key === monthSelectValue;
                })[0];
            } else {
                chartDataByLayerTypeAndMonth = chartDataByLayerType.values;
            }

            if (monthSelectValue !== "MonthlyNormals") {

                if (!chartDataByLayerTypeAndMonth.values[xI]) {
                    toggleTootip(false);
                    return;
                } else {
                    toggleTootip(true);
                }
            }

            var xValueByMousePos = monthSelectValue === "MonthlyNormals" ? chartDataByLayerTypeAndMonth[xI].key.substring(0, 3) : monthSelectValue === "Annual" ? "20" + chartDataByLayerTypeAndMonth.values[xI].year : "20" + chartDataByLayerTypeAndMonth.values[xI].year + " " + chartDataByLayerTypeAndMonth.values[xI].month.substring(0, 3);

            var yValueByMousePos = monthSelectValue === "MonthlyNormals" ? round(chartDataByLayerTypeAndMonth[xI].normalizedValue, 1) : chartDataByLayerTypeAndMonth.values[xI].value;

            tooltipTextForXValue.text(xValueByMousePos);
            tooltipTextForYValue.text(round(yValueByMousePos, 0) + " mm");
            tooltipGroupForXValue.attr("transform", function () {
                return "translate(" + (tickPos[xI] - tooltipWrapperRectWidth / 2) + ", " + -tooltipWrapperRectHeight + ")";
            });
            tooltipGroupForYValue.attr("transform", function () {
                return "translate(" + (xI <= 7 ? tickPos[xI] + 2 : tickPos[xI] - tooltipWrapperRectForYValueWidth - 2) + ", " + (yScale(yValueByMousePos) - tooltipWrapperRectHeight / 2) + ")";
            });
        }

        function toggleTootip(isVisible) {
            if (isVisible) {
                verticalLine.style("display", null);
                tooltipGroupForXValue.style("display", null);
                tooltipGroupForYValue.style("display", null);
            } else {
                verticalLine.style("display", "none");
                tooltipGroupForXValue.style("display", "none");
                tooltipGroupForYValue.style("display", "none");
            }
        }

        this.updateChartScale = function () {
            // var dataLayerType = $(".data-layer-select").val();
            var dataLayerType = $(".map-layer-select option:selected").attr("value");
            var monthSelectValue = $(".month-select").val();

            var getYScaleDomainForSummarizedValues = function getYScaleDomainForSummarizedValues() {
                var yScaleDomain;
                var yScaleDomainForMonthlyValues;
                var keyName = monthSelectValue === "Annual" ? "value" : "normalizedValue";
                var chartDataByLayerType = chartData.filter(function (d) {
                    return d.key === dataLayerType;
                })[0];
                var annualTotalData = chartDataByLayerType.values.filter(function (d) {
                    return d.key === "Annual";
                })[0];
                var monthlyData = chartDataByLayerType.values.filter(function (d) {
                    return d.key !== "Annual";
                });
                var maxForYScale = d3.max(monthSelectValue === "Annual" ? annualTotalData.values : monthlyData, function (d) {
                    return d[keyName];
                });
                var minForYScale = d3.min(monthSelectValue === "Annual" ? annualTotalData.values : monthlyData, function (d) {
                    return d[keyName];
                });

                if (monthSelectValue === "Annual") {
                    yScaleDomainForMonthlyValues = getYScaleDomainForMonthlyValues();
                    yScaleDomainForMonthlyValues = yScaleDomainForMonthlyValues.concat([minForYScale, maxForYScale]);
                    yScaleDomain = [d3.min(yScaleDomainForMonthlyValues), d3.max(yScaleDomainForMonthlyValues)];
                } else {
                    yScaleDomain = [minForYScale, maxForYScale];
                }
                return yScaleDomain;
            };

            var getYScaleDomainForMonthlyValues = function getYScaleDomainForMonthlyValues() {
                var chartDataByLayerType = data.filter(function (d) {
                    return d.key === dataLayerType;
                })[0];
                var maxForYScale = d3.max(chartDataByLayerType.values, function (d) {
                    return d.value;
                });
                var minForYScale = d3.min(chartDataByLayerType.values, function (d) {
                    return d.value;
                });
                return [minForYScale, maxForYScale];
            };

            if (monthSelectValue === "Annual" || monthSelectValue === "MonthlyNormals") {
                yScale.domain(getYScaleDomainForSummarizedValues());
            } else {
                yScale.domain(getYScaleDomainForMonthlyValues());
            }

            yAxisG.transition().duration(1000).ease("sin-in-out").call(yAxis);
            lines.transition().duration(1000).attr('d', function (d) {
                return createLine(d.values);
            });
            linesForMonthlyNormal.transition().duration(1000).attr('d', function (d) {
                return createLineForMonthlyNormals(getMonthlyNormalsData(d));
            });
            tooltipTextForYValue.style("fill", function () {
                return getColorByKey(dataLayerType);
            });
            tooltipTextForXValue.style("fill", function () {
                return getColorByKey(dataLayerType);
            });
        };

        this.resize = function () {
            width = container.width() - margin.left - margin.right - 5;
            height = container.height() - margin.top - margin.bottom - 5;
            xScale.rangeRoundBands([margin.left, width - margin.right]);
            xScaleForMonthlyNormals.rangeRoundBands([margin.left, width - margin.right]);
            yScale.range([height - margin.top, 0]);
            yAxis.innerTickSize(-(width - margin.left));
            xAxisG.attr("transform", "translate(0," + (height - margin.top) + ")").call(xAxis);
            xAxisGForMonthlyNormals.attr("transform", "translate(0," + (height - margin.top) + ")").call(xAxisForMonthlyNormals);
            yAxisG.call(yAxis);

            d3.select(".monthly-trend-chart-svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom);

            lines.attr('d', function (d) {
                return createLine(d.values);
            });
            linesForMonthlyNormal.attr('d', function (d) {
                return createLineForMonthlyNormals(getMonthlyNormalsData(d));
            });
            overlay.attr("width", width).attr("height", height);
        };

        this.highlightTrendLineByMonth = function (month) {
            // var dataLayerType = $(".data-layer-select").val();
            var dataLayerType = $(".map-layer-select option:selected").attr("value");
            var monthlySelectValue = $(".month-select").val();
            $(".monthly-trend-chart-title-div").text("Trend Analyzer for " + dataLayerType);
            lines.style("opacity", 0);
            lines.style("stroke-width", 1);
            linesForMonthlyNormal.style("opacity", 0);
            linesForMonthlyNormal.style("stroke-width", 1);
            xAxisG.style("opacity", 0);
            xAxisGForMonthlyNormals.style("opacity", 0);

            if (monthlySelectValue !== "MonthlyNormals") {
                lines.each(function (d) {
                    var lineElement = d3.select(this).node();
                    if (d.key !== month && d.dataType === dataLayerType) {
                        d3.select(lineElement).style("opacity", 0.2);
                        d3.select(lineElement).style("stroke-width", 1);
                    } else if (d.key === month && d.dataType === dataLayerType) {
                        d3.select(lineElement).style("opacity", 1);
                        d3.select(lineElement).style("stroke-width", 3);
                    }
                });
                xAxisG.style("opacity", 1);
                $(".month-select").val(month);
            } else {
                linesForMonthlyNormal.each(function (d) {
                    var lineElement = d3.select(this).node();
                    if (d.key === dataLayerType) {
                        d3.select(lineElement).style("opacity", 1);
                        d3.select(lineElement).style("stroke-width", 3);
                    }
                });
                xAxisGForMonthlyNormals.style("opacity", 1);
            }
        };

        this.getChangeInStorageDataByMonth = function (fullMonthName) {
            var changeInStorageDataByMonth = changeInStorageDataNested[0].values.filter(function (d) {
                return d.key === fullMonthName;
            });
            return changeInStorageDataByMonth[0];
        };

        this.getSoilMoistureDataByMonth = function (fullMonthName) {
            var soilMoistureDataByMonth = soilMoistureDataNested[0].values.filter(function (d) {
                return d.key === fullMonthName;
            });
            return soilMoistureDataByMonth[0];
        };
    }

    function convertChartDataToCSV(objArray) {

        var str = "data:text/csv;charset=utf-8,";
        var headers = ['Time'];
        var timeFormatFullMonthName = d3.time.format("%Y-%B");

        // get column headers
        app.mainChart.rawData.forEach(function (item, idx) {
            var header = item.key === 'ChangeInStorage' ? 'Change In Storage' : item.key;
            headers.push(header);
        });
        // set csv headers
        str += headers.join(',');
        str += '\r\n';

        app.mainChart.rawData[0].values.forEach(function (item, idx) {
            var rowData = [timeFormatFullMonthName(new Date(item.stdTime)), item.value, app.mainChart.rawData[1].values[idx].value, app.mainChart.rawData[2].values[idx].value, app.mainChart.rawData[3].values[idx].value, app.mainChart.rawData[4].values[idx].value, app.mainChart.rawData[5].values[idx].value];

            var rowStr = rowData.join(',');
            str += rowStr + '\r\n';
        });

        return str;
    }

    //add event listeners
    $(".month-select").change(trendChartDropdownSelectOnChangeHandler);
    $(".data-layer-select").change(trendChartDropdownSelectOnChangeHandler);

    $(".map-layer-select").change(function () {
        var selectedMapLayer = $(this).val();
        var selectedMapLayerCategory = $(".map-layer-select option:selected").attr("category");
        if (selectedMapLayerCategory === "waterflux") {
            app.isWaterStorageChartVisible = false;
            $(".waterfulx-legend").removeClass("hide");
            $(".waterstorage-legend").addClass("hide");
        } else {
            app.isWaterStorageChartVisible = true;
            $(".waterfulx-legend").addClass("hide");
            $(".waterstorage-legend").removeClass("hide");
        }
        setDataLayerSelectValue(selectedMapLayer);
        if (app.mainChart) {
            app.mainChart.toggleChartViews();
        }
        if (app.monthlyTrendChart) {
            app.monthlyTrendChart.highlightTrendLineByMonth(app.selectedMonth);
            app.monthlyTrendChart.updateChartScale();
        }
        setOperationalLayersVisibility();
    });

    $(".legend-wrapper").on("click", function (event) {
        event.stopPropagation();
        var targetItem = $(this);
        var selectedLegendItemValue = targetItem.attr("value");

        if (!targetItem.hasClass("active")) {
            targetItem.addClass("active");
            targetItem.css("opacity", 1);
            targetItem.siblings(".legend-wrapper").css("opacity", 0.5);
            targetItem.siblings(".legend-wrapper").removeClass("active");
            app.mainChart.highlightChartItemByLegendValue(selectedLegendItemValue);
        } else {
            targetItem.removeClass("active");
            targetItem.css("opacity", 1);
            targetItem.siblings(".legend-wrapper").css("opacity", 1);
            app.mainChart.toggleChartViews();
        }
    });

    $(".main-chart-legend-div").on("click", function () {
        app.mainChart.toggleChartViews();
    });

    $(".app-message-wrapper").on("click", function () {
        $(this).removeClass("show");
    });

    $(".scale-chart-rect").on("mouseover", function () {
        toggleSummaryInfoTooltip(true);
    });

    $(".scale-chart-rect").on("mouseout", function () {
        toggleSummaryInfoTooltip(false);
    });

    $(".main-chart-info-icon").on("mouseover", function () {
        toggleMainChartInfoTooltip(true);
    });

    $(".main-chart-info-icon").on("mouseout", function () {
        toggleMainChartInfoTooltip(false);
    });

    $('.link-download-csv').on('click', function () {
        var link = $(this);
        var csvStr = convertChartDataToCSV();
        var encodedUri = encodeURI(csvStr);
        var csvFileName = "water-balance-data(" + round(app.pointGeom.x, 2) + "," + round(app.pointGeom.y, 2) + ").csv";
        link.attr("href", encodedUri);
        link.attr("download", csvFileName);
    });

    $('.about-app-icon').on('click', function () {
        // $('#about-this-app').addClass('show');
        calcite.bus.emit('modal:open', 'foo');
    });

    $(window).resize(function () {
        if (app.mainChart) {
            app.mainChart.resize();
            app.monthlyTrendChart.resize();
        }
    });

    function getColorByKey(key) {
        var color;
        switch (key) {
            case "Precipitation":
                color = "#5984ca";
                break;
            case "Evapotranspiration":
                color = "#b15a4d";
                break;
            case "Runoff":
                color = "#b15a4d";
                break;
            case "ChangeInStorage":
                color = "#129876";
                break;
            case "Snowpack":
                color = "#f9f9f9";
                break;
            case "Soil Moisture":
                color = "#598fb8";
                break;
        }
        return color;
    }

    function round(value, decimals) {
        return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
    }

    function average(data) {
        var sum = data.reduce(function (sum, value) {
            return sum + value;
        }, 0);
        var avg = sum / data.length;
        return avg;
    }
});