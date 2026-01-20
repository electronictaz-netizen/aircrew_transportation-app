import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useAdminAccess, isSystemAdmin } from '../utils/adminAccess';
import { updateAppIcons } from '../utils/dynamicIcons';
import { calculateTrialEndDate, isTrialExpired } from '../utils/stripe';

interface CompanyContextType {
  company: Schema['Company']['type'] | null;
  companyId: string | null;
  loading: boolean;
  userRole: 'admin' | 'manager' | 'driver' | null;
  refreshCompany: () => Promise<void>;
  setAdminSelectedCompany: (companyId: string | null) => void;
  isAdminOverride: boolean;
}

const CompanyContext = createContext<CompanyContextType>({
  company: null,
  companyId: null,
  loading: true,
  userRole: null,
  refreshCompany: async () => {},
  setAdminSelectedCompany: () => {},
  isAdminOverride: false,
});

const client = generateClient<Schema>();

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthenticator();
  const hasAdminAccess = useAdminAccess();
  const [company, setCompany] = useState<Schema['Company']['type'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'manager' | 'driver' | null>(null);
  const [adminSelectedCompanyId, setAdminSelectedCompanyId] = useState<string | null>(null);

  const loadUserCompany = async () => {
    if (!user?.userId) {
      setCompany(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // If system admin has manually selected a company, use that
      if (hasAdminAccess && adminSelectedCompanyId) {
        const { data: selectedCompany } = await client.models.Company.get({
          id: adminSelectedCompanyId
        });
        if (selectedCompany) {
          setCompany(selectedCompany);
          // Update app icons with company logo
          updateAppIcons(selectedCompany.logoUrl || null, selectedCompany.displayName || selectedCompany.name);
          setLoading(false);
          return;
        }
      }
      
      // Find CompanyUser record for this user
      // First check for active users
      let { data: companyUsers } = await client.models.CompanyUser.list({
        filter: { 
          userId: { eq: user.userId },
          isActive: { eq: true }
        }
      });
      
      // Filter out system admins from company user lookup
      if (companyUsers && companyUsers.length > 0) {
        companyUsers = companyUsers.filter(
          cu => !isSystemAdmin(cu.email, cu.userId)
        );
      }

      // If no active user found, check for pending invitations by email
      if (!companyUsers || companyUsers.length === 0) {
        const userEmail = user.signInDetails?.loginId || user.username;
        if (userEmail) {
          const { data: pendingInvites } = await client.models.CompanyUser.list({
            filter: { 
              email: { eq: userEmail.toLowerCase().trim() },
              isActive: { eq: false }
            }
          });
          
          // Filter for pending invitations (userId is 'pending' or matches pattern)
          const actualPending = pendingInvites?.filter(
            invite => invite.userId === 'pending' || !invite.userId || invite.userId === ''
          );

          // If found pending invite, activate it and link user
          if (actualPending && actualPending.length > 0) {
            const invite = actualPending[0];
            try {
              await client.models.CompanyUser.update({
                id: invite.id,
                userId: user.userId,
                isActive: true,
              });
              console.log('✅ Activated pending invitation for user');
              // Reload to get the updated record
              const { data: updated } = await client.models.CompanyUser.list({
                filter: { 
                  userId: { eq: user.userId },
                  isActive: { eq: true }
                }
              });
              companyUsers = updated;
            } catch (error) {
              console.error('Error activating invitation:', error);
            }
          }
        }
      }

      if (companyUsers && companyUsers.length > 0) {
        const companyUser = companyUsers[0];
        
        // Set user role
        const role = (companyUser.role || 'driver') as 'admin' | 'manager' | 'driver';
        setUserRole(role);
        
        // Load the company
        const { data: companyData } = await client.models.Company.get({
          id: companyUser.companyId
        });

        if (companyData && companyData.isActive) {
          // Check if user came from trial signup and company doesn't have trial set up
          const urlParams = new URLSearchParams(window.location.search);
          const isTrialSignup = urlParams.get('trial') === 'true';
          
          if (isTrialSignup && !companyData.isTrialActive && !companyData.trialEndDate) {
            // Set up trial period
            try {
              const trialEndDate = calculateTrialEndDate();
              await client.models.Company.update({
                id: companyData.id,
                isTrialActive: true,
                trialEndDate: trialEndDate.toISOString(),
                subscriptionStatus: 'trialing',
                subscriptionTier: 'basic', // Give them Basic tier features during trial
              });
              
              // Reload company to get updated data
              const { data: updatedCompany } = await client.models.Company.get({
                id: companyData.id
              });
              
              if (updatedCompany) {
                setCompany(updatedCompany);
                updateAppIcons(updatedCompany.logoUrl || null, updatedCompany.displayName || updatedCompany.name);
                // Remove trial parameter from URL
                urlParams.delete('trial');
                window.history.replaceState({}, '', `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`);
                return;
              }
            } catch (error) {
              console.error('Error setting up trial:', error);
            }
          }
          
          // Check if trial has expired and downgrade if needed
          if (companyData.isTrialActive && isTrialExpired(companyData.isTrialActive, companyData.trialEndDate)) {
            // Trial has expired - downgrade to Free tier
            try {
              await client.models.Company.update({
                id: companyData.id,
                isTrialActive: false,
                subscriptionStatus: 'active',
                subscriptionTier: 'free', // Downgrade to Free tier
              });
              
              // Reload company to get updated data
              const { data: updatedCompany } = await client.models.Company.get({
                id: companyData.id
              });
              
              if (updatedCompany) {
                setCompany(updatedCompany);
                updateAppIcons(updatedCompany.logoUrl || null, updatedCompany.displayName || updatedCompany.name);
                return;
              }
            } catch (error) {
              console.error('Error downgrading expired trial:', error);
            }
          }
          
          setCompany(companyData);
          // Update app icons with company logo
          updateAppIcons(companyData.logoUrl || null, companyData.displayName || companyData.name);
        } else {
          setCompany(null);
          // Reset to default icons
          updateAppIcons(null);
        }
      } else {
        // No company found - try to create default GLS company or assign user to it
        console.log('⚠️ No CompanyUser found, attempting to create default company...');
        try {
          await ensureDefaultCompany(user.userId, user.signInDetails?.loginId || '');
          // Retry loading
          const { data: retryCompanyUsers } = await client.models.CompanyUser.list({
            filter: { 
              userId: { eq: user.userId },
              isActive: { eq: true }
            }
          });
          if (retryCompanyUsers && retryCompanyUsers.length > 0) {
            const { data: companyData } = await client.models.Company.get({
              id: retryCompanyUsers[0].companyId
            });
            if (companyData) {
              console.log('✅ Successfully loaded company after creation:', companyData.name);
              setCompany(companyData);
              // Update app icons with company logo
              updateAppIcons(companyData.logoUrl || null, companyData.displayName || companyData.name);
            } else {
              console.error('❌ Company data not found after creating CompanyUser');
            }
          } else {
            console.error('❌ CompanyUser still not found after ensureDefaultCompany');
          }
        } catch (error: any) {
          console.error('❌ Failed to ensure default company:', error);
          // Show user-friendly error
          console.error('Please check:');
          console.error('1. Is the schema deployed? (Company model must exist)');
          console.error('2. Do you have permission to create companies?');
          console.error('3. Check browser console for detailed errors');
        }
      }
    } catch (error) {
      console.error('Error loading company:', error);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  const ensureDefaultCompany = async (userId: string, email: string) => {
    try {
      console.log('🔍 Ensuring default company for user:', userId, email);
      
      // Try to find existing GLS company (try both 'GLS' and 'GLS Transportation')
      const { data: companiesGLS } = await client.models.Company.list({
        filter: { name: { eq: 'GLS' } }
      });
      
      const { data: companiesGLSTransport } = await client.models.Company.list({
        filter: { name: { eq: 'GLS Transportation' } }
      });

      let glsCompany: Schema['Company']['type'] | null = null;

      // Check for existing company (either name)
      if (companiesGLS && companiesGLS.length > 0) {
        glsCompany = companiesGLS[0];
        console.log('✅ Found existing GLS company:', glsCompany.id);
      } else if (companiesGLSTransport && companiesGLSTransport.length > 0) {
        glsCompany = companiesGLSTransport[0];
        console.log('✅ Found existing GLS Transportation company:', glsCompany.id);
      } else {
        // Create GLS company if it doesn't exist
        console.log('📝 Creating new GLS company...');
        try {
          const { data: newCompany, errors: createErrors } = await client.models.Company.create({
            name: 'GLS Transportation',
            subdomain: 'gls',
            isActive: true,
            subscriptionTier: 'premium',
            subscriptionStatus: 'active',
          });
          
          if (createErrors && createErrors.length > 0) {
            console.error('❌ Company creation errors:', createErrors);
            throw new Error(`Failed to create company: ${createErrors.map(e => e.message).join(', ')}`);
          }
          
          if (!newCompany) {
            throw new Error('Company creation returned no data');
          }
          
          glsCompany = newCompany;
          console.log('✅ Created GLS Transportation company:', glsCompany.id);
        } catch (createError: any) {
          console.error('❌ Failed to create company:', createError);
          // If creation fails, try to list all companies to see what's available
          const { data: allCompanies } = await client.models.Company.list();
          console.log('Available companies:', allCompanies);
          throw createError;
        }
      }

      if (glsCompany) {
        // Check if CompanyUser already exists
        const { data: existingUsers } = await client.models.CompanyUser.list({
          filter: { 
            companyId: { eq: glsCompany.id },
            userId: { eq: userId }
          }
        });

        if (!existingUsers || existingUsers.length === 0) {
          console.log('📝 Creating CompanyUser record...');
          try {
            const { data: newUser, errors: userErrors } = await client.models.CompanyUser.create({
              companyId: glsCompany.id,
              userId: userId,
              email: email,
              role: 'admin',
              isActive: true,
            });
            
            if (userErrors && userErrors.length > 0) {
              console.error('❌ CompanyUser creation errors:', userErrors);
              throw new Error(`Failed to create CompanyUser: ${userErrors.map(e => e.message).join(', ')}`);
            }
            
            console.log('✅ Created CompanyUser record:', newUser?.id);
          } catch (userError: any) {
            console.error('❌ Failed to create CompanyUser:', userError);
            throw userError;
          }
        } else {
          console.log('✅ CompanyUser record already exists');
        }
      } else {
        console.error('❌ No company available to associate user with');
      }
    } catch (error: any) {
      console.error('❌ Error ensuring default company:', error);
      console.error('Error details:', {
        message: error?.message,
        errors: error?.errors,
        stack: error?.stack
      });
      // Re-throw to allow caller to handle
      throw error;
    }
  };

  const setAdminSelectedCompany = (companyId: string | null) => {
    setAdminSelectedCompanyId(companyId);
    // Store in localStorage for persistence
    if (companyId) {
      localStorage.setItem('adminSelectedCompanyId', companyId);
    } else {
      localStorage.removeItem('adminSelectedCompanyId');
    }
    // Reload company
    loadUserCompany();
  };

  useEffect(() => {
    // Load admin-selected company from localStorage if system admin
    if (hasAdminAccess) {
      const stored = localStorage.getItem('adminSelectedCompanyId');
      if (stored && !adminSelectedCompanyId) {
        setAdminSelectedCompanyId(stored);
      }
    }
  }, [hasAdminAccess]);

  useEffect(() => {
    loadUserCompany();
  }, [user?.userId, adminSelectedCompanyId]);

  return (
    <CompanyContext.Provider
      value={{
        company,
        companyId: company?.id || null,
        loading,
        userRole,
        refreshCompany: loadUserCompany,
        setAdminSelectedCompany,
        isAdminOverride: hasAdminAccess && adminSelectedCompanyId !== null,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within CompanyProvider');
  }
  return context;
};
