import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getCompanyByBookingCodeWithDetail, type CompanyData } from '../utils/bookingApi';
import { logger } from '../utils/logger';
import CustomerPortal from './CustomerPortal';
import { PageSkeleton } from './ui/skeleton-loaders';

export default function CustomerPortalWrapper() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get code from URL params or query string
        const code = params.code || searchParams.get('code');
        
        if (!code) {
          setError('Company code is required. Please check your customer portal link.');
          setLoading(false);
          return;
        }

        const result = await getCompanyByBookingCodeWithDetail(code);

        if (!result.company) {
          const msg = result.error || `No customer portal found for code "${code}". Please verify your link.`;
          setError(msg);
          setLoading(false);
          return;
        }

        setCompany(result.company);
      } catch (err) {
        logger.error('Error loading company for customer portal:', err);
        setError('Failed to load customer portal. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, [params.code, searchParams]);

  if (loading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h2>Unable to Load Customer Portal</h2>
        <p style={{ color: '#dc2626', marginTop: '1rem' }}>{error}</p>
        <p style={{ marginTop: '1rem', color: '#6b7280' }}>
          Please contact your transportation provider for assistance.
        </p>
      </div>
    );
  }

  if (!company) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h2>Company Not Found</h2>
        <p style={{ color: '#6b7280', marginTop: '1rem' }}>
          Please verify your customer portal link.
        </p>
      </div>
    );
  }

  return <CustomerPortal companyId={company.id} />;
}
