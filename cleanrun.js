var redis = require('redis');
var client = redis.createClient();
var selectedRun = process.argv[2];

removeActivityFromRun(selectedRun);



function removeActivityFromRun(selectedRun) {

    intRemove(selectedRun);
    
    function intRemove(selectedRun) {

	client.spop("run:"+selectedRun, function (err,reply) {
	    console.log(reply);
	    if (reply) {
		intRemove(selectedRun);
	    }
	    else {
		done();
	    }
	});
	
    }
    function done() {
	client.quit();
	console.log("ok");
    }
    

}

function removeActivity (selectedRun, currentActivity, cb) {
    
}

