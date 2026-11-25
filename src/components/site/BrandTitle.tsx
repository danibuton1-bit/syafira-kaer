import logo from "@/assets/syafira-logo.jpg.asset.json";

export function BrandTitle({ size = "sm" }: { size?: "sm" | "lg" }) {
  const big = size === "lg";
  return (
    <div className={`flex items-center ${big ? "flex-col gap-6" : "gap-3"}`}>
      <div className={`shine-box shrink-0 rounded-full border-4 border-primary shadow-xl ${big ? "h-44 w-44 md:h-56 md:w-56" : "h-11 w-11 border-2"}`}>
        <img src={logo.url} alt="Logo Syafira Kaer" className="h-full w-full object-cover" />
      </div>
      <span className={`shine-text font-script leading-none ${big ? "text-6xl md:text-8xl" : "text-3xl"}`}>Syafira Kaer</span>
    </div>
  );
}
