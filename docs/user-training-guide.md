# Malar Market Digital Ledger - User Training Guide

## Table of Contents

1. [Overview](#overview)
2. [Admin Training](#admin-training)
3. [Staff Training](#staff-training)
4. [Common Workflows](#common-workflows)
5. [Troubleshooting Guide](#troubleshooting-guide)
6. [FAQ](#faq)
7. [Best Practices](#best-practices)

---

## Overview

This guide provides comprehensive training materials for users of the Malar Market Digital Ledger system, including administrators, staff members, and farmers.

### Training Objectives

- **Admin Users**: Master system administration, user management, and configuration
- **Staff Users**: Learn daily operations, data entry, and reporting
- **Farmers**: Understand settlement viewing, balance checking, and communication
- **All Users**: Understand bilingual support, offline functionality, and security practices

### Training Format

- **In-Person Training**: Hands-on sessions with practical exercises
- **Video Tutorials**: Step-by-step video guides for common tasks
- **Written Documentation**: Quick reference guides and cheat sheets
- **Online Resources**: Interactive tutorials and knowledge base
- **Support Sessions**: Regular Q&A and troubleshooting assistance

---

## Admin Training

### Module 1: System Overview

**Duration**: 1 hour

**Objectives**:
- Understand system architecture
- Learn about key components
- Understand data flow
- Understand security features

**Topics Covered**:
- Frontend vs Backend architecture
- Database structure
- API endpoints
- Authentication and authorization
- Offline functionality
- WhatsApp integration

**Key Takeaways**:
- System is designed for offline-first operation
- Data is synchronized between frontend and backend
- WhatsApp provides real-time notifications to farmers
- Security is implemented with role-based access control

### Module 2: User Management

**Duration**: 2 hours

**Objectives**:
- Create new users
- Manage user roles and permissions
- Reset user passwords
- Deactivate user accounts
- View user activity logs

**Hands-On Exercises**:

#### Exercise 1: Create New Staff User
1. Navigate to **Settings > Users**
2. Click **"Add User"** button
3. Fill in user details:
   - Email: `staff1@malar.com`
   - Full Name: `Staff User 1`
   - Phone: `+919876543211`
   - Role: `staff`
   - Language Preference: `ta`
4. Set temporary password: `TempPass123!`
5. Click **"Create User"**
6. Note: User must change password on first login

#### Exercise 2: Assign Permissions
1. Navigate to **Settings > Users**
2. Click on user to edit
3. Review current permissions
4. Add or remove permissions as needed
5. Click **"Save Changes"**

#### Exercise 3: Reset User Password
1. Navigate to **Settings > Users**
2. Click on user to edit
3. Click **"Reset Password"** button
4. Enter new password
5. Click **"Send Reset Link"**
6. Verify email is received

### Module 3: Market Rate Management

**Duration**: 1.5 hours

**Objectives**:
- Create time slots
- Set market rates for flower types
- Update rates based on market conditions
- View rate history
- Understand time-based pricing logic

**Hands-On Exercises**:

#### Exercise 1: Create Time Slots
1. Navigate to **Settings > Market Rates**
2. Click **"Time Slots"** tab
3. Click **"Add Time Slot"**
4. Fill in time slot details:
   - Name: `Early Morning`
   - Name (Tamil): `காலை`
   - Start Time: `04:00`
   - End Time: `06:00`
5. Click **"Save"**

#### Exercise 2: Set Market Rates
1. Navigate to **Settings > Market Rates**
2. Click **"Market Rates"** tab
3. Select flower type: `Rose`
4. Select time slot: `Early Morning`
5. Enter rate: `150.00`
6. Click **"Save"**
7. Verify rate appears in rate table

#### Exercise 3: Update Rates for New Day
1. Navigate to **Settings > Market Rates**
2. Click **"Add Rate"**
3. Select flower type: `Rose`
4. Select time slot: `Early Morning`
5. Enter new rate: `155.00`
6. Set effective date: `2026-02-15`
7. Click **"Save"**

### Module 4: Report Generation

**Duration**: 2 hours

**Objectives**:
- Generate daily summary reports
- Generate farmer summary reports
- Export reports to PDF
- Export reports to Excel
- Understand report data and metrics

**Hands-On Exercises**:

#### Exercise 1: Generate Daily Summary
1. Navigate to **Reports > Daily Summary**
2. Select date: `2026-02-14`
3. Click **"Generate Report"**
4. Review report data:
   - Total entries
   - Total quantity
   - Gross amount
   - Total commission
5. Click **"Export to PDF"**

#### Exercise 2: Generate Farmer Summary
1. Navigate to **Reports > Farmer Summary**
2. Select farmer: `Raj Kumar (FAR001)`
3. Select date range: `2026-02-01` to `2026-02-14`
4. Click **"Generate Report"**
5. Review report data:
   - Total entries
   - Total settlements
   - Current balance
6. Click **"Export to Excel"**

---

## Staff Training

### Module 1: Daily Entry Management

**Duration**: 2 hours

**Objectives**:
- Create daily flower entries
- Understand time-based pricing
- Use autocomplete for farmers
- Calculate totals automatically
- Handle offline mode

**Hands-On Exercises**:

#### Exercise 1: Create Daily Entry (Online)
1. Navigate to **Daily Entry** page
2. Click on farmer autocomplete field
3. Type `Raj` and select `Raj Kumar (FAR001)`
4. Select flower type: `Rose`
5. Enter quantity: `10.5`
6. Verify auto-calculated total: `₹1,575.00`
7. Click **"Save Entry"**
8. Verify entry appears in list

#### Exercise 2: Create Daily Entry (Offline)
1. Disconnect from internet
2. Verify offline indicator appears
3. Create entry following steps above
4. Verify entry is saved locally
5. Verify sync pending indicator appears
6. Reconnect to internet
7. Verify entry syncs to server

#### Exercise 3: Edit Daily Entry
1. Navigate to **Daily Entry** page
2. Click on entry to edit
3. Modify quantity: `12.0`
4. Verify new total: `₹1,800.00`
5. Click **"Save Changes"**

#### Exercise 4: Delete Daily Entry
1. Navigate to **Daily Entry** page
2. Click on entry to delete
3. Confirm deletion
4. Verify entry is removed from list

### Module 2: Settlement Management

**Duration**: 2 hours

**Objectives**:
- Generate settlements for farmers
- Review settlement details
- Approve settlements
- Mark settlements as paid
- Generate settlement PDFs

**Hands-On Exercises**:

#### Exercise 1: Generate Settlement
1. Navigate to **Settlements** page
2. Click **"Generate Settlement"** button
3. Select farmer: `Raj Kumar (FAR001)`
4. Set date range: `2026-02-01` to `2026-02-14`
5. Click **"Generate"**
6. Review settlement details:
   - Total entries: 25
   - Gross amount: `₹37,500.00`
   - Total commission: `₹1,875.00`
   - Net payable: `₹30,125.00`
7. Click **"Save"**

#### Exercise 2: Approve Settlement
1. Navigate to **Settlements** page
2. Click on settlement to view
3. Review settlement details
4. Click **"Approve"** button
5. Enter notes: `Approved after review`
6. Click **"Confirm Approval"**
7. Verify status changes to `approved`

#### Exercise 3: Send Settlement Notification
1. Navigate to **Settlements** page
2. Click on settlement to view
3. Click **"Send WhatsApp Notification"** button
4. Verify notification is sent
5. Check WhatsApp for confirmation

### Module 3: Cash Advance Management

**Duration**: 1.5 hours

**Objectives**:
- Request cash advances for farmers
- Review advance requests
- Approve or reject advances
- Track advance balances

**Hands-On Exercises**:

#### Exercise 1: Request Cash Advance
1. Navigate to **Cash Advances** page
2. Click **"New Advance"** button
3. Select farmer: `Raj Kumar (FAR001)`
4. Enter amount: `5,000.00`
5. Enter reason: `Emergency medical expense`
6. Select advance date: `2026-02-14`
7. Click **"Submit Request"**
8. Verify request status: `pending`

#### Exercise 2: Approve Cash Advance
1. Navigate to **Cash Advances** page
2. Click on pending advance to view
3. Review advance details
4. Click **"Approve"** button
5. Enter notes: `Approved as emergency`
6. Click **"Confirm Approval"**
7. Verify status changes to `approved`

#### Exercise 3: Reject Cash Advance
1. Navigate to **Cash Advances** page
2. Click on pending advance to view
3. Review advance details
4. Click **"Reject"** button
5. Enter reason: `Insufficient balance`
6. Click **"Confirm Rejection"**
7. Verify status changes to `rejected`

### Module 4: Farmer Management

**Duration**: 1.5 hours

**Objectives**:
- Add new farmers
- Edit farmer details
- View farmer history
- Check farmer balances
- Deactivate farmers

**Hands-On Exercises**:

#### Exercise 1: Add New Farmer
1. Navigate to **Farmers** page
2. Click **"Add Farmer"** button
3. Fill in farmer details:
   - Farmer Code: `FAR004`
   - Name: `Muthu Pandi`
   - Village: `Trichy`
   - Phone: `+919876543213`
   - WhatsApp Number: `+919876543213`
   - Address: `789, Garden Lane, Trichy`
4. Click **"Save"**
5. Verify farmer appears in list

#### Exercise 2: View Farmer Balance
1. Navigate to **Farmers** page
2. Click on farmer to view
3. Click **"Balance"** tab
4. Review balance information:
   - Current Balance: `₹15,000.00`
   - Total Settlements: `₹20,000.00`
   - Total Advances: `₹5,000.00`
5. Verify calculations are correct

---

## Common Workflows

### Workflow 1: Morning Rush Hour Entry (4-9 AM)

**Purpose**: Efficiently record flower entries during peak market hours

**Steps**:
1. **Preparation** (3:45-4:00 AM):
   - Start application
   - Verify offline mode is ready
   - Check market rates are loaded
   - Verify farmer list is cached

2. **Entry Creation** (4:00-9:00 AM):
   - Select farmer using autocomplete
   - Select flower type
   - Enter quantity
   - Verify auto-calculated total
   - Click save
   - Repeat for each entry

3. **Sync Process** (9:00-10:00 AM):
   - Reconnect to internet
   - Verify all entries sync
   - Check for sync conflicts
   - Resolve conflicts if needed

4. **Verification** (10:00-10:30 AM):
   - Verify all entries are synced
   - Check for any errors
   - Review totals
   - Generate daily summary report

**Best Practices**:
- Use autocomplete for faster farmer selection
- Verify quantities before saving
- Use keyboard shortcuts for faster entry
- Keep entries in sync queue when offline
- Review sync status regularly

### Workflow 2: Settlement Generation (Weekly)

**Purpose**: Generate and approve weekly settlements for farmers

**Steps**:
1. **Preparation** (Monday 10 AM):
   - Review all entries for the week
   - Check for any missing or incorrect data
   - Verify all cash advances are recorded
   - Calculate expected totals

2. **Generation** (Monday 2-4 PM):
   - Generate settlements for all farmers
   - Review each settlement for accuracy
   - Calculate net payable amounts
   - Verify commission calculations
   - Check advance deductions

3. **Review** (Tuesday 9-11 AM):
   - Admin reviews all settlements
   - Approve settlements
   - Add notes if needed
   - Generate PDF reports

4. **Notification** (Tuesday 2-4 PM):
   - Send WhatsApp notifications to farmers
   - Verify notifications are delivered
   - Track delivery status
   - Resend failed notifications

5. **Payment** (Wednesday 9-11 AM):
   - Mark settlements as paid
   - Record payment details
   - Update farmer balances
   - Generate payment receipts

**Best Practices**:
- Generate settlements in batches to avoid system overload
- Review settlements before approval
- Use WhatsApp notifications for faster communication
- Keep detailed records of all settlements
- Generate PDF reports for farmers

### Workflow 3: Cash Advance Request (Ad-hoc)

**Purpose**: Handle farmer requests for cash advances

**Steps**:
1. **Request Receipt** (Any time):
   - Farmer requests advance in person or via WhatsApp
   - Staff records request details
   - Staff enters request in system
   - System creates advance request with `pending` status

2. **Review** (Within 1 hour):
   - Admin reviews request
   - Checks farmer balance
   - Verifies advance reason
   - Reviews advance history

3. **Decision** (Within 2 hours):
   - Admin approves or rejects request
   - If approved: Update farmer balance
   - If rejected: Notify farmer with reason

4. **Disbursement** (If approved, same day):
   - Staff provides cash to farmer
   - Farmer signs receipt
   - System records disbursement details
   - WhatsApp notification sent

**Best Practices**:
- Verify farmer balance before approving
- Document reasons for all decisions
- Get written confirmation for advances
- Keep detailed records of all advances
- Use WhatsApp for faster communication

### Workflow 4: Market Rate Update (Daily)

**Purpose**: Update market rates based on daily market conditions

**Steps**:
1. **Market Assessment** (Evening 6-7 PM):
   - Review market conditions
   - Check flower prices
   - Determine rate adjustments needed
   - Consult with market manager

2. **Rate Update** (Evening 7-8 PM):
   - Admin updates rates in system
   - Set effective date for next day
   - Document reason for changes
   - Notify staff of rate changes

3. **Verification** (Next morning 4-5 AM):
   - Verify rates are active
   - Test rate application
   - Check for any issues
   - Update WhatsApp templates if needed

**Best Practices**:
- Communicate rate changes in advance
- Document reasons for rate changes
- Test rate changes before implementation
- Keep historical rate data for reference
- Update WhatsApp templates for new rates

---

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue 1: Cannot Login

**Symptoms**:
- Incorrect email or password error
- "Account locked" message
- "Session expired" message

**Solutions**:
1. Verify email address is correct
2. Check password is correct (case-sensitive)
3. Reset password if forgotten
4. Wait 15 minutes if account is locked
5. Clear browser cache and cookies
6. Try different browser
7. Contact admin if issue persists

#### Issue 2: Entry Not Saving

**Symptoms**:
- Entry not appearing in list
- Error message on save
- Data lost after refresh

**Solutions**:
1. Check internet connection
2. Verify all required fields are filled
3. Check for validation errors
4. Check sync status (offline mode)
5. Clear browser cache
6. Refresh page
7. Check browser console for errors
8. Contact support if issue persists

#### Issue 3: Settlement Not Generating

**Symptoms**:
- Settlement generation fails
- Incorrect totals calculated
- Missing entries in settlement

**Solutions**:
1. Verify date range is correct
2. Check all entries are included
3. Verify market rates are set
4. Check for data inconsistencies
5. Clear browser cache
6. Try again with different browser
7. Contact support if issue persists

#### Issue 4: WhatsApp Notification Not Sending

**Symptoms**:
- Notification status shows "failed"
- No message received by farmer
- Error message in system

**Solutions**:
1. Verify farmer's WhatsApp number is correct
2. Check WhatsApp API credentials
3. Verify message template is approved
4. Check for special characters in message
5. Resend notification
6. Check WhatsApp service status
7. Contact support if issue persists

#### Issue 5: PDF Not Generating

**Symptoms**:
- PDF download fails
- Tamil text not displaying correctly
- Formatting issues in PDF

**Solutions**:
1. Check Tamil font is installed
2. Verify browser supports PDF generation
3. Try different browser
4. Clear browser cache
5. Check for JavaScript errors
6. Contact support if issue persists

#### Issue 6: Offline Mode Not Working

**Symptoms**:
- Offline indicator not showing
- Entries not saving locally
- Sync queue not working

**Solutions**:
1. Check service worker is registered
2. Verify browser supports service workers
3. Check IndexedDB is accessible
4. Clear browser cache
5. Refresh page
6. Check browser console for errors
7. Contact support if issue persists

---

## FAQ

### General Questions

**Q: How do I change the language?**
A: Click on the language selector in the top-right corner and select "English" or "தமிழ்" (Tamil).

**Q: How do I know if I'm offline?**
A: Look for the offline indicator (📶) in the top-right corner. If it's visible, you're working offline.

**Q: How do I sync my data when I go back online?**
A: Data syncs automatically when you reconnect to the internet. You can also manually trigger sync by clicking the sync button in the top-right corner.

**Q: What happens if I lose connection while creating an entry?**
A: The entry is saved locally and added to the sync queue. When you reconnect, it will automatically sync to the server.

**Q: How do I check my settlement status?**
A: Navigate to the "Settlements" page to view all your settlements. Filter by status to see pending, approved, or paid settlements.

**Q: Can I edit an entry after it's been included in a settlement?**
A: No, entries cannot be edited once they've been included in a settlement. You must delete the settlement first.

**Q: How do I request a cash advance?**
A: Navigate to the "Cash Advances" page and click "New Advance". Fill in the details and submit. The admin will review and approve your request.

**Q: How do I check my balance?**
A: Navigate to the "Farmers" page, click on your name, and view the "Balance" tab. It shows your current balance, total settlements, and total advances.

**Q: What should I do if I see an error message?**
A: Note the error message and contact support. Common errors include network issues, validation errors, and sync conflicts.

**Q: How do I generate reports?**
A: Navigate to the "Reports" page, select the report type, choose your filters, and click "Generate Report". You can export to PDF or Excel.

**Q: How do I use WhatsApp commands?**
A: Send a WhatsApp message to the registered number with commands like:
- `BALANCE` - Check your current balance
- `SETTLEMENT` - Check your latest settlement status
- `HELP` - Get help with available commands

### Technical Questions

**Q: What browsers are supported?**
A: Chrome, Firefox, Safari, and Edge are fully supported. Internet Explorer is not supported.

**Q: What are the system requirements?**
A: 
- Desktop: Windows 10+, macOS 10.11+, or Linux
- Tablet: iPadOS 13+, Android 8.0+, or iOS 13+
- Browser: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Internet: Required for online features, optional for offline mode

**Q: How do I clear my browser cache?**
A: 
- Chrome: Ctrl+Shift+Delete (Windows), Cmd+Shift+Delete (Mac)
- Firefox: Ctrl+Shift+Delete (Windows), Cmd+Shift+Delete (Mac)
- Safari: Cmd+Option+E (Mac), then click "Remove All Website Data"
- Edge: Ctrl+Shift+Delete (Windows), Cmd+Shift+Delete (Mac)

**Q: How do I enable notifications?**
A: Notifications are enabled by default. You can manage notification preferences in your profile settings.

**Q: What should I do if the system is slow?**
A: 
- Check your internet connection
- Try refreshing the page
- Clear your browser cache
- Try a different browser
- Contact support if the issue persists

---

## Best Practices

### For Admin Users

1. **Security First**
   - Use strong passwords
   - Enable two-factor authentication
   - Review access logs regularly
   - Follow principle of least privilege

2. **Data Integrity**
   - Verify data before major operations
   - Keep regular backups
   - Test changes in staging first
   - Document all configuration changes

3. **User Management**
   - Create separate accounts for different roles
   - Review user activity regularly
   - Deactivate unused accounts promptly
   - Provide proper training for new users

4. **System Monitoring**
   - Monitor system performance daily
   - Review error logs regularly
   - Set up alerts for critical issues
   - Plan for system maintenance

### For Staff Users

1. **Accuracy First**
   - Double-check all entries before saving
   - Verify calculations are correct
   - Review data before submitting
   - Ask for clarification if unsure

2. **Efficiency**
   - Use keyboard shortcuts
   - Use autocomplete features
   - Batch similar operations
   - Keep frequently used data accessible

3. **Communication**
   - Notify farmers of important changes
   - Respond to inquiries promptly
   - Use WhatsApp for urgent matters
   - Document all communications

4. **Data Management**
   - Sync data regularly when online
   - Verify offline entries are synced
   - Check for sync conflicts
   - Report any data issues

### For All Users

1. **Security**
   - Never share passwords
   - Log out when not using the system
   - Keep software updated
   - Report suspicious activity
   - Use secure networks only

2. **Performance**
   - Close unused browser tabs
   - Clear cache regularly
   - Use supported browsers
   - Report performance issues

3. **Learning**
   - Attend training sessions
   - Read documentation
   - Ask questions when unsure
   - Share knowledge with team
   - Stay updated on new features

---

## Training Resources

### Quick Reference Guides

#### Keyboard Shortcuts

| Action | Windows/Linux | Mac |
|---------|---------------|-----|
| Save Entry | Ctrl+S / Cmd+S | Ctrl+S / Cmd+S |
| Delete Entry | Delete | Delete |
| Navigate | Arrow Keys | Arrow Keys |
| Search | Ctrl+F / Cmd+F | Ctrl+F / Cmd+F |
| Refresh | F5 | Cmd+R |
| Logout | Ctrl+Shift+Q | Cmd+Shift+Q |

#### Common Icons

| Icon | Meaning |
|-------|----------|
| 📶 | Offline Mode |
| 🔄 | Syncing |
| ✅ | Success |
| ❌ | Error |
| ⚠️ | Warning |
| ℹ️ | Information |
| 🔒 | Secure Connection |

#### Status Indicators

| Status | Color | Meaning |
|---------|-------|----------|
| Green | Active/Success |
| Yellow | Pending/Warning |
| Red | Error/Critical |
| Gray | Inactive |

### Support Resources

- **Email**: support@malar-market-ledger.com
- **Phone**: +91-98765-43210 (during business hours)
- **WhatsApp**: +91-98765-43210
- **Documentation**: https://docs.malar-market-ledger.com
- **Training Portal**: https://training.malar-market-ledger.com
- **Status Page**: https://status.malar-market-ledger.com

### Additional Training Materials

- **Video Tutorials**: Available in training portal
- **Interactive Guides**: Step-by-step walkthroughs
- **Cheat Sheets**: Quick reference for common tasks
- **FAQ Database**: Searchable knowledge base
- **Release Notes**: Information about new features and changes

---

## Training Schedule

### Recommended Training Timeline

**Week 1: System Fundamentals**
- Day 1: System overview and architecture
- Day 2: User management and security
- Day 3: Navigation and interface
- Day 4: Basic operations

**Week 2: Core Operations**
- Day 1: Daily entry management
- Day 2: Settlement generation
- Day 3: Cash advance management
- Day 4: Farmer management
- Day 5: Report generation

**Week 3: Advanced Features**
- Day 1: Offline functionality
- Day 2: WhatsApp integration
- Day 3: Bilingual support
- Day 4: Troubleshooting
- Day 5: Best practices and tips

### Ongoing Training

- **Monthly Refresher**: Short sessions on new features
- **Quarterly Deep Dive**: Comprehensive training on complex topics
- **Annual Review**: Full system review and updates
- **On-Demand**: Training for new users or as needed

---

**Document Version**: 1.0
**Last Updated**: 2026-02-14
**Author**: Training Team
