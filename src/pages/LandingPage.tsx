import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Heart, Sparkles, UserCheck, Calendar, ChevronRight, CheckCircle, Menu, X } from 'lucide-react';
import Button from '../components/ui/Button';

const LandingPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // References to sections for smooth scrolling
  const featuresRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubmitted(true);
    setIsSubmitting(false);
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50">
      {/* Responsive Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center justify-center p-2 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full mr-2">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">MediCare Clinic</span>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection(featuresRef)} className="text-gray-700 hover:text-pink-600 font-medium">Features</button>
              <button onClick={() => scrollToSection(testimonialsRef)} className="text-gray-700 hover:text-pink-600 font-medium">Testimonials</button>
              <button onClick={() => scrollToSection(contactRef)} className="text-gray-700 hover:text-pink-600 font-medium">Contact</button>
            </div>
            
            <div className="hidden md:flex space-x-4">
              <Link to="/login" className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium">
                View Courses
              </Link>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:bg-pink-50"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-pink-100 py-4 px-4">
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => scrollToSection(featuresRef)}
                className="text-gray-700 hover:text-pink-600 font-medium py-2 px-3 rounded-md hover:bg-pink-50"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection(testimonialsRef)}
                className="text-gray-700 hover:text-pink-600 font-medium py-2 px-3 rounded-md hover:bg-pink-50"
              >
                Testimonials
              </button>
              <button 
                onClick={() => scrollToSection(contactRef)}
                className="text-gray-700 hover:text-pink-600 font-medium py-2 px-3 rounded-md hover:bg-pink-50"
              >
                Contact
              </button>
              <hr className="border-pink-100 my-2" />
                <div className="flex">
                  <Link 
                    to="/login"
                    className="w-full text-center bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2 px-3 rounded-lg hover:opacity-90 transition-opacity font-medium"
                  >
                    View Courses
                  </Link>
                </div>
            </div>
          </div>
        )}
      </nav>
        
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-8 md:mb-0">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Elevate Your Beauty Skills with Expert-Led Tutorials
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Join MediCare Clinic's online learning portal for premium video training on facial care, laser therapy, PRP treatments, microneedling, and more.
          </p>
          <div className="flex space-x-4">
            <Link to="/login">
              <Button size="lg" className="bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:opacity-90 transition-opacity">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <button 
              onClick={() => scrollToSection(featuresRef)} 
              className="flex items-center text-pink-600 font-medium hover:underline"
            >
              Learn more <ChevronRight className="ml-1 h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="md:w-1/2 relative">
          <div className="bg-gradient-to-br from-pink-400 to-rose-500 rounded-lg overflow-hidden shadow-xl transform -rotate-2">
            <img src="https://img.freepik.com/free-photo/beauty-concept-beautiful-caucasian-woman-with-clean-skin-natural-make-up-isolated-bright-pink-background-with-copy-space_1258-1031.jpg?semt=ais_hybrid&w=740" alt="Beauty tutorial" className="w-full h-auto opacity-90" />
          </div>
          <div className="absolute -bottom-6 -right-6 bg-white rounded-lg p-4 shadow-lg">
            <p className="font-medium text-gray-900">Join 1,000+ beauty professionals</p>
            <div className="flex mt-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-pink-300 border-2 border-white flex items-center justify-center text-white text-xs">
                    {i}
                  </div>
                ))}
              </div>
              <div className="ml-2 text-sm text-gray-600">
                <div className="font-medium">5-star rated</div>
                <div>training courses</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features */}
      <section id="features" ref={featuresRef} className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Premium Beauty Training at Your Fingertips</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our exclusive video library covers everything you need to know about modern beauty treatments and techniques
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-pink-50 rounded-xl p-6">
              <div className="bg-gradient-to-r from-pink-400 to-rose-400 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Skincare Mastery</h3>
              <p className="text-gray-600 mb-4">
                Learn advanced facial treatments, anti-aging techniques, and personalized skincare protocols for different skin types.
              </p>
              <ul className="space-y-2">
                {['Chemical Peels', 'LED Therapy', 'Hydra Facials'].map(item => (
                  <li key={item} className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-pink-500 mr-2" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-pink-50 rounded-xl p-6">
              <div className="bg-gradient-to-r from-pink-400 to-rose-400 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Laser Treatments</h3>
              <p className="text-gray-600 mb-4">
                Master various laser technologies for hair removal, skin rejuvenation, and targeted treatment of specific skin concerns.
              </p>
              <ul className="space-y-2">
                {['Hair Removal', 'Skin Resurfacing', 'Pigmentation Treatment'].map(item => (
                  <li key={item} className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-pink-500 mr-2" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-pink-50 rounded-xl p-6">
              <div className="bg-gradient-to-r from-pink-400 to-rose-400 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Advanced Procedures</h3>
              <p className="text-gray-600 mb-4">
                Detailed step-by-step guides on PRP, microneedling, and other advanced aesthetic procedures.
              </p>
              <ul className="space-y-2">
                {['PRP Injections', 'Microneedling', 'Mesotherapy'].map(item => (
                  <li key={item} className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-pink-500 mr-2" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section id="testimonials" ref={testimonialsRef} className="py-16 bg-gradient-to-r from-rose-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Success Stories from Our Community</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              See how our training has transformed beauty practices around the world
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Aesthetician",
                content: "The microneedling tutorials have completely transformed my practice. My clients are amazed by the results I can now deliver."
              },
              {
                name: "Emma Taylor",
                role: "Medical Spa Owner",
                content: "MediCare's PRP training gave my staff the confidence to offer this premium service. Our revenue has increased by 40% since implementation."
              },
              {
                name: "Jennifer Williams",
                role: "Beauty Therapist",
                content: "The laser training videos cover safety protocols that weren't taught in my formal education. Invaluable resource for any serious practitioner."
              }
            ].map((testimonial, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-300 to-rose-300 flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-pink-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Contact Section */}
      <section id="contact" ref={contactRef} className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Want to Learn More?</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Get in touch with our team to learn about membership options and specialized training paths.
                </p>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="p-2 bg-pink-100 rounded-full">
                    <Calendar className="h-6 w-6 text-pink-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Live Webinars</h4>
                    <p className="text-sm text-gray-600">Join our monthly live Q&A sessions with expert practitioners</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-pink-100 rounded-full">
                    <UserCheck className="h-6 w-6 text-pink-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Certification Paths</h4>
                    <p className="text-sm text-gray-600">Complete courses and earn digital certificates</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Us</h3>
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Thank You!</h4>
                    <p className="text-gray-600">We've received your message and will be in touch soon.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                        required
                      ></textarea>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-pink-500 to-rose-500"
                      isLoading={isSubmitting}
                    >
                      Send Message
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
<footer className="bg-gray-900 text-white py-12">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Left Column - Contact Info */}
      <div>
        <div className="flex items-center mb-4">
          <div className="flex items-center justify-center p-2 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full mr-2">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">MediCare Clinic</span>
        </div>
        
        <p className="text-gray-400 mb-6 max-w-md">
          Empowering beauty professionals with expert-led educational content on facial care, laser therapy, and advanced aesthetic procedures.
        </p>
        
        <div className="space-y-4 mb-8">
          {/* Phone */}
          <div className="flex items-center">
            <div className="p-2 bg-gray-800 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <a href="tel:+212524434640" className="text-gray-300 hover:text-pink-400 transition-colors">
              +212 524 434 640
            </a>
          </div>
          
          {/* WhatsApp */}
          <div className="flex items-center">
            <div className="p-2 bg-gray-800 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <a href="https://wa.me/212661280787" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-pink-400 transition-colors">
              +212 661 280 787
            </a>
          </div>
          
          {/* Address */}
          <div className="flex items-center">
            <div className="p-2 bg-gray-800 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <a 
              href="https://www.google.com/maps?q=JXQQ+3R+Marrakech" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-300 hover:text-pink-400 transition-colors"
            >
              N 9 Résidence Ahlam A, Entrée 1, 2ème étage, Av. Yacoub El Mansour, Marrakesh 40000
            </a>
          </div>
        </div>
        
        {/* Social Media Links */}
        <div className="flex space-x-4">
          {/* Facebook */}
          <a 
            href="https://www.facebook.com/p/Medicare-Clinic-100083241855250/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 bg-gray-800 rounded-full hover:bg-pink-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
            </svg>
          </a>
          
          {/* Instagram */}
          <a 
            href="https://www.instagram.com/medicare_clinic_marrakech/?hl=fr" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 bg-gray-800 rounded-full hover:bg-pink-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
          
          {/* WhatsApp */}
          <a 
            href="https://wa.me/212661280787" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 bg-gray-800 rounded-full hover:bg-pink-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
          </a>
        </div>
      </div>
      
      {/* Right Column - Map */}
      <div className="h-64 md:h-auto">
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3396.931440884852!2d-8.006368!3d31.631441!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzHCsDM3JzUzLjIiTiA4wrAwMCcyMi45Ilc!5e0!3m2!1sen!2sma!4v1627550897505!5m2!1sen!2sma" 
          className="w-full h-full rounded-lg" 
          style={{ border: 0 }} 
          allowFullScreen 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </div>
    
    <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
      <p className="text-gray-400 text-sm">© 2025 MediCare Clinic. All rights reserved.</p>
      
      <div className="flex mt-4 md:mt-0 space-x-6">
        <button onClick={() => scrollToSection(featuresRef)} className="text-gray-400 hover:text-pink-400 transition-colors text-sm">Features</button>
        <button onClick={() => scrollToSection(testimonialsRef)} className="text-gray-400 hover:text-pink-400 transition-colors text-sm">Testimonials</button>
        <button onClick={() => scrollToSection(contactRef)} className="text-gray-400 hover:text-pink-400 transition-colors text-sm">Contact</button>
      </div>
    </div>
  </div>
</footer>
      
      </div>
  );
};

export default LandingPage;