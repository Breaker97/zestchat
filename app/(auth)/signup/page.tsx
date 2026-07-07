"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Lock, Mail, User, ShieldCheck, Loader2, Smartphone, Check, Calendar, ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { auth as firebaseAuth } from "@/lib/firebase/config";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { createClient as createBrowserClient } from "@/lib/supabase/browser";
import { getMobileOtpEnabled, registerUserAction, checkUsernameAvailabilityAction } from "@/lib/supabase/actions";


const countryCodes = [
  { code: "+971", flag: "ae", name: "UAE" },
  { code: "+91", flag: "in", name: "India" },
  { code: "+92", flag: "pk", name: "Pakistan" },
  { code: "+880", flag: "bd", name: "Bangladesh" },
  { code: "+977", flag: "np", name: "Nepal" },
  { code: "+94", flag: "lk", name: "Sri Lanka" },
  { code: "+44", flag: "gb", name: "UK" },
  { code: "+1", flag: "us", name: "US" },
];

export default function SignupPage() {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("+1");
  const [mobileNumber, setMobileNumber] = useState("");

  // Username validation states
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  // UI States
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: "", color: "bg-slate-200", text: "text-slate-400" });

  // System Configuration state
  const [mobileOtpEnabled, setMobileOtpEnabled] = useState(false);

  // Validation States
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [ageError, setAgeError] = useState("");
  const [formError, setFormError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // OTP Verification States
  const [mobileOtp, setMobileOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [mobileVerified, setMobileVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifyingMobile, setVerifyingMobile] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Timer for Resend
  const [timerSeconds, setTimerSeconds] = useState(120);

  // Load system configuration and set defaults
  useEffect(() => {
    async function loadConfig() {
      try {
        const isEnabled = await getMobileOtpEnabled();
        setMobileOtpEnabled(isEnabled);
        if (!isEnabled) {
          setMobileVerified(true);
        }
      } catch (err) {
        console.error("Failed to load platform settings:", err);
      }
    }
    loadConfig();
  }, []);

  // Debounced username availability validation on keystroke
  useEffect(() => {
    if (!username) {
      setUsernameAvailable(null);
      setUsernameError("");
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check formatting
    const isValidFormat = /^[a-zA-Z0-9_]{3,15}$/.test(cleanUsername);
    if (!isValidFormat) {
      setUsernameAvailable(null);
      setUsernameError("Username must be 3-15 alphanumeric characters or underscores.");
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsCheckingUsername(true);
      setUsernameError("");
      try {
        const res = await checkUsernameAvailabilityAction(cleanUsername);
        if (res && res.available !== undefined) {
          setUsernameAvailable(res.available);
          if (!res.available) {
            setUsernameError("This username is already taken.");
          }
        } else {
          setUsernameAvailable(null);
        }
      } catch (err) {
        console.error(err);
        setUsernameAvailable(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [username]);


  // Timezone-based country code auto-detection
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz.includes("Calcutta") || tz.includes("India") || tz.includes("Asia/Kolkata")) {
        setSelectedCountryCode("+91");
      } else if (tz.includes("Europe/London") || tz.includes("GB")) {
        setSelectedCountryCode("+44");
      } else if (tz.includes("Dubai") || tz.includes("Asia/Dubai")) {
        setSelectedCountryCode("+971");
      } else if (tz.includes("Sydney") || tz.includes("Australia")) {
        setSelectedCountryCode("+61");
      } else if (tz.includes("Europe/Paris")) {
        setSelectedCountryCode("+33");
      } else if (tz.includes("Europe/Berlin")) {
        setSelectedCountryCode("+49");
      } else if (tz.includes("America/Toronto")) {
        setSelectedCountryCode("+1");
      } else if (tz.includes("Asia/Singapore")) {
        setSelectedCountryCode("+65");
      } else if (tz.includes("Asia/Tokyo")) {
        setSelectedCountryCode("+81");
      }
    } catch (e) {
      console.warn("Timezone detection failed:", e);
    }
  }, []);

  // Timer countdown trigger
  useEffect(() => {
    if (step === 2 && timerSeconds > 0) {
      const interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, timerSeconds]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const calculateAge = (dobString: string) => {
    if (!dobString) return 0;
    const parts = dobString.split("/");
    if (parts.length !== 3) return 0;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    const today = new Date();
    let age = today.getFullYear() - year;
    const m = today.getMonth() - (month - 1);
    if (m < 0 || (m === 0 && today.getDate() < day)) {
      age--;
    }
    return age;
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // strip non-digits
    if (value.length > 8) value = value.substring(0, 8);
    
    // Format: DD/MM/YYYY
    let formatted = "";
    if (value.length > 0) {
      formatted += value.substring(0, 2);
    }
    if (value.length > 2) {
      formatted += "/" + value.substring(2, 4);
    }
    if (value.length > 4) {
      formatted += "/" + value.substring(4, 8);
    }
    
    setDob(formatted);
    
    // If complete date is entered (8 digits)
    if (value.length === 8) {
      const day = parseInt(value.substring(0, 2), 10);
      const month = parseInt(value.substring(2, 4), 10);
      const year = parseInt(value.substring(4, 8), 10);
      
      if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > new Date().getFullYear()) {
        setAgeError("Please enter a valid Date of Birth (DD/MM/YYYY).");
        setCalculatedAge(null);
        return;
      }
      
      const ageVal = calculateAge(formatted);
      setCalculatedAge(ageVal);
      if (ageVal < 18) {
        setAgeError("You must be 18 years or older to create an account.");
      } else {
        setAgeError("");
      }
    } else {
      setCalculatedAge(null);
      setAgeError("");
    }
  };

  const checkPasswordStrength = (pass: string) => {
    if (!pass) {
      setPasswordStrength({ score: 0, label: "", color: "bg-slate-200", text: "text-slate-400" });
      return;
    }
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) {
      setPasswordStrength({ score: 1, label: "Weak Password", color: "bg-rose-500", text: "text-rose-500" });
    } else if (score <= 4) {
      setPasswordStrength({ score: 2, label: "Medium Password", color: "bg-amber-500", text: "text-amber-500" });
    } else {
      setPasswordStrength({ score: 3, label: "Strong Password", color: "bg-emerald-500", text: "text-emerald-500" });
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    checkPasswordStrength(val);
  };

  const fullPhoneNumber = `${selectedCountryCode}${mobileNumber}`;

  // Proceed to Step 2
  const handleProceedToVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!fullName || !email || !password || !dob || !mobileNumber) {
      setFormError("All fields are required.");
      return;
    }

    if (calculatedAge === null || calculatedAge < 18) {
      setFormError("You must be 18 years or older to create an account.");
      return;
    }

    if (!username) {
      setFormError("Please choose a username.");
      return;
    }

    if (usernameError || !usernameAvailable) {
      setFormError(usernameError || "This username is not available.");
      return;
    }

    setIsRegistering(true);

    try {
      // 1. Send SMS via Firebase Phone Auth (only if enabled)
      if (mobileOtpEnabled) {
        const recaptchaContainer = document.getElementById("recaptcha-container");
        if (!recaptchaContainer) {
          throw new Error("reCAPTCHA element not found in DOM");
        }
        
        if ((window as any).recaptchaVerifier) {
          try {
            (window as any).recaptchaVerifier.clear();
          } catch (_) {}
        }

        const verifier = new RecaptchaVerifier(firebaseAuth, "recaptcha-container", {
          size: "invisible",
        });
        (window as any).recaptchaVerifier = verifier;

        const smsResult = await signInWithPhoneNumber(firebaseAuth, fullPhoneNumber, verifier);
        setConfirmationResult(smsResult);
      } else {
        // If mobile OTP is disabled, we mark it verified immediately
        setMobileVerified(true);
      }

      // 2. Call Supabase Sign Up via Server Action (Bypassing SMTP limits)
      const signUpRes = await registerUserAction({
        email,
        password,
        username: username.trim().toLowerCase(),
        fullName,
        age: calculatedAge || 0,
        mobileNumber: fullPhoneNumber,
      });

      if (signUpRes.error) {
        setFormError(signUpRes.error);
        return;
      }

      // Transition to verification step page and reset timer
      setTimerSeconds(120);
      setStep(2);
    } catch (err: any) {
      console.error("Signup initiation error:", err);
      // Give details about AuthRetryableFetchError to help user
      const isRetryableError = err.name === "AuthRetryableFetchError" || err.message?.includes("fetch");
      setFormError(
        isRetryableError
          ? "Network connection to Supabase was blocked or timed out. Please disable any active ad-blockers / VPNs and try again."
          : (err.message || "Failed to initiate signup verification.")
      );
    } finally {
      setIsRegistering(false);
    }
  };

  // Resend Mobile SMS Code
  const handleResendMobileSms = async () => {
    if (!mobileOtpEnabled || timerSeconds > 0) return;
    setVerificationError("");
    try {
      const verifier = new RecaptchaVerifier(firebaseAuth, "recaptcha-container", {
        size: "invisible",
      });
      const smsResult = await signInWithPhoneNumber(firebaseAuth, fullPhoneNumber, verifier);
      setConfirmationResult(smsResult);
      setTimerSeconds(120); // Reset timer to 2 minutes
    } catch (err: any) {
      console.error("SMS resend failed:", err);
      setVerificationError("Failed to resend Mobile OTP.");
    }
  };

  // Resend Supabase Email Code
  const handleResendEmailOtp = async () => {
    if (timerSeconds > 0) return;
    setVerificationError("");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });
      if (error) throw error;
      setTimerSeconds(120); // Reset timer to 2 minutes
    } catch (err: any) {
      console.error("Email resend failed:", err);
      setVerificationError("Failed to resend Email OTP.");
    }
  };

  // Verify Mobile SMS OTP
  const handleVerifyMobile = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!mobileOtp) {
      setVerificationError("Please enter the 6-digit SMS OTP.");
      return;
    }

    setVerificationError("");
    setVerifyingMobile(true);

    try {
      if (confirmationResult) {
        await confirmationResult.confirm(mobileOtp);
        setMobileVerified(true);
        if (emailVerified) await handleFinishSignup();
      } else {
        setMobileVerified(true);
        if (emailVerified) await handleFinishSignup();
      }
    } catch (err: any) {
      console.error("Mobile OTP verification failed:", err);
      setVerificationError("Invalid mobile verification code.");
    } finally {
      setVerifyingMobile(false);
    }
  };

  // Verify Email OTP
  const handleVerifyEmail = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!emailOtp) {
      setVerificationError("Please enter the 6-digit email OTP.");
      return;
    }

    setVerificationError("");
    setVerifyingEmail(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: emailOtp,
        type: "signup",
      });

      if (error) throw error;
      setEmailVerified(true);
      if (mobileVerified) await handleFinishSignup();
    } catch (err: any) {
      console.error("Email OTP verification failed:", err);
      setVerificationError(err.message || "Invalid email verification code.");
    } finally {
      setVerifyingEmail(false);
    }
  };


  // Establish a browser session and enter the app after all verification succeeds.
  const handleFinishSignup = async () => {
    setVerificationError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/");
      router.refresh();
    } catch (err: any) {
      console.error("Login failed after signup:", err);
      setVerificationError(err.message || "Failed to log in automatically.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex lg:grid lg:grid-cols-12 font-sans overflow-hidden">
      
      {/* Features Column (Visible on PC/Desktop, hidden on mobile) */}
      <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-tr from-primary to-indigo-600 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-40 -right-20 w-[400px] h-[400px] bg-indigo-500/30 rounded-full blur-3xl"></div>

        {/* Brand Header */}
        <Link href="/" className="flex items-center gap-2 relative z-10 hover:opacity-90 transition-opacity">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center text-white">
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="font-plus-jakarta font-extrabold text-xl tracking-tight">ZestChat</span>
        </Link>

        {/* Feature Highlights */}
        <div className="my-auto space-y-8 relative z-10">
          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-200">Premium Communication</span>
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight">Create your ZestChat workspace today.</h1>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 shrink-0 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                <Check className="w-5 h-5 text-indigo-200 stroke-[3]" />
              </div>
              <div>
                <h3 className="font-bold text-base">Sub-Second Video & Audio Rooms</h3>
                <p className="text-sm text-indigo-100">Crystal-clear conference calls with ultra-low latency and HD stream quality.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 shrink-0 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                <Check className="w-5 h-5 text-indigo-200 stroke-[3]" />
              </div>
              <div>
                <h3 className="font-bold text-base">End-to-End Encrypted Secure Chat</h3>
                <p className="text-sm text-indigo-100">Your privacy is guaranteed with our state-of-the-art secure chat vault.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 shrink-0 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                <Check className="w-5 h-5 text-indigo-200 stroke-[3]" />
              </div>
              <div>
                <h3 className="font-bold text-base">Verified Badges & Moderation</h3>
                <p className="text-sm text-indigo-100">Engage in trusted workspaces with legal guidelines and green-tick verified profiles.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-indigo-200 relative z-10">
          © {new Date().getFullYear()} ZestChat. All rights reserved.
        </div>
      </div>

      {/* Form Column */}
      <div className="flex-1 lg:col-span-7 flex items-center justify-center p-6 lg:p-12 relative bg-slate-50">
        {/* Background Animated Blobs (Light Theme) */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-primary/8 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-indigo-600/5 rounded-full blur-[100px] animate-pulse duration-5000"></div>
        </div>

        <div className="w-full max-w-md bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-8 shadow-xl flex flex-col gap-6 transform hover:scale-[1.01] transition-all duration-500">
          
          {/* Header */}
          <div className="flex flex-col items-center gap-2 text-center">
            <Link href="/" className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-sm hover:scale-105 hover:bg-primary/20 transition-all duration-300">
              <MessageSquare className="w-6 h-6 text-primary" />
            </Link>
            <h2 className="font-plus-jakarta font-extrabold text-2xl mt-4 tracking-tight text-slate-800 animate-fadeIn">
              {step === 1 ? "Create Account" : "Identity Verification"}
            </h2>
            <p className="text-slate-500 text-sm">
              {step === 1 ? "Join the premium community of ZestChat today" : "Complete secure verification to activate your account"}
            </p>
          </div>

          {/* reCAPTCHA target element */}
          <div id="recaptcha-container"></div>

          {/* STEP 1: Registration Form */}
          {step === 1 && (
            <>
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl text-sm font-semibold flex flex-col gap-2">
                  <span>{formError || ageError}</span>
                </div>
              )}

              <form onSubmit={handleProceedToVerification} className="flex flex-col gap-4">
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                  <div className="relative group">
                    <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input 
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Elena Rodriguez"
                      className="w-full bg-slate-100/50 border border-slate-200 hover:border-slate-300 focus:border-primary focus:bg-white rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-400 font-medium text-slate-800"
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Username</label>
                  <div className="relative group">
                    <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input 
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="elena_rod"
                      className={`w-full bg-slate-100/50 border rounded-xl pl-12 pr-10 py-3.5 text-sm outline-none focus:ring-4 transition-all placeholder:text-slate-400 font-medium text-slate-800 ${
                        usernameError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' :
                        usernameAvailable ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/10' : 'border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-primary/10'
                      }`}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                      {isCheckingUsername && <Loader2 className="w-4.5 h-4.5 animate-spin text-primary" />}
                      {!isCheckingUsername && usernameAvailable === true && <Check className="w-4.5 h-4.5 text-emerald-500 stroke-[3]" />}
                    </div>
                  </div>
                  {usernameError && (
                    <span className="text-[10px] text-red-500 font-semibold mt-0.5 px-1 block">{usernameError}</span>
                  )}
                  {!usernameError && usernameAvailable === true && (
                    <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 px-1 block">✓ Username is available!</span>
                  )}
                </div>

                {/* Email Address - Full Width */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                  <div className="relative group">
                    <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="elena@zest.com"
                      className="w-full bg-slate-100/50 border border-slate-200 hover:border-slate-300 focus:border-primary focus:bg-white rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-400 font-medium text-slate-800"
                    />
                  </div>
                </div>

                {/* Password - Full Width with Eye Toggle and Strength Meter */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
                  <div className="relative group">
                    <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={handlePasswordChange}
                      placeholder="Min. 8 characters"
                      className="w-full bg-slate-100/50 border border-slate-200 hover:border-slate-300 focus:border-primary focus:bg-white rounded-xl pl-12 pr-12 py-3.5 text-sm outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-400 font-medium text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="space-y-1.5 px-1 mt-1 animate-fadeIn">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-400">Password Strength:</span>
                        <span className={passwordStrength.text}>{passwordStrength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.score / 3) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Date of Birth Input (DD/MM/YYYY) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Date of Birth</label>
                    {calculatedAge !== null && (
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border transition-all ${
                        calculatedAge >= 18 
                          ? "bg-emerald-55 text-emerald-600 border-emerald-250/60" 
                          : "bg-rose-50 text-rose-600 border-rose-200"
                      }`}>
                        Age: {calculatedAge} ({calculatedAge >= 18 ? "18+ Valid" : "Under 18"})
                      </span>
                    )}
                  </div>
                  <div className="relative group">
                    <Calendar className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
                    <input 
                      type="text"
                      required
                      maxLength={10}
                      value={dob}
                      onChange={handleDobChange}
                      placeholder="DD/MM/YYYY"
                      className="w-full bg-slate-100/50 border border-slate-200 hover:border-slate-300 focus:border-primary focus:bg-white rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-400 text-slate-800 font-medium"
                    />
                  </div>
                  {ageError && <span className="text-[10px] text-rose-500 font-semibold px-1 mt-0.5">{ageError}</span>}
                </div>

                {/* Mobile Number with Country Code (Compact 1/3 Custom Flag Selector Layout) */}
                <div className="flex flex-col gap-1.5 border-t border-slate-200 pt-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Mobile Number</label>
                  <div className="flex gap-2 relative">
                    
                    {/* Custom Image-Based Flag Selector */}
                    <div className="w-1/3 relative">
                      <button
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="w-full h-full bg-slate-100/50 border border-slate-200 hover:border-slate-300 rounded-xl px-2 py-3.5 text-sm font-semibold flex items-center justify-between outline-none focus:border-primary text-slate-800 transition-all"
                      >
                        <span className="flex items-center gap-2 justify-center w-full">
                          <img 
                            src={`https://flagcdn.com/w40/${countryCodes.find(c => c.code === selectedCountryCode)?.flag || "us"}.png`}
                            alt="flag"
                            className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
                          />
                          <span>{selectedCountryCode}</span>
                        </span>
                        <span className="text-[8px] text-slate-400">▼</span>
                      </button>

                      {dropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setDropdownOpen(false)}
                          />
                          
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
                            {countryCodes.map((c) => (
                              <button
                                key={c.code + c.name}
                                type="button"
                                onClick={() => {
                                  setSelectedCountryCode(c.code);
                                  setDropdownOpen(false);
                                }}
                                className="w-full px-3 py-2.5 text-xs font-semibold text-left flex items-center gap-2.5 hover:bg-slate-50 transition-colors text-slate-800"
                              >
                                <img 
                                  src={`https://flagcdn.com/w40/${c.flag}.png`}
                                  alt={c.name}
                                  className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
                                />
                                <span className="flex-1 truncate">{c.name}</span>
                                <span className="text-slate-400 font-normal">{c.code}</span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="relative flex-1 group">
                      <Smartphone className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <input 
                        type="tel"
                        required
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="5551234567"
                        className="w-full bg-slate-100/50 border border-slate-200 hover:border-slate-300 focus:border-primary focus:bg-white rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-400 font-medium text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isRegistering || !!ageError}
                  className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:bg-primary/95 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Initiating Signup...</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Verification</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* STEP 2: Beautiful Verification View */}
          {step === 2 && (
            <div className="space-y-5 animate-fadeIn">
              {verificationError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl text-sm font-semibold">
                  {verificationError}
                </div>
              )}

              {/* Countdown Banner */}
              <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-bold text-slate-600">Verification Codes Sent</span>
                </div>
                <div className="text-xs font-mono font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                  {timerSeconds > 0 ? `Resend in ${formatTime(timerSeconds)}` : "Ready to Resend"}
                </div>
              </div>

              {/* Mobile OTP Segment */}
              {mobileOtpEnabled && (
                <div className={`border rounded-2xl p-5 space-y-4 transition-all duration-300 bg-white ${mobileVerified ? "border-emerald-200 shadow-sm" : "border-slate-200"}`}>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-primary" />
                        <span>SMS Verification</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Code sent to <span className="font-semibold text-slate-700">{fullPhoneNumber}</span>
                      </p>
                    </div>
                    {mobileVerified && (
                      <div className="bg-emerald-55 border border-emerald-200 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>
                  
                  {!mobileVerified ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          maxLength={6}
                          value={mobileOtp}
                          onChange={(e) => setMobileOtp(e.target.value)}
                          placeholder="6-digit OTP"
                          className="flex-1 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-primary focus:bg-white rounded-xl px-4 py-3 text-sm outline-none text-center font-bold tracking-widest text-slate-800 transition-all focus:ring-4 focus:ring-primary/10"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyMobile}
                          disabled={verifyingMobile || !mobileOtp}
                          className="px-5 py-3 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {verifyingMobile ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <span>Verify</span>
                          )}
                        </button>
                      </div>

                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] text-slate-400">Didn&apos;t get SMS code?</span>
                        <button
                          type="button"
                          disabled={timerSeconds > 0}
                          onClick={handleResendMobileSms}
                          className="text-[10px] font-bold text-primary disabled:text-slate-300 hover:underline transition-all"
                        >
                          Resend SMS
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Mobile authentication process is complete.</p>
                  )}
                </div>
              )}

              {/* Email OTP Segment */}
              <div className={`border rounded-2xl p-5 space-y-4 transition-all duration-300 bg-white ${emailVerified ? "border-emerald-200 shadow-sm" : "border-slate-200"}`}>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      <span>Email Verification</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Code sent to <span className="font-semibold text-slate-700">{email}</span>
                    </p>
                  </div>
                  {emailVerified && (
                    <div className="bg-emerald-55 border border-emerald-200 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Verified</span>
                    </div>
                  )}
                </div>
                
                {!emailVerified ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        maxLength={6}
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value)}
                        placeholder="6-digit OTP"
                        className="flex-1 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-primary focus:bg-white rounded-xl px-4 py-3 text-sm outline-none text-center font-bold tracking-widest text-slate-800 transition-all focus:ring-4 focus:ring-primary/10"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyEmail}
                        disabled={verifyingEmail || !emailOtp}
                        className="px-5 py-3 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {verifyingEmail ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <span>Verify</span>
                        )}
                      </button>
                    </div>

                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] text-slate-400">Didn&apos;t get email code?</span>
                      <button
                        type="button"
                        disabled={timerSeconds > 0}
                        onClick={handleResendEmailOtp}
                        className="text-[10px] font-bold text-primary disabled:text-slate-300 hover:underline transition-all"
                      >
                        Resend Email
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Email verification process is complete.</p>
                )}
              </div>


              {/* Navigation Actions */}
              <div className="flex gap-4 border-t border-slate-200 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold rounded-xl transition-all text-slate-600"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <div className="flex-1 py-3 bg-primary/10 text-primary font-bold rounded-xl text-xs flex items-center justify-center gap-2">
                  {mobileVerified && emailVerified ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Signing you in...</span></>
                  ) : (
                    <><ShieldCheck className="w-4 h-4" /><span>Complete the verification above</span></>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Legal Notice */}
          <div className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-200 pt-4 text-center">
            By signing up, you agree that you are 18 years of age or older. We are not responsible for user-generated content, audio/video channels, or third-party communications under our <Link href="/terms" className="underline hover:text-slate-500">Terms of Service</Link> and <Link href="/privacy" className="underline hover:text-slate-500">Privacy Policy</Link>.
          </div>

          <div className="text-center text-sm text-slate-500">
            <span>Already have an account? </span>
            <Link href="/login" className="font-bold text-primary hover:text-primary/80 hover:underline transition-all">
              Sign In
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
