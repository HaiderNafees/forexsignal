# **App Name**: ForexEdge

## Core Features:

- Live Gold Price Chart: Display a live TradingView chart widget for XAU/USD (Gold price) on the home page.
- Free Forex Signals: Provide up to 2 free forex signals per day for non-pro users.
- User Authentication: Implement login and signup forms with email and password authentication using Firebase Auth.
- Role-Based Access Control: Implement role-based access control (free, pro, admin) to protect routes and restrict features based on user roles. Admin will be a tool which can reason about different signals based on the state of the current users.
- Signal Display: Display available signals on the dashboard, limiting free users to 2 signals daily.
- Admin Dashboard Access: Restrict access to the Admin Dashboard to admin@forexsignal.com, redirecting automatically upon login with the correct credentials (Admin798956!!).
- "Upgrade to Pro" Simulation: Include a dummy "Upgrade to Pro" button that simulates changing the user's role to "pro" for testing purposes.

## Style Guidelines:

- Primary color: Saturated, vibrant blue (#29ABE2) evoking confidence and forward momentum in trading.
- Background color: Light blue-gray (#D4E7ED) for a clean, professional backdrop.
- Accent color: Yellow-gold (#FFC107) as an analogous accent, drawing upon gold as an iconic element of Forex trading.
- Body text: 'PT Sans', sans-serif.
- Headline text: 'Space Grotesk', sans-serif.
- Responsive, mobile-first design using Tailwind CSS grid utilities.
- Subtle animations and transitions using Framer Motion to enhance UI interactions.