# Penny Pilot - Personal Finance Copilot

A comprehensive personal finance management application that helps you track, tag, and forecast your money across accounts and currencies. Penny Pilot is your personal finance copilot for analyzing spending, building budgets, and owning your financial future.

## 🚀 Features

### Core Functionality
- **📊 Insights & Analytics** - Track trends, top categories, burn rate, and identify spending anomalies
- **💰 Budget Management** - Create monthly, quarterly, or custom budgets with rollover capabilities
- **🔮 Financial Forecasting** - Cashflow projections and scenario planning for better financial decisions
- **🏷️ Smart Categorization** - Auto-tag transactions using flexible rules and AI-powered categorization
- **🌍 Multi-Currency Support** - Track accounts in different currencies with live exchange rates
- **👥 Access Control** - Invite partners or accountants with granular permission settings
- **📁 Data Import** - Upload bank/credit card CSV files with customizable field mapping
- **💳 IOU Tracking** - Manage splits, loans, and shared expenses with friends
- **🔒 Data Security** - Encrypted backups and full data export capabilities

### User Experience
- **Responsive Design** - Modern, mobile-first interface built with Bootstrap 5
- **Real-time Updates** - Live data synchronization across all devices
- **Intuitive Dashboard** - Clean, organized interface for managing your financial life
- **Dark/Light Themes** - Customizable appearance to match your preferences

## 🛠️ Technology Stack

- **Frontend**: React 19 with React Router for navigation
- **Styling**: Bootstrap 5 with custom CSS modules
- **Backend**: Firebase (Authentication, Firestore, Hosting)
- **State Management**: React Context API for global state
- **Build Tool**: Create React App with custom configuration
- **Deployment**: Firebase Hosting with automatic builds

## 📱 Application Structure

```
src/
├── components/
│   ├── app/           # Main application components
│   │   ├── Dashboard/ # Dashboard shell and navigation
│   │   ├── pages/     # Individual app pages (Insights, Budgets, etc.)
│   │   └── common/    # Shared UI components
│   ├── marketing/     # Marketing website components
│   └── common/        # Cross-app shared components
├── context/           # React Context providers
├── routes/            # Route protection and layout components
├── styles/            # Global styles and CSS modules
├── utils/             # Utility functions and helpers
└── content/           # Marketing copy and static content
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Firebase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd penny-pilot-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory with your Firebase configuration:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

   The app will open at [http://localhost:3000](http://localhost:3000)

## 📋 Available Scripts

- **`npm start`** - Runs the app in development mode
- **`npm test`** - Launches the test runner in interactive watch mode
- **`npm run build`** - Builds the app for production to the `build` folder
- **`npm run eject`** - Ejects from Create React App (one-way operation)

## 🏗️ Building for Production

```bash
npm run build
```

The production build will be created in the `build/` directory, optimized for performance and ready for deployment.

## 🚀 Deployment

This project is configured for Firebase Hosting. To deploy:

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

## 🔧 Development

### Project Structure
- **Components**: Modular React components with CSS modules
- **Routing**: Protected routes with authentication guards
- **State Management**: Context API for global state (Auth, Profile)
- **Styling**: Bootstrap 5 with custom CSS modules for component-specific styles

### Key Components
- **Dashboard**: Main application shell with sidebar navigation
- **Protected Routes**: Authentication-based route protection
- **Marketing Site**: Public-facing marketing pages
- **App Pages**: Core application functionality (Insights, Budgets, Forecast, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary. All rights reserved.

## 📞 Support

For support and demo requests, please visit the application or contact the development team.

---

**Penny Pilot** - Your personal finance copilot for a brighter financial future. 💰✨
