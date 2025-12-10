const MOCK_POSTS = [
  { handle: "@maya.vibes", text: "Just got accepted as a Sauce ambassador 🧃🔥" },
  { handle: "@jordanfitness", text: "First brand deal through Sauce was insane!" },
  { handle: "@alexthegreat", text: "The perks are actually unreal" },
  { handle: "@sarahcreates", text: "Finally a program that values creators" },
  { handle: "@miketheconnector", text: "3 campaigns in my first month 💰" },
  { handle: "@emmastyle", text: "This is how you do campus marketing right" },
];

export const SocialProofTicker = () => {
  return (
    <div className="w-full overflow-hidden py-4 border-y border-border/30">
      <div className="ticker-scroll flex gap-8 whitespace-nowrap">
        {[...MOCK_POSTS, ...MOCK_POSTS].map((post, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2 glass-card rounded-full">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent" />
            <span className="text-primary font-medium">{post.handle}</span>
            <span className="text-muted-foreground">{post.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};