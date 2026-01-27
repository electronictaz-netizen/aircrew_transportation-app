import { useState, useEffect } from 'react';
import type { Schema } from '../../amplify/data/resource';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import LoadingButton from './LoadingButton';
import { showSuccess } from '../utils/toast';
import { useNotification } from './Notification';
import NotificationComponent from './Notification';
import { generateReceipt } from '../utils/receiptGenerator';
import { findCustomer, verifyAccessCode, getCustomerTrips, createModificationRequest, createTripRating } from '../utils/customerPortalApi';
import './CustomerPortal.css';

interface CustomerPortalProps {
  companyId: string;
  customerId?: string; // If provided, skip login
}

function CustomerPortal({ companyId, customerId: initialCustomerId }: CustomerPortalProps) {
  const { notification, showError, hideNotification } = useNotification();
  const [authenticated, setAuthenticated] = useState(!!initialCustomerId);
  const [customer, setCustomer] = useState<Schema['Customer']['type'] | null>(null);
  const [trips, setTrips] = useState<Array<Schema['Trip']['type']>>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'upcoming' | 'history'>('upcoming');
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [showLogin, setShowLogin] = useState(!initialCustomerId);
  const [verifyingCode, setVerifyingCode] = useState(false);
  
  // Trip modification request state
  const [showModificationDialog, setShowModificationDialog] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Schema['Trip']['type'] | null>(null);
  const [modificationType, setModificationType] = useState<'date' | 'time' | 'location' | 'passengers' | 'other'>('date');
  const [modificationReason, setModificationReason] = useState('');
  const [modificationDetails, setModificationDetails] = useState('');
  
  // Trip rating state
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [tripToRate, setTripToRate] = useState<Schema['Trip']['type'] | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [driverRating, setDriverRating] = useState<number>(5);
  const [vehicleRating, setVehicleRating] = useState<number>(5);
  const [review, setReview] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(true);

  useEffect(() => {
    if (authenticated && customer && companyId) {
      loadTrips();
    }
  }, [authenticated, customer, view, companyId]);

  const handleLogin = async () => {
    if (!loginEmail.trim() && !loginPhone.trim()) {
      showError('Please enter your email or phone number');
      return;
    }

    setLoading(true);
    try {
      const result = await findCustomer(companyId, loginEmail.trim() || undefined, loginPhone.trim() || undefined);

      if (!result.success || !result.customerId) {
        showError(result.error || 'No account found. Please contact your transportation provider.');
        setLoading(false);
        return;
      }

      // Store customer ID and access code for verification
      setCustomer({ id: result.customerId } as Schema['Customer']['type']);
      setVerifyingCode(true);
      
      if (result.accessCode) {
        // In production, code would be sent via email/SMS
        // For testing, show it (remove in production!)
        showSuccess(`Access code: ${result.accessCode} (for testing - check email/SMS in production)`);
      } else {
        showSuccess(result.message || 'Access code sent! Please check your email or phone.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      showError('Failed to process login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!customer || !loginCode.trim()) {
      showError('Please enter the access code');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyAccessCode(companyId, customer.id, loginCode.trim());

      if (!result.success || !result.customer) {
        showError(result.error || 'Invalid access code. Please try again.');
        setLoading(false);
        return;
      }

      // Set authenticated customer
      setCustomer(result.customer as Schema['Customer']['type']);
      setAuthenticated(true);
      setShowLogin(false);
      setVerifyingCode(false);
      showSuccess('Login successful!');
    } catch (error) {
      console.error('Error verifying code:', error);
      showError('Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadTrips = async () => {
    if (!customer || !companyId) return;

    setLoading(true);
    try {
      const result = await getCustomerTrips(companyId, customer.id, view);

      if (!result.success || !result.trips) {
        showError(result.error || 'Failed to load trips');
        setTrips([]);
        setLoading(false);
        return;
      }

      // Sort by pickup date
      const sortedTrips = (result.trips || []).sort((a, b) => {
        const dateA = a.pickupDate ? new Date(a.pickupDate).getTime() : 0;
        const dateB = b.pickupDate ? new Date(b.pickupDate).getTime() : 0;
        return view === 'upcoming' ? dateA - dateB : dateB - dateA;
      });

      setTrips(sortedTrips as Array<Schema['Trip']['type']>);
    } catch (error) {
      console.error('Error loading trips:', error);
      showError('Failed to load trips');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (trip: Schema['Trip']['type']) => {
    try {
      const receipt = await generateReceipt(trip, customer!);
      const blob = new Blob([receipt], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${trip.id}-${format(new Date(), 'yyyy-MM-dd')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showSuccess('Receipt downloaded!');
    } catch (error) {
      console.error('Error generating receipt:', error);
      showError('Failed to generate receipt. Please try again.');
    }
  };

  const handleRequestModification = async () => {
    if (!selectedTrip || !customer || !modificationReason.trim() || !modificationDetails.trim()) {
      showError('Please provide details and reason for the modification request');
      return;
    }

    setLoading(true);
    try {
      const requestedChanges = {
        type: modificationType,
        details: modificationDetails,
        originalTrip: {
          pickupDate: selectedTrip.pickupDate,
          pickupLocation: selectedTrip.pickupLocation,
          dropoffLocation: selectedTrip.dropoffLocation,
          numberOfPassengers: selectedTrip.numberOfPassengers,
        },
      };

      const result = await createModificationRequest(
        companyId,
        customer.id,
        selectedTrip.id,
        modificationType,
        requestedChanges,
        modificationReason
      );

      if (!result.success) {
        showError(result.error || 'Failed to submit request. Please try again.');
        return;
      }

      showSuccess('Modification request submitted! We will review and contact you soon.');
      setShowModificationDialog(false);
      setSelectedTrip(null);
      setModificationReason('');
      setModificationDetails('');
    } catch (error) {
      console.error('Error submitting modification request:', error);
      showError('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!tripToRate || !customer) {
      return;
    }

    setLoading(true);
    try {
      const result = await createTripRating(
        companyId,
        customer.id,
        tripToRate.id,
        rating,
        driverRating,
        vehicleRating,
        review.trim() || undefined,
        wouldRecommend
      );

      if (!result.success) {
        showError(result.error || 'Failed to submit rating. Please try again.');
        return;
      }

      showSuccess('Thank you for your feedback!');
      setShowRatingDialog(false);
      setTripToRate(null);
      setRating(5);
      setDriverRating(5);
      setVehicleRating(5);
      setReview('');
      setWouldRecommend(true);
    } catch (error) {
      console.error('Error submitting rating:', error);
      showError('Failed to submit rating. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showLogin && !authenticated) {
    return (
      <div className="customer-portal">
        <NotificationComponent notification={notification} onClose={hideNotification} />
        <div className="portal-login">
          <div className="portal-login-card">
            <h2>Customer Portal Login</h2>
            <p>Enter your email or phone number to access your trips</p>
            
            {!verifyingCode ? (
              <div className="login-form">
                <div className="form-group">
                  <label>Email Address</label>
                  <Input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="your.email@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <Input
                    type="tel"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <LoadingButton
                  onClick={handleLogin}
                  isLoading={loading}
                  disabled={loading || (!loginEmail.trim() && !loginPhone.trim())}
                >
                  Continue
                </LoadingButton>
              </div>
            ) : (
              <div className="verify-code-form">
                <p>We've sent an access code to your email/phone. Please enter it below:</p>
                <div className="form-group">
                  <label>Access Code</label>
                  <Input
                    type="text"
                    value={loginCode}
                    onChange={(e) => setLoginCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                  />
                </div>
                <div className="form-actions">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setVerifyingCode(false);
                      setLoginCode('');
                    }}
                  >
                    Back
                  </Button>
                  <LoadingButton
                    onClick={handleVerifyCode}
                    isLoading={loading}
                    disabled={loading || !loginCode.trim()}
                  >
                    Verify Code
                  </LoadingButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return <div className="customer-portal">Loading...</div>;
  }

  return (
    <div className="customer-portal">
      <NotificationComponent notification={notification} onClose={hideNotification} />
      
      <div className="portal-header">
        <div>
          <h1>Welcome, {customer.name}!</h1>
          <p>Manage your trips and view your history</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setAuthenticated(false);
            setCustomer(null);
            setShowLogin(true);
            setLoginEmail('');
            setLoginPhone('');
            setLoginCode('');
          }}
        >
          Sign Out
        </Button>
      </div>

      <div className="portal-tabs">
        <button
          className={`tab ${view === 'upcoming' ? 'active' : ''}`}
          onClick={() => setView('upcoming')}
        >
          Upcoming Trips ({trips.filter(t => t.pickupDate && new Date(t.pickupDate) >= new Date()).length})
        </button>
        <button
          className={`tab ${view === 'history' ? 'active' : ''}`}
          onClick={() => setView('history')}
        >
          Trip History ({trips.filter(t => t.pickupDate && new Date(t.pickupDate) < new Date()).length})
        </button>
      </div>

      {loading && trips.length === 0 ? (
        <div className="loading-state">Loading trips...</div>
      ) : trips.length === 0 ? (
        <div className="empty-state">
          <p>No {view === 'upcoming' ? 'upcoming' : 'past'} trips found.</p>
        </div>
      ) : (
        <div className="trips-list">
          {trips.map((trip) => (
            <div key={trip.id} className="trip-card">
              <div className="trip-card-header">
                <div>
                  <h3>
                    {trip.flightNumber || 'Standard Trip'}
                    {trip.status && (
                      <span className={`status-badge status-${trip.status.toLowerCase()}`}>
                        {trip.status}
                      </span>
                    )}
                  </h3>
                  {trip.pickupDate && (
                    <p className="trip-date">
                      {format(new Date(trip.pickupDate), 'EEEE, MMMM dd, yyyy')} at{' '}
                      {format(new Date(trip.pickupDate), 'h:mm a')}
                    </p>
                  )}
                </div>
              </div>

              <div className="trip-card-details">
                <div className="detail-row">
                  <span className="detail-label">Pickup:</span>
                  <span className="detail-value">{trip.pickupLocation}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Dropoff:</span>
                  <span className="detail-value">{trip.dropoffLocation}</span>
                </div>
                {trip.numberOfPassengers && (
                  <div className="detail-row">
                    <span className="detail-label">Passengers:</span>
                    <span className="detail-value">{trip.numberOfPassengers}</span>
                  </div>
                )}
                {trip.driverId && (
                  <div className="detail-row">
                    <span className="detail-label">Driver:</span>
                    <span className="detail-value">Assigned</span>
                  </div>
                )}
              </div>

              <div className="trip-card-actions">
                {view === 'history' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadReceipt(trip)}
                    >
                      📄 Download Receipt
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setTripToRate(trip);
                        setShowRatingDialog(true);
                      }}
                    >
                      ⭐ Rate Trip
                    </Button>
                  </>
                )}
                {view === 'upcoming' && trip.status !== 'Completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedTrip(trip);
                      setShowModificationDialog(true);
                    }}
                  >
                    ✏️ Request Changes
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modification Request Dialog */}
      <Dialog open={showModificationDialog} onOpenChange={setShowModificationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Trip Modification</DialogTitle>
            <DialogDescription>
              Request changes to your upcoming trip. We'll review and contact you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                What would you like to change? *
              </label>
              <Select value={modificationType} onValueChange={(value) => setModificationType(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="time">Time</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="passengers">Number of Passengers</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Details *
              </label>
              <Textarea
                value={modificationDetails}
                onChange={(e) => setModificationDetails(e.target.value)}
                placeholder="Describe the changes you'd like..."
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Reason *
              </label>
              <Textarea
                value={modificationReason}
                onChange={(e) => setModificationReason(e.target.value)}
                placeholder="Why do you need this change?"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowModificationDialog(false);
                setSelectedTrip(null);
                setModificationReason('');
                setModificationDetails('');
              }}
            >
              Cancel
            </Button>
            <LoadingButton
              onClick={handleRequestModification}
              isLoading={loading}
              disabled={!modificationReason.trim() || !modificationDetails.trim()}
            >
              Submit Request
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Your Trip</DialogTitle>
            <DialogDescription>
              Help us improve by rating your experience
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Overall Rating *
              </label>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star ${star <= rating ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>
            {tripToRate?.driverId && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Driver Rating
                </label>
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star ${star <= driverRating ? 'active' : ''}`}
                      onClick={() => setDriverRating(star)}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">
                Review (Optional)
              </label>
              <Textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="wouldRecommend"
                checked={wouldRecommend}
                onChange={(e) => setWouldRecommend(e.target.checked)}
              />
              <label htmlFor="wouldRecommend" className="text-sm cursor-pointer">
                I would recommend this service
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRatingDialog(false);
                setTripToRate(null);
              }}
            >
              Cancel
            </Button>
            <LoadingButton
              onClick={handleSubmitRating}
              isLoading={loading}
            >
              Submit Rating
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CustomerPortal;
