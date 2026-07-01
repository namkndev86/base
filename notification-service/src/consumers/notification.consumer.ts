import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { BaseEvent, SendNotificationPayload } from '@platform/shared-contracts';

@Controller()
export class NotificationConsumer {
  @EventPattern('notification.send')
  async handleSendNotification(@Payload() event: BaseEvent<SendNotificationPayload>) {
    const { recipient, channel, templateName, variables } = event.payload;
    console.log(`[Notification Service] Sending ${channel} to ${recipient} using template ${templateName}`, variables);
    // Real implementation integrates with Nodemailer / Twilio / Slack webhooks here.
  }
}
