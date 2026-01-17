import { Link } from "wouter";

export function HeroCarousel() {
  const staticImage = "https://files.catbox.moe/ciy961.webp";

  return (
    <div className="relative w-full overflow-hidden rounded-2xl h-[260px] md:h-[360px] lg:h-[420px] bg-black group border border-border/50 shadow-2xl">
      <Link href="/games">
        <div className="absolute inset-0 block cursor-pointer">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-[1.02]"
            style={{
              backgroundImage: `url(${staticImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
        </div>
      </Link>
    </div>
  );
}
