import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getBookingCodeFromURL, calculatePrice, parsePricingSettings, type PricingRequest, type PricingResult } from '../utils/bookingPortalHelpers';
import { getCompanyByBookingCodeWithDetail, createBookingViaAPI, type CompanyData } from '../utils/bookingApi';
import { logger } from '../utils/logger';
import './BookingPortal.css';

interface BookingFormData {
  // Customer information
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany?: string;
  
  // Trip details
  tripType: 'Airport Trip' | 'Standard Trip';
  pickupDate: string;
  pickupTime: string;
  flightNumber?: string;
  jobNumber?: string;
  pickupLocation: string;
  dropoffLocation: string;
  numberOfPassengers: number;
  vehicleType?: string;
  isRoundTrip: boolean;
  returnDate?: string;
  returnTime?: string;
  
  // Additional
  specialInstructions?: string;
  smsOptIn: boolean;
}

export default function BookingPortal() {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<BookingFormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerCompany: '',
    tripType: 'Airport Trip',
    pickupDate: '',
    pickupTime: '',
    flightNumber: '',
    jobNumber: '',
    pickupLocation: '',
    dropoffLocation: '',
    numberOfPassengers: 1,
    vehicleType: '',
    isRoundTrip: false,
    returnDate: '',
    returnTime: '',
    specialInstructions: '',
    smsOptIn: false,
  });

  const [pricing, setPricing] = useState<PricingResult | null>(null);

  // Load company by booking code
  useEffect(() => {
    const loadCompany = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get code from URL params or query string
        const code = params.code || getBookingCodeFromURL() || searchParams.get('code');
        
        if (!code) {
          setError('Booking code is required. Please check your booking link.');
          setLoading(false);
          return;
        }

        const result = await getCompanyByBookingCodeWithDetail(code);

        if (!result.company) {
          const msg = [result.error, result.hint].filter(Boolean).join(' ') || `No booking portal found for code "${code}". Please verify your booking link.`;
          setError(msg);
          setLoading(false);
          return;
        }

        setCompany(result.company);
      } catch (err) {
        logger.error('Error loading company:', err);
        setError('Failed to load booking portal. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, [params.code, searchParams]);

  // Calculate pricing when relevant fields change
  useEffect(() => {
    if (formData.pickupLocation && formData.dropoffLocation && formData.pickupDate) {
      const pricingRequest: PricingRequest = {
        pickupLocation: formData.pickupLocation,
        dropoffLocation: formData.dropoffLocation,
        vehicleType: formData.vehicleType,
        numberOfPassengers: formData.numberOfPassengers,
        tripType: formData.isRoundTrip ? 'round-trip' : 'one-way',
        pickupDate: new Date(`${formData.pickupDate}T${formData.pickupTime}`),
      };

      // Parse pricing settings from company bookingSettings
      const pricingSettings = company ? parsePricingSettings(company.bookingSettings) : null;
      const calculatedPrice = calculatePrice(pricingRequest, pricingSettings);
      setPricing(calculatedPrice);
    }
  }, [
    formData.pickupLocation,
    formData.dropoffLocation,
    formData.vehicleType,
    formData.numberOfPassengers,
    formData.isRoundTrip,
    formData.pickupDate,
    formData.pickupTime,
    company,
  ]);

  const handleInputChange = (field: keyof BookingFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!company) {
      setError('Company information not loaded. Please refresh the page.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Combine date and time for pickup
      const pickupDateTime = new Date(`${formData.pickupDate}T${formData.pickupTime}`).toISOString();

      // Get booking code from URL
      const code = params.code || getBookingCodeFromURL() || searchParams.get('code') || '';
      
      if (!code) {
        throw new Error('Booking code not found');
      }

      // Create booking via Lambda API
      // Pass booking code (Lambda will resolve to company ID)
      const result = await createBookingViaAPI({
        companyId: code, // Lambda expects booking code here
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        customerCompany: formData.customerCompany,
        tripType: formData.tripType,
        pickupDate: pickupDateTime,
        flightNumber: formData.flightNumber,
        jobNumber: formData.jobNumber,
        pickupLocation: formData.pickupLocation,
        dropoffLocation: formData.dropoffLocation,
        numberOfPassengers: formData.numberOfPassengers,
        vehicleType: formData.vehicleType,
        isRoundTrip: formData.isRoundTrip,
        returnDate: formData.returnDate,
        returnTime: formData.returnTime,
        specialInstructions: formData.specialInstructions,
        smsOptIn: formData.smsOptIn,
      });

      if (!result.success || !result.bookingId) {
        const msg = [result.error, result.hint].filter(Boolean).join(' ');
        throw new Error(msg || 'Failed to create booking');
      }

      setBookingId(result.bookingId);
      setShowConfirmation(true);
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });

      logger.info('Booking created successfully:', { bookingId: result.bookingId, companyId: company.id });
    } catch (err) {
      logger.error('Error creating booking:', err);
      setError((err as Error)?.message || 'Failed to submit booking. Please try again or contact us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="booking-portal-container">
        <div className="booking-loading">Loading booking portal...</div>
      </div>
    );
  }

  if (error && !company) {
    return (
      <div className="booking-portal-container">
        <div className="booking-error">
          <h2>Booking Portal Not Found</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (showConfirmation && bookingId) {
    return (
      <div className="booking-portal-container">
        <div className="booking-confirmation">
          <div className="confirmation-icon">✓</div>
          <h2>Request Received</h2>
          <p>Your booking request has been submitted successfully.</p>
          <p className="booking-id">Request ID: {bookingId.substring(0, 8)}</p>
          <p className="confirmation-message">
            A manager will review your request and confirm your trip. You will be contacted once it is approved.
          </p>
          <button
            onClick={() => {
              setShowConfirmation(false);
              setFormData({
                customerName: '',
                customerEmail: '',
                customerPhone: '',
                customerCompany: '',
                tripType: 'Airport Trip',
                pickupDate: '',
                pickupTime: '',
                flightNumber: '',
                jobNumber: '',
                pickupLocation: '',
                dropoffLocation: '',
                numberOfPassengers: 1,
                vehicleType: '',
                isRoundTrip: false,
                returnDate: '',
                returnTime: '',
                specialInstructions: '',
              });
              setBookingId(null);
            }}
            className="btn btn-primary"
          >
            Book Another Trip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-portal-container">
      <div className="booking-header">
        {company?.logoUrl && (
          <img src={company.logoUrl} alt={company.displayName || company.name} className="company-logo" />
        )}
        <h1>{company?.displayName || company?.name || 'Booking Portal'}</h1>
        <p className="booking-subtitle">Book Your Transportation</p>
      </div>

      {error && (
        <div className="booking-error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="booking-form">
        {/* Customer Information */}
        <section className="form-section">
          <h2>Your Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="customerName">Full Name *</label>
              <input
                type="text"
                id="customerName"
                required
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="customerEmail">Email *</label>
              <input
                type="email"
                id="customerEmail"
                required
                value={formData.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="customerPhone">Phone *</label>
              <input
                type="tel"
                id="customerPhone"
                required
                value={formData.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="customerCompany">Company (Optional)</label>
              <input
                type="text"
                id="customerCompany"
                value={formData.customerCompany}
                onChange={(e) => handleInputChange('customerCompany', e.target.value)}
              />
            </div>
            <div className="form-group form-group-full">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.smsOptIn}
                  onChange={(e) => handleInputChange('smsOptIn', e.target.checked)}
                  aria-describedby="sms-opt-in-desc"
                />
                <span className="checkbox-text">
                  I agree to receive SMS notifications about my trip (booking confirmations, reminders, driver updates). Reply STOP to opt out at any time.
                </span>
              </label>
              <span id="sms-opt-in-desc" className="form-hint">Optional. We'll send a text to your phone when your booking is received and for trip updates.</span>
            </div>
          </div>
        </section>

        {/* Trip Type */}
        <section className="form-section">
          <h2>Trip Details</h2>
          <div className="form-group">
            <label htmlFor="tripType">Trip Type *</label>
            <select
              id="tripType"
              required
              value={formData.tripType}
              onChange={(e) => handleInputChange('tripType', e.target.value as 'Airport Trip' | 'Standard Trip')}
            >
              <option value="Airport Trip">Airport Trip</option>
              <option value="Standard Trip">Standard Trip</option>
            </select>
          </div>

          {formData.tripType === 'Airport Trip' ? (
            <div className="form-group">
              <label htmlFor="flightNumber">Flight Number *</label>
              <input
                type="text"
                id="flightNumber"
                required={formData.tripType === 'Airport Trip'}
                value={formData.flightNumber}
                onChange={(e) => handleInputChange('flightNumber', e.target.value)}
                placeholder="e.g., AA1234"
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="jobNumber">Job/PO Number *</label>
              <input
                type="text"
                id="jobNumber"
                required={formData.tripType === 'Standard Trip'}
                value={formData.jobNumber}
                onChange={(e) => handleInputChange('jobNumber', e.target.value)}
              />
            </div>
          )}

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="pickupDate">Pickup Date *</label>
              <input
                type="date"
                id="pickupDate"
                required
                value={formData.pickupDate}
                onChange={(e) => handleInputChange('pickupDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="form-group">
              <label htmlFor="pickupTime">Pickup Time *</label>
              <input
                type="time"
                id="pickupTime"
                required
                value={formData.pickupTime}
                onChange={(e) => handleInputChange('pickupTime', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Locations */}
        <section className="form-section">
          <h2>Locations</h2>
          <div className="form-group">
            <label htmlFor="pickupLocation">Pickup Location *</label>
            <input
              type="text"
              id="pickupLocation"
              required
              value={formData.pickupLocation}
              onChange={(e) => handleInputChange('pickupLocation', e.target.value)}
              placeholder="Enter pickup address"
            />
          </div>
          <div className="form-group">
            <label htmlFor="dropoffLocation">Dropoff Location *</label>
            <input
              type="text"
              id="dropoffLocation"
              required
              value={formData.dropoffLocation}
              onChange={(e) => handleInputChange('dropoffLocation', e.target.value)}
              placeholder="Enter dropoff address"
            />
          </div>
        </section>

        {/* Additional Details */}
        <section className="form-section">
          <h2>Additional Details</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="numberOfPassengers">Number of Passengers *</label>
              <input
                type="number"
                id="numberOfPassengers"
                required
                min="1"
                max="50"
                value={formData.numberOfPassengers}
                onChange={(e) => handleInputChange('numberOfPassengers', parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="vehicleType">Vehicle Type (Optional)</label>
              <select
                id="vehicleType"
                value={formData.vehicleType}
                onChange={(e) => handleInputChange('vehicleType', e.target.value)}
              >
                <option value="">Any Available</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Van">Van</option>
                <option value="Limo">Limo</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isRoundTrip}
                onChange={(e) => handleInputChange('isRoundTrip', e.target.checked)}
              />
              Round Trip
            </label>
          </div>

          {formData.isRoundTrip && (
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="returnDate">Return Date</label>
                <input
                  type="date"
                  id="returnDate"
                  value={formData.returnDate}
                  onChange={(e) => handleInputChange('returnDate', e.target.value)}
                  min={formData.pickupDate || new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="form-group">
                <label htmlFor="returnTime">Return Time</label>
                <input
                  type="time"
                  id="returnTime"
                  value={formData.returnTime}
                  onChange={(e) => handleInputChange('returnTime', e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="specialInstructions">Special Instructions (Optional)</label>
            <textarea
              id="specialInstructions"
              rows={4}
              value={formData.specialInstructions}
              onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
              placeholder="Any special requests or instructions..."
            />
          </div>
        </section>

        {/* Pricing Estimate */}
        {pricing && formData.pickupLocation && formData.dropoffLocation && (
          <section className="form-section pricing-section">
            <h2>Estimated Price</h2>
            <div className="pricing-display">
              <div className="pricing-line">
                <span>Base Price:</span>
                <span>${pricing.basePrice.toFixed(2)}</span>
              </div>
              {pricing.vehicleSurcharge > 0 && (
                <div className="pricing-line">
                  <span>Vehicle Surcharge:</span>
                  <span>${pricing.vehicleSurcharge.toFixed(2)}</span>
                </div>
              )}
              {pricing.passengerSurcharge && pricing.passengerSurcharge > 0 && (
                <div className="pricing-line">
                  <span>Passenger Surcharge:</span>
                  <span>${pricing.passengerSurcharge.toFixed(2)}</span>
                </div>
              )}
              {pricing.roundTripDiscount > 0 && (
                <div className="pricing-line discount">
                  <span>Round Trip Discount:</span>
                  <span>-${pricing.roundTripDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="pricing-total">
                <span>Estimated Total:</span>
                <span>${pricing.totalPrice.toFixed(2)}</span>
              </div>
              <p className="pricing-note">* Final price may vary based on actual distance and time</p>
            </div>
          </section>
        )}

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary btn-large"
          >
            {submitting ? 'Submitting...' : 'Submit Booking'}
          </button>
        </div>
      </form>
    </div>
  );
}
