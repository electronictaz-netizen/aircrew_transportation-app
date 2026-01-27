/**
 * Receipt/Invoice Generator
 * Generates HTML receipts for trips that customers can download
 */

import type { Schema } from '../../amplify/data/resource';
import { format } from 'date-fns';

export async function generateReceipt(
  trip: Schema['Trip']['type'],
  customer: Schema['Customer']['type']
): Promise<string> {
  const tripDate = trip.pickupDate ? format(new Date(trip.pickupDate), 'MMMM dd, yyyy') : 'N/A';
  const tripTime = trip.pickupDate ? format(new Date(trip.pickupDate), 'h:mm a') : 'N/A';
  const actualPickup = trip.actualPickupTime ? format(new Date(trip.actualPickupTime), 'MMMM dd, yyyy h:mm a') : 'N/A';
  const actualDropoff = trip.actualDropoffTime ? format(new Date(trip.actualDropoffTime), 'MMMM dd, yyyy h:mm a') : 'N/A';

  const receiptHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - ${trip.flightNumber || 'Trip'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            padding: 2rem;
        }
        .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 3rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .receipt-header {
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 1.5rem;
            margin-bottom: 2rem;
        }
        .receipt-header h1 {
            color: #1f2937;
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        .receipt-header p {
            color: #6b7280;
            font-size: 0.875rem;
        }
        .receipt-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-bottom: 2rem;
        }
        .info-section h2 {
            font-size: 1.125rem;
            color: #1f2937;
            margin-bottom: 1rem;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 0.5rem;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px solid #f3f4f6;
        }
        .info-label {
            font-weight: 500;
            color: #6b7280;
        }
        .info-value {
            color: #1f2937;
            text-align: right;
        }
        .trip-details {
            margin: 2rem 0;
            padding: 1.5rem;
            background: #f9fafb;
            border-radius: 8px;
        }
        .trip-details h2 {
            font-size: 1.25rem;
            color: #1f2937;
            margin-bottom: 1rem;
        }
        .detail-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }
        .financial-section {
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 2px solid #e5e7eb;
        }
        .financial-row {
            display: flex;
            justify-content: space-between;
            padding: 0.75rem 0;
            font-size: 1.125rem;
        }
        .financial-row.total {
            font-weight: 700;
            font-size: 1.5rem;
            border-top: 2px solid #3b82f6;
            margin-top: 1rem;
            padding-top: 1rem;
        }
        .receipt-footer {
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 0.875rem;
        }
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .receipt-container {
                box-shadow: none;
                padding: 2rem;
            }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="receipt-header">
            <h1>Trip Receipt</h1>
            <p>Receipt Date: ${format(new Date(), 'MMMM dd, yyyy')}</p>
        </div>

        <div class="receipt-info">
            <div class="info-section">
                <h2>Customer Information</h2>
                <div class="info-row">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${escapeHtml(customer.name)}</span>
                </div>
                ${customer.email ? `
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${escapeHtml(customer.email)}</span>
                </div>
                ` : ''}
                ${customer.phone ? `
                <div class="info-row">
                    <span class="info-label">Phone:</span>
                    <span class="info-value">${escapeHtml(customer.phone)}</span>
                </div>
                ` : ''}
            </div>

            <div class="info-section">
                <h2>Trip Information</h2>
                <div class="info-row">
                    <span class="info-label">Trip ID:</span>
                    <span class="info-value">${trip.id.substring(0, 8)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Status:</span>
                    <span class="info-value">${trip.status || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Flight/Job #:</span>
                    <span class="info-value">${trip.flightNumber || 'N/A'}</span>
                </div>
            </div>
        </div>

        <div class="trip-details">
            <h2>Trip Details</h2>
            <div class="detail-grid">
                <div>
                    <strong>Pickup Date & Time:</strong><br>
                    ${tripDate} at ${tripTime}
                </div>
                <div>
                    <strong>Number of Passengers:</strong><br>
                    ${trip.numberOfPassengers || 1}
                </div>
                <div>
                    <strong>Pickup Location:</strong><br>
                    ${escapeHtml(trip.pickupLocation)}
                </div>
                <div>
                    <strong>Dropoff Location:</strong><br>
                    ${escapeHtml(trip.dropoffLocation)}
                </div>
            </div>
            ${trip.actualPickupTime ? `
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
                <strong>Actual Pickup:</strong> ${actualPickup}<br>
                ${trip.actualDropoffTime ? `<strong>Actual Dropoff:</strong> ${actualDropoff}` : ''}
            </div>
            ` : ''}
        </div>

        ${trip.tripRate !== null && trip.tripRate !== undefined ? `
        <div class="financial-section">
            <h2>Payment Information</h2>
            <div class="financial-row">
                <span>Trip Rate:</span>
                <span>$${trip.tripRate.toFixed(2)}</span>
            </div>
            <div class="financial-row total">
                <span>Total:</span>
                <span>$${trip.tripRate.toFixed(2)}</span>
            </div>
        </div>
        ` : ''}

        ${trip.notes ? `
        <div style="margin-top: 2rem; padding: 1rem; background: #f9fafb; border-radius: 8px;">
            <strong>Notes:</strong><br>
            ${escapeHtml(trip.notes)}
        </div>
        ` : ''}

        <div class="receipt-footer">
            <p>Thank you for choosing our transportation services!</p>
            <p style="margin-top: 0.5rem;">For questions about this receipt, please contact your transportation provider.</p>
        </div>
    </div>
</body>
</html>
  `;

  return receiptHtml;
}

function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  // Simple HTML escaping
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
