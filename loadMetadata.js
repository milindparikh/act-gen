var redis = require('redis');
var client = redis.createClient();

main();




function main() {

    var command = process.argv[2];
    var entity = process.argv[3];

    if (command == 'loadMetadata') {
	if (entity == 'PATIENT') {
	    loadPatientMetadata (done);
	}
	else {
	    if (entity == 'STORE') {
		loadStoreMetadata (done);
	    }
	    else {
		if (entity == 'DRUG') {
		    loadDrugMetadata(done);
		}
	    }
	}
    }
    else {
	
	testMetadata(entity, done);
    }
    
    
    function done () {
	client.quit();
    }
    

}



function loadPatientMetadata (cb) {
    client.lpush("METADATA:PATIENT", "firstname", function (err, len) {
	client.lpush("METADATA:PATIENT", "lastname", function (err, len) {
	    client.lpush("METADATA:PATIENT", "city", function (err, len) {
		client.lpush("METADATA:PATIENT", "state", function (err, len) {
		    client.lpush("METADATA:PATIENT", "zipcode", function (err, len) {
			client.lpush("METADATA:PATIENT", "age", function (err, len) {

			    cb();
			});
		    });
		});
	    });
	});
    });
}


function loadStoreMetadata (cb) {
    client.lpush("METADATA:STORE", "id", function (err, len) {
	client.lpush("METADATA:STORE", "straddr", function (err, len) {
	    client.lpush("METADATA:STORE", "city", function (err, len) {
		client.lpush("METADATA:STORE", "state", function (err, len) {
		    client.lpush("METADATA:STORE", "zipcode", function (err, len) {
			client.lpush("METADATA:STORE", "phone", function (err, len) {
			    client.lpush("METADATA:STORE", "start", function (err, len) {
				client.lpush("METADATA:STORE", "end", function (err, len) {
			    
				    cb();
				});
			    });
			});
		    });
		});
	    });
	});
    });
}



function loadDrugMetadata (cb) {
    client.lpush("METADATA:DRUG", "id", function (err, len) {
	client.lpush("METADATA:DRUG", "name", function (err, len) {
	    client.lpush("METADATA:DRUG", "dose", function (err, len) {
		client.lpush("METADATA:DRUG", "manufacturer", function (err, len) {
		    cb();
		});
	    });
	});
    });
}





function testMetadata (entity, cb) {
    
    client.llen ("METADATA:"+entity, function (err, len) {
	client.lrange("METADATA:"+entity, 0, len, function (err, metadata) {
	    client.get("total:"+entity+"S", function (err, totalEntities) {
		var randomEntity = getRandomInt(0, totalEntities);
		metadata.forEach ( function (e) {
		    client.hget(entity+":"+randomEntity, e, function (err, value) {
			console.log(e + " --> " + value);
		    });
		});
		cb();
		

	    });
	});
    });
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

		 

		    
		
	    
	
