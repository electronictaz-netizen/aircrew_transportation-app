/**
 * Stripe API Utilities
 * Helper functions for interacting with Stripe API
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId: string; // Stripe Price ID for this plan
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    interval: 'month',
    features: [
      'Up to 10 trips per month',
      'Basic trip management',
      'Driver management',
      'Basic reports',
    ],
    stripePriceId: '', // No Stripe price for free tier
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'For small teams',
    price: 29,
    interval: 'month',
    features: [
      'Unlimited trips',
      'All basic features',
      'Standard reports',
      'Email support',
      'Location management',
      'Custom fields',
    ],
    stripePriceId: process.env.VITE_STRIPE_PRICE_ID_BASIC || '', // Set in environment
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'For growing businesses',
    price: 99,
    interval: 'month',
    features: [
      'Everything in Basic',
      'Advanced reports',
      'Flight status API integration',
      'Custom report configurations',
      'Priority support',
      'Advanced analytics',
    ],
    stripePriceId: process.env.VITE_STRIPE_PRICE_ID_PREMIUM || '', // Set in environment
  },
];

/**
 * Get subscription plan by ID
 */
export function getSubscriptionPlan(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
}

/**
 * Get current subscription plan for a company
 */
export async function getCompanySubscription(companyId: string): Promise<{
  plan: SubscriptionPlan | undefined;
  status: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
} | null> {
  try {
    const { data: company } = await client.models.Company.get({ id: companyId });
    if (!company) return null;

    const plan = getSubscriptionPlan(company.subscriptionTier || 'free');
    return {
      plan,
      status: company.subscriptionStatus || 'active',
      currentPeriodEnd: company.subscriptionCurrentPeriodEnd ? new Date(company.subscriptionCurrentPeriodEnd) : null,
      cancelAtPeriodEnd: company.subscriptionCancelAtPeriodEnd || false,
    };
  } catch (error) {
    console.error('Error getting company subscription:', error);
    return null;
  }
}

/**
 * Check if company has active subscription
 */
export function isSubscriptionActive(subscriptionStatus: string | null | undefined): boolean {
  return subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
}

/**
 * Check if company has feature access based on subscription tier
 */
export function hasFeatureAccess(
  subscriptionTier: string | null | undefined,
  feature: string
): boolean {
  const tier = subscriptionTier || 'free';
  
  // Feature mapping
  const featureAccess: Record<string, string[]> = {
    free: ['basic_trips', 'driver_management', 'basic_reports'],
    basic: ['basic_trips', 'driver_management', 'basic_reports', 'unlimited_trips', 'custom_fields', 'location_management'],
    premium: ['basic_trips', 'driver_management', 'basic_reports', 'unlimited_trips', 'custom_fields', 'location_management', 'flight_status_api', 'advanced_reports', 'custom_report_config'],
  };

  return featureAccess[tier]?.includes(feature) || false;
}

/**
 * Get subscription status badge color
 */
export function getSubscriptionStatusColor(status: string | null | undefined): string {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'green';
    case 'past_due':
      return 'yellow';
    case 'canceled':
    case 'unpaid':
      return 'red';
    default:
      return 'gray';
  }
}
