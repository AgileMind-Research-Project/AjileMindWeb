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
      icon: <Users className="w-8 h-8" style={{ color: 'var(--am-primary)' }} />,
      title: 'Team Collaboration',
      description: 'Seamless collaboration tools for agile teams of all sizes'
    },
    {
      icon: <Shield className="w-8 h-8" style={{ color: 'var(--am-secondary)' }} />,
      title: 'Enterprise Security',
      description: 'Bank-level security with role-based access control'
    },
    {
      icon: <Zap className="w-8 h-8" style={{ color: 'var(--am-accent)' }} />,
      title: 'AI-Powered Insights',
      description: 'Smart analytics with AI-driven project insights and reports'
    },
    {
      icon: <BarChart3 className="w-8 h-8" style={{ color: 'var(--am-primary)' }} />,
      title: 'Advanced Analytics',
      description: 'Track progress with powerful reporting and real-time dashboards'
    },
    {
      icon: <Globe className="w-8 h-8" style={{ color: 'var(--am-secondary)' }} />,
      title: 'Multi-Tenant SaaS',
      description: 'Complete isolation and customization for each company'
    },
    {
      icon: <Lock className="w-8 h-8" style={{ color: 'var(--am-accent)' }} />,
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
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, var(--am-primary-50) 0%, #FFFFFF 40%, var(--am-bg) 100%)' }}>
      {/* Navigation */}
      <nav style={{ backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--am-border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--am-primary)' }}>
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-2xl font-bold" style={{ color: 'var(--am-text-primary)' }}>AgileMind Platform</span>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="font-semibold transition-colors px-4 py-2 rounded-lg"
              style={{ color: 'var(--am-primary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--am-primary-50)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6" style={{
            backgroundColor: 'var(--am-accent-50)',
            color: 'var(--am-accent-dark)',
            border: '1px solid var(--am-accent-100)'
          }}>
            <Zap className="w-4 h-4" />
            AI-Powered Meeting Management
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight" style={{ color: 'var(--am-text-primary)' }}>
            Agile Project Management
            <span style={{ color: 'var(--am-primary)' }}> Made Simple</span>
          </h1>
          <p className="text-xl mb-10 leading-relaxed" style={{ color: 'var(--am-text-secondary)' }}>
            Empower your team with the ultimate SaaS platform for agile project management. 
            Built for modern teams who value speed, collaboration, and results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => router.push('/register')}
              className="group px-8 py-4 rounded-xl font-semibold text-lg flex items-center gap-2 text-white transition-all duration-200"
              style={{ 
                backgroundColor: 'var(--am-primary)',
                boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.35)'
              }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.backgroundColor = 'var(--am-primary-dark)';
                e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(37, 99, 235, 0.45)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.backgroundColor = 'var(--am-primary)';
                e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(37, 99, 235, 0.35)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200"
              style={{
                border: '2px solid var(--am-border)',
                color: 'var(--am-text-primary)',
                backgroundColor: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--am-primary)';
                e.currentTarget.style.color = 'var(--am-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--am-border)';
                e.currentTarget.style.color = 'var(--am-text-primary)';
              }}
            >
              Sign In to Your Account
            </button>
          </div>
          <p className="text-sm mt-5" style={{ color: 'var(--am-text-muted)' }}>
            No credit card required • Free forever for small teams • 
            <button 
              onClick={() => router.push('/otp-register')}
              className="hover:underline ml-1 font-medium"
              style={{ color: 'var(--am-primary)' }}
            >
              Traditional signup
            </button>
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--am-text-primary)' }}>
            Everything You Need to Succeed
          </h2>
          <p className="text-lg" style={{ color: 'var(--am-text-secondary)' }}>
            Powerful features designed for high-performing agile teams
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-7 rounded-2xl transition-all duration-300 cursor-default group"
              style={{
                backgroundColor: 'white',
                border: '1px solid var(--am-border)',
                boxShadow: 'var(--am-shadow)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'var(--am-shadow-lg)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'var(--am-shadow)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: 'var(--am-primary-50)' }}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--am-text-primary)' }}>
                {feature.title}
              </h3>
              <p style={{ color: 'var(--am-text-secondary)' }}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="rounded-2xl p-12 text-white" style={{
          background: 'linear-gradient(135deg, var(--am-primary) 0%, var(--am-secondary) 100%)'
        }}>
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Teams Choose AgileMind
            </h2>
            <p className="text-lg" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Join thousands of companies already using our platform
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--am-accent-light)' }} />
                <span className="text-lg">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--am-text-primary)' }}>
          Ready to Transform Your Workflow?
        </h2>
        <p className="text-lg mb-10" style={{ color: 'var(--am-text-secondary)' }}>
          Create your company account and invite your team in minutes
        </p>
        <button
          onClick={() => router.push('/register')}
          className="group px-10 py-5 rounded-xl text-white font-semibold text-xl flex items-center gap-3 mx-auto transition-all duration-200"
          style={{
            backgroundColor: 'var(--am-primary)',
            boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.35)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--am-primary-dark)';
            e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(37, 99, 235, 0.45)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--am-primary)';
            e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(37, 99, 235, 0.35)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Start Your Free Trial
          <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </button>
      </section>

      {/* Footer */}
      <footer className="py-8 mt-16" style={{ backgroundColor: 'var(--am-text-primary)' }}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p style={{ color: 'var(--am-text-muted)' }}>
            © 2025 AgileMind Platform. All rights reserved.
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--am-text-secondary)' }}>
            AI-Powered Meeting Management System
          </p>
        </div>
      </footer>
    </div>
  );
}
