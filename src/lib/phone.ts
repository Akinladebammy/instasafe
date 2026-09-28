// Nigerian mobile validation, shared by the client forms and the server actions
// so both reject the same input before a request is ever made.
//
// The API normalises 080.../ +234... / 234... on its side, but anything that is
// not an 11-digit local mobile (070/080/081/090/091) or 234 + 10 digits is a
// 400 "must be a valid Nigerian mobile number".

export function validateNigerianPhone(phone: string) {
  if (!phone) return "Enter a WhatsApp number.";
  const digits = phone.replace(/\D/g, "");

  if (/^234\d{10}$/.test(digits)) return null;
  if (/^0(70|80|81|90|91)\d{8}$/.test(digits)) return null;

  return "Enter a valid Nigerian mobile number.";
}

export function isNigerianPhone(phone: string) {
  return validateNigerianPhone(phone) === null;
}
