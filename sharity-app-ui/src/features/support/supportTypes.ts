export type SupportDashboardResponse = {
  searchPlaceholder: string;
  commonActions: SelfServiceSuggestionItem[];
  supportCategories: SupportCategoryItem[];
  openTicketCount: number;
  actionRequiredCount: number;
  unreadCount: number;
  recentTickets: SupportTicketSummary[];
  availableActions: string[];
};

export type SupportCategoryItem = {
  categoryCode: string;
  label: string;
  description: string;
  suggestedRelatedEntityTypes: string[];
  evidenceRecommendations: string[];
  selfServiceSuggestionTypes: string[];
  defaultPriorityHint: string;
  unsafeContentWarningRequired: boolean;
};

export type HelpSearchResultItem = {
  resultId: string;
  resultType: string;
  title: string;
  summary: string;
  categoryCode: string;
  route: string;
  actionLabel: string;
};

export type GuidedHelpFlowResponse = {
  flowId: string;
  categoryCode: string;
  title: string;
  steps: GuidedHelpStep[];
  suggestedActions: SelfServiceSuggestionItem[];
  createTicketRecommended: boolean;
};

export type GuidedHelpStep = {
  stepId: string;
  question: string;
  options: string[];
  explanation: string;
  nextStepMap: Record<string, string>;
};

export type SelfServiceSuggestionItem = {
  suggestionId: string;
  title: string;
  description: string;
  actionLabel: string;
  route: string;
  relatedEntityType: string;
  relatedEntityId: string;
};

export type CreateSupportTicketRequest = {
  categoryCode: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  subject: string;
  description: string;
  priorityHint: string;
  attachmentIds: string[];
  userAcknowledgedSafeSupportRules: boolean;
};

export type CreateSupportTicketResponse = {
  ticketId: string;
  ticketReference: string;
  status: string;
  priority: string;
  nextRoute: string;
  message: string;
};

export type SupportTicketSummary = {
  ticketId: string;
  ticketReference: string;
  categoryCode: string;
  subject: string;
  relatedEntityType: string;
  relatedEntityReference: string;
  status: string;
  priority: string;
  severity: string;
  lastUpdatedAt: string;
  unreadCount: number;
  actionRequired: boolean;
  escalated: boolean;
};

export type SupportTicketDetail = {
  ticketId: string;
  ticketReference: string;
  categoryCode: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  severity: string;
  relatedEntity: SupportRelatedEntity;
  messages: SupportTicketMessage[];
  attachments: SupportAttachmentItem[];
  timeline: SupportTicketTimelineEvent[];
  availableActions: string[];
  createdAt: string;
  updatedAt: string;
};

export type SupportRelatedEntity = {
  relatedEntityType: string;
  relatedEntityId: string;
  relatedEntityReference: string;
  status: string;
  summary: string;
  route: string;
  accessAllowed: boolean;
};

export type SupportTicketMessage = {
  messageId: string;
  senderType: string;
  senderDisplayName: string;
  body: string;
  attachments: SupportAttachmentItem[];
  createdAt: string;
  read: boolean;
  moderationStatus: string;
  systemMessage: boolean;
};

export type SupportAttachmentItem = {
  attachmentId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  previewUrl: string;
  uploadStatus: string;
  scanStatus: string;
  visibilityPolicy: string;
  createdAt: string;
};

export type SupportTicketTimelineEvent = {
  eventId: string;
  eventType: string;
  title: string;
  message: string;
  actorType: string;
  status: string;
  timestamp: string;
};

export type ReplySupportTicketRequest = {
  body: string;
  attachmentIds: string[];
  userAcknowledgedSafeSupportRules: boolean;
};

export type EscalateSupportTicketRequest = {
  escalationType: string;
  reason: string;
  message: string;
  additionalAttachmentIds: string[];
  userAcknowledgedEscalationRules: boolean;
};

export type SupportTicketActionResponse = {
  ticketId: string;
  status: string;
  message: string;
  updatedAt: string;
};

export type AdminSupportQueueItem = {
  ticketId: string;
  ticketReference: string;
  categoryCode: string;
  status: string;
  priority: string;
  severity: string;
  relatedEntityType: string;
  createdAt: string;
  updatedAt: string;
  assignedTo: string;
  escalationStatus: string;
};

export type SupportScreenData = {
  dashboard: SupportDashboardResponse;
  searchResults: HelpSearchResultItem[];
  guidedHelp: GuidedHelpFlowResponse;
  selfServiceSuggestions: SelfServiceSuggestionItem[];
  selectedTicket: SupportTicketDetail;
  relatedEntities: SupportRelatedEntity[];
  adminQueue: AdminSupportQueueItem[];
};
