# IndabaXKenya-Website

Official website for the IndabaX Kenya conference - an information and communication platform for the IndabaX community, including the NOAI sub-event.

## Overview

This website provides:
- Event information for IndabaX and NOAI
- News updates and announcements
- Speaker profiles with interactive flip cards
- Photo gallery (2022-present)
- Application submission system
- Admin panel for content management

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: React 18 + Bootstrap 5
- **Styling**: Sass + Custom CSS
- **Animations**: AOS (Animate On Scroll)
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Template Base**: Evnia v1.4.0 + Eventify v1.0.0 features

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (for backend services)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/IndabaXKenya254/IndabaXKenya-Website.git
cd IndabaXKenya-Website
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Add your Supabase credentials to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Build

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## Project Structure

```
indabax-kenya-website/
├── src/
│   ├── app/              # Next.js 14 app router pages
│   └── components/       # React components
├── public/
│   ├── images/          # Static images
│   └── fonts/           # Icon fonts
├── styles/              # Global styles (Sass/CSS)
└── libs/                # Utilities and helpers
```

## Key Features

- **Responsive Design**: Optimized for mobile and desktop
- **Event Management**: Dynamic event listings and schedules
- **Speaker Profiles**: Interactive flip card animations
- **Photo Gallery**: Organized by year with download capability
- **Application System**: Form submission and admin review
- **Newsletter**: Email subscription widget
- **Admin Panel**: Content and application management

## Database Tables

- `events` - Event information
- `posts` - News and announcements
- `applications` - User applications
- `subscribers` - Newsletter subscribers
- `speakers` - Speaker information
- `photos` - Gallery images
- `settings` - Site configuration
- `admins` - Admin users

## Deployment

Recommended platforms:
- **Vercel** (Recommended for Next.js)
- Netlify
- Custom hosting with Node.js support

## Contributing

This is a private project for IndabaX Kenya. For questions or contributions, please contact the project maintainers.

## License

Proprietary - IndabaX Kenya 2025

## Budget & Timeline

- **Budget**: 50,000 KSH
- **Timeline**: 3 weeks
- **Status**: In Development

## Support

For issues or questions, please contact the development team.
