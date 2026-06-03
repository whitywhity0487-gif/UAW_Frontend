export const validateMobileNumber = (value) => {
  const digitsOnly = value.replace(/\D/g, '');

  if (digitsOnly.length === 10) {
    return { isValid: true, formattedValue: digitsOnly, error: null };
  }

  if (digitsOnly.length > 0 && digitsOnly.length < 10) {
    return { 
      isValid: false, 
      formattedValue: digitsOnly, 
      error: `Mobile number must be exactly 10 digits (currently ${digitsOnly.length})` 
    };
  }

  if (digitsOnly.length > 10) {
    return { 
      isValid: false, 
      formattedValue: digitsOnly.slice(0, 10), 
      error: "Mobile number cannot exceed 10 digits" 
    };
  }

  return { isValid: true, formattedValue: value, error: null };
};

export const validateProfileForm = async (profile, checkEmailExists, checkMobileExists) => {
  const errors = {};

  if (!profile.name?.trim()) {
    errors.name = "Name is required";
  }

  if (!profile.email?.trim()) {
    errors.email = "Email is required";
  } else if (!/\S+@\S+\.\S+/.test(profile.email)) {
    errors.email = "Email is invalid";
  } else if (checkEmailExists) {
    const emailExists = await checkEmailExists(profile.email);
    if (emailExists) {
      errors.email = "This email is already registered";
    }
  }

  if (!profile.mobile?.trim()) {
    errors.mobile = "Mobile number is required";
  } else {
    const mobileDigits = profile.mobile.replace(/\D/g, '');
    if (mobileDigits.length !== 10 && mobileDigits.length !== 11) {
      errors.mobile = "Mobile number must be 10 or 11 digits";
    } else if (!/^\d{10,11}$/.test(mobileDigits)) {
      errors.mobile = "Mobile number must contain only numbers";
    } else if (checkMobileExists) {
      const mobileExists = await checkMobileExists(mobileDigits);
      if (mobileExists) {
        errors.mobile = "This mobile number is already registered";
      }
    }
  }

  if (!profile.keySkills || profile.keySkills.length === 0) {
    errors.keySkills = "At least one skill is required";
  }

  return errors;
};
