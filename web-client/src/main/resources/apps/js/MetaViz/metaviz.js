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
var domain, idDomain, searchDomain;
var id, children;
var metaViz = {};
var jsonObject;    
//namespaces
var gmd="http://www.isotc211.org/2005/gmd";
var gco="http://www.isotc211.org/2005/gco";
var gml="http://www.opengis.net/gml";
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

       //Code from old metaviz implementation
       // metaViz.dataBaseRequest(mode, id, function(data) {
       //    metaViz.displayMetaViz(data);
       //     hidePreloader();
       //
       //     if (heatmap)
       //         metaVizMode = true;
       //
       // });
        
        
    
    this.id = id; this.children = children;       
    //get domain (needed for parents
    domain = id.split("=")[0]+"=";                              //url to show xml of mainData
    gnID = id.split("=")[1];
    idDomain=domain.split("srv")[0]+"srv/eng/search#|";             //url to get info based on ID
    searchDomain=  domain.split("srv")[0]+"srv/eng/search#fast=index&from=1&to=10&any_OR_geokeyword=" //url to search for keywords


//test code for local json files
//file="test.json"; //only test file - overwrite
//localJson = readTextFile(file);
//metaViz.displayMetaViz(localJson);
//hidePreloader();
//console.log(response);

        //new code to read xml from http request and convert to valid json 
        readXML(id,true, function(err, response) { // pass an anonymous function
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
function readXML(theUrl, boolXML,callback){  
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
            if(boolXML)
                callback(null, xmlhttp.responseXML);
            else 
                callback(null, xmlhttp.responseText);
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
   try{
   code = xml.getElementsByTagNameNS(gmd,"identificationInfo")[0].getElementsByTagNameNS(gmd,"code")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML;
   codeSpace = xml.getElementsByTagNameNS(gmd,"identificationInfo")[0].getElementsByTagNameNS(gmd,"codeSpace")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML;
   //ID
   dataID = codeSpace+":"+code;//xml.getElementsByTagNameNS(gmd,"fileIdentifier")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML;
   }catch (e){
   dataID = xml.getElementsByTagNameNS(gmd,"fileIdentifier")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML;    
   }
   //keywords
   keywords = "";
   keywordObject = xml.getElementsByTagNameNS(gmd,"MD_Keywords")[0].getElementsByTagNameNS(gmd,"keyword");
   for (var i=0; i<keywordObject.length;i++){
       keywords+=keywordObject[i].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML;
       if(i!=keywordObject.length-1)keywords+="; ";
   }
   //vector true/false
   if( xml.getElementsByTagNameNS(gmd,"MD_Format")[0] != undefined ){
    format = xml.getElementsByTagNameNS(gmd,"MD_Format")[0].getElementsByTagNameNS(gmd,"name")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML;
    if (format==="ShapeFile") vector = true;else vector = false;
   }else (vector = false);


    //try catches because of different formats
    try{
       modelTitle = emptyChecker(xml.getElementsByTagNameNS(gmd,"MD_Identifier")[0].getElementsByTagNameNS(gmd,"code")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML);
    }catch(e){
       modelTitle = xml.getElementsByTagNameNS(gmd,"title")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML; 
    }
    try{
       dateTime = emptyChecker(xml.getElementsByTagNameNS(gmd,"dateStamp")[0].getElementsByTagNameNS(gco,"Date")[0].innerHTML); 
    }catch(e){
        try{
            dateTime = emptyChecker(xml.getElementsByTagNameNS(gmd,"dateStamp")[0].getElementsByTagNameNS(gco,"DateTime")[0].innerHTML);      
        }catch(e){
            dateTime = ""; 
        }  
    }
    try{
      save = emptyChecker(xml.getElementsByTagNameNS(gmd,"linkage")[0].getElementsByTagNameNS(gmd,"URL")[0].innerHTML);
    }catch(e){
      save = "";  
    }
    try{
      time = emptyChecker(xml.getElementsByTagNameNS(gml,"beginPosition")[0].innerHTML +" - "+ emptyChecker(xml.getElementsByTagNameNS(gml,"endPosition")[0].innerHTML));
    }catch(e){
      time = "";  
    }
    try{
      lineageDescription = emptyChecker(xml.getElementsByTagNameNS(gmd,"lineage")[0].getElementsByTagNameNS(gmd,"statement")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML);  
    }catch(e){
      lineageDescription = emptyChecker(xml.getElementsByTagNameNS(gmd,"lineage")[0].getElementsByTagNameNS(gmd,"description")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML);  
    }
    

   //JSON Object -pure without ectra lineage or usage datasets
    jsonObject = {
        
        "mapping_ids_uuids": {
        "paramName": "mapping_ids_uuids",
        "detail_0": dataID,
        "lineage_model_0": "model_0"
        },
        
        "model_data": {
            "model_0": {
            "title": modelTitle,//xml.getElementsByTagNameNS(gmd,"title")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML,
            "dateTime": dateTime,// emptyChecker(xml.getElementsByTagNameNS(gmd,"dateStamp")[0].getElementsByTagNameNS(gco,"Date")[0].innerHTML),  //DateTime with sample dataset
            "description":  emptyChecker(xml.getElementsByTagNameNS(gmd,"abstract")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML), //or abstreact
            "organisation": emptyChecker(xml.getElementsByTagNameNS(gmd,"organisationName")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML),
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
                "keywords": emptyChecker(keywords),
                "save": save,//emptyChecker(xml.getElementsByTagNameNS(gmd,"linkage")[0].getElementsByTagNameNS(gmd,"URL")[0].innerHTML),
                "organisation": emptyChecker(xml.getElementsByTagNameNS(gmd,"organisationName")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML),
                "type": " ", 
                "info": " ",
                "title": emptyChecker(xml.getElementsByTagNameNS(gmd,"title")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML),
                "time": time,//emptyChecker(xml.getElementsByTagNameNS(gml,"beginPosition")[0].innerHTML +" - "+ emptyChecker(xml.getElementsByTagNameNS(gml,"endPosition")[0].innerHTML)),
                "extent": "180,-90;-180,-90;-180,90;180,90",
                "description":  emptyChecker(xml.getElementsByTagNameNS(gmd,"abstract")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML), //or abstreact
                "vector": vector,
                "view": "",
                "paramName": dataID,
                "gnID":gnID,
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
                    "dateTime": dateTime,//emptyChecker(xml.getElementsByTagNameNS(gmd,"dateStamp")[0].getElementsByTagNameNS(gco,"DateTime")[0].innerHTML),
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
                        "identifier": emptyChecker(xml.getElementsByTagNameNS(gmd,"title")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML),
                        "paramName": "processing_0"
                        },
                    "paramName": "processingList"
                    },
                "description": lineageDescription,//emptyChecker(xml.getElementsByTagNameNS(gmd,"lineage")[0].getElementsByTagNameNS(gmd,"statement")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML),
                "rationale": "not set.",
                "processor": emptyChecker(xml.getElementsByTagNameNS(gmd,"organisationName")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML),
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
    
    if(!viewLineage){
        console.log ("PCR-VIEW");

        try{
        //modify object to add parent/children datasets
        //parent check
        addParent(xml);
         //get childrens
        addChildren(children, dataID);
        }catch(e){
            console.log("error parent-children-search"); //sometimes there is a parent id but no parent--- oO
        }
       
        
    }else{
        try{
        console.log ("Lineage-VIEW");
        //add lineage datasets
        addLineageDS(xml,"model_0", "lineage");
        //search for identifier, get results as usage datasets
        //children id to adddChildren
        //http://localhost:8080/geonetwork/srv/eng/main.search?any_OR_keyword=urn:glues:lmu:metadata:dataset%20promet
        
        // code + codeSpace used for keyword search
        code = xml.getElementsByTagNameNS(gmd,"identificationInfo")[0].getElementsByTagNameNS(gmd,"code")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML;
        codeSpace = xml.getElementsByTagNameNS(gmd,"identificationInfo")[0].getElementsByTagNameNS(gmd,"codeSpace")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML;
        searchURL = domain.split("srv")[0]+"srv/eng/main.search?any_OR_keyword="+code+" "+codeSpace;
       //console.log(searchURL);
        readXML(searchURL,false, function(err, response) { // pass an anonymous function
            if (err) {
                //do nothing
            } else {
                //parsing doesnt work because of different errors: open tags etc
//                var parser=new DOMParser();
//                var xmlDoc=parser.parseFromString(table,"text/xml");
//                var tds = xmlDoc.getElementById("loadingMD"); 
                table= response.split("<table>");
                searchString ="";
                for(var i =1;i<table.length;i++){
                  tableContent = table[i].split("</div>")[0]; 
                  name = tableContent.split("h1")[1].split("\">")[2].split("</a>")[0];
                  gnid = tableContent.split("id=")[1].split("&amp;")[0];   //uuid is based on a button only shown to admin...
                  if(xml.getElementsByTagNameNS(gmd,"title")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML !=name){
                      searchString+=gnid+"+";
                  }  
                }
                searchString = searchString.slice(0, -1);//delete last +
                addChildren(searchString, dataID);
            } 
        });
    }catch(e){            //-> if there is no code and codespace, switch back to parent view
        console.log ("Lineage-View Error - toggle View");
        toggleView();
    }
        
    }

   return JSON.stringify(jsonObject);
};

/**
 * check if string is null or empty - used for json creation
 */
function emptyChecker(string){
    if(string !== null || string !=="") return string;
    else { console.log("empty xml string:"+string); return "";}      
}

/**
 * add dataset to jsonObject based in id and xml
 * @param {type} id
 * @param {type} xml
 * @returns {undefined}
 */
function addDataset(id, xml){  
    try{
      save = emptyChecker(xml.getElementsByTagNameNS(gmd,"linkage")[0].getElementsByTagNameNS(gmd,"URL")[0].innerHTML);
    }catch(e){
      save = "";  
    }
    try{
      time = emptyChecker(xml.getElementsByTagNameNS(gml,"beginPosition")[0].innerHTML +" - "+ emptyChecker(xml.getElementsByTagNameNS(gml,"endPosition")[0].innerHTML));
    }catch(e){
      time = "";  
    }
    try{
    gnID=xml.getElementsByTagNameNS(gmd,"fileIdentifier")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML;
    }catch(e){
        //TODO: search in gn database for identifier od datasets - but more request...puh
    }
    jsonObject["dataset_data"][id]={
                "keywords": "keywords",
                "save": save,//emptyChecker(xml.getElementsByTagNameNS(gmd,"linkage")[0].getElementsByTagNameNS(gmd,"URL")[0].innerHTML),
                "organisation": emptyChecker(xml.getElementsByTagNameNS(gmd,"organisationName")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML),
                "type": "usage", 
                "info": " ",
                "title": emptyChecker(xml.getElementsByTagNameNS(gmd,"title")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML),
                "time": time,//emptyChecker(xml.getElementsByTagNameNS(gml,"beginPosition")[0].innerHTML +" - "+ emptyChecker(xml.getElementsByTagNameNS(gml,"endPosition")[0].innerHTML)),
                "extent": "180,-90;-180,-90;-180,90;180,90",
                "description":  emptyChecker(xml.getElementsByTagNameNS(gmd,"abstract")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML), //or abstreact
                "vector": vector,
                "view": "",
                "gnID":gnID,
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
       parent = xml.getElementsByTagNameNS(gmd,"parentIdentifier")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML;
       console.log(parent);
       jsonObject['mapping_ids_uuids']["lineage_dataset_0"]=parent;
       jsonObject["model_data"]["model_0"]["input_datasets"][0]=parent;
       //get parent xml from http request
       var parentXML;
       readXML(domain+parent,true, function(err, response) { // pass an anonymous function
            if (err) {
                //do nothing
            } else {
                parentXML = response;
                
                    //try catches because of different formats
    
    try{
      save = emptyChecker(xml.getElementsByTagNameNS(gmd,"linkage")[0].getElementsByTagNameNS(gmd,"URL")[0].innerHTML);
    }catch(e){
      save = "";  
    }
    try{
      time = emptyChecker(xml.getElementsByTagNameNS(gml,"beginPosition")[0].innerHTML +" - "+ emptyChecker(xml.getElementsByTagNameNS(gml,"endPosition")[0].innerHTML));
    }catch(e){
      time = "";  
    }

                jsonObject["dataset_data"][parent]={
                "keywords": "keywords",
                "save": save ,//emptyChecker(parentXML.getElementsByTagNameNS(gmd,"linkage")[0].getElementsByTagNameNS(gmd,"URL")[0].innerHTML),
                "organisation": emptyChecker(parentXML.getElementsByTagNameNS(gmd,"organisationName")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML),
                "type": "lineage", 
                "info": " ",
                "title": emptyChecker(parentXML.getElementsByTagNameNS(gmd,"title")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML),
                "time": time, //emptyChecker(parentXML.getElementsByTagNameNS(gml,"beginPosition")[0].innerHTML +" - "+ emptyChecker(xml.getElementsByTagNameNS(gml,"endPosition")[0].innerHTML)),
                "extent": "180,-90;-180,-90;-180,90;180,90",
                "description":  emptyChecker(parentXML.getElementsByTagNameNS(gmd,"abstract")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML), //or abstreact
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
    if(viewLineage)domain=domain.replace("uuid","id");
    if(children!==""){
    childrenArray = children.split("+");
    childCounter = 1; //0 = lineage model 0 - maybe set usage models first and lineage model last, like previously
    for(var j = 0;j<childrenArray.length;j++){
        var xmlKiddy;
        readXML(domain+childrenArray[j],true, function(err, response) { // pass an anonymous function
            //console.log(domain+childrenArray[j]);
            if (err) {
                //do nothing
            } else {
                xmlKiddy=response;
                 try{
                    dateTime = emptyChecker(xmlKiddy.getElementsByTagNameNS(gmd,"dateStamp")[0].getElementsByTagNameNS(gco,"Date")[0].innerHTML); 
                }catch(e){
                    try{
                        dateTime = emptyChecker(xmlKiddy.getElementsByTagNameNS(gmd,"dateStamp")[0].getElementsByTagNameNS(gco,"DateTime")[0].innerHTML);      
                }catch(e){
                    dateTime = ""; 
                }  
                try{
                codeKid = xmlKiddy.getElementsByTagNameNS(gmd,"identificationInfo")[0].getElementsByTagNameNS(gmd,"code")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML;
                codeSpaceKid = xmlKiddy.getElementsByTagNameNS(gmd,"identificationInfo")[0].getElementsByTagNameNS(gmd,"codeSpace")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML;
                //ID
                kidId = codeSpaceKid+":"+codeKid;//xml.getElementsByTagNameNS(gmd,"fileIdentifier")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML;
                }catch (e){
                kidId = xmlKiddy.getElementsByTagNameNS(gmd,"fileIdentifier")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML;    
                }
            }
                //add children to dataset
                addDataset(kidId,xmlKiddy); //childrenArray[j] makes no sense because of id and uuid
                //modify mappings
                jsonObject["mapping_ids_uuids"]["usage_model_"+(childCounter-1)]="model_"+childCounter;
                jsonObject["mapping_ids_uuids"]["usage_dataset_"+(childCounter-1)]=kidId;
                //add model
                    try{
                        modelTitle = emptyChecker(xmlKiddy.getElementsByTagNameNS(gmd,"MD_Identifier")[0].getElementsByTagNameNS(gmd,"code")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML);
                    }catch(e){
                        modelTitle = xmlKiddy.getElementsByTagNameNS(gmd,"title")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML; 
                    }
                jsonObject["model_data"]["model_"+childCounter]={
                    "title": modelTitle,//xmlKiddy.getElementsByTagNameNS(gmd,"title")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML,
                    "dateTime": dateTime,
                    "description":  emptyChecker(xmlKiddy.getElementsByTagNameNS(gmd,"abstract")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML), //or abstreact
                    "organisation": emptyChecker(xmlKiddy.getElementsByTagNameNS(gmd,"organisationName")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML),
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
                //add usage inputs if lineage view is active
                if(viewLineage){
                     addLineageDS(xmlKiddy,"model_"+(childCounter),"usage_input");
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
function toggleView(){
    viewLineage = !viewLineage; 
    //if (!viewLineage) dojo.byId("lin_pub_Texts").style.visibility = "hidden";
    this.jsonObject = null;
    metaViz.showMetaViz(id, children);
}
/**
 * add lineage ds from gmd:source - model_0 = main model with type lineage - other models have usage_input
 * @param {type} xml
 * @returns {undefined}
 */
function addLineageDS(xml,model,type){
    for(var i=0;i<xml.getElementsByTagNameNS(gmd,"source").length;i++){
        name = emptyChecker(xml.getElementsByTagNameNS(gmd,"source")[i].getElementsByTagNameNS(gmd,"codeSpace")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML)+":"+emptyChecker(xml.getElementsByTagNameNS(gmd,"source")[i].getElementsByTagNameNS(gmd,"code")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML);
        if(type=="lineage"){
            jsonObject['mapping_ids_uuids']["lineage_dataset_"+i]=name;
            jsonObject["model_data"][model]["input_datasets"][i]=name;
        } else {
            jsonObject["model_data"][model]["input_datasets"][i]=name;
        }
        if(dataID != name){
        jsonObject["dataset_data"][name]={
                "keywords": "keywords",
                "save": "" ,//emptyChecker(parentXML.getElementsByTagNameNS(gmd,"linkage")[0].getElementsByTagNameNS(gmd,"URL")[0].innerHTML),
                "organisation": "",
                "type": type, 
                "info": " ",
                "title": emptyChecker(xml.getElementsByTagNameNS(gmd,"source")[i].getElementsByTagNameNS(gmd,"title")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML),
                "time": emptyChecker(xml.getElementsByTagNameNS(gmd,"source")[i].getElementsByTagNameNS(gmd,"date")[0].getElementsByTagNameNS(gco,"Date")[0].innerHTML), //emptyChecker(parentXML.getElementsByTagNameNS(gml,"beginPosition")[0].innerHTML +" - "+ emptyChecker(xml.getElementsByTagNameNS(gml,"endPosition")[0].innerHTML)),
                "extent": "180,-90;-180,-90;-180,90;180,90",
                "description":  emptyChecker(xml.getElementsByTagNameNS(gmd,"source")[i].getElementsByTagNameNS(gmd,"description")[0].getElementsByTagNameNS(gco,"CharacterString")[0].innerHTML),
                "vector": vector,
                "view": "",
                "paramName": name,
                "relations_csw": " "
                };
            }
    }
}
/**
 * Method to show metaviz gui elements.
 */
metaViz.displayMetaViz = function(data) {
    //console.log(data);
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
//used for test
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


//stuff could be deleted

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

