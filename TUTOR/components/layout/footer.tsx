import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { label: 'Find Tutors', href: '/tutors' },
      { label: 'Become a Tutor', href: '/register?role=tutor' },
      { label: 'How it Works', href: '/how-it-works' },
      { label: 'Pricing', href: '/pricing' },
    ],
    subjects: [
      { label: 'Mathematics', href: '/tutors?subject=mathematics' },
      { label: 'Science', href: '/tutors?subject=science' },
      { label: 'Languages', href: '/tutors?subject=languages' },
      { label: 'Programming', href: '/tutors?subject=programming' },
    ],
    support: [
      { label: 'Help Center', href: '/help' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Safety', href: '/safety' },
      { label: 'Community Guidelines', href: '/guidelines' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Accessibility', href: '/accessibility' },
    ],
  };

  const socialLinks = [
    { 
      icon: Facebook, 
      href: 'https://facebook.com/tutorplatform', 
      label: 'Follow us on Facebook',
      ariaLabel: 'Visit our Facebook page'
    },
    { 
      icon: Twitter, 
      href: 'https://twitter.com/tutorplatform', 
      label: 'Follow us on Twitter',
      ariaLabel: 'Visit our Twitter profile'
    },
    { 
      icon: Instagram, 
      href: 'https://instagram.com/tutorplatform', 
      label: 'Follow us on Instagram',
      ariaLabel: 'Visit our Instagram profile'
    },
    { 
      icon: Linkedin, 
      href: 'https://linkedin.com/company/tutorplatform', 
      label: 'Connect on LinkedIn',
      ariaLabel: 'Visit our LinkedIn company page'
    },
  ];

  const contactInfo = [
    {
      icon: Mail,
      text: 'support@tutorplatform.com',
      href: 'mailto:support@tutorplatform.com',
      ariaLabel: 'Send us an email'
    },
    {
      icon: Phone,
      text: '+1 (555) 123-4567',
      href: 'tel:+15551234567',
      ariaLabel: 'Call our support line'
    },
    {
      icon: MapPin,
      text: '123 Education St, Learning City, LC 12345',
      href: 'https://maps.google.com/?q=123+Education+St,+Learning+City,+LC+12345',
      ariaLabel: 'View our location on Google Maps'
    },
  ];

  return (
    <footer className="bg-gray-900 text-white" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand and Description */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <Link 
                  href="/" 
                  className="text-2xl font-bold text-white hover:text-blue-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                  aria-label="TutorPlatform - Go to homepage"
                >
                  TutorPlatform
                </Link>
              </div>
              <p className="text-gray-300 mb-6 max-w-md leading-relaxed">
                Connecting students with expert tutors worldwide. Experience personalized learning 
                through our advanced virtual classroom technology and comprehensive learning management system.
              </p>
              
              {/* Contact Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white mb-4">Contact Us</h3>
                {contactInfo.map((contact, index) => {
                  const IconComponent = contact.icon;
                  return (
                    <div key={index} className="flex items-center space-x-3">
                      <IconComponent className="h-5 w-5 text-blue-400 flex-shrink-0" aria-hidden="true" />
                      <a
                        href={contact.href}
                        className="text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                        aria-label={contact.ariaLabel}
                        target={contact.href.startsWith('http') ? '_blank' : undefined}
                        rel={contact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      >
                        {contact.text}
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Platform Links */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Platform</h3>
              <nav aria-label="Platform navigation">
                <ul className="space-y-3">
                  {footerLinks.platform.map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.href}
                        className="text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Subjects Links */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Popular Subjects</h3>
              <nav aria-label="Subject categories navigation">
                <ul className="space-y-3">
                  {footerLinks.subjects.map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.href}
                        className="text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
              <nav aria-label="Support navigation">
                <ul className="space-y-3 mb-6">
                  {footerLinks.support.map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.href}
                        className="text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Social Media Links */}
              <div>
                <h4 className="text-md font-semibold text-white mb-4">Follow Us</h4>
                <div className="flex space-x-4">
                  {socialLinks.map((social, index) => {
                    const IconComponent = social.icon;
                    return (
                      <a
                        key={index}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded p-1"
                        aria-label={social.ariaLabel}
                        title={social.label}
                      >
                        <IconComponent className="h-6 w-6" aria-hidden="true" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            {/* Copyright */}
            <div className="text-gray-400 text-sm">
              <p>
                © {currentYear} TutorPlatform. All rights reserved.
              </p>
            </div>

            {/* Legal Links */}
            <nav aria-label="Legal navigation" className="flex flex-wrap justify-center lg:justify-end gap-6">
              {footerLinks.legal.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="text-gray-400 hover:text-white text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Additional Compliance Information */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="text-xs text-gray-500 text-center lg:text-left">
              <p className="mb-2">
                TutorPlatform is committed to accessibility and provides equal access to learning opportunities for all users.
              </p>
              <p>
                This website uses cookies to enhance user experience and analyze website traffic. 
                By continuing to use this site, you consent to our use of cookies as described in our Cookie Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;