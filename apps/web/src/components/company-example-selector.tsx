"use client";

import { usePathname, useRouter } from "next/navigation";

import type { SupportedCompany } from "@/lib/api";

type CompanyExampleSelectorProps = {
  companies: SupportedCompany[];
  selectedCompany: SupportedCompany;
};

export function CompanyExampleSelector({
  companies,
  selectedCompany,
}: CompanyExampleSelectorProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <label className="company-example-selector">
      <span>Company example</span>
      <select
        aria-label="Choose a company example"
        onChange={(event) => {
          const params = new URLSearchParams();
          params.set("company", event.target.value);
          router.push(`${pathname}?${params.toString()}`);
        }}
        value={selectedCompany.slug}
      >
        {companies.map((company) => (
          <option key={company.ticker} value={company.slug}>
            {company.name} · {company.ticker}
          </option>
        ))}
      </select>
    </label>
  );
}
