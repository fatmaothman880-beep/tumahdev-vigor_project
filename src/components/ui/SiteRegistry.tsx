import React, { useEffect, useState } from 'react';
import { Anchor, Ship } from 'lucide-react';
import { USE_MOCK_API } from '../../api/client';
import { getSiteCatalogue, type SiteCatalogue } from '../../api/workflowApi';

export function SiteRegistry() {
  const [site, setSite] = useState<SiteCatalogue | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (USE_MOCK_API) return;
    void getSiteCatalogue().then(setSite).catch((error) => setError(error instanceof Error ? error.message : 'Unable to load site registry.'));
  }, []);
  if (USE_MOCK_API) return null;
  return <section className="bg-white border border-[#E1DED4] rounded-xl p-5 shadow-xs">
    <div className="flex items-center justify-between gap-3 mb-3"><div><h2 className="text-sm font-bold uppercase tracking-wider text-[#14181A]">Mangapwani Site Registry</h2><p className="text-xs text-[#3F4A47]">Reported site-survey records; confirm before operational use.</p></div><Anchor className="w-5 h-5 text-[#0E7C86]" /></div>
    {error ? <p className="text-xs text-[#AE3B2E]">{error}</p> : !site ? <p className="text-xs text-[#3F4A47]">Loading site registry…</p> : !site.configured ? <p className="text-xs text-[#3F4A47]">Site registry is not configured.</p> : <><p className="text-xs mb-3"><strong>Berth:</strong> {site.berth_label}</p><div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-2">{site.vessels.map((vessel) => <div key={vessel.vessel_id} className="rounded-lg border border-[#E1DED4] p-3"><div className="flex gap-2"><Ship className="w-4 h-4 text-[#0C9349]" /><strong className="text-xs">{vessel.name}</strong></div><p className="mt-1 text-xs font-mono">Reported cargo: {vessel.reported_cargo_t == null ? 'Not confirmed' : `${Number(vessel.reported_cargo_t).toLocaleString()} t`}</p>{vessel.temporary_label && <p className="text-[10px] text-[#B5760F]">Temporary vessel label</p>}</div>)}</div><p className="mt-3 text-[11px] text-[#3F4A47]">Reported cargo is not verified vessel capacity and remains editable for each visit.</p></>}
  </section>;
}
