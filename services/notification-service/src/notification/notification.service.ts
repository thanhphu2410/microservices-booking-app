import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendEmail(to: string, subject: string, content: string) {
    try {
      const mailOptions = {
        from: this.configService.get('SMTP_USER'),
        to,
        subject,
        html: content,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
  }

  async sendBookingConfirmation(email: string, bookingDetails: any) {
    const subject = 'Booking Confirmation';
    const content = `
      <h1>Booking Confirmation</h1>
      <p>Thank you for your booking!</p>
      <h2>Booking Details:</h2>
      <ul>
        <li>Booking ID: ${bookingDetails.id}</li>
        <li>Event: ${bookingDetails.event}</li>
        <li>Date: ${bookingDetails.date}</li>
        <li>Seats: ${bookingDetails.seats}</li>
      </ul>
    `;

    return this.sendEmail(email, subject, content);
  }
}