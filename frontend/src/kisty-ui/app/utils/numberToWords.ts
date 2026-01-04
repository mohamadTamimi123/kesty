/**
 * Convert number to Persian words
 */
const ones = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const hundreds = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];

function convertHundreds(num: number): string {
  if (num === 0) return '';
  
  let result = '';
  const hundred = Math.floor(num / 100);
  const remainder = num % 100;
  
  if (hundred > 0) {
    result += hundreds[hundred];
  }
  
  if (remainder === 0) {
    return result;
  }
  
  if (result) result += ' و ';
  
  if (remainder < 10) {
    result += ones[remainder];
  } else if (remainder < 20) {
    result += teens[remainder - 10];
  } else {
    const ten = Math.floor(remainder / 10);
    const one = remainder % 10;
    result += tens[ten];
    if (one > 0) {
      result += ' و ' + ones[one];
    }
  }
  
  return result;
}

export function numberToWords(num: number): string {
  if (num === 0) return 'صفر';
  if (num < 0) return 'منفی ' + numberToWords(-num);
  
  const billion = Math.floor(num / 1_000_000_000);
  const million = Math.floor((num % 1_000_000_000) / 1_000_000);
  const thousand = Math.floor((num % 1_000_000) / 1_000);
  const remainder = num % 1_000;
  
  let result = '';
  
  if (billion > 0) {
    result += convertHundreds(billion) + ' میلیارد';
  }
  
  if (million > 0) {
    if (result) result += ' و ';
    result += convertHundreds(million) + ' میلیون';
  }
  
  if (thousand > 0) {
    if (result) result += ' و ';
    result += convertHundreds(thousand) + ' هزار';
  }
  
  if (remainder > 0) {
    if (result) result += ' و ';
    result += convertHundreds(remainder);
  }
  
  return result || 'صفر';
}

export function formatNumberWithCommas(num: number | string): string {
  const numStr = typeof num === 'string' ? num.replace(/,/g, '') : num.toString();
  const numValue = parseFloat(numStr);
  if (isNaN(numValue)) return '';
  
  return new Intl.NumberFormat('fa-IR').format(numValue);
}

export function parseFormattedNumber(value: string): number {
  // Remove commas and non-digit characters, then convert to integer
  const cleaned = value.replace(/,/g, '').replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
}
