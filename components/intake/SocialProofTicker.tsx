const MOCK_POSTS = [
  { 
    handle: "@maya.vibes", 
    text: "Just got accepted as a Sauce ambassador 🧃🔥",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
  },
  { 
    handle: "@jordanfitness", 
    text: "First brand deal through Sauce was insane!",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
  },
  { 
    handle: "@alexthegreat", 
    text: "The perks are actually unreal",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face"
  },
  { 
    handle: "@sarahcreates", 
    text: "Finally a program that values creators",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face"
  },
  { 
    handle: "@miketheconnector", 
    text: "3 campaigns in my first month 💰",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face"
  },
  { 
    handle: "@emmastyle", 
    text: "This is how you do campus marketing right",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=face"
  },
];

export const SocialProofTicker = () => {
  return (
    <div className="w-full overflow-hidden py-4 border-y border-border/30">
      <div className="ticker-scroll flex gap-8 whitespace-nowrap">
        {[...MOCK_POSTS, ...MOCK_POSTS].map((post, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2 glass-card rounded-full">
            <img 
              src={post.avatar} 
              alt={post.handle}
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-primary font-medium">{post.handle}</span>
            <span className="text-muted-foreground">{post.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
