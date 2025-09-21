// MongoDB initialization script
db = db.getSiblingDB('client-portal');

// Create collections
db.createCollection('users');
db.createCollection('forms');
db.createCollection('submissions');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "region": 1 });
db.users.createIndex({ "isActive": 1 });

db.forms.createIndex({ "isActive": 1, "isPublic": 1 });
db.forms.createIndex({ "createdBy": 1 });
db.forms.createIndex({ "title": "text", "description": "text" });

db.submissions.createIndex({ "formId": 1, "status": 1 });
db.submissions.createIndex({ "assignedTo": 1, "status": 1 });
db.submissions.createIndex({ "createdAt": -1 });
db.submissions.createIndex({ "status": 1, "priority": 1 });
db.submissions.createIndex({ "submittedBy": 1 });

// Create default admin user
db.users.insertOne({
  name: "Admin User",
  email: "admin@example.com",
  password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
  role: "admin",
  region: "global",
  isActive: true,
  permissions: {
    canCreateForms: true,
    canManageUsers: true,
    canViewAllSubmissions: true,
    canEditSubmissions: true
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

print('Database initialized successfully!');
