import { getBaseTemplate, EmailTemplateProps } from './base';

export interface RegistrationReceivedEmailProps extends EmailTemplateProps {
    userName: string;
}

export function getRegistrationReceivedEmailTemplate(props: RegistrationReceivedEmailProps): string {
    const { userName } = props;

    const content = `
    <div class="content">
      <h2>Registration Received! 📋</h2>
      <p>Dear ${userName},</p>
      <p>
        Thank you for registering with ${props.companyName}. We have received your application and 
        it is currently <strong>under review</strong>.
      </p>
      
      <p>
        Our team reviews all new account applications to ensure the security and compliance of our banking platform.
        This process usually takes less than 24 hours.
      </p>

      <div class="info-box">
        <p style="margin: 0; color: #334155;">
          <strong>What happens next?</strong><br>
          You will receive another email from us as soon as your account is approved and activated.
          Once approved, you will be able to log in and access all banking features.
        </p>
      </div>

      <div class="divider"></div>

      <p style="font-size: 14px;">
        <strong>Questions?</strong><br>
        If you have any urgent inquiries, please reply to this email or contact our support team.
      </p>

      <p style="margin-top: 24px;">
        Best regards,<br>
        <strong>The ${props.companyName} Team</strong>
      </p>
    </div>
  `;

    return getBaseTemplate(content, props);
}

export function getRegistrationReceivedEmailSubject(companyName: string): string {
    return `Welcome to ${companyName} - Application Received`;
}
