const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class SupabaseUser {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role;
    this.region = data.region;
    this.isActive = data.is_active;
    this.permissions = data.permissions;
    this.lastLogin = data.last_login;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Static method to find user by email
  static async findOne({ email }) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No user found
        }
        throw error;
      }

      return new SupabaseUser(data);
    } catch (error) {
      console.error('Error finding user:', error);
      return null;
    }
  }

  // Static method to find user by ID
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No user found
        }
        throw error;
      }

      return new SupabaseUser(data);
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  // Static method to create user
  static async create(userData) {
    try {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const { data, error } = await supabase
        .from('users')
        .insert([{
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role || 'user',
          region: userData.region || 'global',
          is_active: true,
          permissions: userData.permissions || {}
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new SupabaseUser(data);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Method to match password
  async matchPassword(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  }

  // Method to update last login
  async updateLastLogin() {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', this.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      this.updatedAt = data.updated_at;
      return this;
    } catch (error) {
      console.error('Error updating last login:', error);
      // Don't throw error, just log it and continue
      return this;
    }
  }

  // Method to update user
  async update(updateData) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update current instance
      Object.assign(this, new SupabaseUser(data));
      return this;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
}

module.exports = SupabaseUser;
