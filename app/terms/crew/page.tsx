export default function CrewTermsPage() {
  return (
    <main className="min-h-screen w-full relative text-white overflow-hidden">
      <img
        src="/msc-ship.jpg"
        className="absolute w-full h-full object-cover"
        alt="msc ship"
      />

      <div className="absolute inset-0 bg-black/45" />

      <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-7 sm:right-7 flex justify-between items-center z-20">
        <h1 className="text-white text-base sm:text-xl font-medium">
          CrewOceanLink
        </h1>

        <a
          href="/crew/dashboard"
          className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs sm:text-sm text-white hover:bg-white/15"
        >
          Crew Dashboard
        </a>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-3 py-20 sm:px-4">
        <div
          className="
            w-full max-w-5xl max-h-[calc(100vh-6rem)]
            rounded-3xl bg-white/[0.03] backdrop-blur-[5px]
            border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.35)]
            p-3 sm:p-4 flex flex-col
          "
        >
          <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/20 px-4 py-3 text-center shrink-0">
            <span className="inline-flex rounded-full bg-white/15 border border-white/20 px-4 py-1.5 text-xs sm:text-sm font-medium text-white">
              Crew Terms & Fair Use Policy
            </span>
          </div>

          <div className="mt-4 sm:mt-5 px-2 shrink-0">
            <h2 className="text-3xl sm:text-4xl font-semibold text-white">
              Crew Terms & Fair Use Policy
            </h2>
            <p className="text-white/75 mt-2 text-sm sm:text-base">
              These rules apply to crew members using CrewOceanLink prepaid
              voucher internet access.
            </p>
          </div>

          <div
            className="
              mt-4 rounded-2xl bg-white/5 backdrop-blur-[6px]
              border border-white/15 shadow-inner
              flex-1 min-h-0 overflow-y-auto
            "
          >
            <div className="divide-y divide-white/10">
              <Section number="1" title="Service Overview">
                <p>
                  CrewOceanLink provides prepaid onboard internet access for
                  crew members through individual data vouchers. By purchasing,
                  activating or using a voucher, the user accepts these Crew
                  Terms & Fair Use Policy.
                </p>
                <p>
                  The service operates on shared maritime satellite internet
                  infrastructure. Availability, speed and performance may vary
                  depending on ship position, satellite coverage, weather,
                  network load, technical systems and onboard operational
                  conditions.
                </p>
              </Section>

              <Section number="2" title="Voucher Use">
                <p>
                  Each voucher includes a fixed amount of data, a unique voucher
                  code and a limited usage entitlement. The voucher is intended
                  for personal use by the assigned user only.
                </p>
                <p>
                  The user is responsible for keeping the voucher code private
                  and for all data usage generated through the voucher.
                </p>
              </Section>

              <Section number="3" title="One User / One Device Rule">
                <p>
                  Unless explicitly allowed otherwise, each voucher is intended
                  for one user and one personal device.
                </p>
                <ul>
                  <li>Do not share the voucher with other people.</li>
                  <li>Do not resell the voucher.</li>
                  <li>Do not use the voucher as a public hotspot.</li>
                  <li>Do not bypass device or session restrictions.</li>
                </ul>
                <p>
                  If misuse is detected, CrewOceanLink may restrict, disconnect
                  or disable the voucher without refund.
                </p>
              </Section>

              <Section number="4" title="Fair Use Rules">
                <p>
                  CrewOceanLink operates on limited shared satellite capacity.
                  Fair use is required to protect the internet experience of all
                  users onboard.
                </p>
                <ul>
                  <li>No network abuse or overload.</li>
                  <li>No illegal activity.</li>
                  <li>No hacking, scanning or network attacks.</li>
                  <li>No unauthorized resale or redistribution.</li>
                  <li>No public hotspots or server operation unless allowed.</li>
                  <li>No circumvention of network restrictions.</li>
                </ul>
                <p>
                  CrewOceanLink may apply traffic management, temporary
                  restrictions, session termination or voucher suspension if fair
                  use is violated.
                </p>
              </Section>

              <Section number="5" title="High Bandwidth Usage">
                <p>
                  Streaming, cloud backups, large downloads, game updates,
                  software updates, video calls and hotspot sharing may use large
                  amounts of data and affect onboard network performance.
                </p>
                <p>
                  Data used by background apps, system updates, cloud services or
                  automatic processes will be counted against the voucher.
                </p>
              </Section>

              <Section number="6" title="VPN Usage">
                <p>
                  Normal personal or business VPN use is generally permitted.
                  VPN use may be restricted if it is used to bypass rules, mask
                  abuse, redistribute access, generate excessive traffic or
                  interfere with network operation.
                </p>
              </Section>

              <Section number="7" title="Session Rules">
                <p>
                  CrewOceanLink may manage, limit or terminate sessions to
                  protect network stability and fair access. Sessions may be
                  disconnected if the voucher is exhausted, expired, abused,
                  shared, or affects other users.
                </p>
              </Section>

              <Section number="8" title="Refund Policy">
                <p>
                  Voucher purchases are generally final. No refund is normally
                  provided once a voucher has been delivered, activated or used.
                </p>
                <p>
                  Refunds may be considered only for duplicate payment, incorrect
                  voucher delivery or technical failure caused directly by
                  CrewOceanLink.
                </p>
              </Section>

              <Section number="9" title="Expired, Exhausted or Disabled Vouchers">
                <p>
                  A voucher may become unavailable if the data allowance is fully
                  used, the voucher expires, misuse is detected, payment issues
                  occur or security rules are violated.
                </p>
                <p>
                  Remaining data on disabled or expired vouchers is not
                  guaranteed to be restored.
                </p>
              </Section>

              <Section number="10" title="Network Availability">
                <p>
                  Service may be limited or interrupted due to satellite
                  coverage, weather, ship position, port interference, hardware
                  issues, maintenance, high onboard usage or third-party service
                  limitations.
                </p>
                <p>
                  CrewOceanLink does not guarantee uninterrupted service, minimum
                  speed or permanent availability.
                </p>
              </Section>

              <Section number="11" title="Privacy and Technical Data">
                <p>
                  CrewOceanLink may process technical network data required to
                  operate and protect the service, including voucher usage, data
                  consumption, session status, device connection information,
                  network access records and security-related events.
                </p>
                <p>
                  This information is used for service operation,
                  troubleshooting, billing, fair use enforcement and network
                  protection. CrewOceanLink does not sell crew user data.
                </p>
              </Section>

              <Section number="12" title="Limitation of Liability">
                <p>
                  CrewOceanLink is not liable for temporary outages, reduced
                  speeds, satellite interruptions, missed communications, data
                  loss, personal device problems, app issues or indirect damages.
                  The service is provided on a best-effort basis.
                </p>
              </Section>

              <Section number="13" title="Company Information / Support">
                <p>CrewOceanLink</p>
                <p>Neugonzenbach 8</p>
                <p>9601 Lütisburg-Station</p>
                <p>Switzerland</p>
                <p>Email: info@crewoceanlink.com</p>
                <p>WhatsApp: +41 77 280 04 01</p>
              </Section>
            </div>
          </div>

          <div className="pt-2 shrink-0">
            <div className="rounded-2xl bg-white/[0.06] border border-white/15 px-4 py-2 sm:py-2.5">
              <div className="text-white text-sm">Private crew access</div>
              <div className="text-white/70 text-xs mt-0.5">
                One voucher. One device. Live data tracking.
              </div>
            </div>

            <div className="mt-2 text-center text-white/75 text-[11px] sm:text-xs space-y-0.5">
              <div>Need help? info@crewoceanlink.com</div>
              <div>WhatsApp: +41 77 280 04 01</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-[56px_1fr] gap-3 sm:gap-5 px-4 py-5 sm:px-6 sm:py-6">
      <div className="h-12 w-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white font-semibold shadow">
        {number}
      </div>

      <div className="text-white/78 text-sm leading-6">
        <h3 className="text-white text-base sm:text-lg font-semibold mb-2">
          {number}. {title}
        </h3>

        <div className="space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1">
          {children}
        </div>
      </div>
    </section>
  );
}