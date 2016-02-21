var fs = require('fs');
var Guid = require('guid');
var redis = require('redis');
var client = redis.createClient(); //creates a new client


var obj;
var statemap;
var states;

fs.readFile('mockinstructions.json', 'utf8', function (err, data) {
  if (err) throw err2;
    obj = JSON.parse(data);
    console.log(obj.agi.numberOfActivities);
    console.log(obj.agi.inSequenceOrParallel);
    console.log(obj.agi.demotime.createEventEveryNSeconds);

    fs.readFile(obj.agi.statemap, 'utf8', function (err2, data2) {
	if (err2) throw err2;
	statemap = JSON.parse(data2);
	states = statemap.states;

	var currentRun = Guid.create();
    
	function done(word) {
	    console.log(word);
	    client.quit();
	}
	startEventTriggering(currentRun, 0, obj.agi.numberOfActivities, done);
    });

    
});



function  startEventTriggering(currentRun, currentActivityCount, totalActivityCount, cb) {
    setTimeout(function() {
	if (shouldEventCreateActivity (currentRun, currentActivityCount, totalActivityCount)) {
	    createActivity(currentRun, currentActivityCount, totalActivityCount, cb);
	}
	else {
	    processActivity(currentRun, currentActivityCount, totalActivityCount, cb);
	    }
    }, obj.agi.demotime.createEventEveryNSeconds);
    
}





			 
function endEventTriggering (currentRun, currentActivityCount, totalActivityCount, cb) {
    client.scard("run:"+currentRun, function (err, reply) {

//	console.log(" in endEventTriggering -- > " + currentActivityCount + " " + reply + " " +  totalActivityCount);
	
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
//	console.log(currentRun + " --> " + activityId.value);
	var startState = generateStartState(states);
	

//	console.log(JSON.stringify(startState));
	
	client.sadd("run:"+currentRun, activityId.value, function (err,reply) {
	    client.sadd("activity:"+activityId.value+":currentState", JSON.stringify(startState), function (err2, reply2) {
		var currentObj = {activityId: activityId.value, currentState: '', attributes: {}};
		
		client.sadd("activity:"+activityId.value+":currentObj", JSON.stringify(currentObj), function (err2, reply2) {
		    
		    processActivityWithNextState(currentRun, currentActivityCount+1, totalActivityCount, cb, activityId.value, currentObj, startState) ;
		});
	    });
	});
    }
}

function processActivity(currentRun, currentActivityCount, totalActivityCount, cb) {
    client.srandmember("run:"+currentRun, function (err, reply) {


	
	if (reply === null) {
	    endEventTriggering (currentRun, currentActivityCount, totalActivityCount, cb) ;
 	}
	else {
	    client.spop("activity:"+reply+":currentState", function (err2, reply2) {
		client.spop("activity:"+reply+":currentObj", function (err5, sCurrentObj) {

		    currentState = JSON.parse(reply2);
		    var nextState = generateNextState(currentState);
		    currentObj = JSON.parse(sCurrentObj);
		    
		
		    if (nextState === null) {
			client.srem("run:"+currentRun, reply, function (err3, reply3) {
			    endEventTriggering (currentRun, currentActivityCount, totalActivityCount, cb) ;
			});
		    }
		    else {
			client.sadd("activity:"+reply+":currentState", JSON.stringify(nextState), function (err4, reply4) {
//			    console.log(nextState);
			    processActivityWithNextState(currentRun, currentActivityCount, totalActivityCount, cb, reply, currentObj, nextState);
			});
		    }
		});	   

	    });
	}
    });
}

function processActivityWithNextState(currentRun, currentActivityCount, totalActivityCount, cb, activityId, currentObj, currentState) {

    currentObj.currentState = currentState.state.shortdesc;
    
    client.sadd("activity:"+activityId+":currentObj", JSON.stringify(currentObj), function (err2, reply2) {
//	console.log(activityId);
	console.log(currentObj);
//	console.log(currentState);
	
	endEventTriggering (currentRun, currentActivityCount, totalActivityCount, cb) ;
    });
    
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

function generateNextState(state) {

    
    if (state.state.type == 'end') {
	return null;
    }
    else {
	var nextState = 

	    findStateById (
		states,
		state.state.nextstates[getRandomInt(0, state.state.nextstates.length)].state
	    )[0];
	return nextState;
	
	
    }
    
}

function generateStartState (states) {
    return (findStartState (findStatesByType(states, "start"), getRandomInt(0, findStatesByType(states, "start").length)));
    function findStartState (array, index) {
	return array[index];
    }
}

function findStatesByType(states, type) {
    return states.filter(function (element, index, array) {
	return (element.state.type == type);
    });
    
}
    
function findStateById(states, id) {

    
    return states.filter(function (element, index, array) {
	return (element.state.id == id);
    });
    
}



function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}
