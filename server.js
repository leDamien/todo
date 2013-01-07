var http = require('http');
var fs = require("fs");

var response = function (res, json) {
    res.writeHead(200, { 'content-type':'application/json',
        'Access-Control-Allow-Origin' : '*',
        'Content-length':json.length}
    );
    console.log('About to send:'+json);
    res.end(json);
    };

var searchTodo = function (res,urlObj) {
    var vals = require('querystring').parse(urlObj.query);
    var rfd = vals.rfd;
    var who = vals.who;
    var searchedString = vals.seachedString;
    console.log (who+' on '+rfd+' for '+ searchedString);
    fs.readdir( "data/todone", function( err, files) {
        if ( err ) {
            console.log("Error reading files: ", err);
        } else {
            // keep track of how many we have to go.            
            var remaining = files.length;
            console.log('looking at : '+remaining+' files');
            var todoArray = [];

            if ( remaining === 0 ) {
                response(res,'["11447143","12591552","9876543210"]');
                console.log("No file corresponded, test answer given");
            }
            
            files.forEach(function (file){
                fs.readFile('./data/todone/'+file, 'utf8', function (err, data){
                    if ( err ) {
                        console.log("reading Error: ",file, err);
                    } else {
                        if ((/\.txt/).exec(file)) {
                            var fileName = new RegExp("(.+)\.txt").exec(file)[1];
                            console.log("Reading: "+ fileName);
                            var todoLines = data.split('\r\n');
                            var todoHeader = todoLines[0];
                            var regEx = new RegExp ("/who:(.*?)/");
                            var whoTest = regEx.exec(todoHeader);
                            if (new RegExp("/who:"+who+"/").test(whoTest)) {
                                todoArray.push(fileName);
                            }                        
                            console.log("Successfully read file:"+fileName);
                        } else {
                            console.log('not a text file');
                        }
                    }
                    remaining -= 1;
                    if ( remaining === 0 ) {
                        response(res,JSON.stringify(todoArray));
                    }
                });
            });
        }
    });    
};

var quicktodone = function (res,urlObj) {
    var vals = require('querystring').parse(urlObj.query);
    console.log ('opening:'+vals.target);
    fs.readFile('./data/todone/'+vals.target+'.txt','utf8',function (err,data){
        var json='';
        var todoJson = {};
        if (err) {
            todoJson.id = vals.target + ' could not be found';
            console.log('file access problem:',err);
        } else {
            todoJson.id = vals.target;
            var todoLines = data.split('\r\n');
            var todoHeader = todoLines[0];
            console.log('about to process: '+todoHeader);
            var todoCarac = ['type','rfd','dueDate','who','length'];
            for (var i = 0; i < todoCarac.length; i++) {
                var regEx = new RegExp("/"+todoCarac[i]+":(.*?)/");
                var caracValue =  regEx.exec(todoHeader);
                console.log (todoCarac[i]+': '+caracValue);
                if (caracValue) {
                    todoJson[todoCarac[i]] = caracValue[1];
                }
            }
            var goalDate = "000000";
            var goal = '';
            for (var j = 0; j < todoLines.length; j++) {
                var regExj = new RegExp('.GOAL-(\\d\\d\\d\\d\\d\\d):(.*?)$');
                var goalj = regExj.exec(todoLines[j]);
                if (goalj && goalj[1] > goalDate) {
                    goalDate = goalj[1];
                    goal = goalj[2];    
                }
            }
            todoJson.goal = goal;
        }
        json = JSON.stringify(todoJson);
        response(res,json);
    });    
};

http.createServer( function (req,res) {
    var urlObj = require('url').parse(req.url);
    console.log('request received for:');
    console.log(urlObj);
    //var json='{"who":"DRx","goal":"who Knows"}';
    if (urlObj.pathname == '/quicktodone.cgi') {
        quicktodone(res,urlObj);
    } else {
        searchTodo(res,urlObj);
    }

}).listen(process.env.PORT || 8080);
