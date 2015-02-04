/**
 * Copyright 2012 52�North Initiative for Geospatial Open Source Software GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
var num_lin_ds = 0, num_us_ds = 0;
var num_lin_mod = 0, num_us_mod = 0;

//xml-json variables / geonetwork 
var domain, idDomain, searchDomain;
var id, children;
var metaViz = {};
var jsonObject;

//namespaces
var gmd = "http://www.isotc211.org/2005/gmd";
var gco = "http://www.isotc211.org/2005/gco";
var gml = "http://www.opengis.net/gml";
var gmi = "http://eden.ign.fr/xsd/metafor/20050620/gmi";

//switch parent-child / lineage view
var viewLineage = true;
var dataID, gnID;


/**
 * Method to call requestController servlet and get json string.
 */
metaViz.dataBaseRequest = function(mode, id, callback) {
    $.ajax({
        "url": 'MetavizController',
        "type": 'GET',
        "data": {
            "mode": mode,
            "id": id,
        },
        "success": function(data, status) {
            return callback(data);
        }
    });
};

/**
 * Method to hide metaviz gui elements.
 */
metaViz.hideMetaViz = function() {
    if (heatmap)
        metaVizMode = false; 

    num_lin_ds = 0, num_us_ds = 0;
    num_lin_mod = 0, num_us_mod = 0;
    dojo.byId("page").style.display = "none";

    lineage_model_cards = 0;
    usage_model_cards = 0;

    lineage_model_mini_cards = 0;
    usage_model_mini_cards = 0;

    lineage_dataset_cards = 0;
    usage_dataset_cards = 0;

    lineage_dataset_mini_cards = 0;
    usage_dataset_mini_cards = 0;

    al = dojo.byId("actual_lines");
    while (al.hasChildNodes()) {
        al.removeChild(al.lastChild);
    } 
    ldmcc = dojo.byId("lineage_dataset_mini_cards_container");
    while (ldmcc.hasChildNodes()) {
        ldmcc.removeChild(ldmcc.lastChild);
    } 
    lmmcc = dojo.byId("lineage_model_mini_cards_container");
    while (lmmcc.hasChildNodes()) {
        lmmcc.removeChild(lmmcc.lastChild);
    }  
    udmcc = dojo.byId("usage_dataset_mini_cards_container");
    while (udmcc.hasChildNodes()) {
        udmcc.removeChild(udmcc.lastChild);
    }  
    ummcc = dojo.byId("usage_model_mini_cards_container");
    while (ummcc.hasChildNodes()) {
        ummcc.removeChild(ummcc.lastChild);
    }  
    ldcc = dojo.byId("lineage_dataset_cards_container");
    while (ldcc.hasChildNodes()) {
        ldcc.removeChild(ldcc.lastChild);
    }  
    lmcc = dojo.byId("lineage_model_cards_container");
    while (lmcc.hasChildNodes()) {
        lmcc.removeChild(lmcc.lastChild);
    }  
    umcc = dojo.byId("usage_model_cards_container");
    while (umcc.hasChildNodes()) {
        umcc.removeChild(umcc.lastChild);
    } 
    udcc = dojo.byId("usage_dataset_cards_container");
    while (udcc.hasChildNodes()) {
        udcc.removeChild(udcc.lastChild);
    } 
    udic = dojo.byId("input_container");
    while (udcc.hasChildNodes()) {
        udic.removeChild(udcc.lastChild);
    } 
};

/**
 * Method to show metaviz gui elements.
 * Database request is set up and display function is initialized.
 *
 * @param mode - db/csw/file ... requests db/csw/file
 * @param id - id of data set
 */
metaViz.showMetaViz = function(id, children) {

    //navi_hide_show_logic -> metaViz is not hidden at beginning
    //show Preloader
    guiFunctions.showPreloaderCallback().then(function() {
        lineage_hidden = true;
        mode = "hsql";
        metaViz.hideMetaViz();

        if (dojo.byId("map_info_text") != null)
            dojo.byId("map_info_text").innerHTML = "Click on an item in the list to reset the lineage view to map.";

        this.id = id;
        this.children = children;
        //get domain (needed for parents)
        domain = id.split("=")[0] + "=";                              //url to show xml  
        gnID = id.split("=")[1];
        idDomain = domain.split("srv")[0] + "srv/eng/search#|";             //url to get info based on ID
        searchDomain = domain.split("srv")[0] + "srv/eng/search#fast=index&from=1&to=10&any_OR_geokeyword=" //url to search for keywords

        //read xml from http request and convert to valid json 
        readXML(id, true, function(err, response) { // pass an anonymous function
            if (err) {
                //do nothing
            } else {
                var json = prepareData(response, children);
                metaViz.displayMetaViz(json);
                hidePreloader();

            }
        });
    });

};

//get xml from http request
function readXML(theUrl, boolXML, callback) {
    var xmlhttp = null;
    if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } else {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            if (boolXML)
                callback(null, xmlhttp.responseXML);
            else
                callback(null, xmlhttp.responseText);
        } else {
            // callback(xmlhttp.statusText);
        }
    }
    xmlhttp.open("GET", theUrl, false);
    xmlhttp.send();
}
;

//convert xml to json
function prepareData(xml, children) {
    try {
        code = xml.getElementsByTagNameNS(gmd, "identificationInfo")[0].getElementsByTagNameNS(gmd, "code")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML;
        codeSpace = xml.getElementsByTagNameNS(gmd, "identificationInfo")[0].getElementsByTagNameNS(gmd, "codeSpace")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML;
        //ID
        dataID = codeSpace + ":" + code;
    } catch (e) {
        dataID = xml.getElementsByTagNameNS(gmd, "fileIdentifier")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML;
    }
    //keywords
    keywords = "";
    keywordObject = xml.getElementsByTagNameNS(gmd, "MD_Keywords")[0].getElementsByTagNameNS(gmd, "keyword");
    for (var i = 0; i < keywordObject.length; i++) {
        keywords += keywordObject[i].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML;
        if (i != keywordObject.length - 1)
            keywords += "; ";
    }
    //vector true/false 
    var format = "";
    if (xml.getElementsByTagNameNS(gmd, "MD_Format")[0] != undefined)
        format = xml.getElementsByTagNameNS(gmd, "MD_Format")[0].getElementsByTagNameNS(gmd, "name")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML;

    if (format === "ShapeFile" || format === "GML" || format === "RDF" || format === "XML")
        vector = true;
    else
        vector = false;


    //try catches because of different formats
    try {
        modelTitle = emptyChecker(xml.getElementsByTagNameNS(gmd, "MD_Identifier")[0].getElementsByTagNameNS(gmd, "code")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML);
    } catch (e) {
        modelTitle = ""; //xml.getElementsByTagNameNS(gmd, "title")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML;
    }
    try {
        dateTime = emptyChecker(xml.getElementsByTagNameNS(gmd, "dateStamp")[0].getElementsByTagNameNS(gco, "Date")[0].innerHTML);
    } catch (e) {
        try {
            dateTime = emptyChecker(xml.getElementsByTagNameNS(gmd, "dateStamp")[0].getElementsByTagNameNS(gco, "DateTime")[0].innerHTML);
        } catch (e) {
            dateTime = "";
        }
    }
    try {
        save = emptyChecker(xml.getElementsByTagNameNS(gmd, "linkage")[0].getElementsByTagNameNS(gmd, "URL")[0].innerHTML);
    } catch (e) {
        save = "";
    }
    try {
        time = emptyChecker(xml.getElementsByTagNameNS(gml, "beginPosition")[0].innerHTML + " - " + emptyChecker(xml.getElementsByTagNameNS(gml, "endPosition")[0].innerHTML));
    } catch (e) {
        time = "";
    }
    try {
        lineageDescription = emptyChecker(xml.getElementsByTagNameNS(gmd, "lineage")[0].getElementsByTagNameNS(gmd, "statement")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML);
    } catch (e) {
        lineageDescription = "No lineage information available."; //emptyChecker(xml.getElementsByTagNameNS(gmd, "lineage")[0].getElementsByTagNameNS(gmd, "description")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML);
    }
    try {
        rationale = emptyChecker(
                xml.getElementsByTagNameNS(gmd, "lineage")[0].
                getElementsByTagNameNS(gmd, "LI_Lineage")[0].
                getElementsByTagNameNS(gmd, "processStep")[0].
                getElementsByTagNameNS(gmi, "LE_ProcessStep")[0].
                getElementsByTagNameNS(gmd, "rationale")[0].
                getElementsByTagNameNS(gco, "CharacterString")[0].
                innerHTML);
    } catch (e) {
        rationale = "";
    }

    var publication_title = "", publication_date = "", publication_url = "";
    if (emptyChecker(xml.getElementsByTagNameNS(gmi, "documentation")[0]) != null) {
        if (xml.getElementsByTagNameNS(gmi, "documentation")[0].
                getElementsByTagNameNS(gmd, "CI_Citation")[0].
                getElementsByTagNameNS(gmd, "title")[0] != null)
            publication_title = xml.getElementsByTagNameNS(gmi, "documentation")[0].
                    getElementsByTagNameNS(gmd, "CI_Citation")[0].
                    getElementsByTagNameNS(gmd, "title")[0].
                    getElementsByTagNameNS(gco, "CharacterString")[0].
                    innerHTML;
        if (xml.getElementsByTagNameNS(gmi, "documentation")[0].
                getElementsByTagNameNS(gmd, "CI_Citation")[0].
                getElementsByTagNameNS(gmd, "date")[0] != null)
            publication_date = xml.getElementsByTagNameNS(gmi, "documentation")[0].
                    getElementsByTagNameNS(gmd, "CI_Citation")[0].
                    getElementsByTagNameNS(gmd, "date")[0].
                    getElementsByTagNameNS(gmd, "CI_Date")[0].
                    getElementsByTagNameNS(gmd, "date")[0].
                    getElementsByTagNameNS(gco, "Date")[0].
                    innerHTML;
        if (xml.getElementsByTagNameNS(gmi, "documentation")[0].
                getElementsByTagNameNS(gmd, "CI_Citation")[0].
                getElementsByTagNameNS(gmd, "otherCitationDetails")[0] != null)
            publication_url = xml.getElementsByTagNameNS(gmi, "documentation")[0].
                    getElementsByTagNameNS(gmd, "CI_Citation")[0].
                    getElementsByTagNameNS(gmd, "otherCitationDetails")[0].
                    getElementsByTagNameNS(gco, "CharacterString")[0].
                    innerHTML;
    }

    //JSON Object - pure without extra lineage or usage datasets
    jsonObject = {
        "mapping_ids_uuids": {
            "paramName": "mapping_ids_uuids",
            "detail_0": dataID,
            "lineage_model_0": "model_0"
        },
        "model_data": {
            "model_0": {
                "title": modelTitle,
                "dateTime": dateTime, //DateTime with sample dataset
                "description": emptyChecker(xml.getElementsByTagNameNS(gmd, "abstract")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML), //or abstreact
                "organisation": emptyChecker(xml.getElementsByTagNameNS(gmd, "organisationName")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML),
                "input_datasets": [],
                "output_datasets": [
                    dataID
                ],
                "type": "lineage",
                "paramName": "model_0",
                "info": ""
            },
            "paramName": "models"
        },
        "detail_data": {
            "  ": {
                "linked_2_modelInput": 0,
                "keywords": emptyChecker(keywords),
                "save": save,
                "organisation": emptyChecker(xml.getElementsByTagNameNS(gmd, "organisationName")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML),
                "type": " ",
                "info": " ",
                "title": emptyChecker(xml.getElementsByTagNameNS(gmd, "title")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML),
                "time": time,
                "extent": "180,-90;-180,-90;-180,90;180,90",
                "description": emptyChecker(xml.getElementsByTagNameNS(gmd, "abstract")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML), //or abstract
                "vector": vector,
                "view": "",
                "paramName": dataID,
                "gnID": gnID,
                "relations_csw": " "
            },
            "paramName": "detail"
        },
        "usage": {
            "models": {
                "usage_model_ids": [],
                "paramName": "usage_models"
            },
            "mod_ds_relations": {
                "paramName": "mod_ds_relations"
            },
            "paramName": "usage"
        },
        "lineage_detail": {
            "statement": {
                "description": "",
                "paramName": "statement"
            },
            "process_steps": {
                "process_step_0": {
                    "dateTime": dateTime,
                    "processing_list": {
                        "processing_0": {
                            "runTimeParams": "",
                            "docs": {
                                "doc_0": {
                                    "id": "",
                                    "alternateTitle": "",
                                    "title": publication_title,
                                    "others": publication_url,
                                    "date": publication_date,
                                    "paramName": "doc_0"
                                },
                                "paramName": "docs_0",
                                "size": 1
                            },
                            "sw_refs": {
                                "paramName": "sw_refs_0"
                            },
                            "identifier": emptyChecker(xml.getElementsByTagNameNS(gmd, "title")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML),
                            "paramName": "processing_0"
                        },
                        "paramName": "processingList"
                    },
                    "description": lineageDescription,
                    "rationale": rationale,
                    "processor": emptyChecker(xml.getElementsByTagNameNS(gmd, "organisationName")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML),
                    "paramName": "process_step_0"
                },
                "paramName": "process_steps"
            },
            "paramName": "lineage_detail"
        },
        "paramName": "metaViz_data",
        "dataset_data": {
            "paramName": "datasets"
        }
    };

	//view parent/child mode
    if (!viewLineage) {
        try {
            //modify object and add parent/children datasets 
            addParent(xml);
            addChildren(children, dataID);
        } catch (e) { }
	//view lineage/usage mode	
    } else {
        try {
            //add lineage datasets
            addLineageDS(xml, "model_0", "lineage");
            //search for identifier, get results as usage datasets 
            //http://localhost:8080/geonetwork/srv/eng/main.search?any_OR_keyword=urn:glues:lmu:metadata:dataset%20promet

            // code + codeSpace used for keyword search
            code = xml.getElementsByTagNameNS(gmd, "identificationInfo")[0].getElementsByTagNameNS(gmd, "code")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML;
            codeSpace = xml.getElementsByTagNameNS(gmd, "identificationInfo")[0].getElementsByTagNameNS(gmd, "codeSpace")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML;
            searchURL = domain.split("srv")[0] + "srv/eng/main.search?any_OR_keyword=" + code + " " + codeSpace;

            readXML(searchURL, false, function(err, response) {
                if (err) {
                    //do nothing
                } else {
                    table = response.split("<table>");
                    searchString = "";
					
					realUsage = false;
					
                    for (var i = 1; i < table.length; i++) {
                        tableContent = table[i].split("</div>")[0];
                        name = tableContent.split("h1")[1].split("\">")[2].split("</a>")[0];
                        gnid = tableContent.split("id=")[1].split("&amp;")[0];   //uuid is based on a button only shown to admin...
                        if (xml.getElementsByTagNameNS(gmd, "title")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML != name) {
                            
							//filter false friends - check if code/code space are used in lineage xml tag
							//TODO: optimize - this can be time-consuming!
							usageSearchURL = domain.split("srv")[0] + "srv/eng/xml_iso19139?id=" + gnid;
							
							readXML(usageSearchURL, true, function(err, response) {
								if (err) { //do nothing
								} else {
									usageXML = response;
									sources = usageXML.getElementsByTagNameNS(gmd, "source");
									if (sources != null) {
										for (var i = 0; i < sources.length; i++) {
											if (code == sources[i].getElementsByTagNameNS(gmd, "code")[0].getElementsByTagNameNS(gco, "CharacterString")[0]
											&& codeSpace == sources[i].getElementsByTagNameNS(gmd, "codeSpace")[0].getElementsByTagNameNS(gco, "CharacterString")[0])
												realUsage = true;
												break;
										}
									}
								}
							});
							
							if (realUsage)
								searchString += gnid + "+";
                        }
                    }
                    searchString = searchString.slice(0, -1);//delete last +
                    addChildren(searchString, dataID);
                }
            });
        } catch (e) {            //-> if there is no code and codespace, switch back to parent view 
            toggleView();
        }

    }

    return JSON.stringify(jsonObject);
}
;

/**
 * check if string is null or empty - used for json creation
 */
function emptyChecker(string) {
    if (string !== null || string !== "")
        return string;
    else {
        console.log("empty xml string:" + string);
        return "";
    }
}

/**
 * add dataset to jsonObject based in id and xml
 * @param {type} id
 * @param {type} xml
 * @returns {undefined}
 */
function addDataset(id, xml) {
    try {
        save = emptyChecker(xml.getElementsByTagNameNS(gmd, "linkage")[0].getElementsByTagNameNS(gmd, "URL")[0].innerHTML);
    } catch (e) {
        save = "";
    }
    try {
        time = emptyChecker(xml.getElementsByTagNameNS(gml, "beginPosition")[0].innerHTML + " - " + emptyChecker(xml.getElementsByTagNameNS(gml, "endPosition")[0].innerHTML));
    } catch (e) {
        time = "";
    }
    try {
        gnID = xml.getElementsByTagNameNS(gmd, "fileIdentifier")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML;
    } catch (e) {
    }
    jsonObject["dataset_data"][id] = {
        "keywords": "keywords",
        "save": save,
        "organisation": emptyChecker(xml.getElementsByTagNameNS(gmd, "organisationName")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML),
        "type": "usage",
        "info": " ",
        "title": emptyChecker(xml.getElementsByTagNameNS(gmd, "title")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML),
        "time": time,
        "extent": "",
        "description": emptyChecker(xml.getElementsByTagNameNS(gmd, "abstract")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML), //or abstract
        "vector": vector,
        "view": "",
        "gnID": gnID,
        "paramName": id,
        "relations_csw": " "
    };//end jsonObject
}
;
/**
 * add parent to jsonObject based on xml
 * @param {type} xml
 * @returns {undefined}
 */
function addParent(xml) {
    parent = "";
    if (xml.getElementsByTagNameNS(gmd, "parentIdentifier")[0] != null) {
        parent = xml.getElementsByTagNameNS(gmd, "parentIdentifier")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML;
        jsonObject['mapping_ids_uuids']["lineage_dataset_0"] = parent;
        jsonObject["model_data"]["model_0"]["input_datasets"][0] = parent;
        //get parent xml from http request
        var parentXML;
        readXML(domain + parent, true, function(err, response) {
            if (err) {
                //do nothing
            } else {
                parentXML = response;

                try {
                    save = emptyChecker(xml.getElementsByTagNameNS(gmd, "linkage")[0].getElementsByTagNameNS(gmd, "URL")[0].innerHTML);
                } catch (e) {
                    save = "";
                }
                try {
                    time = emptyChecker(xml.getElementsByTagNameNS(gml, "beginPosition")[0].innerHTML + " - " + emptyChecker(xml.getElementsByTagNameNS(gml, "endPosition")[0].innerHTML));
                } catch (e) {
                    time = "";
                }

                jsonObject["dataset_data"][parent] = {
                    "keywords": "keywords",
                    "save": save,
                    "organisation": emptyChecker(parentXML.getElementsByTagNameNS(gmd, "organisationName")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML),
                    "type": "lineage",
                    "info": " ",
                    "title": emptyChecker(parentXML.getElementsByTagNameNS(gmd, "title")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML),
                    "time": time,
                    "extent": "180,-90;-180,-90;-180,90;180,90",
                    "description": emptyChecker(parentXML.getElementsByTagNameNS(gmd, "abstract")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML), //or abstract
                    "vector": vector,
                    "view": "",
                    "paramName": parent,
                    "relations_csw": " ",
                    "gnID": parent
                };
            }
        });
    }
}
;
/**
 * add children based on parameter children (&children=child+child+) + id of main dataset
 * @param {type} children
 * @param {type} motherID
 * @returns {undefined}
 */
function addChildren(children, motherID) {
    if (viewLineage)
        domain = domain.replace("uuid", "id");
    if (children !== "") {
        childrenArray = children.split("+");
        childCounter = 1; //0 = lineage model 0 - maybe set usage models first and lineage model last, like previously
        for (var j = 0; j < childrenArray.length; j++) {
            var xmlKiddy;
            readXML(domain + childrenArray[j], true, function(err, response) {
                if (err) {
                    //do nothing
                } else {
                    xmlKiddy = response;
                    try {
                        dateTime = emptyChecker(xmlKiddy.getElementsByTagNameNS(gmd, "dateStamp")[0].getElementsByTagNameNS(gco, "Date")[0].innerHTML);
                    } catch (e) {
                        try {
                            dateTime = emptyChecker(xmlKiddy.getElementsByTagNameNS(gmd, "dateStamp")[0].getElementsByTagNameNS(gco, "DateTime")[0].innerHTML);
                        } catch (e) {
                            dateTime = "";
                        }
                        try {
                            codeKid = xmlKiddy.getElementsByTagNameNS(gmd, "identificationInfo")[0].getElementsByTagNameNS(gmd, "code")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML;
                            codeSpaceKid = xmlKiddy.getElementsByTagNameNS(gmd, "identificationInfo")[0].getElementsByTagNameNS(gmd, "codeSpace")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML;
                            //ID
                            kidId = codeSpaceKid + ":" + codeKid;
                        } catch (e) {
                            kidId = xmlKiddy.getElementsByTagNameNS(gmd, "fileIdentifier")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML;
                        }
                    }
                    //add children to dataset
                    addDataset(kidId, xmlKiddy);
                    //modify mappings
                    jsonObject["mapping_ids_uuids"]["usage_model_" + (childCounter - 1)] = "model_" + childCounter;
                    jsonObject["mapping_ids_uuids"]["usage_dataset_" + (childCounter - 1)] = kidId;
                    //add model
                    try {
                        modelTitle = emptyChecker(xmlKiddy.getElementsByTagNameNS(gmd, "MD_Identifier")[0].getElementsByTagNameNS(gmd, "code")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML);
                    } catch (e) {
                        modelTitle = xmlKiddy.getElementsByTagNameNS(gmd, "title")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML;
                    }
                    jsonObject["model_data"]["model_" + childCounter] = {
                        "title": modelTitle,
                        "dateTime": dateTime,
                        "description": emptyChecker(xmlKiddy.getElementsByTagNameNS(gmd, "abstract")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML), //or abstreact
                        "organisation": emptyChecker(xmlKiddy.getElementsByTagNameNS(gmd, "organisationName")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML),
                        "input_datasets": [
                            motherID
                        ],
                        "output_datasets": [
                            kidId
                        ],
                        "type": "usage",
                        "paramName": "model_" + childCounter,
                        "info": ""
                    };
                    //add to usage
                    jsonObject["usage"]["models"]["usage_model_ids"][childCounter - 1] = "usage_model_" + (childCounter - 1);
                    jsonObject["usage"]["mod_ds_relations"]["usage_model_" + (childCounter - 1)] = "model_" + (childCounter - 1); //quick fix -1 for model - otherwise usage_model_0=model_0 in mappings - and lineage has to move to last model
                    jsonObject["usage"]["mod_ds_relations"]["map" + (childCounter - 1)] = {
                        "dataset_ids": [
                            kidId
                        ],
                        "paramName": "usage_models_" + (childCounter - 1)
                    };
                    //add usage inputs if lineage view is active
                    if (viewLineage) {
                        addLineageDS(xmlKiddy, "model_" + (childCounter), "usage_input");
                    }
                }//end else
            });//end readXML  
            childCounter++;
        }//end for
    }//end if
}
/**
 * switch between parent-children view and lineage view (sources in xml)
 * @returns {toggleView}
 */
function toggleView() {
    viewLineage = !viewLineage;
    this.jsonObject = null;
    metaViz.showMetaViz(id, children);
}
/**
 * add lineage ds from gmd:source - model_0 = main model with type lineage - other models have usage_input
 * @param {type} xml
 * @returns {undefined}
 */
function addLineageDS(xml, model, type) {
    for (var i = 0; i < xml.getElementsByTagNameNS(gmd, "source").length; i++) {
        name = emptyChecker(xml.getElementsByTagNameNS(gmd, "source")[i].getElementsByTagNameNS(gmd, "codeSpace")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML) + ":" + emptyChecker(xml.getElementsByTagNameNS(gmd, "source")[i].getElementsByTagNameNS(gmd, "code")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML);
        if (type == "lineage") {
            jsonObject['mapping_ids_uuids']["lineage_dataset_" + i] = name;
            jsonObject["model_data"][model]["input_datasets"][i] = name;
        } else {
            jsonObject["model_data"][model]["input_datasets"][i] = name;
        }
        if (dataID != name) { 
            cS = emptyChecker(xml.getElementsByTagNameNS(gmd, "source")[i].getElementsByTagNameNS(gmd, "codeSpace")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML);
            c = emptyChecker(xml.getElementsByTagNameNS(gmd, "source")[i].getElementsByTagNameNS(gmd, "code")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML);
            sURL = domain.split("srv")[0] + "srv/eng/main.search?any_OR_keyword=" + c + " " + cS;

            readXML(sURL, false, function(err, response) { // pass an anonymous function
                if (err) { //do nothing
                } else {
                    t = response.split("<table>");
                    sString = "";
                    for (var i = 1; i < t.length; i++) {
                        tContent = t[i].split("</div>")[0];
                        searchedName = tContent.split("h1")[1].split("\">")[2].split("</a>")[0];
                        gnIdent = tContent.split("id=")[1].split("&amp;")[0];   //uuid is based on a button only shown to admin...
                        if (xml.getElementsByTagNameNS(gmd, "title")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML != searchedName) {
                            sString += gnIdent + "+";
                            break;
                        }
                    }
                    sString = sString.slice(0, -1);//delete last + 
                    linDomain = domain.replace("uuid", "id");
                    orga = "", bbox = "";
                    ident = sString;
					
					if (sString != "") {
						readXML(linDomain + sString, true, function(err, response) {
							if (err) {
                            //do nothing
							} else {
								xmlResponse = response;
								try {
									if (emptyChecker(xmlResponse.getElementsByTagNameNS(gmd, "CI_ResponsibleParty")[0]))
										orga = xmlResponse.getElementsByTagNameNS(gmd, "CI_ResponsibleParty")[0].
                                            getElementsByTagNameNS(gmd, "organisationName")[0].
                                            getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML;
									if (emptyChecker(xmlResponse.getElementsByTagNameNS(gmd, "EX_GeographicBoundingBox")[0]))
										bbox = xmlResponse.getElementsByTagNameNS(gmd, "westBoundLongitude")[0].
                                            getElementsByTagNameNS(gco, "Decimal")[0].innerHTML + ", " +
                                            xmlResponse.getElementsByTagNameNS(gmd, "eastBoundLongitude")[0].
                                            getElementsByTagNameNS(gco, "Decimal")[0].innerHTML + ", " +
                                            xmlResponse.getElementsByTagNameNS(gmd, "southBoundLatitude")[0].
                                            getElementsByTagNameNS(gco, "Decimal")[0].innerHTML + ", " +
                                            xmlResponse.getElementsByTagNameNS(gmd, "northBoundLatitude")[0].
                                            getElementsByTagNameNS(gco, "Decimal")[0].innerHTML + ", ";
								} catch (e) { }
							}
						});
					}
				}
            }); 
            
            jsonObject["dataset_data"][name] = {
                "keywords": "keywords",
                "save": "",
                "organisation": orga,
                "type": type,
                "info": " ",
                "title": emptyChecker(xml.getElementsByTagNameNS(gmd, "source")[i].getElementsByTagNameNS(gmd, "title")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML),
                "time": emptyChecker(xml.getElementsByTagNameNS(gmd, "source")[i].getElementsByTagNameNS(gmd, "date")[0].getElementsByTagNameNS(gco, "Date")[0].innerHTML), //emptyChecker(parentXML.getElementsByTagNameNS(gml,"beginPosition")[0].innerHTML +" - "+ emptyChecker(xml.getElementsByTagNameNS(gml,"endPosition")[0].innerHTML)),
                "extent": bbox,
                "description": emptyChecker(xml.getElementsByTagNameNS(gmd, "source")[i].getElementsByTagNameNS(gmd, "description")[0].getElementsByTagNameNS(gco, "CharacterString")[0].innerHTML),
                "vector": vector,
                "view": "",
                "paramName": name,
                "relations_csw": " ",
                "gnID": ident
            };
        }
    }
}
/**
 * Method to show metaviz gui elements.
 */
metaViz.displayMetaViz = function(data) { 
    try {
        var jsonObject = $.parseJSON(data);
    } catch (e) {
        console.log("Error with jsonString from database");
        return;
    }
    var storeData = {
        identifier: 'paramName', //each element and sub element must have an attribute 'paramName'
        items: [jsonObject]
    };

    require(["dojo/dom", "dojo/dom-style"], function(dom, domStyle) {
        if (dom.byId("btnCursor"))
            domStyle.set("btnCursor", "display", "none");
        if (dom.byId("btnFilter"))
            domStyle.set("btnFilter", "display", "none");
        if (dom.byId("btnRectangle"))
            domStyle.set("btnRectangle", "display", "none");
    });

    initMetaViz(storeData);
    dojo.byId("page").style.display = "block";
    if (dijit.byId("map_contentPane"))
        dijit.byId("map_contentPane").resize();
};