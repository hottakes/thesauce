const BRANDS = [
  "Monster Energy",
  "Smirnoff",
  "GymShark",
  "Prime",
  "Redbull",
  "Spotify",
];

export const BrandLogos = () => {
  return (
    <div className="w-full py-8">
      <p className="text-center text-sm text-muted-foreground mb-6">
        Brands we work with
      </p>
      <div className="flex flex-wrap justify-center gap-6 opacity-50">
        {BRANDS.map((brand) => (
          <div
            key={brand}
            className="px-6 py-3 rounded-lg border border-border/30 text-muted-foreground text-sm font-medium"
          >
            {brand}
          </div>
        ))}
      </div>
    </div>
  );
};