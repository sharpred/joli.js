/*jslint nomen: true, sloppy : true, plusplus: true, vars: true, newcap: true*/
var SQLOBJ = require("com.dmarie.sql");

//added by Paul Ryan to save in private documents folder
function privateDocumentsDirectory() {

    Ti.API.info('We need to open a file object to get our directory info');
    var testFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory);
    Ti.API.info('Now we remove the Documents folder reference');
    var privateDir = testFile.nativePath.replace('Documents/', '');
    Ti.API.info('This is our base App Directory =' + privateDir);
    Ti.API.info('Now we add the Private Documents Directory');
    privateDir += 'Library/Private%20Documents/';
    Ti.API.info('Our new path is ' + privateDir);
    return privateDir;
}

//var dbPath = privateDocumentsDirectory();
//TODO this would need to be in Private Documents for an app published on the app store.  Okay for this though
var dbPath = Titanium.Filesystem.applicationDataDirectory.replace("%20", " ");
dbPath = dbPath.replace("%20", " ");
dbPath = dbPath.replace("file://", "");
dbPath = dbPath.replace("localhost", "");

function openDBObject(db, pw) {
    if ( typeof pw == "undefined") {
        pw = "";
    }
    return SQLOBJ.open_db(dbPath + db, pw);
}

var emptyObj = {
    length : 0,
    isValidRow : function() {
        return false;
    },
    close : function() {
        return;
    }
};

function DBRecordSet(sql) {
    if (Titanium.Platform.osname != "android") {
        return SQLOBJ.select(sql);
    }

    var results;
    try {
        results = SQLOBJ.select(sql);
    } catch (selectError) {
        return emptyObj;
    }

    if (results.length < 2) {
        return emptyObj;
    }

    /*
     SQLOBJ.select returns an array of arrays:

     results[0] = array of field names
     results[1-n] = array of data
     */
    var recordPointer = 0;
    var fieldNameRow = results[0];
    var fieldNames = {};

    for (var fieldNameCounter = 0; fieldNameCounter < fieldNameRow.length; fieldNameCounter++) {
        fieldNames[fieldNameRow[fieldNameCounter].toLowerCase()] = fieldNameCounter;
    }
    recordPointer++;
    var row = results[recordPointer];
    var fieldCount = row.length;
    return {
        length : results.length,
        fieldName : function(num) {
            return fieldNameRow[num];
        },
        field : function(num) {
            return row[num - 1];
        },
        fieldByName : function(name) {
            // we force all field names to lower case here
            return row[fieldNames[name.toLowerCase()]];
        },
        next : function() {
            recordPointer++;
            row = results[recordPointer];
        },
        isValidRow : function() {
            return (recordPointer <= (results.length - 1));
        },
        fieldCount : function() {
            return fieldCount;
        },
        close : function() {
        }
    };

}

function close_database() {
    SQLOBJ.close_db();
}

var close = function() {
    close_database();
};

openDBObject.prototype.close = function() {
    close_database();
};
openDBObject.prototype.close_db = function() {
    close_database();
};
openDBObject.prototype.execute = function(sql) {
    if (sql.toLowerCase().substr(0, 6) == "select") {
        return new DBRecordSet(sql);
    } else {
        return SQLOBJ.execute(sql);
    }
};
openDBObject.prototype.select = function(sql) {
    return new DBRecordSet(sql);
};

openDBObject.prototype.attach = function dbAttach(file, alias, key) {
    SQLOBJ.execute("attach '" + dbPath + file + "' as " + alias + " key '" + key + "';");
};

var openDB = function openDB(db, pw) {
    return new openDBObject(db, pw);
};

exports.openDB = openDB;
exports.dbPath = dbPath;
