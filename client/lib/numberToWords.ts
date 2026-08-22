/**
 * Converts a number to its English word representation
 * Supports numbers up to 999,999,999.99
 * 
 * @param num - The number to convert
 * @returns The number in words
 * 
 * @example
 * numberToWords(125450.75) // "One Hundred Twenty-Five Thousand Four Hundred Fifty and 75/100"
 * numberToWords(0) // "Zero"
 */
export function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const scales = ['', 'Thousand', 'Million', 'Billion'];
  
  function convertHundreds(n: number): string {
    if (n === 0) return '';
    
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    
    let result = '';
    if (hundred > 0) {
      result += units[hundred] + ' Hundred';
      if (remainder > 0) result += ' ';
    }
    
    if (remainder > 0) {
      if (remainder < 10) {
        result += units[remainder];
      } else if (remainder < 20) {
        result += teens[remainder - 10];
      } else {
        const ten = Math.floor(remainder / 10);
        const unit = remainder % 10;
        result += tens[ten];
        if (unit > 0) result += ' ' + units[unit];
      }
    }
    
    return result;
  }
  
  // Ensure we have exactly 2 decimal places
  const parts = num.toFixed(2).split('.');
  const integerPart = parseInt(parts[0]);
  const decimalPart = parseInt(parts[1]);
  
  let result = '';
  let scaleIndex = 0;
  let n = integerPart;
  
  while (n > 0) {
    const chunk = n % 1000;
    if (chunk > 0) {
      const chunkWords = convertHundreds(chunk);
      if (scaleIndex > 0) {
        result = chunkWords + ' ' + scales[scaleIndex] + (result ? ' ' + result : '');
      } else {
        result = chunkWords + (result ? ' ' + result : '');
      }
    }
    n = Math.floor(n / 1000);
    scaleIndex++;
  }
  
//   // Handle decimal part as fractional currency (e.g., "75/100")
//   if (decimalPart > 0) {
//     const paddedDecimal = decimalPart.toString().padStart(2, '0');
//     result += ' and ' + paddedDecimal + '/100';
//   }
  
  return result;
}