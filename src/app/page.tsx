/**
 * Platform Home - Landing Page
 * 
 * Public landing page with "Get Started" button to register new tenant
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Shield, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  BarChart3,
  Globe,
  Lock
} from 'lucide-react';

export default function PlatformHomePage() {
  const router = useRouter();

  const features = [
    {
      icon: <Users className="w-8 h-8 text-blue-600" />,
      title: 'Team Collaboration',
      description: 'Seamless collaboration tools for agile teams of all sizes'
    },
    {
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      title: 'Enterprise Security',
      description: 'Bank-level security with role-based access control'
    },
    {
      icon: <Zap className="w-8 h-8 text-blue-600" />,
      title: 'Lightning Fast',
      description: 'Built for speed with real-time updates and notifications'
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-blue-600" />,
      title: 'Advanced Analytics',
      description: 'Track progress with powerful reporting and insights'
    },
    {
      icon: <Globe className="w-8 h-8 text-blue-600" />,
      title: 'Multi-Tenant SaaS',
      description: 'Complete isolation and customization for each company'
    },
    {
      icon: <Lock className="w-8 h-8 text-blue-600" />,
      title: 'Data Privacy',
      description: 'Your data is encrypted and completely secure'
    }
  ];

  const benefits = [
    'Unlimited team members',
    'Role-based permissions',
    'Custom workflows',
    'Real-time notifications',
    '99.9% uptime guarantee',
    '24/7 customer support'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">AgileMind Platform</span>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Agile Project Management
            <span className="text-blue-600"> Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Empower your team with the ultimate SaaS platform for agile project management. 
            Built for modern teams who value speed, collaboration, and results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => router.push('/register')}
              className="group bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-all font-semibold text-lg shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => router.push('/login')}
              className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:border-blue-600 hover:text-blue-600 transition-colors font-semibold text-lg"
            >
              Sign In to Your Account
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • Free forever for small teams
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-lg text-gray-600">
            Powerful features designed for high-performing agile teams
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="bg-blue-600 rounded-2xl p-12 text-white">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Teams Choose AgileMind
            </h2>
            <p className="text-blue-100 text-lg">
              Join thousands of companies already using our platform
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-blue-200 flex-shrink-0" />
                <span className="text-lg">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Ready to Transform Your Workflow?
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Create your company account and invite your team in minutes
        </p>
        <button
          onClick={() => router.push('/register')}
          className="group bg-blue-600 text-white px-10 py-5 rounded-lg hover:bg-blue-700 transition-all font-semibold text-xl shadow-xl hover:shadow-2xl flex items-center gap-3 mx-auto"
        >
          Start Your Free Trial
          <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-400">
            © 2025 AgileMind Platform. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Multi-tenant SaaS platform for agile project management
          </p>
        </div>
      </footer>
    </div>
  );
}
