# Tutoring Marketplace

A modern tutoring marketplace built with Next.js 14, TypeScript, and Tailwind CSS. Connect students with qualified tutors across various subjects with an intuitive booking system.

## Features

### 🏠 Homepage
- Hero section with search functionality
- Featured tutors showcase
- Subject category navigation
- Platform statistics (students, tutors, sessions)

### 👨‍🏫 Tutor Discovery
- Advanced search and filtering by subject, price range, and rating
- Sort options (price, rating, name)
- Pagination with 12 tutors per page
- Quick view modals for tutor previews

### 📋 Tutor Profiles
- Detailed tutor information and qualifications
- Subject expertise and hourly rates
- Availability calendar view
- Contact form and booking integration

### 📅 Booking System
- Interactive date and time selection
- Session duration options
- Real-time cost calculation
- Booking confirmation with details

### 🎨 User Experience
- Fully responsive design
- Toast notifications for user feedback
- Loading states and error handling
- Clean, modern interface

## Tech Stack

- **Framework**: Next.js 14.2.3 with App Router
- **Language**: TypeScript 5.4.5
- **Styling**: Tailwind CSS 3.4.4
- **State Management**: Zustand 4.5.2
- **UI Components**: Radix UI (Dialog, Select)
- **Notifications**: React Hot Toast 2.4.1
- **Date Handling**: date-fns 3.6.0
- **Deployment**: Vercel

## Project Structure

```
TUTOR/
├── app/                    # Next.js 14 App Router
│   ├── booking/           # Booking flow pages
│   ├── tutors/            # Tutor listing and profiles
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # Reusable UI components
│   ├── Calendar.tsx       # Date selection component
│   ├── FilterSidebar.tsx  # Search filters
│   ├── SearchBar.tsx      # Search input
│   ├── TimeSlotPicker.tsx # Time selection
│   └── TutorCard.tsx      # Tutor display card
├── lib/                   # Utilities and data
│   ├── data.ts           # Mock tutor data
│   ├── store.ts          # Zustand state management
│   └── utils.ts          # Helper functions
├── next.config.js        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS config
└── tsconfig.json         # TypeScript config
```

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm

### Installation

1. Clone or download the project:
```bash
cd TUTOR
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

## Deployment

### Vercel (Recommended)

This application is optimized for Vercel deployment:

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Visit [vercel.com](https://vercel.com) and import your repository

3. Vercel will automatically detect Next.js and configure the build settings

4. Deploy with one click!

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. The `out` folder contains the static files ready for deployment to any static hosting service.

## Key Features Implementation

### State Management
- Zustand store manages booking flow state
- Persistent selection across booking steps
- Type-safe state updates

### Data Layer
- Mock data with 20+ diverse tutors
- Comprehensive subject coverage
- Realistic availability schedules
- Rating and pricing variety

### Search & Filtering
- Real-time search across tutor names and subjects
- Multi-criteria filtering (subject, price, rating)
- URL-based filter state for shareable links
- Debounced search for performance

### Booking Flow
- Multi-step booking process
- Date and time validation
- Session duration options
- Cost calculation and confirmation

### Responsive Design
- Mobile-first approach
- Tailwind CSS utility classes
- Flexible grid layouts
- Touch-friendly interactions

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational and demonstration purposes.

## Support

For questions or support, please contact the development team or create an issue in the repository.