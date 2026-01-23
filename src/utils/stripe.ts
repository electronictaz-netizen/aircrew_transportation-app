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
    price: 49,
    interval: 'month',
    features: [
      'Unlimited trips',
      'All basic features',
      'Standard reports',
      'Email support',
      'Location management',
      'Custom fields',
    ],
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_ID_BASIC || '', // Set in .env.local
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
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_ID_PREMIUM || '', // Set in .env.local
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
    // @ts-ignore - Complex union type inference
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

/**
 * Trial period configuration (in days)
 */
export const TRIAL_PERIOD_DAYS = 14; // 14-day free trial

/**
 * Check if company is currently on a trial
 */
export function isTrialActive(
  isTrialActive: boolean | null | undefined,
  trialEndDate: string | null | undefined
): boolean {
  if (!isTrialActive || !trialEndDate) return false;
  
  const endDate = new Date(trialEndDate);
  const now = new Date();
  
  return now < endDate;
}

/**
 * Check if trial has expired
 */
export function isTrialExpired(
  isTrialActive: boolean | null | undefined,
  trialEndDate: string | null | undefined
): boolean {
  if (!isTrialActive || !trialEndDate) return false;
  
  const endDate = new Date(trialEndDate);
  const now = new Date();
  
  return now >= endDate;
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(
  trialEndDate: string | null | undefined
): number | null {
  if (!trialEndDate) return null;
  
  const endDate = new Date(trialEndDate);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Calculate trial end date from start date
 */
export function calculateTrialEndDate(startDate: Date = new Date()): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + TRIAL_PERIOD_DAYS);
  return endDate;
}
