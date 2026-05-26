import { CommunityDetails, Follower, Post } from "./types";

export const initialCommunityDetails: CommunityDetails = {
  name: "Antrophic",
  handle: "AiNormal",
  isVerified: true,
  followers: 14000,
  following: 0,
  bannerUrl: null, // Starts null, we will support uploads/fallback nicely
  logoUrl: null, // Starts null, we will support uploads/fallback nicely
  description:
    "We're an AI safety and research company that builds reliable, interpretable, and steerable AI systems.",
  aboutText:
    "Pizza ipsum dolor meat lovers buffalo. Spinach pork meatball burnt sauce anchovies. Stuffed sauce green peppers style hand ipsum. Lovers tossed broccoli melted cheese fresh Bianca extra lot hand. Pesto roll fresh sauce sauce fresh olives pepperoni ranch. Spinach Aussie Hawaiian pineapple large ranch thin pineapple platter. Pork fresh garlic style crust. Garlic bell personal mayo burnt onion style sautéed style. And fresh pan onions pineapple sauce pie.",
  aboutBullets: [
    "Pizza ipsum dolor meat lovers buffalo. Spinach pork meatball burnt sauce anchovies.",
    "Stuffed sauce green peppers style hand ipsum.",
    "Lovers tossed broccoli melted cheese fresh Bianca extra lot hand.",
    "Pesto roll fresh sauce sauce fresh olives pepperoni ranch.",
  ],
  aboutSecondaryText:
    "Spinach Aussie Hawaiian pineapple large ranch thin pineapple platter. Pork fresh garlic style crust. Garlic bell personal mayo burnt onion style sautéed style. And fresh pan onions pineapple sauce pie.",
};

export const mockFollowers: Follower[] = [
  {
    id: "f1",
    name: "Liora Dunne",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    followersCount: 135,
    timeframe: "5 hrs ago",
  },
  {
    id: "f2",
    name: "Kian Mercer",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    followersCount: 304,
    timeframe: "1 day ago",
  },
  {
    id: "f3",
    name: "Seline Voss",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
    followersCount: 197,
    timeframe: "3 days ago",
  },
  {
    id: "f4",
    name: "Ravi Patel",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
    followersCount: 512,
    timeframe: "5 hrs ago",
  },
  {
    id: "f5",
    name: "Nia Coleman",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
    followersCount: 275,
    timeframe: "6 days ago",
  },
  {
    id: "f6",
    name: "Jesper Lin",
    avatar:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop",
    followersCount: 198,
    timeframe: "22 mins ago",
  },
  {
    id: "f7",
    name: "Freya Moss",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop",
    followersCount: 160,
    timeframe: "4 days ago",
  },
  {
    id: "f8",
    name: "Tariq El-Sayed",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop",
    followersCount: 320,
    timeframe: "7 hrs ago",
  },
  {
    id: "f9",
    name: "Elena Cruz",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop",
    followersCount: 245,
    timeframe: "3 mins ago",
  },
];

export const mockPosts: Post[] = [
  {
    id: "p1",
    authorName: "Antrophic",
    authorAvatar: "/logos/anthropic.png",
    followersCount: 20000,
    timeframe: "2 days ago",
    content:
      "Pizza ipsum dolor meat lovers buffalo. Spinach pork meatball burnt sauce anchovies. Stuffed sauce green peppers style hand ipsum. Lovers tossed broccoli melted cheese fresh Bianca extra lot hand. Pesto roll fresh sauce sauce fresh olives pepperoni ranch. Spinach Aussie Hawaiian pineapple large ranch thin...",
    images: [
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80",
    ],
    likes: 500,
    commentsCount: 80,
    reposts: 50,
    shares: 400,
    isLiked: true,
    comments: [
      {
        id: "c1",
        authorName: "Antrophic",
        authorAvatar: "/logos/anthropic.png",
        followersCount: 20000,
        timeframe: "2 days ago",
        content:
          "Pizza ipsum dolor meat lovers buffalo. Spinach pork meatball burnt sauce anchovies. Stuffed sauce green peppers style hand ipsum. Lovers tossed broccoli melted cheese fresh Bianca extra lot hand. Pesto roll fresh sauce sauce fresh olives pepperoni ranch. Spinach Aussie Hawaiian pin...",
        likes: 1500,
        isLiked: true,
      },
      {
        id: "c2",
        authorName: "Antrophic",
        authorAvatar: "/logos/anthropic.png",
        followersCount: 20000,
        timeframe: "2 days ago",
        content:
          "Pizza ipsum dolor meat lovers buffalo. Spinach pork meatball burnt sauce anchovies. Stuffed sauce green peppers style hand ipsum. Lovers tossed broccoli melted cheese fresh Bianca extra lot hand. Pesto roll fresh sauce sauce fresh olives pepperoni ranch. Spinach Aussie Hawaiian pin...",
        likes: 1500,
        isLiked: false,
      },
    ],
  },
  {
    id: "p2",
    authorName: "Antrophic",
    authorAvatar: "/logos/anthropic.png",
    followersCount: 20000,
    timeframe: "2 days ago",
    content:
      "Pizza ipsum dolor meat lovers buffalo. Spinach pork meatball burnt sauce anchovies. Stuffed sauce green peppers style hand ipsum. Lovers tossed broccoli melted cheese fresh Bianca extra lot hand. Pesto roll fresh sauce sauce fresh olives pepperoni ranch. Spinach Aussie Hawaiian pineapple large ranch thin...",
    images: [
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&auto=format&fit=crop&q=80",
    ],
    likes: 300,
    commentsCount: 30,
    reposts: 15,
    shares: 400,
    isLiked: false,
    comments: [],
  },
];
