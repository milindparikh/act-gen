var fs = require('fs');
var Guid = require('guid');
var redis = require('redis');
var client = redis.createClient(); //creates a new client


var obj;
fs.readFile('mockinstructions.json', 'utf8', function (err, data) {
  if (err) throw err;
    obj = JSON.parse(data);
    console.log(obj.agi.numberOfActivities);
    console.log(obj.agi.inSequenceOrParallel);
    console.log(obj.agi.demotime.createEventEveryNSeconds);


	var currentRun = Guid.create();
	
	function done(word) {
	    console.log(word);
	    client.quit();
	    
	}
	startEventTriggering(currentRun, 0, obj.agi.numberOfActivities, done);

    
});



function  startEventTriggering(currentRun, currentActivityCount, totalActivityCount, cb) {
    setTimeout(function() {
	if (shouldEventCreateActivity (currentRun, currentActivityCount, totalActivityCount)) {
	    createActivity(currentRun, currentActivityCount, totalActivityCount, cb);
	}
	else {
	    processActivity(currentRun, currentActivityCount, totalActivityCount, cb);
	    }
    }, obj.agi.demotime.createEventEveryNSeconds*1000);
    
}





			 
function endEventTriggering (currentRun, currentActivityCount, totalActivityCount, cb) {
    client.scard("run:"+currentRun, function (err, reply) {

	console.log(" in endEventTriggering -- > " + currentActivityCount + " " + reply + " " +  totalActivityCount);
	
	if (currentActivityCount < totalActivityCount ) {
	    startEventTriggering(currentRun, currentActivityCount, totalActivityCount, cb);
	}
	else {
	    if (reply == 0) {
		cb("done");
	    }
	    else {
		startEventTriggering(currentRun, currentActivityCount, totalActivityCount, cb);
	    }
	}
	
    });
}


function createActivity (currentRun, currentActivityCount, totalActivityCount, cb)  {
    
    (function (activityId) {startActivity(activityId);}(Guid.create()));
    
    function startActivity(activityId) {
	console.log(currentRun + " --> " + activityId.value);
	client.sadd("run:"+currentRun, activityId.value, function (err,reply) {
	    endEventTriggering (currentRun, currentActivityCount+1, totalActivityCount, cb);
	});
    }
}

function processActivity(currentRun, currentActivityCount, totalActivityCount, cb) {
    client.spop("run:"+currentRun, function (err, reply) {

	console.log("processing event " + reply);
	
	if (reply === null) {
	    endEventTriggering (currentRun, currentActivityCount, totalActivityCount, cb) ;
 	}
	else {
	    processActivityWithNextState(currentRun, currentActivityCount, totalActivityCount, cb, reply);	    
	}
    });
}

function processActivityWithNextState(currentRun, currentActivityCount, totalActivityCount, cb, activityId) {
    console.log(activityId);
    endEventTriggering (currentRun, currentActivityCount, totalActivityCount, cb) ;
    
}

			 


function shouldEventCreateActivity (currentRun, currentActivityCount, totalActivityCount) {
    
    if (currentActivityCount == totalActivityCount ) {
	return false;
    }
    else {
	if  ( (currentActivityCount /  totalActivityCount) < 0.9) {   // less than 90% left
	    return true;
	}
	else {             // do a coin toss
	    if (getRandomInt(1, 100)/100 < (currentActivityCount /  totalActivityCount)) {
		return true;
	    }

	    else {
		return false;
	    }
	}
    }
}





function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}
