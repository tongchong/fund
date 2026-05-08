// 不用 window 参数，不用 document.write
export default function openPdfInNewTab(pdfUrl: string): boolean {
  if (typeof window === "undefined") return false;
  window.open(pdfUrl, "_blank");
  return true;
}
