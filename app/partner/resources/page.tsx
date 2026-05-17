"use client";

const resources = [
  {
    title: "Crew Guide",
    description: "Internet access and voucher usage for crew members.",
    file: "https://crewoceanlink.com/resources/guides/crew-internet-guide.png",
  },
  {
    title: "Crew Partner Guide",
    description: "How to sell, assign and manage vouchers onboard.",
    file: "https://crewoceanlink.com/resources/guides/crew-partner-dashboard-guide.png",
  },
  {
    title: "System Setup Guide",
    description: "Plug & play onboard system setup.",
    file: "https://crewoceanlink.com/resources/guides/system-setup-guide.png",
  },
  {
    title: "Dish Mount Guide",
    description: "Satellite dish railing mount and cable routing.",
    file: "https://crewoceanlink.com/resources/guides/satellite-dish-mount-guide.png",
  },
  {
    title: "Crew Partner Application",
    description: "Overview for becoming a CrewOceanLink partner.",
    file: "https://crewoceanlink.com/resources/marketing/crew-partner-application-guide.jpeg",
  },
  {
    title: "How CrewOceanLink Works",
    description: "Simple overview of the onboard internet system.",
    file: "https://crewoceanlink.com/resources/marketing/how-crewoceanlink-works.jpeg",
  },
  {
    title: "Plug & Play System",
    description: "Fast maritime deployment overview.",
    file: "https://crewoceanlink.com/resources/marketing/plug-and-play-system.png",
  },
  {
    title: "Crew Partner Earnings",
    description: "Realistic earning opportunity overview.",
    file: "https://crewoceanlink.com/resources/pricing/crew-partner-earnings.jpeg",
  },
  {
    title: "Small Crew Pricing",
    description: "Voucher pricing for small crews.",
    file: "https://crewoceanlink.com/resources/pricing/small-crew-packages-pricing.jpeg",
  },
  {
    title: "Large Crew Pricing",
    description: "Voucher pricing for large crews.",
    file: "https://crewoceanlink.com/resources/pricing/large-crew-packages-pricing.jpeg",
  },
];

export default function PartnerResourcesPage() {
  return (
    <div className="min-h-screen w-full relative text-white overflow-hidden">
      <img
        src="/msc-ship.jpg"
        className="absolute w-full h-full object-cover"
        alt="msc ship"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/20 to-black/45" />

      <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-7 sm:right-7 flex justify-between items-center z-20">
        <h1 className="text-white text-base sm:text-xl font-medium">
          CrewOceanLink
        </h1>

        <div className="flex items-center gap-3">
          <span className="text-white text-base sm:text-xl font-medium">
            Crew Partner Dashboard
          </span>

          <button
            type="button"
            onClick={() => {
              window.location.href = "/login";
            }}
            className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs sm:text-sm text-white hover:bg-white/15"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-3 pt-20 pb-6">
        <div
          className="
            w-full max-w-5xl mx-auto rounded-3xl
            bg-white/[0.04] backdrop-saturate-150 backdrop-blur-[6px]
            border border-white/20
            shadow-[0_8px_32px_rgba(0,0,0,0.25)]
            p-4 sm:p-6
          "
        >
          <button
            type="button"
            onClick={() => window.history.back()}
            className="text-white/90 hover:text-white text-sm mb-8"
          >
            ← Back to Dashboard
          </button>

          <div className="mb-8">
            <div className="text-3xl sm:text-4xl font-medium text-white">
              Resources & Guides
            </div>

            <div className="text-white/75 text-sm sm:text-base mt-2">
              Download helpful guides and marketing materials.
            </div>
          </div>

          <div className="space-y-2">
            {resources.map((item) => (
              <a
                key={item.title}
                href={item.file}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  flex items-center justify-between gap-4
                  rounded-2xl bg-white/[0.08] hover:bg-white/[0.12]
                  border border-white/15
                  px-4 py-4 transition
                "
              >
                <div>
                  <div className="text-white text-base font-medium">
                    {item.title}
                  </div>

                  <div className="text-white/65 text-sm mt-1">
                    {item.description}
                  </div>
                </div>

                <div className="text-cyan-300 text-sm font-medium shrink-0">
                  Open →
                </div>
              </a>
            ))}
          </div>

          <div className="mt-8 pt-5 border-t border-white/15 text-center text-white/75 text-xs sm:text-sm">
            Need help?{" "}
            <a href="mailto:info@crewoceanlink.com" className="text-white font-medium">
              info@crewoceanlink.com
            </a>
            <span className="mx-3 text-white/30">|</span>
            WhatsApp:{" "}
            <a
              href="https://wa.me/41772800401"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-medium"
            >
              +41 77 280 04 01
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}