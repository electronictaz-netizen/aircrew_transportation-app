/**
 * Subscription Management Component
 * Allows companies to view and manage their subscriptions
 */

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useCompany } from '../contexts/CompanyContext';
import { 
  SUBSCRIPTION_PLANS, 
  getSubscriptionPlan, 
  getCompanySubscription,
  isSubscriptionActive,
  getSubscriptionStatusColor,
  type SubscriptionPlan 
} from '../utils/stripe';
import { createCheckoutSession, createPortalSession } from '../utils/stripeCheckout';
import { Button } from './ui/button';
import { format } from 'date-fns';
import { Check, X, AlertCircle, CreditCard } from 'lucide-react';
import { showSuccess, showError, showInfo } from '../utils/toast';
import './SubscriptionManagement.css';

const client = generateClient<Schema>();

interface SubscriptionManagementProps {
  onClose?: () => void;
}

export function SubscriptionManagement({ onClose }: SubscriptionManagementProps) {
  const { companyId } = useCompany();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<{
    plan: SubscriptionPlan | undefined;
    status: string;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
  } | null>(null);

  useEffect(() => {
    if (companyId) {
      loadSubscription();
    }
  }, [companyId]);

  const loadSubscription = async () => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      const subData = await getCompanySubscription(companyId);
      setSubscription(subData);
    } catch (error) {
      console.error('Error loading subscription:', error);
      showError('Failed to load subscription information.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (!companyId) {
      showError('Company not found.');
      return;
    }

    const plan = getSubscriptionPlan(planId);
    if (!plan) {
      showError('Invalid plan selected.');
      return;
    }

    if (plan.price === 0) {
      // Free plan - just update directly
      try {
        await client.models.Company.update({
          id: companyId,
          subscriptionTier: planId,
        });
        showSuccess(`Switched to ${plan.name} plan successfully!`);
        loadSubscription();
      } catch (error) {
        console.error('Error updating subscription:', error);
        showError('Failed to update subscription.');
      }
    } else {
      // Paid plan - redirect to Stripe Checkout
      try {
        if (!plan.stripePriceId) {
          showError('Stripe Price ID not configured for this plan. Please contact support.');
          return;
        }

        showInfo('Redirecting to checkout...');
        const checkout = await createCheckoutSession(companyId, plan.stripePriceId);
        
        // Redirect to Stripe Checkout
        window.location.href = checkout.checkoutUrl;
      } catch (error) {
        console.error('Error creating checkout session:', error);
        showError('Failed to create checkout session. Please try again or contact support.');
      }
    }
  };

  const handleOpenCustomerPortal = async () => {
    if (!companyId) {
      showError('Company not found.');
      return;
    }

    try {
      showInfo('Opening customer portal...');
      const portal = await createPortalSession(companyId);
      
      // Redirect to Stripe Customer Portal
      window.location.href = portal.portalUrl;
    } catch (error) {
      console.error('Error creating portal session:', error);
      showError('Failed to open customer portal. Please try again or contact support.');
    }
  };

  if (loading) {
    return (
      <div className="subscription-management">
        <div className="subscription-loading">Loading subscription information...</div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="subscription-management">
        <div className="subscription-error">
          <AlertCircle className="error-icon" />
          <p>Unable to load subscription information.</p>
        </div>
      </div>
    );
  }

  const currentPlan = subscription.plan;
  const statusColor = getSubscriptionStatusColor(subscription.status);
  const isActive = isSubscriptionActive(subscription.status);

  return (
    <div className="subscription-management">
      <div className="subscription-header">
        <h2>Subscription Management</h2>
        {onClose && (
          <Button variant="outline" onClick={onClose} size="sm">
            Close
          </Button>
        )}
      </div>

      {/* Current Subscription */}
      <div className="subscription-current">
        <h3>Current Plan</h3>
        {currentPlan && (
          <div className="subscription-current-plan">
            <div className="plan-header">
              <h4>{currentPlan.name}</h4>
              <span className={`status-badge status-${statusColor}`}>
                {subscription.status}
              </span>
            </div>
            {currentPlan.price > 0 && (
              <div className="plan-price">
                ${currentPlan.price}
                <span className="plan-interval">/{currentPlan.interval}</span>
              </div>
            )}
            {subscription.currentPeriodEnd && (
              <div className="plan-period">
                {subscription.cancelAtPeriodEnd ? (
                  <p className="cancel-notice">
                    <X className="icon-small" />
                    Subscription will cancel on {format(subscription.currentPeriodEnd, 'MMM dd, yyyy')}
                  </p>
                ) : (
                  <p>Renews on {format(subscription.currentPeriodEnd, 'MMM dd, yyyy')}</p>
                )}
              </div>
            )}
            {currentPlan.features && (
              <ul className="plan-features">
                {currentPlan.features.map((feature, index) => (
                  <li key={index}>
                    <Check className="icon-small" />
                    {feature}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Manage Subscription */}
      {isActive && currentPlan && currentPlan.price > 0 && (
        <div className="subscription-actions">
          <Button 
            variant="outline" 
            onClick={handleOpenCustomerPortal}
            className="manage-button"
          >
            <CreditCard className="icon-small" />
            Manage Billing
          </Button>
        </div>
      )}

      {/* Available Plans */}
      <div className="subscription-plans">
        <h3>Available Plans</h3>
        <div className="plans-grid">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
            const isUpgrade = !currentPlan || 
              (plan.price > 0 && (!currentPlan.price || plan.price > currentPlan.price));
            
            return (
              <div 
                key={plan.id} 
                className={`plan-card ${isCurrentPlan ? 'plan-current' : ''}`}
              >
                <div className="plan-card-header">
                  <h4>{plan.name}</h4>
                  {plan.price === 0 ? (
                    <div className="plan-price">Free</div>
                  ) : (
                    <div className="plan-price">
                      ${plan.price}
                      <span className="plan-interval">/{plan.interval}</span>
                    </div>
                  )}
                </div>
                <p className="plan-description">{plan.description}</p>
                <ul className="plan-features">
                  {plan.features.map((feature, index) => (
                    <li key={index}>
                      <Check className="icon-small" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {isCurrentPlan ? (
                  <Button disabled className="plan-button">
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    variant={isUpgrade ? 'default' : 'outline'}
                    className="plan-button"
                  >
                    {isUpgrade ? 'Upgrade' : 'Downgrade'} to {plan.name}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SubscriptionManagement;
