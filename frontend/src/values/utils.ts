export function getUrlParameter(url: string, target: string): string | undefined {
    const _url = new URL(url);
    const params = _url.searchParams;
    return params.get(target) ?? undefined;
  }
  
  export function isMobile(): boolean {
    return /Android|iPhone/i.test(navigator.userAgent);
  }
  
  // Android input focus workaround
  export function focusOnWriting() {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      window.setTimeout(() => {
        document.activeElement?.scrollIntoView();
      }, 0);
    }
  }
  
  export function koreanSuffix(text: string): string {
    const KR_SUFFIX = ['을(를)', '이(가)', '와(과)'];
    let fixedText = text;
  
    KR_SUFFIX.forEach((s) => {
      if (text.indexOf(s) === -1) return;
  
      const finalCharCode = text.charCodeAt(text.indexOf(s) - 1);
      const finalConsonantCode = (finalCharCode - 44032) % 28;
      const isFinalCharBatchim = finalConsonantCode !== 0;
  
      if (isFinalCharBatchim) {
        if (s === '을(를)') fixedText = fixedText.replace('을(를)', '을');
        if (s === '이(가)') fixedText = fixedText.replace('이(가)', '이');
        if (s === '와(과)') fixedText = fixedText.replace('와(과)', '와');
      } else {
        if (s === '을(를)') fixedText = fixedText.replace('을(를)', '를');
        if (s === '이(가)') fixedText = fixedText.replace('이(가)', '가');
        if (s === '와(과)') fixedText = fixedText.replace('와(과)', '과');
      }
    });
  
    return fixedText;
  }
  
  export function newlineToBrHtml(value: string): string {
    return value.replace(/\n/g, '<br/>'); // Angular pipe :contentReference[oaicite:22]{index=22} 포팅
  }
  