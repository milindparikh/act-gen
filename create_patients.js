var redis = require('redis');
var client = redis.createClient();

var totalFirstNames = 5000; 
var totalLastNames = 15000; 
var totalZipCodes =  42000; 

main () ;

function main() {

    var numofpatients = process.argv[2];
    
    client.set("total:PATIENTS", numofpatients);

    
    for (var cnt = 0; cnt <  numofpatients; cnt++) {
	
	firstName = getRandomInt(0, totalFirstNames);
	lastName =  getRandomInt(0, totalLastNames);
	zipCode =  getRandomInt(0, totalZipCodes);
	age = getRandomInt(0, 100);
	
	createPatient(cnt, firstName, lastName, zipCode, age);
    }
    
    
}

function createPatient (id, firstName, lastName, zipCode, age) {

    client.get("fname:"+firstName, function (err, realFName) {
	client.get("lname:"+lastName, function (err, realLName) {
		client.get("zip:zipcode:"+zipCode, function (err, realZipCode) {
		    client.get("zip:city:"+zipCode, function (err, city) {
			client.get("zip:state:"+zipCode, function (err, state) {
			    console.log(realFName + " " + realLName +
					" age: " + age + " city: " + city +
				       " state: " + state + " zip: " + realZipCode);

			    
			    client.hset("PATIENT:"+id, 'firstname', realFName);
			    client.hset("PATIENT:"+id, 'lastname', realLName);
			    client.hset("PATIENT:"+id, 'city', city);
			    client.hset("PATIENT:"+id, 'state', state);
			    client.hset("PATIENT:"+id, 'zipcode', realZipCode);
			    client.hset("PATIENT:"+id, 'age', age);
			    
			    
			    
			    
			});
		    });

	    });
	});
    });
}



function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

