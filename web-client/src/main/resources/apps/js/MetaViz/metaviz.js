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
var num_lin_ds = 0,
    num_us_ds = 0;
var num_lin_mod = 0,
    num_us_mod = 0;
//xml-json variables / geonetwork 
var domain;
var metaViz = {};
var jsonObject;    
//namespaces
var gmd="http://www.isotc211.org/2005/gmd";
var gco="http://www.isotc211.org/2005/gco";
var gml="http://www.opengis.net/gml";

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

    if (dojo.byId("map_info_text") != null)
        dojo.byId("map_info_text").innerHTML = "Click on a boundingbox to get further information.";

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
    };

    udmcc = dojo.byId("usage_dataset_mini_cards_container");
    while (udmcc.hasChildNodes()) {
        udmcc.removeChild(udmcc.lastChild);
    };

    ummcc = dojo.byId("usage_model_mini_cards_container");
    while (ummcc.hasChildNodes()) {
        ummcc.removeChild(ummcc.lastChild);
    };

    ldcc = dojo.byId("lineage_dataset_cards_container");
    while (ldcc.hasChildNodes()) {
        ldcc.removeChild(ldcc.lastChild);
    };

    lmcc = dojo.byId("lineage_model_cards_container");
    while (lmcc.hasChildNodes()) {
        lmcc.removeChild(lmcc.lastChild);
    };

    umcc = dojo.byId("usage_model_cards_container");
    while (umcc.hasChildNodes()) {
        umcc.removeChild(umcc.lastChild);
    };

    udcc = dojo.byId("usage_dataset_cards_container");
    while (udcc.hasChildNodes()) {
        udcc.removeChild(udcc.lastChild);
    };
    udic = dojo.byId("input_container");
    while (udcc.hasChildNodes()) {
        udic.removeChild(udcc.lastChild);
    };
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

       // metaViz.dataBaseRequest(mode, id, function(data) {
       //    metaViz.displayMetaViz(data);
       //     hidePreloader();
       //
       //     if (heatmap)
       //         metaVizMode = true;
       //
       // });
        
        //alert(id); 
  //    new Ajax.Request( id, {
  //method:  'get',
  //parameters:  { 'param1': 'value1'},
  //onSuccess:  function(response){
  //  alert(response.responseText);
  //},
  //onFailure:  function(){
 //  alert('ERROR');
 // }
//});

//get domain (needed for parents
domain = id.split("=")[0]+"=";

//file="test.json"; //only test file - overwrite
////file="promet.json";
//localJson = readTextFile(file);
//metaViz.displayMetaViz(localJson);
//hidePreloader();
//console.log(response);

        //new code to read xml from http request and convert to valid json 
        readXML(id, function(err, response) { // pass an anonymous function
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
function readXML(theUrl,callback){  
    var xmlhttp=null;
    if (window.XMLHttpRequest)
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp=new XMLHttpRequest();
    }
    else
    {// code for IE6, IE5
        xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange=function()
    {       
        if (xmlhttp.readyState==4 && xmlhttp.status==200)
        {
            callback(null, xmlhttp.responseXML);
        }
        else{ 
           // callback(xmlhttp.statusText);
        }
    }
    xmlhttp.open("GET", theUrl, false );
            xmlhttp.send();  
};

//convert xml to json
function prepareData(xml,children){   
   
   //ID
   dataID = xml.getElementsByTagNameNS(gmd,"fileIdentifier")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML;
   //keywords
   keywords = "";
   keywordObject = xml.getElementsByTagNameNS(gmd,"MD_Keywords")[0].getElementsByTagNameNS(gmd,"keyword");
   for (var i=0; i<keywordObject.length;i++){
       keywords+=keywordObject[i].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML;
       if(i!=keywordObject.length-1)keywords+="; ";
   }
   //vector true/false
   format = xml.getElementsByTagNameNS(gmd,"MD_Format")[0].getElementsByTagNameNS(gmd,"name")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML;
   if (format==="ShapeFile") vector = true;else vector = false;

 
   //JSON Object -pure without ectra lineage or usage datasets
    jsonObject = {
        
        "mapping_ids_uuids": {
        "paramName": "mapping_ids_uuids",
        "detail_0": dataID,
        "lineage_model_0": "model_0"
        },
        
        "model_data": {
            "model_0": {
            "title": xml.getElementsByTagNameNS(gmd,"title")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML,
            "dateTime": xml.getElementsByTagNameNS(gmd,"dateStamp")[0].getElementsByTagNameNS(gco,"DateTime")[0].innerHTML,
            "description":  xml.getElementsByTagNameNS(gmd,"purpose")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML, //or abstreact
            "organisation": xml.getElementsByTagNameNS(gmd,"organisationName")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML,
            "input_datasets": [ ],
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
                "keywords": keywords,
                "save": xml.getElementsByTagNameNS(gmd,"linkage")[0].getElementsByTagNameNS(gmd,"URL")[0].innerHTML,
                "organisation": xml.getElementsByTagNameNS(gmd,"organisationName")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML,
                "type": " ", 
                "info": " ",
                "title": xml.getElementsByTagNameNS(gmd,"title")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML,
                "time": xml.getElementsByTagNameNS(gml,"beginPosition")[0].innerHTML +" - "+ xml.getElementsByTagNameNS(gml,"endPosition")[0].innerHTML,
                "extent": "180,-90;-180,-90;-180,90;180,90",
                "description":  xml.getElementsByTagNameNS(gmd,"purpose")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML, //or abstreact
                "vector": vector,
                "view": "",
                "paramName": dataID,
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
                    "dateTime": xml.getElementsByTagNameNS(gmd,"dateStamp")[0].getElementsByTagNameNS(gco,"DateTime")[0].innerHTML,
                    "processing_list": {
                        "processing_0": {
                        "runTimeParams": "",
                            "docs": {
                                "doc_0": {
                                "id": "",
                                "alternateTitle": "",
                                "title": null,
                                "others": null,
                                "date": null,
                                "paramName": "doc_0"
                                },
                            "paramName": "docs_0",
                            "size": 1
                            },
                            "sw_refs": {
                            "paramName": "sw_refs_0"
                            },
                        "identifier": xml.getElementsByTagNameNS(gmd,"title")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML,
                        "paramName": "processing_0"
                        },
                    "paramName": "processingList"
                    },
                "description": xml.getElementsByTagNameNS(gmd,"lineage")[0].getElementsByTagNameNS(gmd,"statement")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML,
                "rationale": "not set.",
                "processor": xml.getElementsByTagNameNS(gmd,"organisationName")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML,
                "paramName": "process_step_0"
                },
            "paramName": "process_steps"
            },
        "paramName": "lineage_detail"
        },
  
        "paramName": "metaViz_data",
        "dataset_data": {
        //  "ID": {
        //  "time": "",
        //  "title": "",
        //  "keywords": "",
        //  "save": "",
        //  "extent": "",
        //  "vector": "",
        //  "description": "",
        //  "organisation": "",
        //  "view": "",
        //  "type": "",
        //  "paramName": "",
        //  "relations_csw": "",
        //  "info": ""
        //  },
        "paramName": "datasets"
        }
    };
    
 //modify object to add parent/children datasets
   //parent check
   addParent(xml);
   //get childrens
   addChildren(children, dataID);
    
   //dojo.byId("jsonString").innerHTML = JSON.stringify(jsonObject);
   //alert(JSON.stringify(jsonObject)); 
   // var jsonObject = $.parseJSON(data);
   return JSON.stringify(jsonObject);
};

/**
 * add dataset to jsonObject based in id and xml
 * @param {type} id
 * @param {type} xml
 * @returns {undefined}
 */
function addDataset(id, xml){  
    jsonObject["dataset_data"][id]={
                "keywords": "keywords",
                "save": xml.getElementsByTagNameNS(gmd,"linkage")[0].getElementsByTagNameNS(gmd,"URL")[0].innerHTML,
                "organisation": xml.getElementsByTagNameNS(gmd,"organisationName")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML,
                "type": "usage", 
                "info": " ",
                "title": xml.getElementsByTagNameNS(gmd,"title")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML,
                "time": xml.getElementsByTagNameNS(gml,"beginPosition")[0].innerHTML +" - "+ xml.getElementsByTagNameNS(gml,"endPosition")[0].innerHTML,
                "extent": "180,-90;-180,-90;-180,90;180,90",
                "description":  xml.getElementsByTagNameNS(gmd,"purpose")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML, //or abstreact
                "vector": vector,
                "view": "",
                "paramName": id,
                "relations_csw": " "
                };//end jsonObject
};
/**
 * add parent to jsonObject based on xml
 * @param {type} xml
 * @returns {undefined}
 */
function addParent(xml){
    parent="";   //TODO: loop necessary if more prants are possible
    if (xml.getElementsByTagNameNS(gmd,"parentIdentifier")[0]!=null){
       parent = xml.getElementsByTagNameNS(gmd,"parentIdentifier")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML
       jsonObject['mapping_ids_uuids']["lineage_dataset_0"]=parent;
       jsonObject["model_data"]["model_0"]["input_datasets"][0]=parent;
       //get parent xml from http request
       var parentXML;
       readXML(domain+parent, function(err, response) { // pass an anonymous function
            if (err) {
                //do nothing
            } else {
                parentXML = response;
                jsonObject["dataset_data"][parent]={
                "keywords": "keywords",
                "save": parentXML.getElementsByTagNameNS(gmd,"linkage")[0].getElementsByTagNameNS(gmd,"URL")[0].innerHTML,
                "organisation": parentXML.getElementsByTagNameNS(gmd,"organisationName")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML,
                "type": "lineage", 
                "info": " ",
                "title": parentXML.getElementsByTagNameNS(gmd,"title")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML,
                "time": parentXML.getElementsByTagNameNS(gml,"beginPosition")[0].innerHTML +" - "+ xml.getElementsByTagNameNS(gml,"endPosition")[0].innerHTML,
                "extent": "180,-90;-180,-90;-180,90;180,90",
                "description":  parentXML.getElementsByTagNameNS(gmd,"purpose")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML, //or abstreact
                "vector": vector,
                "view": "",
                "paramName": parent,
                "relations_csw": " "
                };
            } 
        });
   }
};
/**
 * add children based on parameter children (&children=child+child+) + id of main dataset
 * @param {type} children
 * @param {type} motherID
 * @returns {undefined}
 */
function addChildren(children, motherID){
    if(children!==""){
    childrenArray = children.split("+");
    childCounter = 1; //0 = lineage model 0 - maybe set usage models first and lineage model last, like previously
    for(var j = 0;j<childrenArray.length-1;j++){
        console.log(j);
        var xmlKiddy;
        readXML(domain+childrenArray[j], function(err, response) { // pass an anonymous function
            console.log(domain+childrenArray[j]);
            if (err) {
                //do nothing
            } else {
                console.log("IN");
                xmlKiddy=response;
                //add children to dataset
                addDataset(childrenArray[j],xmlKiddy);  
                kidId=xmlKiddy.getElementsByTagNameNS(gmd,"fileIdentifier")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML;
                //modify mappings
                jsonObject["mapping_ids_uuids"]["usage_model_"+(childCounter-1)]="model_"+childCounter;
                jsonObject["mapping_ids_uuids"]["usage_dataset_"+(childCounter-1)]=kidId;
                //add model
                jsonObject["model_data"]["model_"+childCounter]={
                    "title": xmlKiddy.getElementsByTagNameNS(gmd,"title")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML,
                    "dateTime": xmlKiddy.getElementsByTagNameNS(gmd,"dateStamp")[0].getElementsByTagNameNS(gco,"DateTime")[0].innerHTML,
                    "description":  xmlKiddy.getElementsByTagNameNS(gmd,"purpose")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML, //or abstreact
                    "organisation": xmlKiddy.getElementsByTagNameNS(gmd,"organisationName")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML,
                    "input_datasets": [
                        motherID
                     ],
                    "output_datasets": [
                       kidId
                    ],
                    "type": "usage",
                    "paramName": "model_"+childCounter,
                    "info": ""   
                 };
                 //add to usage
                jsonObject["usage"]["models"]["usage_model_ids"][childCounter-1]="usage_model_"+(childCounter-1);
                jsonObject["usage"]["mod_ds_relations"]["usage_model_"+(childCounter-1)]="model_"+(childCounter-1); //quick fix -1 for model - otherwise usage_model_0=model_0 in mappings - and lineage has to move to last model
                jsonObject["usage"]["mod_ds_relations"]["map"+(childCounter-1)]={
                    "dataset_ids": [
                        kidId
                    ],
                    "paramName":"usage_models_"+(childCounter-1)
                };
            }//end else
        });//end readXML  
        childCounter++;
    }//end for
   }//end if
}
/**
 * Method to show metaviz gui elements.
 */
metaViz.displayMetaViz = function(data) {
    console.log(data);
    if (dojo.byId("time4mapsMap") != null) dojo.byId("time4mapsMap").style.display = "none";
    if (dojo.byId("mapII") != null) dojo.byId("mapII").style.display = "none";
    if (dojo.byId("map") != null) {
        var map = dojo.byId("map");
        //delete children of map
        if (map) {
            while (map.hasChildNodes()) {
                map.removeChild(map.lastChild);
            }
        }
    }
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









//old functions

function readTextFile(file)
{
    var allText ;
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                allText = rawFile.responseText;
                return allText;
                //alert(allText);
                
            }
        }
    }
    rawFile.send(null);
return(allText);
};



// Changes XML to JSON
function xmlToJson(xml) {
	
	// Create the return object
	var obj = {};

	if (xml.nodeType == 1) { // element
		// do attributes
		if (xml.attributes.length > 0) {
		obj["@attributes"] = {};
			for (var j = 0; j < xml.attributes.length; j++) {
				var attribute = xml.attributes.item(j);
				obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
			}
		}
	} else if (xml.nodeType == 3) { // text
		obj = xml.nodeValue;
	}

	// do children
	if (xml.hasChildNodes()) {
		for(var i = 0; i < xml.childNodes.length; i++) {
			var item = xml.childNodes.item(i);
			var nodeName = item.nodeName;
			if (typeof(obj[nodeName]) == "undefined") {
				obj[nodeName] = xmlToJson(item);
			} else {
				if (typeof(obj[nodeName].push) == "undefined") {
					var old = obj[nodeName];
					obj[nodeName] = [];
					obj[nodeName].push(old);
				}
				obj[nodeName].push(xmlToJson(item));
			}
		}
	}
	return obj;
};


function convertXML (xml){
    var obj = {};
  
    //x=xml.getElementsByTagName("gmd:title");
    
   // obj["dataset_data"].push(x);
    
   var jsonObject = {
        
        name: xml.getElementsByTagName("gmd:title"),
        bla: "blubb"

  
    };

    
   return jsonObject;

};
function loadXMLDoc(filename)
{
if (window.ActiveXObject)
  {
  xhttp = new ActiveXObject("Msxml2.XMLHTTP");
  }
else 
  {
  xhttp = new XMLHttpRequest();
  }
xhttp.open("GET", filename, false);
try {xhttp.responseType = "msxml-document"} catch(err) {} // Helping IE11
xhttp.send("");
return xhttp.responseXML;
};