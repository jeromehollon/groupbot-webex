var spark = require('ciscospark/env');
var fs = require('fs');

// data
var rooms = {};
var actions = {};

// Read the cache
fs.readFile('./cache.db', (err, data) => {
  if (err) {
    return;
  }
  rooms = JSON.parse(data);
});



sparkController.addRomm = function (roomId) {
  if(rooms[roomId] == null) {
    rooms[roomId] = { groups: {}};
  }
}


actions.help = function (caller) {
  // Print help to the room I'm in

  var message = {};
  message.roomId = caller.roomId;
  message.markdown = "```\n======================================================================\n";
  message.markdown += "I am groupbot. I maintain groups. To talk to me say '@Groupbot command'\n"
  message.markdown += "I understand the following commands:\n"
  message.markdown += "    create <groupname>\n";
  message.markdown += "    groupadd <groupname> <person> ...\n";
  message.markdown += "    groupdel <groupname> <person> ...\n";
  message.markdown += "    grouplist <groupname>\n";
  message.markdown += "    delete <groupname>\n";
  message.markdown += "    list\n";
  message.markdown += "    tag <groupname> ...\n";
  message.markdown += "======================================================================";

  spark.messages.create(message);
};

// --------------- Action: Unknown ----------------
// If we don't understand the action
// ------------------------------------------------
actions.unknown = function (source) {
  // tell them I didn't understand

  var message = {};
  message.roomId = source.roomId;
  message.text = "Sorry, I didn't understand '" + source.text + "'";
  spark.messages.create(message);
  console.log("WARN: Unknown command '" + source.text + "'");
};


// --------------- Action: Create  ----------------
// Create a new group
// ------------------------------------------------
actions.create = function (source, groupname) {
  // create a group
  var token = getGroupname(groupname);

  if (token == null) {
    invalidGroupname(source, groupname);
    return;
  }

  if (rooms[source.roomId].groups[token]) {
    var message = {
      roomId: source.roomId,
      text: "Group " + token + " has already been created. It contains " + rooms[source.roomId].groups[token].people.length + " people"
    };
    spark.messages.create(message);
    return;
  }


  rooms[source.roomId].groups[token] = {people: {}}

  var message = {};
  message.roomId = source.roomId;
  message.text = "Created group '" + token + "'";
  spark.messages.create(message);

  save();
};


// --------------- Action: Delete  ----------------
// Delete a group
// ------------------------------------------------

actions['delete'] = function (source, input) {
  var group = getGroupname(input);

  if (token == null) {
    invalidGroupname(source, input);
    return;
  }

  if (rooms[source.roomId].groups[group] == null) {
    var message = {
      roomId: source.roomId,
      text: "Could not find a group named '" + group + "' for this room."
    };
    spark.messages.create(message);
    return;
  }
  delete rooms[source.roomId].groups[group];
  save();
};


// --------------- Action: Hello   ----------------
// Syn/Ack
// ------------------------------------------------
actions.hello = function (source) {
  var message = {};
  message.roomId = source.roomId;
  message.text = "Yes?";
  spark.messages.create(message);
};


// --------------- Action: GroupAdd ----------------
// Adds member(s) to a group
// -------------------------------------------------
actions.groupadd = function (source, input) {
  var group = getGroupname(input);

  if (group == null) {
    invalidGroupname(source, input);
    return;
  }

  if (rooms[source.roomId].groups[group] == null) {
    var message = {
      roomId: source.roomId,
      text: "Could not find a group named '" + group + "' for this room."
    };
    spark.messages.create(message);
    return;
  }

  if (source.mentionedPeople == null || source.mentionedPeople.length < 2) {
    var message = {
      roomId: source.roomId,
      text: "Could not identify any people in your message"
    };
    spark.messages.create(message);
    return;
  }

  // got a good request
  for (var i = 1; i < source.mentionedPeople.length; i++) {
    // see if we actually need to add them
    if (rooms[source.roomId].groups[group].people[source.mentionedPeople[i]] == null) {
      var person = source.mentionedPeople[i];
      spark.people.get(person).then(function (p) {
        rooms[source.roomId].groups[group].people[p.id] = p;
        save();
      });
    }
  }
};


// --------------- Action: GroupList ----------------
// List membership of a group
// --------------------------------------------------
actions.grouplist = function (source, input) {
  var group = getGroupname(input);

  if (group == null) {
    invalidGroupname(source, input);
    return;
  }

  if (rooms[source.roomId].groups[group] == null) {
    var message = {
      roomId: source.roomId,
      text: "Could not find a group named '" + group + "' for this room."
    };
    spark.messages.create(message);
    return;
  }

  var message = {};
  message.roomId = source.roomId;
  message.markdown = "Group '" + group + "' contains: ";

  for (var property in rooms[source.roomId].groups[group].people) {
    if (rooms[source.roomId].groups[group].people.hasOwnProperty(property)) {
      var person = rooms[source.roomId].groups[group].people[property];
      message.markdown += person.displayName + " ";
    }
  }

  spark.messages.create(message);
};


// --------------- Action: GroupDel ----------------
// Delete member(s) from a group
// ------------------------------------------------
actions.groupdel = function (source, input) {
  var group = getGroupname(input);

  if (group == null) {
    invalidGroupname(source, input);
    return;
  }

  if (rooms[source.roomId].groups[group] == null) {
    var message = {
      roomId: source.roomId,
      text: "Could not find a group named '" + group + "' for this room."
    };
    spark.messages.create(message);
    return;
  }

  // got a good request
  for (var i = 1; i < source.mentionedPeople.length; i++) {
    // see if we actually need to delete them
    if (rooms[source.roomId].groups[group].people[source.mentionedPeople[i]] != null) {
      delete rooms[source.roomId].groups[group].people[source.mentionedPeople[i]];
    }
  }
  save();
};


// --------------- Action: Tag     ----------------
// Tag/Notify all members in the group
// ------------------------------------------------
actions.tag = function (source, input) {
  var group = getGroupname(input);

  if (group == null) {
    invalidGroupname(source, input);
    return;
  }

  if (rooms[source.roomId].groups[group] == null) {
    var message = {
      roomId: source.roomId,
      text: "Could not find a group named '" + group + "' for this room."
    };
    spark.messages.create(message);
    return;
  }

  // tag everyone!
  var message = {};
  message.roomId = source.roomId;
  message.markdown = "Hey you'in(s) ";

  for (var property in rooms[source.roomId].groups[group].people) {
    if (rooms[source.roomId].groups[group].people.hasOwnProperty(property)) {
      var person = rooms[source.roomId].groups[group].people[property];
      message.markdown += "<@personId:" + person.id + "|" + person.displayName + "> ";
    }
  }

  spark.messages.create(message);
};


// --------------- Action: List    ----------------
// List all groups
// ------------------------------------------------
actions.list = function (source, input) {
  // input will be null
  var message = {};
  message.roomId = source.roomId;
  message.text = "Groups available in this room: ";
  for (var property in rooms[source.roomId].groups) {
    if (rooms[source.roomId].groups.hasOwnProperty(property)) {
      message.text += property + " ";
    }
  }
  spark.messages.create(message);
}


function invalidGroupname(source, groupname) {
  var message = {}
  message.roomId = source.roomId;
  message.text = "Invalid group name: '" + groupname + "'. Must be alphanumeric.";
  spark.messages.create(message);
}

function getGroupname(input) {
  var token = /^([a-zA-Z0-9]+)/.exec(input);
  if (token == null || token[1] == null) {
    return null;
  }
  return token[1]
}

function save() {
  console.log(rooms);
  console.log(JSON.stringify(rooms));
  fs.writeFile("./cache.db", JSON.stringify(rooms));
}


module.exports = actions;