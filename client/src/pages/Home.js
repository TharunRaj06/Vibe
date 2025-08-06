import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Car, 
  Zap, 
  Shield, 
  Clock, 
  Camera, 
  Brain, 
  CheckCircle, 
  ArrowRight 
} from 'lucide-react';
import './Home.css';

const Home = () => {
  const features = [
    {
      icon: <Camera size={32} />,
      title: 'AI-Powered Photo Analysis',
      description: 'Upload photos of vehicle damage and get instant severity assessment using Azure Computer Vision.'
    },
    {
      icon: <Clock size={32} />,
      title: 'Fast Processing',
      description: 'Submit claims in minutes and get quick responses with automated damage analysis.'
    },
    {
      icon: <Shield size={32} />,
      title: 'Secure & Reliable',
      description: 'Your data is protected with enterprise-grade Azure security and compliance.'
    },
    {
      icon: <Brain size={32} />,
      title: 'Smart Estimates',
      description: 'Get accurate damage estimates based on AI analysis and historical claim data.'
    }
  ];

  const steps = [
    {
      step: 1,
      title: 'Register Account',
      description: 'Create your account and set up your profile'
    },
    {
      step: 2,
      title: 'Submit Claim',
      description: 'Upload photos and provide incident details'
    },
    {
      step: 3,
      title: 'AI Analysis',
      description: 'Our AI analyzes damage and estimates costs'
    },
    {
      step: 4,
      title: 'Get Results',
      description: 'Receive your claim decision and payout'
    }
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Smart Vehicle Insurance Claims
            <span className="highlight"> Powered by AI</span>
          </h1>
          <p className="hero-description">
            Submit your vehicle insurance claims in minutes with our AI-powered 
            damage analysis. Get faster approvals and accurate estimates using 
            cutting-edge computer vision technology.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-large">
              Get Started
              <ArrowRight size={20} />
            </Link>
            <Link to="/submit-claim" className="btn btn-secondary btn-large">
              Submit Claim
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-card">
            <Car size={64} className="hero-icon" />
            <h3>AutoClaimAI</h3>
            <p>Intelligent Claims Processing</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="section-header">
          <h2>Why Choose AutoClaimAI?</h2>
          <p>Experience the future of insurance claims with AI-powered automation</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Simple steps to process your vehicle insurance claim</p>
        </div>
        <div className="steps-container">
          {steps.map((step, index) => (
            <div key={index} className="step-card">
              <div className="step-number">{step.step}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              {index < steps.length - 1 && (
                <ArrowRight className="step-arrow" size={24} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits">
        <div className="benefits-content">
          <div className="benefits-text">
            <h2>Advanced AI Technology</h2>
            <p>
              Our platform leverages Microsoft Azure's Computer Vision API to 
              analyze vehicle damage photos with unprecedented accuracy. Get 
              instant damage assessments and cost estimates.
            </p>
            <ul className="benefits-list">
              <li>
                <CheckCircle size={20} />
                Instant damage severity classification
              </li>
              <li>
                <CheckCircle size={20} />
                Automated cost estimation
              </li>
              <li>
                <CheckCircle size={20} />
                24/7 claim submission
              </li>
              <li>
                <CheckCircle size={20} />
                Real-time status updates
              </li>
            </ul>
            <Link to="/submit-claim" className="btn btn-primary">
              Try It Now
            </Link>
          </div>
          <div className="benefits-visual">
            <div className="tech-showcase">
              <Zap size={48} className="tech-icon" />
              <h3>Powered by Azure AI</h3>
              <p>Computer Vision • Blob Storage • Cosmos DB</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-content">
          <h2>Ready to Get Started?</h2>
          <p>Join thousands of users who trust AutoClaimAI for their insurance claims</p>
          <div className="cta-actions">
            <Link to="/register" className="btn btn-primary btn-large">
              Create Account
            </Link>
            <Link to="/login" className="btn btn-secondary btn-large">
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
