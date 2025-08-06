let EmailClient, sgMail;

// Try to import Azure Communication Services
try {
  const azureEmail = require('@azure/communication-email');
  EmailClient = azureEmail.EmailClient;
} catch (error) {
  console.warn('Azure Communication Services not available. Email notifications will use fallback.');
}

// Try to import SendGrid
try {
  sgMail = require('@sendgrid/mail');
} catch (error) {
  console.warn('SendGrid not available. Email notifications will use fallback.');
}

class NotificationService {
  constructor() {
    // Azure Communication Services setup
    this.azureEmailConnectionString = process.env.AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING;
    this.azureEmailClient = null;
    
    if (this.azureEmailConnectionString && EmailClient) {
      this.azureEmailClient = new EmailClient(this.azureEmailConnectionString);
      console.log('Azure Communication Services Email initialized');
    }

    // SendGrid setup as fallback
    this.sendGridApiKey = process.env.SENDGRID_API_KEY;
    if (this.sendGridApiKey && sgMail) {
      sgMail.setApiKey(this.sendGridApiKey);
      console.log('SendGrid initialized');
    }

    this.fromEmail = process.env.FROM_EMAIL || 'noreply@autoclaimai.com';
    this.fromName = process.env.FROM_NAME || 'AutoClaimAI';

    if (!this.azureEmailClient && !this.sendGridApiKey) {
      console.warn('No email service configured. Email notifications will be logged only.');
    }
  }

  async sendClaimSubmissionNotification(userEmail, claimNumber, userName) {
    const subject = `Claim Submitted Successfully - ${claimNumber}`;
    const htmlContent = this.generateClaimSubmissionEmail(claimNumber, userName);
    const textContent = `Dear ${userName},\n\nYour insurance claim ${claimNumber} has been successfully submitted and is under review.\n\nBest regards,\nAutoClaimAI Team`;

    return this.sendEmail(userEmail, subject, htmlContent, textContent);
  }

  async sendClaimStatusUpdate(userEmail, claimNumber, status, userName, adminNotes = '') {
    const subject = `Claim Status Update - ${claimNumber}`;
    const htmlContent = this.generateClaimStatusEmail(claimNumber, status, userName, adminNotes);
    const textContent = `Dear ${userName},\n\nYour insurance claim ${claimNumber} status has been updated to: ${status.toUpperCase()}\n\n${adminNotes ? `Notes: ${adminNotes}\n\n` : ''}Best regards,\nAutoClaimAI Team`;

    return this.sendEmail(userEmail, subject, htmlContent, textContent);
  }

  async sendAdminClaimNotification(adminEmail, claimNumber, userEmail) {
    const subject = `New Claim Requires Review - ${claimNumber}`;
    const htmlContent = this.generateAdminNotificationEmail(claimNumber, userEmail);
    const textContent = `A new insurance claim ${claimNumber} has been submitted by ${userEmail} and requires admin review.`;

    return this.sendEmail(adminEmail, subject, htmlContent, textContent);
  }

  async sendEmail(to, subject, htmlContent, textContent) {
    try {
      // Try Azure Communication Services first
      if (this.azureEmailClient) {
        return await this.sendViaAzure(to, subject, htmlContent, textContent);
      }
      
      // Fallback to SendGrid
      if (this.sendGridApiKey) {
        return await this.sendViaSendGrid(to, subject, htmlContent, textContent);
      }
      
      // If no service available, log the email
      console.log('EMAIL NOTIFICATION (No service configured):');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${textContent}`);
      
      return { success: true, service: 'logged' };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendViaAzure(to, subject, htmlContent, textContent) {
    try {
      const message = {
        senderAddress: this.fromEmail,
        content: {
          subject: subject,
          plainText: textContent,
          html: htmlContent
        },
        recipients: {
          to: [{ address: to }]
        }
      };

      const response = await this.azureEmailClient.beginSend(message);
      await response.pollUntilDone();
      
      console.log(`Email sent via Azure Communication Services to ${to}`);
      return { success: true, service: 'azure', messageId: response.id };
    } catch (error) {
      console.error('Azure Communication Services error:', error);
      throw error;
    }
  }

  async sendViaSendGrid(to, subject, htmlContent, textContent) {
    try {
      const message = {
        to: to,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: subject,
        text: textContent,
        html: htmlContent
      };

      const response = await sgMail.send(message);
      
      console.log(`Email sent via SendGrid to ${to}`);
      return { success: true, service: 'sendgrid', messageId: response[0].headers['x-message-id'] };
    } catch (error) {
      console.error('SendGrid error:', error);
      throw error;
    }
  }

  generateClaimSubmissionEmail(claimNumber, userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Claim Submitted - AutoClaimAI</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .claim-number { font-weight: bold; color: #007bff; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AutoClaimAI</h1>
            <h2>Claim Submitted Successfully</h2>
          </div>
          <div class="content">
            <p>Dear ${userName},</p>
            <p>Thank you for submitting your insurance claim. Your claim has been received and assigned the following number:</p>
            <p class="claim-number">Claim Number: ${claimNumber}</p>
            <p>Your claim is now under review by our team. We will analyze the submitted information and photos using our AI-powered damage assessment system.</p>
            <p>You will receive updates as your claim progresses through our review process. You can also check your claim status by logging into your AutoClaimAI dashboard.</p>
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            <p>Best regards,<br>The AutoClaimAI Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message from AutoClaimAI. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateClaimStatusEmail(claimNumber, status, userName, adminNotes) {
    const statusColors = {
      approved: '#28a745',
      rejected: '#dc3545',
      under_review: '#ffc107',
      pending_documents: '#17a2b8',
      closed: '#6c757d'
    };

    const statusColor = statusColors[status] || '#007bff';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Claim Status Update - AutoClaimAI</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .claim-number { font-weight: bold; color: #007bff; }
          .status { font-weight: bold; color: ${statusColor}; text-transform: uppercase; }
          .notes { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AutoClaimAI</h1>
            <h2>Claim Status Update</h2>
          </div>
          <div class="content">
            <p>Dear ${userName},</p>
            <p>Your insurance claim status has been updated:</p>
            <p class="claim-number">Claim Number: ${claimNumber}</p>
            <p>New Status: <span class="status">${status.replace('_', ' ')}</span></p>
            ${adminNotes ? `<div class="notes"><strong>Additional Notes:</strong><br>${adminNotes}</div>` : ''}
            <p>You can view the complete details of your claim by logging into your AutoClaimAI dashboard.</p>
            <p>If you have any questions about this update, please contact our support team.</p>
            <p>Best regards,<br>The AutoClaimAI Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message from AutoClaimAI. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateAdminNotificationEmail(claimNumber, userEmail) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Claim Review Required - AutoClaimAI Admin</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .claim-details { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AutoClaimAI Admin</h1>
            <h2>New Claim Requires Review</h2>
          </div>
          <div class="content">
            <p>A new insurance claim has been submitted and requires admin review:</p>
            <div class="claim-details">
              <p><strong>Claim Number:</strong> ${claimNumber}</p>
              <p><strong>Submitted by:</strong> ${userEmail}</p>
              <p><strong>Submission Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p>Please log into the admin dashboard to review this claim and update its status accordingly.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new NotificationService();
