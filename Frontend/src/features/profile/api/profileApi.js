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

const mockPosts = Array.from({ length: 15 }).map((_, i) => ({
  id: `post-${i}`,
  imageUrl: `https://picsum.photos/id/${i + 100}/400/400`,
  type: i % 3 === 0 ? 'video' : 'image', // some videos
}));

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
  }
};
