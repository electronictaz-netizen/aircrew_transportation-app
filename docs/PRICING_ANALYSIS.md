# Subscription Pricing Analysis

## Cost Breakdown Analysis

### AWS Infrastructure Costs (Per Company, Average Usage)

#### Base AWS Services (Shared Infrastructure)
- **AWS Amplify Hosting**: Included in base platform cost (shared across all companies)
- **AWS CloudFront CDN**: Included with Amplify
- **AWS Cognito**: Free tier covers up to 50,000 MAU (Monthly Active Users)
  - Cost per company: **$0** (within free tier limits)

#### Per-Company AWS Usage (Estimated Monthly)

**Small Company (Basic Tier - ~500 trips/month):**
- **AppSync GraphQL**: ~50,000 requests/month
  - Cost: 50K × $4.00/1M = **$0.20/month**
- **DynamoDB**: ~2GB storage, 500K read/write units
  - Storage: 2GB × $0.25/GB = $0.50
  - Read/Write: 500K × $1.25/1M = $0.63
  - Total: **~$1.13/month**
- **Lambda Functions**: ~5,000 invocations/month
  - Cost: 5K × $0.20/1M = **$0.001/month** (negligible)
- **Data Transfer**: ~1GB/month
  - Cost: **~$0.09/month**

**Medium Company (Premium Tier - ~2,000 trips/month):**
- **AppSync GraphQL**: ~200,000 requests/month
  - Cost: 200K × $4.00/1M = **$0.80/month**
- **DynamoDB**: ~5GB storage, 2M read/write units
  - Storage: 5GB × $0.25/GB = $1.25
  - Read/Write: 2M × $1.25/1M = $2.50
  - Total: **~$3.75/month**
- **Lambda Functions**: ~20,000 invocations/month
  - Cost: 20K × $0.20/1M = **$0.004/month** (negligible)
- **Data Transfer**: ~5GB/month
  - Cost: **~$0.45/month**

**Total AWS Cost Per Company:**
- Basic Tier: **~$1.42/month**
- Premium Tier: **~$5.00/month**

### Third-Party Service Costs

#### Email Service (SendGrid or Postmark)
**SendGrid Pricing:**
- Free: 100 emails/day (3,000/month)
- Essentials: $19.95/month - 50,000 emails/month
- Pro: $89.95/month - 100,000 emails/month

**Postmark Pricing:**
- Free: 100 emails/month
- Paid: $15/month - 10,000 emails/month
- Plus: $25/month - 50,000 emails/month

**Estimated Usage Per Company:**
- Booking confirmations: ~500-2,000 emails/month (depending on tier)
- Manager notifications: ~100-500 emails/month
- Trip status updates: ~200-1,000 emails/month
- **Total: ~800-3,500 emails/month per company**

**Cost Allocation:**
- Shared email service account (bulk pricing)
- Cost per company: **~$2-5/month** (depending on volume)

#### Flight Status API (Premium Tier Only)
**AviationStack Pricing:**
- Free: 1,000 requests/month
- Basic: $49/month - 10,000 requests/month
- Professional: $99/month - 50,000 requests/month

**Estimated Usage:**
- Premium tier companies: ~500-2,000 flight checks/month
- Shared API account across all Premium customers
- Cost per Premium company: **~$5-10/month** (with bulk pricing)

#### SMS Service (Optional, Not Currently Required)
- AWS End User Messaging: ~$0.006-0.01/SMS
- Estimated: ~100-500 SMS/month per company (if enabled)
- Cost: **~$0.60-5.00/month** (not included in base pricing)

### Total Cost Per Company

**Basic Tier:**
- AWS Infrastructure: $1.42/month
- Email Service: $3.00/month (shared account)
- **Total Cost: ~$4.42/month**
- **Current Price: $49/month**
- **Profit Margin: ~91%**

**Premium Tier:**
- AWS Infrastructure: $5.00/month
- Email Service: $4.00/month (higher volume)
- Flight Status API: $7.50/month (shared account)
- **Total Cost: ~$16.50/month**
- **Current Price: $99/month**
- **Profit Margin: ~83%**

### Recommended Pricing Strategy

Based on cost analysis and competitive positioning:

#### Option 1: Cost-Plus with Healthy Margin (Recommended)
- **Basic Tier: $59/month** (up from $49)
  - Cost: $4.42
  - Margin: 92.5%
  - Competitive with similar SaaS products
  - Allows for growth and feature development

- **Premium Tier: $129/month** (up from $99)
  - Cost: $16.50
  - Margin: 87.2%
  - Reflects additional value (flight API, advanced features)
  - Still competitive in the market

#### Option 2: Value-Based Pricing (Higher End)
- **Basic Tier: $79/month**
  - Cost: $4.42
  - Margin: 94.4%
  - Positions as premium solution
  - Room for discounts and promotions

- **Premium Tier: $149/month**
  - Cost: $16.50
  - Margin: 88.9%
  - Premium positioning
  - Better reflects advanced feature value

#### Option 3: Aggressive Growth Pricing (Current)
- **Basic Tier: $49/month** (keep current)
  - Cost: $4.42
  - Margin: 91.0%
  - Competitive entry point
  - Good for market penetration

- **Premium Tier: $99/month** (keep current)
  - Cost: $16.50
  - Margin: 83.3%
  - Attractive upgrade path
  - May need adjustment as flight API costs scale

### Additional Considerations

#### Scaling Costs
- **High-Volume Companies**: Companies with 5,000+ trips/month may incur:
  - Higher DynamoDB costs: +$5-10/month
  - Higher AppSync costs: +$1-2/month
  - Higher email costs: +$2-5/month
  - **Consider**: Usage-based pricing add-ons or higher tier limits

#### Support Costs
- Email support: Included in base price
- Priority support (Premium): Estimated $5-10/month per company in support time
- **Recommendation**: Factor into Premium tier pricing

#### Development & Maintenance
- Ongoing feature development
- Bug fixes and updates
- Infrastructure maintenance
- **Recommendation**: 20-30% of revenue should cover these costs

### Competitive Analysis

**Similar Transportation Management Software:**
- Limo Anywhere: $99-299/month
- LimoRes.com: $99-199/month
- GroundSpan: $79-199/month
- TaxiCaller: $49-149/month

**Our Positioning:**
- Modern, cloud-based solution
- Real-time GPS tracking
- Configurable booking portal
- Competitive feature set

### Final Recommendation

**Recommended Pricing:**

1. **Basic Tier: $59/month** (up from $49)
   - Justification:
     - Still competitive in market
     - Healthy margin for growth
     - Covers all base costs with room for scaling
     - Reflects value of unlimited trips and booking portal

2. **Premium Tier: $129/month** (up from $99)
   - Justification:
     - Reflects additional value (flight API, advanced features)
     - Covers higher infrastructure and API costs
     - Maintains healthy margin
     - Competitive with similar premium offerings

**Alternative (If Market Penetration is Priority):**

1. **Basic Tier: $49/month** (keep current)
   - Good for growth phase
   - Monitor costs closely
   - Consider usage limits for very high-volume customers

2. **Premium Tier: $119/month** (moderate increase)
   - Better reflects flight API costs
   - Still attractive upgrade path
   - Maintains competitive positioning

### Implementation Notes

- **Free Tier**: Keep at $0 (10 trips/month limit is appropriate)
- **Annual Plans**: Offer 15-20% discount for annual billing
- **Enterprise**: Consider custom pricing for 10+ vehicle fleets
- **Add-Ons**: Consider usage-based add-ons for:
  - Additional flight API requests
  - SMS notifications
  - Custom integrations

### Cost Monitoring

**Key Metrics to Track:**
- AWS costs per company (monthly)
- Email service usage per company
- Flight API usage per Premium company
- Support ticket volume and resolution time
- Customer acquisition cost (CAC)
- Customer lifetime value (LTV)

**Alert Thresholds:**
- If AWS costs exceed $10/month per company → Review pricing
- If email costs exceed $10/month per company → Review email service
- If flight API costs exceed $15/month per Premium company → Review API usage or pricing

---

*Last Updated: January 2026*
*Based on AWS pricing as of January 2026 and estimated usage patterns*
