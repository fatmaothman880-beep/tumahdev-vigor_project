export interface Manufacturer { id: string; name: string; works: string }

/** Add site defaults and historical suppliers without rewriting existing records. */
export function mergeManufacturerCatalogue(
  existing: Manufacturer[] = [],
  voyages: { manufacturerId?: string; manufacturerName?: string }[] = [],
  queue: { manufacturerName?: string }[] = [],
): Manufacturer[] {
  const result = existing.map(row => ({ ...row }));
  const add = (name?: string, suggestedId?: string) => {
    if (!name?.trim() || result.some(row => row.name.toLowerCase() === name.trim().toLowerCase())) return;
    let id = suggestedId || `manufacturer-${result.length + 1}`;
    while (result.some(row => row.id === id)) id += '-imported';
    result.push({ id, name: name.trim(), works: name.trim() });
  };
  add('Mtwara Cement Factory', 'mtwara');
  voyages.forEach(row => add(row.manufacturerName, row.manufacturerId));
  queue.forEach(row => add(row.manufacturerName));
  return result;
}
