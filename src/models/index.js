// src/models/index.js

// Import the required modules
const User = require("./user");
const Group = require("./Group");
const Event = require("./Event");
const Post = require("./Post");
const Comment = require("./Comment");
const GroupUser = require("./GroupUser");
const EventUser = require("./EventUser");
const Follow = require("./Follow");

// User and Group are independent, with GroupUser as a through table
User.belongsToMany(Group, { through: GroupUser });
Group.belongsToMany(User, { through: GroupUser });

// Direct associations between GroupUser and Group, User
GroupUser.belongsTo(Group);
GroupUser.belongsTo(User);

// Event depends on User and Group, with EventUser as a through table
User.belongsToMany(Event, { through: EventUser });
Event.belongsToMany(User, { through: EventUser });

// Direct associations between EventUser and Event, User
EventUser.belongsTo(User);
EventUser.belongsTo(Event);

Group.hasMany(Event);
Event.belongsTo(Group);

// Post depends on User, Group, and Event
User.hasMany(Post);
Post.belongsTo(User);

Group.hasMany(Post);
Post.belongsTo(Group);

Event.hasMany(Post);
Post.belongsTo(Event);

// Comment depends on User and Post
User.hasMany(Comment);
Comment.belongsTo(User);

Post.hasMany(Comment);
Comment.belongsTo(Post);

User.belongsToMany(User, {
  as: "Followers",
  through: Follow,
  foreignKey: "FollowingId",
  otherKey: "UserId",
});
User.belongsToMany(User, {
  as: "Following",
  through: Follow,
  foreignKey: "UserId",
  otherKey: "FollowingId",
});

// Export the models
module.exports = {
  User,
  Group,
  GroupUser,
  Event,
  EventUser,
  Post,
  Comment,
  Follow,
};
