var request = require('request');

var args = process.argv.slice(2);
var tenant = args[0] || "demo";
var debug = 1;

// xxx
var result = [];

function get_ui_modules(list, func) {
   if (!list || list.length == 0) {
       func( result);
       return;
   }
   
   var m = list.pop();
   var url = "http://localhost:9130/_/proxy/modules/" + m;
   
   request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
         var obj = JSON.parse(body);
         // console.log(obj)
         if (obj.uiDescriptor) {
            result.push(obj.id);
            if (debug) console.log("found ui module: " + obj.id)
         } else {
            if (debug) console.log("found non-module: " + obj.id)
         }
         
         return get_ui_modules(list, func);
      } else {
         console.log("HTTP status for " + url + " " + response.statusCode);
      }
   });
}


// return a simple module list 
function modules_list(modules) {
  var list = [];
  for (var i = 0; i < modules.length; i++) {
    list.push(modules[i].id);
  }
  
  return list;
}

function get_module_list(func) {
  var url = "http://localhost:9130/_/proxy/tenants/" + tenant + "/modules";
  
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
       var modules = JSON.parse(body);
       var list = modules_list(modules);
       get_ui_modules(list, func);
       
    } else {
      console.log("HTTP status for " + url + " " + response.statusCode);
    }
  })
}

function body_data(modules) {
  var obj = { url: modules };
  
  return JSON.stringify(obj);
};

function webpack_service(tenant, modules) {
  var body = body_data(modules);
  var url = 'http://localhost:3030/bundle';
  // Set the headers
  
  var headers = {
      'X-Okapi-Tenant-Id': tenant,
      'User-Agent':       'Webpack Folio UI Agent/0.1.0',
      'Content-Type':     'application/json'
  }
   
  // Configure the request
  var options = {
      method: 'POST',
      url: url,
      headers: headers,
      body: body
  }

  if (debug >= 2) console.log(options);
  
  request(options, function (error, response, body) {
    if (!error && response && response.statusCode == 201) {
      console.log(response.headers.location)
    } else {
      var status = response ? response.statusCode : "unknown";
      console.log("HTTP status for " + url + " " + status);
    }
  })
}


// http://localhost:9130/_/proxy/tenants/$tenant/modules
get_module_list( function (modules) { webpack_service(tenant, modules) } );

