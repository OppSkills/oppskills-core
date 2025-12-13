export enum ClerkWebhookEventType {
    USER_CREATED = 'user.created',
    USER_CREATED_AT_EDGE = 'user.createdAtEdge',
    USER_UPDATED = 'user.updated',
    USER_DELETED = 'user.deleted',
}  
  
export interface ClerkWebhookRequestDto {
    data: {
        id: string;
        email_addresses: Array<{
          email_address: string;
          id: string;
          verification: {
            status: string;
            strategy?: string;
            attempts?: number;
            expire_at?: number;
          };
          created_at: number;
          updated_at: number;
          object: string;
          linked_to: unknown[];
          reserved: boolean;
        }>;
        first_name: string;
        last_name: string;
        created_at: number;
        updated_at: number;
        password_enabled: boolean;
        banned: boolean;
        has_image: boolean;
        image_url: string;
        profile_image_url: string;
        primary_email_address_id: string;
        private_metadata: Record<string, unknown>;
        unsafe_metadata: Record<string, unknown>;
      };
      event_attributes: {
        http_request: {
          client_ip: string;
          user_agent: string;
        };
      };
      object: string;
      timestamp: number;
      type: ClerkWebhookEventType;
} 