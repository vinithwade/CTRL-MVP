#!/bin/bash

# CTRL MVP Database Setup Script
echo "🚀 Setting up CTRL MVP database..."

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL client (psql) is not installed. Please install PostgreSQL first."
    exit 1
fi

# Database connection details (update these with your Supabase connection details)
DB_HOST="db.wyrgvlqtbuplsgqfmgzr.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD="your_password_here"  # Replace with your actual password

echo "📊 Connecting to database..."

# Run the database setup script
psql "host=$DB_HOST port=$DB_PORT dbname=$DB_NAME user=$DB_USER password=$DB_PASSWORD" -f database-setup.sql

if [ $? -eq 0 ]; then
    echo "✅ Database setup completed successfully!"
    echo "📋 Tables created:"
    echo "   - projects"
    echo "   - project_data"
    echo "   - user_settings"
    echo ""
    echo "🔒 Row Level Security (RLS) enabled on all tables"
    echo "📈 Indexes created for optimal performance"
    echo "🔄 Auto-update triggers configured"
else
    echo "❌ Database setup failed. Please check your connection details and try again."
    exit 1
fi

echo ""
echo "🎉 CTRL MVP database is ready!"
echo "💡 Next steps:"
echo "   1. Update your .env file with the correct database credentials"
echo "   2. Start the development servers with 'npm run dev'"
echo "   3. Create a new account and start building projects!" 