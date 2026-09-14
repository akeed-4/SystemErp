/**
 * Arabic Number to Words (Tafqeet) Utility for Saudi Riyals and Halalas
 */

const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const hundreds = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

function convertGroup(n: number): string {
  let output = '';
  if (n === 0) return '';

  const h = Math.floor(n / 100);
  const remainder = n % 100;

  if (h > 0) {
    output += hundreds[h];
  }

  if (remainder > 0) {
    if (output !== '') output += ' و ';
    if (remainder < 20) {
      output += ones[remainder];
    } else {
      const t = Math.floor(remainder / 10);
      const o = remainder % 10;
      if (o > 0) {
        output += ones[o] + ' و ';
      }
      output += tens[t];
    }
  }

  return output;
}

export function tafqeetArabic(amount: number): string {
  if (isNaN(amount) || amount === 0) {
    return 'صفر ريال سعودي لا غير';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const riyals = Math.floor(absAmount);
  const halalas = Math.round((absAmount - riyals) * 100);

  let riyalsText = '';

  if (riyals === 0) {
    riyalsText = '';
  } else if (riyals < 1000) {
    riyalsText = convertGroup(riyals);
  } else if (riyals < 1000000) {
    const thousands = Math.floor(riyals / 1000);
    const rem = riyals % 1000;

    let thText = '';
    if (thousands === 1) thText = 'ألف';
    else if (thousands === 2) thText = 'ألفان';
    else if (thousands >= 3 && thousands <= 10) thText = convertGroup(thousands) + ' آلاف';
    else thText = convertGroup(thousands) + ' ألف';

    riyalsText = thText + (rem > 0 ? ' و ' + convertGroup(rem) : '');
  } else {
    riyalsText = `${riyals.toLocaleString('ar-SA')}`;
  }

  let finalStr = '';
  if (riyals > 0) {
    finalStr = `فقط ${riyalsText} ريالاً سعودياً`;
  }

  if (halalas > 0) {
    const halalaText = convertGroup(halalas);
    if (finalStr !== '') {
      finalStr += ` و ${halalaText} هللة`;
    } else {
      finalStr = `فقط ${halalaText} هللة`;
    }
  }

  finalStr += ' لا غير';
  return (isNegative ? 'سالب ' : '') + finalStr;
}
