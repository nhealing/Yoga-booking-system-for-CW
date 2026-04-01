// models/userModel.js
import { usersDb } from './_db.js';

// Handles all database operations related to users
export const UserModel = {
  // Creates a new user in the database
  async create(user) {
    return usersDb.insert(user);
  },
  // Find a user by their email address (used for login)
  async findByEmail(email) {
    return usersDb.findOne({ email });
  },
  // Find a user by their unique ID
  async findById(id) {
    return usersDb.findOne({ _id: id });
  },
  // Return all users in the database (used for organiser features)
  async findAll() {
    return usersDb.find({});
  },
  // Delete a user by their id
  async deleteById(id) {
    return usersDb.remove({ _id: id }, {});
  }
};