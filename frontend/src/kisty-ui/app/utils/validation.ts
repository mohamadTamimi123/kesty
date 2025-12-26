/**
 * Validation utility functions for form inputs
 */

/**
 * Validates phone number format (09xxxxxxxxx)
 */
export const validatePhone = (phone: string): string | null => {
  if (!phone) {
    return "شماره موبایل الزامی است";
  }

  const phoneRegex = /^09[0-9]{9}$/;
  if (!phoneRegex.test(phone)) {
    return "شماره موبایل باید با فرمت 09123456789 وارد شود";
  }

  return null;
};

/**
 * Validates password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export const validatePassword = (password: string): string | null => {
  if (!password) {
    return "رمز عبور الزامی است";
  }

  if (password.length < 8) {
    return "رمز عبور باید حداقل 8 کاراکتر باشد";
  }

  if (!/[A-Z]/.test(password)) {
    return "رمز عبور باید شامل حداقل یک حرف بزرگ انگلیسی باشد";
  }

  if (!/[a-z]/.test(password)) {
    return "رمز عبور باید شامل حداقل یک حرف کوچک انگلیسی باشد";
  }

  if (!/[0-9]/.test(password)) {
    return "رمز عبور باید شامل حداقل یک عدد باشد";
  }

  return null;
};

/**
 * Validates password confirmation matches password
 */
export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): string | null => {
  if (!confirmPassword) {
    return "تکرار رمز عبور الزامی است";
  }

  if (password !== confirmPassword) {
    return "رمز عبور و تکرار آن باید یکسان باشند";
  }

  return null;
};

/**
 * Validates email format
 */
export const validateEmail = (email: string): string | null => {
  if (!email) {
    return "ایمیل الزامی است";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "فرمت ایمیل معتبر نیست";
  }

  return null;
};

