// src/models/index.js

// Import the required modules
const User = require("./User");
const Group = require("./Group");
const Event = require("./Event");
const Post = require("./Post");
const Comment = require("./Comment");

User.belongsToMany(Group, { through: "GroupUser" }); // A User can belong to many Groups
Group.belongsToMany(User, { through: "GroupUser" }); // A Group can belong to many Users

User.belongsToMany(Event, { through: "EventUser" }); // A User can belong to many Events
Event.belongsToMany(User, { through: "EventUser" }); // An Event can belong to many Users

Group.hasMany(Event); // A Group can have many Events
Event.belongsTo(Group); // An Event belongs to a Group

User.hasMany(Post); // A User can have many Posts
Post.belongsTo(User); // A Post belongs to a User

Group.hasMany(Post); // A Group can have many Posts
Post.belongsTo(Group); // A Post belongs to a Group

Event.hasMany(Post); // An Event can have many Posts
Post.belongsTo(Event); // A Post belongs to an Event

User.hasMany(Comment); // A User can have many Comments
Comment.belongsTo(User); // A Comment belongs to a User

Post.hasMany(Comment); // A Post can have many Comments
Comment.belongsTo(Post); // A Comment belongs to a Post

// Export the models
module.exports = {
  User,
  Group,
  Event,
  Post,
  Comment,
};
