import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TutorConnect - Find Your Perfect Tutor',
  description: 'Connect with qualified tutors for personalized learning experiences. Browse subjects, book sessions, and achieve your academic goals.',
  keywords: 'tutoring, education, learning, math, science, english, history, online tutoring',
  authors: [{ name: 'TutorConnect' }],
  openGraph: {
    title: 'TutorConnect - Find Your Perfect Tutor',
    description: 'Connect with qualified tutors for personalized learning experiences.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TutorConnect - Find Your Perfect Tutor',
    description: 'Connect with qualified tutors for personalized learning experiences.',
  },
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <div className="min-h-full flex flex-col">
          {/* Navigation Header */}
          <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
            <nav className="container-custom">
              <div className="flex items-center justify-between h-16">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">TC</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">TutorConnect</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-8">
                  <Link 
                    href="/" 
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
                  >
                    Home
                  </Link>
                  <Link 
                    href="/tutors" 
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
                  >
                    Find Tutors
                  </Link>
                  <Link 
                    href="/booking" 
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
                  >
                    Book Session
                  </Link>
                  <Link 
                    href="/tutors" 
                    className="btn-primary"
                  >
                    Get Started
                  </Link>
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden">
                  <button
                    type="button"
                    className="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600 transition-colors duration-200"
                    aria-label="Toggle navigation menu"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Mobile Navigation Menu */}
              <div className="md:hidden border-t border-gray-200 py-4">
                <div className="flex flex-col space-y-3">
                  <Link 
                    href="/" 
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 px-2 py-1"
                  >
                    Home
                  </Link>
                  <Link 
                    href="/tutors" 
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 px-2 py-1"
                  >
                    Find Tutors
                  </Link>
                  <Link 
                    href="/booking" 
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 px-2 py-1"
                  >
                    Book Session
                  </Link>
                  <Link 
                    href="/tutors" 
                    className="btn-primary w-fit mx-2"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </nav>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
            <div className="container-custom py-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Company Info */}
                <div className="col-span-1 md:col-span-2">
                  <Link href="/" className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">TC</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">TutorConnect</span>
                  </Link>
                  <p className="text-gray-600 text-sm max-w-md">
                    Connect with qualified tutors for personalized learning experiences. 
                    Find the perfect tutor for your academic needs and achieve your goals.
                  </p>
                </div>

                {/* Quick Links */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Quick Links</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                        Home
                      </Link>
                    </li>
                    <li>
                      <Link href="/tutors" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                        Find Tutors
                      </Link>
                    </li>
                    <li>
                      <Link href="/booking" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                        Book Session
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Support */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Support</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                        Help Center
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                        Contact Us
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                        Privacy Policy
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                        Terms of Service
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Bottom Bar */}
              <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center">
                <p className="text-gray-500 text-sm">
                  © 2024 TutorConnect. All rights reserved.
                </p>
                <div className="flex space-x-6 mt-4 sm:mt-0">
                  <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors duration-200">
                    <span className="sr-only">Facebook</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors duration-200">
                    <span className="sr-only">Twitter</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors duration-200">
                    <span className="sr-only">LinkedIn</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  )
}