export interface AlertNotificationData {
  title: string;
  eventType:
    "freeze_proposed" | "freeze_executed" | "vote_cast" | "high_risk_detected" | "unfreeze_action";
  assetCode: string;
  targetAddress: string;
  initiator?: string;
  votesCurrent?: number;
  votesRequired?: number;
  riskScore?: number;
  reason?: string;
  timestamp?: string;
}

export interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  fields: Array<{ name: string; value: string; inline?: boolean }>;
  footer: { text: string };
  timestamp: string;
}

export interface DiscordPayload {
  username: string;
  embeds: DiscordEmbed[];
}

export interface SlackPayload {
  text: string;
  blocks: any[];
}

const COLOR_MAP: Record<AlertNotificationData["eventType"], number> = {
  freeze_executed: 0xd32f2f, // Red
  freeze_proposed: 0xff9800, // Orange
  vote_cast: 0x2196f3, // Blue
  high_risk_detected: 0x9c27b0, // Purple
  unfreeze_action: 0x4caf50, // Green
};

export function formatDiscordAlert(data: AlertNotificationData): DiscordPayload {
  const ts = data.timestamp || new Date().toISOString();
  const color = COLOR_MAP[data.eventType] || 0x607d8b;

  const fields = [
    { name: "Asset Code", value: `\`${data.assetCode}\``, inline: true },
    {
      name: "Target Account",
      value: `\`${data.targetAddress.slice(0, 8)}...${data.targetAddress.slice(-6)}\``,
      inline: true,
    },
  ];

  if (data.initiator) {
    fields.push({
      name: "Initiator",
      value: `\`${data.initiator.slice(0, 8)}...${data.initiator.slice(-6)}\``,
      inline: true,
    });
  }

  if (data.votesCurrent !== undefined && data.votesRequired !== undefined) {
    fields.push({
      name: "Quorum Progress",
      value: `${data.votesCurrent} / ${data.votesRequired} signatures`,
      inline: true,
    });
  }

  if (data.riskScore !== undefined) {
    fields.push({
      name: "AML Risk Score",
      value: `**${data.riskScore} / 100**`,
      inline: true,
    });
  }

  if (data.reason) {
    fields.push({
      name: "Reason / Memo",
      value: data.reason,
      inline: false,
    });
  }

  return {
    username: "Stellar-Guard Sentinel",
    embeds: [
      {
        title: `🛡️ Stellar-Guard: ${data.title}`,
        description: `Action event \`${data.eventType}\` triggered on Stellar network.`,
        color,
        fields,
        footer: { text: "Stellar-Guard Multi-Sig Asset Protection" },
        timestamp: ts,
      },
    ],
  };
}

export function formatSlackAlert(data: AlertNotificationData): SlackPayload {
  const fields = [
    { type: "mrkdwn", text: `*Asset:*\n\`${data.assetCode}\`` },
    {
      type: "mrkdwn",
      text: `*Target:*\n\`${data.targetAddress.slice(0, 8)}...${data.targetAddress.slice(-6)}\``,
    },
  ];

  if (data.initiator) {
    fields.push({
      type: "mrkdwn",
      text: `*Initiator:*\n\`${data.initiator.slice(0, 8)}...${data.initiator.slice(-6)}\``,
    });
  }

  if (data.votesCurrent !== undefined && data.votesRequired !== undefined) {
    fields.push({
      type: "mrkdwn",
      text: `*Progress:*\n${data.votesCurrent}/${data.votesRequired} Signatures`,
    });
  }

  return {
    text: `Stellar-Guard Alert: ${data.title} (${data.assetCode})`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `🛡️ Stellar-Guard Governance Alert: ${data.title}`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields,
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Event: *${data.eventType}* | Timestamp: ${data.timestamp || new Date().toISOString()}`,
          },
        ],
      },
    ],
  };
}
