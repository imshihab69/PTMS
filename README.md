# 🚀 PTMS - Phone Terminal Management System

A comprehensive infrastructure command center for managing phone records and terminal operations within organizations.

## 👨‍💻 Developer
- **Shihab Mohammed**
- GitHub: [imshihab69](https://github.com/imshihab69)

## 🛠️ Technologies Used
- **Next.js 16** - React framework for production
- **Supabase (PostgreSQL)** - Cloud database with real-time capabilities
- **Drizzle ORM** - TypeScript ORM for SQL databases
- **Tailwind CSS** - Utility-first CSS framework
- **Vercel** - Deployment and hosting platform

## 📋 Features
- 🔐 Secure authentication system (Admin/Viewer roles)
- 📞 Phone records management (CRUD operations)
- 👥 User management with rolٍe-based access control
- 📊 Audit trail with detailed activity logging
- 🏢 Department-wise phone line tracking
- 📤 Import/Export data via Excel files
- 🎨 Dark theme UI with custom icons
- ⚡ Real-time data updates

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account (for database)

### Steps
```bash
# Clone the repository
git clone https://github.com/imshihab69/PTMS.git
cd PTMS

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your Supabase database URL

# Run the development server
npm run dev