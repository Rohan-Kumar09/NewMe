export async function downloadUrlAsFile(url: string, fallbackFilename?: string): Promise<string> {
  const res = await fetch(url, { method: 'GET', credentials: 'same-origin' });
  if (!res.ok) {
    let body = '';
    try { body = await res.text(); } catch (e) {}
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText} ${body}`);
  }

  const blob = await res.blob();

  let filename = fallbackFilename ?? `newme-${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`;
  try {
    const cd = res.headers.get('Content-Disposition') || res.headers.get('content-disposition');
    if (cd) {
      const m = cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
      if (m && m[1]) filename = decodeURIComponent(m[1]);
    } else {
      const ct = res.headers.get('Content-Type') || '';
      if (ct.includes('png')) filename = filename.replace('.jpg', '.png');
      else if (ct.includes('gif')) filename = filename.replace('.jpg', '.gif');
    }
  } catch (e) {
    // ignore and use fallback
  }

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);

  return filename;
}

export default downloadUrlAsFile;
