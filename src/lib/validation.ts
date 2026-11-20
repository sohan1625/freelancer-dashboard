// Comprehensive Email & Password Security Validator for FreelancerOS

export interface PasswordCriteria {
    minLength: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
    noWhitespace: boolean;
    notCommon: boolean;
    score: number;
    strength: "Very Weak" | "Weak" | "Fair" | "Strong";
}

const COMMON_PASSWORDS = new Set([
    "password", "password123", "password123!", "admin123", "admin1234",
    "12345678", "123456789", "qwerty1234", "letmein123", "welcome123"
]);

export function validateEmail(email: string): { valid: boolean; error?: string } {
    if (!email || !email.trim()) {
        return { valid: false, error: "Email address is required." };
    }

    const trimmed = email.trim();

    if (trimmed.length > 254) {
        return { valid: false, error: "Email address cannot exceed 254 characters." };
    }

    const atIndex = trimmed.indexOf("@");
    if (atIndex === -1 || atIndex !== trimmed.lastIndexOf("@")) {
        return { valid: false, error: "Email address must contain exactly one '@' symbol." };
    }

    const localPart = trimmed.substring(0, atIndex);
    const domain = trimmed.substring(atIndex + 1).toLowerCase();

    if (!localPart || localPart.length > 64) {
        return { valid: false, error: "Username part of email must be between 1 and 64 characters." };
    }

    if (localPart.startsWith(".") || localPart.endsWith(".")) {
        return { valid: false, error: "Email cannot start or end with a period." };
    }

    if (localPart.includes("..")) {
        return { valid: false, error: "Email cannot contain consecutive periods ('..')." };
    }

    const rfcRegex = /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,15}$/;
    if (!rfcRegex.test(trimmed)) {
        return { valid: false, error: "Please enter a valid email format (e.g., user@domain.com)." };
    }

    // Gmail & Googlemail specific validation
    if (domain === "gmail.com" || domain === "googlemail.com") {
        let baseUsername = localPart;
        const plusIndex = baseUsername.indexOf("+");
        if (plusIndex !== -1) {
            baseUsername = baseUsername.substring(0, plusIndex);
        }

        const strippedDots = baseUsername.replace(/\./g, "");
        if (strippedDots.length < 6) {
            return { valid: false, error: "Gmail usernames must be at least 6 characters long." };
        }
        if (strippedDots.length > 30) {
            return { valid: false, error: "Gmail usernames cannot exceed 30 characters." };
        }
        const gmailRegex = /^[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*(?:\+[a-zA-Z0-9._-]+)?$/;
        if (!gmailRegex.test(localPart)) {
            return {
                valid: false,
                error: "Invalid Gmail username. Google only allows letters (a-z), numbers (0-9), and single dots."
            };
        }
    }

    return { valid: true };
}

export function evaluatePassword(password: string): PasswordCriteria {
    const minLength = password.length >= 8 && password.length <= 128;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password);
    const noWhitespace = !password.startsWith(" ") && !password.endsWith(" ");
    const notCommon = !COMMON_PASSWORDS.has(password.toLowerCase().trim());

    let score = 0;
    if (minLength) score++;
    if (hasUpper) score++;
    if (hasLower) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;

    let strength: "Very Weak" | "Weak" | "Fair" | "Strong" = "Very Weak";
    if (score >= 5 && notCommon && noWhitespace) {
        strength = "Strong";
    } else if (score >= 4) {
        strength = "Fair";
    } else if (score >= 2) {
        strength = "Weak";
    }

    return {
        minLength,
        hasUpper,
        hasLower,
        hasNumber,
        hasSpecial,
        noWhitespace,
        notCommon,
        score,
        strength
    };
}

export function validatePassword(
    password: string,
    username?: string,
    email?: string
): { valid: boolean; error?: string } {
    if (!password) {
        return { valid: false, error: "Password is required." };
    }

    const criteria = evaluatePassword(password);

    if (password.startsWith(" ") || password.endsWith(" ")) {
        return { valid: false, error: "Password cannot start or end with a space." };
    }

    if (password.length < 8) {
        return { valid: false, error: "Password must be at least 8 characters long." };
    }

    if (password.length > 128) {
        return { valid: false, error: "Password cannot exceed 128 characters." };
    }

    const missing: string[] = [];
    if (!criteria.hasUpper) missing.push("1 uppercase letter");
    if (!criteria.hasLower) missing.push("1 lowercase letter");
    if (!criteria.hasNumber) missing.push("1 number");
    if (!criteria.hasSpecial) missing.push("1 special symbol (!@#$%^&*)");

    if (missing.length > 0) {
        return { valid: false, error: `Password must contain at least ${missing.join(", ")}.` };
    }

    if (!criteria.notCommon) {
        return { valid: false, error: "Password is too common. Please choose a stronger password." };
    }

    if (username && username.trim().length >= 3) {
        if (password.toLowerCase().includes(username.trim().toLowerCase())) {
            return { valid: false, error: "Password cannot contain your username." };
        }
    }

    if (email && email.includes("@")) {
        const prefix = email.split("@")[0].trim().toLowerCase();
        if (prefix.length >= 3 && password.toLowerCase().includes(prefix)) {
            return { valid: false, error: "Password cannot contain your email username." };
        }
    }

    return { valid: true };
}
