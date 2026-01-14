import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

interface CompanyContextType {
  company: Schema['Company']['type'] | null;
  companyId: string | null;
  loading: boolean;
  refreshCompany: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType>({
  company: null,
  companyId: null,
  loading: true,
  refreshCompany: async () => {},
});

const client = generateClient<Schema>();

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthenticator();
  const [company, setCompany] = useState<Schema['Company']['type'] | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserCompany = async () => {
    if (!user?.userId) {
      setCompany(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Find CompanyUser record for this user
      const { data: companyUsers } = await client.models.CompanyUser.list({
        filter: { 
          userId: { eq: user.userId },
          isActive: { eq: true }
        }
      });

      if (companyUsers && companyUsers.length > 0) {
        const companyUser = companyUsers[0];
        
        // Load the company
        const { data: companyData } = await client.models.Company.get({
          id: companyUser.companyId
        });

        if (companyData && companyData.isActive) {
          setCompany(companyData);
        } else {
          setCompany(null);
        }
      } else {
        // No company found - try to create default GLS company or assign user to it
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
            setCompany(companyData);
          }
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
      // Try to find existing GLS company
      const { data: companies } = await client.models.Company.list({
        filter: { name: { eq: 'GLS' } }
      });

      let glsCompany: Schema['Company']['type'] | null = null;

      if (companies && companies.length > 0) {
        glsCompany = companies[0];
      } else {
        // Create GLS company if it doesn't exist
        const { data: newCompany } = await client.models.Company.create({
          name: 'GLS',
          subdomain: 'gls',
          isActive: true,
          subscriptionTier: 'premium',
          subscriptionStatus: 'active',
        });
        glsCompany = newCompany;
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
          // Create CompanyUser record
          await client.models.CompanyUser.create({
            companyId: glsCompany.id,
            userId: userId,
            email: email,
            role: 'admin',
            isActive: true,
          });
        }
      }
    } catch (error) {
      console.error('Error ensuring default company:', error);
    }
  };

  useEffect(() => {
    loadUserCompany();
  }, [user?.userId]);

  return (
    <CompanyContext.Provider
      value={{
        company,
        companyId: company?.id || null,
        loading,
        refreshCompany: loadUserCompany,
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
