export type Conversation = {
  id: string;
  phone: string;
  name: string | null;
  mode: "agent" | "human";
  updated_at: string;
  created_at: string;
};

export type ConversationWithPreview = Conversation & {
  last_message: string | null;
  last_message_at: string | null;
};

export type Message = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  whatsapp_msg_id: string | null;
  created_at: string;
};

export type MetaWebhookPayload = {
  object: string;
  entry: Array<{
    changes: Array<{
      value: {
        messages?: Array<{
          from: string;
          type: string;
          text?: { body: string };
          timestamp: string;
          id: string;
        }>;
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        statuses?: unknown[];
      };
    }>;
  }>;
};
