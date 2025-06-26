import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  htmlBody?: string;
  textBody?: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly sesClient: SESClient;
  private readonly defaultFromEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.sesClient = new SESClient({
      region: this.configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });

    this.defaultFromEmail = this.configService.get('AWS_SES_FROM_EMAIL');
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const { to, subject, htmlBody, textBody, from = this.defaultFromEmail } = options;

      // Ensure 'to' is always an array
      const toAddresses = Array.isArray(to) ? to : [to];

      const emailParams: SendEmailCommandInput = {
        Source: from,
        Destination: {
          ToAddresses: toAddresses,
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            ...(htmlBody && {
              Html: {
                Data: htmlBody,
                Charset: 'UTF-8',
              },
            }),
            ...(textBody && {
              Text: {
                Data: textBody,
                Charset: 'UTF-8',
              },
            }),
          },
        },
      };

      // Ensure we have either HTML or text body
      if (!htmlBody && !textBody) {
        throw new Error('Either htmlBody or textBody must be provided');
      }

      const command = new SendEmailCommand(emailParams);
      const result = await this.sesClient.send(command);

      this.logger.log(`Email sent successfully to ${toAddresses.join(', ')}. Message ID: ${result.MessageId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, fullName: string): Promise<boolean> {
    email = 'thanhphu2410@gmail.com';
    const subject = 'Welcome to Our Platform!';
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Welcome!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Our Platform!</h1>
          </div>
          <div class="content">
            <h2>Hello ${fullName},</h2>
            <p>Thank you for registering with our platform! We're excited to have you on board.</p>
            <p>Your account has been successfully created and you can now:</p>
            <ul>
              <li>Access all our features</li>
              <li>Book tickets for events</li>
              <li>Manage your profile</li>
              <li>Receive updates about new events</li>
            </ul>
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            <p>Best regards,<br>The Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
      Welcome to Our Platform!

      Hello ${fullName},

      Thank you for registering with our platform! We're excited to have you on board.

      Your account has been successfully created and you can now:
      - Access all our features
      - Book tickets for events
      - Manage your profile
      - Receive updates about new events

      If you have any questions or need assistance, please don't hesitate to contact our support team.

      Best regards,
      The Team

      This is an automated message, please do not reply to this email.
    `;

    return this.sendEmail({
      to: email,
      subject,
      htmlBody,
      textBody,
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string, resetUrl: string): Promise<boolean> {
    const subject = 'Password Reset Request';
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>You have requested to reset your password.</p>
            <p>Click the button below to reset your password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}?token=${resetToken}" class="button">Reset Password</a>
            </p>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p>${resetUrl}?token=${resetToken}</p>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
      Password Reset Request

      You have requested to reset your password.

      Click the link below to reset your password:
      ${resetUrl}?token=${resetToken}

      This link will expire in 1 hour for security reasons.

      If you didn't request this password reset, please ignore this email.

      This is an automated message, please do not reply to this email.
    `;

    return this.sendEmail({
      to: email,
      subject,
      htmlBody,
      textBody,
    });
  }
}