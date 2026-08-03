// Mock API implementation returning Promises to simulate network requests.
// In the future, this would import the shared axios client from 'services/client.js'

const mockProfileData = {
  username: "redbull",
  name: "Red Bull",
  isVerified: true,
  postsCount: "11,561",
  followersCount: "33.2M",
  followingCount: "2,136",
  bio: "watch the World Of Red Bull👇",
  hashtag: "#givesyouwiiings",
  link: "www.redbull.com/int-en/cartoons/summer-social-wiiings and 1 more",
  threadsUsername: "redbull",
  followedBy: ["ljkuconfession", "ash_dykes"],
  followedByCount: 4,
  avatarUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/RedBullEnergyDrink.svg/1200px-RedBullEnergyDrink.svg.png"
};

const mockPersonas = [
  { id: 1, title: "Zero Excuses", imageUrl: "https://picsum.photos/id/10/200/200" },
  { id: 2, title: "Watersports", imageUrl: "https://picsum.photos/id/11/200/200" },
  { id: 3, title: "Airsports", imageUrl: "https://picsum.photos/id/12/200/200" },
  { id: 4, title: "Training", imageUrl: "https://picsum.photos/id/13/200/200" },
  { id: 5, title: "Bike", imageUrl: "https://picsum.photos/id/14/200/200" },
  { id: 6, title: "Wallpapers", imageUrl: "https://picsum.photos/id/15/200/200" },
  { id: 7, title: "Motorsports", imageUrl: "https://picsum.photos/id/16/200/200" },
];

const mockPosts = [
  {
    id: "post-1",
    subreddit: "r/ahmedabad",
    authorAvatar: "https://picsum.photos/id/102/32/32",
    timeAgo: "2 days ago",
    title: "My recent creations",
    description: "Here are some of the recent crocheted figures I made. What do you guys think? I spent a lot of time on these batmans.",
    imageUrl: "https://picsum.photos/id/103/600/600",
    upvotes: "109",
    commentsCount: "48",
    label: null,
    type: "image"
  },
  {
    id: "post-2",
    subreddit: "r/Advice",
    author: "u/Alarmed-Cookie-2849",
    authorAvatar: "https://picsum.photos/id/104/32/32",
    timeAgo: "13 hr. ago",
    title: "I cannot afford my own therapy",
    description: "I've been dealing with a lot of very stressful life events and don't really have a support system at the moment. I am living paycheck to paycheck and financially really can't afford therapy right now, but I feel like emotionally I can't afford not to go to therapy. I am really struggling. For months I have been searching for someone who takes my insurance and I am running into dead end after dead end. I have found a few who have taken my insurance but are not taking any new clients, or whose openings are during my 9-5. If I had the extra money, I would pay the $150-200 self-pay fees because I understand insurance companies make it very difficult for...",
    imageUrl: null,
    upvotes: "116",
    commentsCount: "63",
    label: "Rant - Advice wanted",
    type: "text"
  },
  {
    id: "post-3",
    subreddit: "r/crochet",
    authorAvatar: "https://picsum.photos/id/105/32/32",
    timeAgo: "5 hr. ago",
    title: "Another batch of orders done!",
    description: "Finished these just in time for the weekend market.",
    imageUrl: "https://picsum.photos/id/106/600/400",
    upvotes: "432",
    commentsCount: "12",
    label: "Finished Object",
    type: "image"
  }
];

const mockActivePersona = {
  id: 1,
  name: "Zero Excuses",
  avatarUrl: "https://picsum.photos/id/10/200/200",
  bio: "\"For all it was worth, it was worth all the while\" -Greenday",
  postsCount: "4,767"
};

const mockInterestFloor = [
  { id: 1, name: "r/ahmedabad", avatarUrl: "https://picsum.photos/id/30/32/32" },
  { id: 2, name: "r/announcements", avatarUrl: "https://picsum.photos/id/31/32/32" },
  { id: 3, name: "r/MemePiece", avatarUrl: "https://picsum.photos/id/32/32/32" },
  { id: 4, name: "r/okbuddyliterature", avatarUrl: "https://picsum.photos/id/33/32/32" },
  { id: 5, name: "r/PeterExplains", avatarUrl: "https://picsum.photos/id/34/32/32" },
  { id: 6, name: "r/ShinChan", avatarUrl: "https://picsum.photos/id/35/32/32" },
];

export const profileApi = {
  getProfile: (username) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockProfileData), 500);
    });
  },
  getPersonas: (username) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockPersonas), 600);
    });
  },
  getPosts: (username, page = 1) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockPosts), 700);
    });
  },
  getActivePersona: (username) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockActivePersona), 400);
    });
  },
  getInterestFloor: (personaId) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockInterestFloor), 450);
    });
  }
};
