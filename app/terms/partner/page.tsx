export default function PartnerTermsPage() {
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
          href="/partner"
          className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs sm:text-sm text-white hover:bg-white/15"
        >
          Partner Dashboard
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
              Crew Partner Terms & Fair Use Policy
            </span>
          </div>

          <div className="mt-4 sm:mt-5 px-2 shrink-0">
            <h2 className="text-3xl sm:text-4xl font-semibold text-white">
              Crew Partner Terms & Fair Use Policy
            </h2>
            <p className="text-white/75 mt-2 text-sm sm:text-base">
              These rules apply to approved CrewOceanLink onboard partners and
              voucher resellers.
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
              <Section number="1" title="Partner Program Overview">
                <p>
                  CrewOceanLink Crew Partners are authorized onboard resellers
                  and operational partners for CrewOceanLink internet vouchers.
                </p>
                <p>
                  By participating in the Crew Partner program, ordering
                  vouchers, selling vouchers or accessing the Partner Dashboard,
                  the partner accepts these Crew Partner Terms & Fair Use Policy.
                </p>
              </Section>

              <Section number="2" title="Voucher Sales Rules">
                <p>
                  Crew Partners may only sell valid CrewOceanLink vouchers
                  issued through the official CrewOceanLink system.
                </p>
                <ul>
                  <li>Do not modify voucher pricing unless authorized.</li>
                  <li>Do not resell vouchers outside approved channels.</li>
                  <li>Do not share partner dashboard access.</li>
                  <li>Do not create unauthorized voucher copies.</li>
                  <li>Do not sell used, expired or disabled vouchers.</li>
                  <li>Do not sell outside the assigned ship without approval.</li>
                </ul>
              </Section>

              <Section number="3" title="Pricing Policy & Commission Models">
                <p>
                  CrewOceanLink may operate different partner and commission
                  models depending on ship configuration.
                </p>
                <p>
                  Voucher resale pricing may be fixed or controlled by
                  CrewOceanLink depending on the assigned plan and commission
                  model. Mandatory resale prices must be respected where
                  displayed.
                </p>
                <p>
                  Unauthorized pricing manipulation may result in commission
                  loss, voucher suspension, partner account restriction or
                  removal from the partner program.
                </p>
              </Section>

              <Section number="4" title="M1 Model – Partner-Owned Hardware">
                <p>
                  Under the M1 model, onboard hardware is purchased directly by
                  the Crew Partner. The hardware becomes the responsibility and
                  property of the partner.
                </p>
                <ul>
                  <li>Hardware handling</li>
                  <li>Installation support</li>
                  <li>Maintenance coordination</li>
                  <li>Protection against damage or loss</li>
                  <li>Operational use onboard</li>
                </ul>
                <p>
                  The partner may transfer or resell the hardware together with
                  the onboard business operation, provided this does not violate
                  CrewOceanLink operational rules, platform access rules or
                  intellectual property rights.
                </p>
                <p>
                  Ownership of hardware under M1 does not grant ownership of the
                  CrewOceanLink platform, software, dashboard, voucher system or
                  brand.
                </p>
              </Section>

              <Section
                number="5"
                title="M2 Model – Deposit / CrewOceanLink-Owned Hardware"
              >
                <p>
                  Under the M2 model, the partner pays a deposit or security
                  collateral for onboard hardware. The deposit is not a purchase
                  payment.
                </p>
                <p>
                  All onboard hardware provided under M2 remains the exclusive
                  property of CrewOceanLink.
                </p>
                <ul>
                  <li>Do not sell the hardware.</li>
                  <li>Do not transfer ownership.</li>
                  <li>Do not lease or give away the hardware.</li>
                  <li>Do not remove the hardware from the vessel.</li>
                  <li>Do not use hardware outside authorized operations.</li>
                </ul>
                <p>
                  CrewOceanLink may disable hardware, restrict access, suspend
                  onboard services or recover equipment where necessary to
                  protect company property and operations.
                </p>
              </Section>

              <Section
                number="6"
                title="Partner Departure, Ship Change, Reassignment & Inactivity"
              >
                <p>
                  Maritime crew operations may involve ship changes, vacation
                  periods, reassignment, contract completion or temporary
                  inactivity.
                </p>
                <p>
                  If a Crew Partner leaves a vessel, changes ship assignment or
                  becomes inactive for an extended period, CrewOceanLink may
                  determine the operational handling of the onboard equipment.
                </p>
                <ul>
                  <li>Equipment may remain onboard for a replacement partner.</li>
                  <li>Equipment may be transferred to another approved vessel.</li>
                  <li>
                    The partner may temporarily keep equipment for future
                    reassignment if approved.
                  </li>
                  <li>Equipment may be required to be returned.</li>
                </ul>
              </Section>

              <Section number="7" title="Voucher Responsibility">
                <p>Crew Partners are responsible for:</p>
                <ul>
                  <li>Selling vouchers correctly</li>
                  <li>Providing the correct voucher code</li>
                  <li>Handling customer interactions professionally</li>
                  <li>Keeping dashboard access secure</li>
                  <li>Protecting voucher confidentiality</li>
                  <li>Following onboard operational procedures</li>
                </ul>
              </Section>

              <Section number="8" title="Fair Use & Abuse Prevention">
                <p>Partners must not:</p>
                <ul>
                  <li>Abuse the voucher system</li>
                  <li>Create fake sales</li>
                  <li>Attempt system manipulation</li>
                  <li>Redistribute vouchers without authorization</li>
                  <li>Attempt unauthorized administrative access</li>
                  <li>Share internal system information</li>
                  <li>Misuse customer data</li>
                </ul>
                <p>
                  CrewOceanLink may investigate suspicious activity and suspend
                  partner access if abuse is suspected.
                </p>
              </Section>

              <Section number="9" title="Payment Rules">
                <p>
                  Partners are responsible for paying outstanding voucher orders
                  according to the agreed payment methods.
                </p>
                <p>
                  CrewOceanLink may delay voucher delivery, restrict partner
                  ordering, suspend partner accounts or limit voucher generation
                  if payments remain outstanding.
                </p>
              </Section>

              <Section number="10" title="Refunds and Customer Complaints">
                <p>
                  Crew Partners must not independently promise refunds without
                  CrewOceanLink approval.
                </p>
                <p>
                  Refund decisions remain under CrewOceanLink control. Technical
                  complaints or billing disputes should be directed to official
                  CrewOceanLink support.
                </p>
              </Section>

              <Section number="11" title="Dashboard Access">
                <p>Partner dashboard access is personal and restricted.</p>
                <ul>
                  <li>Do not share login credentials.</li>
                  <li>Do not allow unauthorized access.</li>
                  <li>Do not use shared accounts.</li>
                  <li>Do not attempt administrative access.</li>
                  <li>Do not access other partner accounts.</li>
                </ul>
              </Section>

              <Section number="12" title="Operational Limitations">
                <p>
                  Internet availability and service quality may vary due to
                  satellite limitations, weather, ship position, network load,
                  maintenance and maritime operational factors.
                </p>
                <p>
                  Partners must not guarantee uninterrupted service or guaranteed
                  speeds to customers.
                </p>
              </Section>

              <Section number="13" title="Partner Conduct">
                <p>
                  Crew Partners are expected to behave professionally and
                  responsibly onboard.
                </p>
                <p>
                  CrewOceanLink may suspend or terminate partner participation
                  for fraud, abuse, harassment, repeated complaints,
                  misrepresentation, unauthorized pricing, security violations,
                  non-payment or brand-damaging behavior.
                </p>
              </Section>

              <Section
                number="14"
                title="Partner Earnings, Commission & No Guaranteed Income"
              >
                <p>
                  CrewOceanLink partner earnings depend on actual onboard voucher
                  sales and operational conditions.
                </p>
                <ul>
                  <li>No minimum income is guaranteed.</li>
                  <li>No minimum sales volume is guaranteed.</li>
                  <li>No guaranteed commissions or profitability.</li>
                  <li>No fixed customer demand.</li>
                </ul>
                <p>
                  Revenue examples or projections are illustrative only and do
                  not constitute a financial guarantee.
                </p>
              </Section>

              <Section
                number="15"
                title="Taxes, Legal Compliance & Local Responsibilities"
              >
                <p>
                  Crew Partners are individually responsible for complying with
                  applicable laws, tax obligations and reporting requirements in
                  their country of residence, nationality, vessel jurisdiction or
                  operational area.
                </p>
                <p>
                  CrewOceanLink does not provide tax, legal or accounting advice.
                </p>
              </Section>

              <Section number="16" title="Independent Contractor Relationship">
                <p>
                  CrewOceanLink Crew Partners operate as independent participants
                  and not as employees, agents or representatives of
                  CrewOceanLink.
                </p>
                <p>
                  Participation does not create salary entitlement, employee
                  benefits, insurance coverage, pension rights or agency
                  authority.
                </p>
              </Section>

              <Section number="17" title="Account Suspension & Termination">
                <p>
                  CrewOceanLink may suspend, restrict or terminate partner
                  access, onboard operations or related services where necessary
                  to protect the platform, hardware, network, business
                  operations or other users.
                </p>
              </Section>

              <Section number="18" title="No Exclusivity & Operational Rights">
                <p>
                  Participation does not create exclusive territorial,
                  vessel-based or operational rights.
                </p>
                <p>
                  CrewOceanLink may appoint additional partners, change
                  operational structures, modify ship assignments, adjust sales
                  models or modify commission structures where required.
                </p>
              </Section>

              <Section
                number="19"
                title="Intellectual Property, Branding & System Ownership"
              >
                <p>
                  All CrewOceanLink systems, branding elements and operational
                  infrastructure remain the exclusive property of CrewOceanLink
                  unless explicitly agreed otherwise in writing.
                </p>
                <p>
                  Partners may not copy systems, clone the platform, use branding
                  without authorization, create competing systems using
                  CrewOceanLink materials or represent CrewOceanLink intellectual
                  property as their own.
                </p>
              </Section>

              <Section number="20" title="Confidentiality & Internal Information">
                <p>
                  Crew Partners may receive access to internal operational,
                  commercial or technical information. Partners agree to treat
                  non-public information as confidential.
                </p>
                <p>
                  Confidentiality obligations continue after termination of the
                  partner relationship.
                </p>
              </Section>

              <Section number="21" title="Governing Law & Jurisdiction">
                <p>
                  These Crew Partner Terms & Fair Use Policy shall be governed by
                  and interpreted in accordance with the laws of Switzerland.
                </p>
                <p>
                  The exclusive place of jurisdiction for disputes arising from
                  or related to CrewOceanLink services, partner operations or
                  related agreements shall be Switzerland.
                </p>
              </Section>

              <Section number="22" title="Limitation of Liability">
                <p>
                  CrewOceanLink is not liable for lost sales, missed commissions,
                  service interruptions, customer disputes, device problems,
                  satellite interruptions, indirect losses, consequential damages
                  or operational interruptions outside CrewOceanLink control.
                </p>
              </Section>

              <Section number="23" title="Company Information / Partner Support">
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
              <div className="text-white text-sm">Partner sales access</div>
              <div className="text-white/70 text-xs mt-0.5">
                Manage voucher stock. Track sales. Order new vouchers.
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