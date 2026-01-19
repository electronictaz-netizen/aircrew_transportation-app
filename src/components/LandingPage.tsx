import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Zap, Shield, BarChart, Users, Clock, Globe } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../utils/stripe';
import { Button } from './ui/button';
import { showError, showInfo } from '../utils/toast';
import './LandingPage.css';

export function LandingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleGetStarted = async (planId: string) => {
    if (planId === 'free') {
      // Free plan - redirect to sign up
      window.location.href = '/?signup=true';
      return;
    }

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan || !plan.stripePriceId) {
      showError('This plan is not available yet. Please contact support.');
      return;
    }

    try {
      setLoadingPlan(planId);
      showInfo('Redirecting to secure checkout...');
      
      // For public landing page, we need to create a temporary company or handle differently
      // For now, redirect to sign up first, then checkout
      // TODO: Implement guest checkout or company creation flow
      showInfo('Please sign up first, then you can subscribe to a plan.');
      window.location.href = '/?signup=true&plan=' + planId;
    } catch (error) {
      console.error('Error starting checkout:', error);
      showError('Failed to start checkout. Please try again or contact support.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const features = [
    {
      icon: <Zap className="feature-icon" />,
      title: 'Streamlined Operations',
      description: 'Manage all your transportation needs in one place with an intuitive interface designed for efficiency.',
    },
    {
      icon: <Users className="feature-icon" />,
      title: 'Driver Management',
      description: 'Easily assign trips, track driver availability, and manage your fleet with comprehensive driver tools.',
    },
    {
      icon: <Clock className="feature-icon" />,
      title: 'Real-Time Updates',
      description: 'Get instant notifications and updates on trip status, driver assignments, and schedule changes.',
    },
    {
      icon: <BarChart className="feature-icon" />,
      title: 'Advanced Reporting',
      description: 'Generate detailed reports for payroll, financial reconciliation, and operational insights.',
    },
    {
      icon: <Shield className="feature-icon" />,
      title: 'Secure & Reliable',
      description: 'Built on AWS infrastructure with enterprise-grade security and 99.9% uptime guarantee.',
    },
    {
      icon: <Globe className="feature-icon" />,
      title: 'Flight Integration',
      description: 'Automatic flight status tracking and integration for seamless airport trip management.',
    },
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-container">
          <div className="landing-nav-brand">
            <h1>Onyx Transportation App</h1>
          </div>
          <div className="landing-nav-actions">
            <Link to="/?signin=true">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/?signup=true">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="landing-hero-title">
              Manage Your Transportation Operations
              <span className="landing-hero-highlight"> with Ease</span>
            </h1>
            <p className="landing-hero-description">
              Streamline your transportation management with powerful tools for trip planning, 
              driver assignment, and comprehensive reporting. Built for teams that need reliability and efficiency.
            </p>
            <div className="landing-hero-cta">
              <Link to="/?signup=true">
                <Button size="lg" className="landing-cta-primary">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="landing-features">
        <div className="landing-section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="landing-section-title">Everything You Need to Succeed</h2>
            <p className="landing-section-description">
              Powerful features designed to make transportation management simple and efficient.
            </p>
          </motion.div>
          <div className="landing-features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="landing-feature-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="landing-feature-icon">{feature.icon}</div>
                <h3 className="landing-feature-title">{feature.title}</h3>
                <p className="landing-feature-description">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="landing-pricing">
        <div className="landing-section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="landing-section-title">Simple, Transparent Pricing</h2>
            <p className="landing-section-description">
              Choose the plan that fits your needs. All plans include core features with no hidden fees.
            </p>
          </motion.div>
          <div className="landing-pricing-grid">
            {SUBSCRIPTION_PLANS.map((plan, index) => (
              <motion.div
                key={plan.id}
                className={`landing-pricing-card ${plan.id === 'basic' ? 'landing-pricing-featured' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                {plan.id === 'basic' && (
                  <div className="landing-pricing-badge">Most Popular</div>
                )}
                <div className="landing-pricing-header">
                  <h3 className="landing-pricing-name">{plan.name}</h3>
                  <div className="landing-pricing-price">
                    {plan.price === 0 ? (
                      <span className="landing-pricing-amount">Free</span>
                    ) : (
                      <>
                        <span className="landing-pricing-amount">${plan.price}</span>
                        <span className="landing-pricing-interval">/{plan.interval}</span>
                      </>
                    )}
                  </div>
                  <p className="landing-pricing-description">{plan.description}</p>
                </div>
                <ul className="landing-pricing-features">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="landing-pricing-feature">
                      <Check className="landing-pricing-check" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="landing-pricing-button"
                  variant={plan.id === 'basic' ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => handleGetStarted(plan.id)}
                  disabled={loadingPlan === plan.id}
                >
                  {loadingPlan === plan.id ? 'Loading...' : plan.id === 'free' ? 'Get Started' : 'Subscribe'}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta">
        <div className="landing-section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="landing-cta-content"
          >
            <h2 className="landing-cta-title">Ready to Get Started?</h2>
            <p className="landing-cta-description">
              Join teams already using Onyx Transportation App to streamline their operations.
            </p>
            <Link to="/?signup=true">
              <Button size="lg" className="landing-cta-button">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-section-container">
          <div className="landing-footer-content">
            <div className="landing-footer-brand">
              <h3>Onyx Transportation App</h3>
              <p>Modern software to meet your business needs</p>
            </div>
            <div className="landing-footer-links">
              <div className="landing-footer-column">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <Link to="/?signup=true">Sign Up</Link>
              </div>
              <div className="landing-footer-column">
                <h4>Company</h4>
                <p>{import.meta.env.VITE_SERVICE_PROVIDER_NAME || 'Taz Software, LLC'}</p>
                {import.meta.env.VITE_SERVICE_PROVIDER_TAGLINE && (
                  <p className="landing-footer-tagline">
                    {import.meta.env.VITE_SERVICE_PROVIDER_TAGLINE}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="landing-footer-bottom">
            <p>&copy; {new Date().getFullYear()} {import.meta.env.VITE_SERVICE_PROVIDER_NAME || 'Taz Software, LLC'}. All rights reserved.</p>
            <p className="landing-footer-powered">Powered by AWS Amplify</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
