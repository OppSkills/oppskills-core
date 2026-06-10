export type UserSelect = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
};

export const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  imageUrl: true,
} as const;

export const MESSAGE_INCLUDE = {
  sender: { select: USER_SELECT },
  replyTo: {
    select: {
      id: true,
      body: true,
      sender: { select: USER_SELECT },
    },
  },
  attachment: true,
} as const;
