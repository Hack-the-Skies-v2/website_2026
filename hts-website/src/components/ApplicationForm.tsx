"use client";

import { useState, useEffect, useRef, useCallback, useActionState } from "react";
import { useRouter } from "next/navigation";
import ParallaxLayer from "@/components/ParallaxLayer";
import { submitRoleApplication, type RoleApplicationState } from "@/actions/submitRoleApplication";
import { submitHackerApplication } from "@/actions/submitHackerApplication";
import { saveDraftHackerApplication } from "@/actions/saveDraftHackerApplication";
import { loadDraftHackerApplication } from "@/actions/loadDraftHackerApplication";

const STORAGE_KEY = "hts_application_draft";
const AUTO_SAVE_DELAY = 1500;

const CANADIAN_PROVINCES = [
    "Alberta",
    "British Columbia",
    "Manitoba",
    "New Brunswick",
    "Newfoundland and Labrador",
    "Northwest Territories",
    "Nova Scotia",
    "Nunavut",
    "Ontario",
    "Prince Edward Island",
    "Quebec",
    "Saskatchewan",
    "Yukon",
];

interface ApplicationData {
    section1: {
        role: "Hacker" | "Judge" | "Mentor" | "";
        firstName: string;
        lastName: string;
        preferredName: string;
        phoneNumber: string;
        dateOfBirth: string;
        tShirtSize: string;
        city: string;
        province: string;
        dietaryRestrictions: string[];
        dietaryOther: string;
        accessibilityAccommodations: string[];
        accessibilityOther: string;
    };
    section2: {
        schoolName: string;
        grade: string;
        graduationYear: string;
        schoolCity: string;
    };
    section3: {
        parentName: string;
        parentEmail: string;
        parentPhone: string;
        emergencyContactName: string;
        emergencyContactPhone: string;
        emergencyContactRelationship: string;
        emergencyContactRelationshipOther: string;
    };
    section4: {
        hackathonExperience: string;
        heardAboutHTS: string;
        heardAboutHTSOther: string;
    };
    section5: {
        applicationQuestions: string[];
    };
    section6: {
        eligibilityConfirm: boolean;
        informationConfirm: boolean;
        parentalConfirm: boolean;
        termsAgreed: boolean;
    };
}

const EMPTY_DATA: ApplicationData = {
    section1: {
        role: "",
        firstName: "",
        lastName: "",
        preferredName: "",
        phoneNumber: "",
        dateOfBirth: "",
        tShirtSize: "",
        city: "",
        province: "",
        dietaryRestrictions: [],
        dietaryOther: "",
        accessibilityAccommodations: [],
        accessibilityOther: "",
    },
    section2: {
        schoolName: "",
        grade: "",
        graduationYear: "",
        schoolCity: "",
    },
    section3: {
        parentName: "",
        parentEmail: "",
        parentPhone: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        emergencyContactRelationship: "",
        emergencyContactRelationshipOther: "",
    },
    section4: {
        hackathonExperience: "",
        heardAboutHTS: "",
        heardAboutHTSOther: "",
    },
    section5: {
        applicationQuestions: ["", "", "", "", ""],
    },
    section6: {
        eligibilityConfirm: false,
        informationConfirm: false,
        parentalConfirm: false,
        termsAgreed: false,
    },
};

function saveApplicationDraft(data: ApplicationData) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("Failed to save draft:", e);
    }
}

function loadApplicationDraft(): ApplicationData {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved) as Partial<ApplicationData> & {
                section1?: Partial<ApplicationData["section1"]>;
                section5?: Partial<ApplicationData["section5"]> & {
                    applicationQuestion?: string;
                };
            };
            const previousAnswer = parsed.section5?.applicationQuestion ?? "";

            return {
                ...EMPTY_DATA,
                ...parsed,
                section1: { ...EMPTY_DATA.section1, ...parsed.section1 },
                section5: {
                    ...EMPTY_DATA.section5,
                    ...parsed.section5,
                    applicationQuestions: Array.isArray(parsed.section5?.applicationQuestions)
                        ? parsed.section5.applicationQuestions
                        : [previousAnswer, "", "", "", ""],
                },
            };
        }
    } catch (e) {
        console.error("Failed to load draft:", e);
    }
    return EMPTY_DATA;
}

function clearApplicationDraft() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.error("Failed to clear draft:", e);
    }
}

export default function ApplicationForm() {
    const router = useRouter();
    const [currentSection, setCurrentSection] = useState(0);
    const [data, setData] = useState<ApplicationData>(EMPTY_DATA);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "">("")
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const dbLoadedRef = useRef(false);

    useEffect(() => {
        queueMicrotask(() => {
            const loaded = loadApplicationDraft();
            setCurrentSection(loaded.section1.role ? 1 : 0);
            setData(loaded);

            if (!dbLoadedRef.current) {
                dbLoadedRef.current = true;
                loadDraftHackerApplication().then((dbDraft) => {
                    if (dbDraft) {
                        setData(dbDraft as unknown as ApplicationData);
                        setCurrentSection(1);
                        saveApplicationDraft(dbDraft as unknown as ApplicationData);
                    }
                }).catch(() => { });
            }
        });
    }, []);

    const debouncedSave = useCallback((newData: ApplicationData) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        setSaveStatus("saving");

        saveTimeoutRef.current = setTimeout(() => {
            saveApplicationDraft(newData);

            if (newData.section1.role === "Hacker") {
                saveDraftHackerApplication(newData).then((res) => {
                    setSaveStatus(res.success ? "saved" : "");
                    if (res.success) setTimeout(() => setSaveStatus(""), 2000);
                }).catch(() => {
                    setSaveStatus("");
                });
            } else {
                setSaveStatus("saved");
                setTimeout(() => setSaveStatus(""), 2000);
            }
        }, AUTO_SAVE_DELAY);
    }, []);

    const updateData = useCallback(
        (updates: Partial<ApplicationData>) => {
            const newData = { ...data, ...updates };
            setData(newData);
            debouncedSave(newData);
        },
        [data, debouncedSave]
    );

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validatePhone = (phone: string) => {
        return /^\d{10}|^\+?\d{1,3}[-.\s]?\d{1,14}$/.test(phone.replace(/\D/g, ""));
    };

    const validateSection1 = () => {
        const newErrors: Record<string, string> = {};
        if (!data.section1.firstName.trim())
            newErrors.firstName = "Please enter your first name.";
        if (!data.section1.lastName.trim())
            newErrors.lastName = "Please enter your last name.";
        if (!data.section1.phoneNumber.trim())
            newErrors.phoneNumber = "Please enter your phone number.";
        else if (!validatePhone(data.section1.phoneNumber))
            newErrors.phoneNumber = "Please enter a valid phone number.";
        if (!data.section1.dateOfBirth)
            newErrors.dateOfBirth = "Please select your date of birth.";
        if (!data.section1.tShirtSize)
            newErrors.tShirtSize = "Please select your t-shirt size.";
        if (!data.section1.city.trim()) newErrors.city = "Please enter your city.";
        if (!data.section1.province)
            newErrors.province = "Please select your province.";
        if (
            data.section1.dietaryRestrictions.includes("Other") &&
            !data.section1.dietaryOther.trim()
        )
            newErrors.dietaryOther = "Please specify your dietary restrictions.";
        if (
            data.section1.accessibilityAccommodations.includes("Other") &&
            !data.section1.accessibilityOther.trim()
        )
            newErrors.accessibilityOther =
                "Please describe your accessibility needs.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateSection2 = () => {
        const newErrors: Record<string, string> = {};
        if (!data.section2.schoolName.trim())
            newErrors.schoolName = "Please enter your school name.";
        if (!data.section2.grade) newErrors.grade = "Please select your grade.";
        if (!data.section2.graduationYear)
            newErrors.graduationYear = "Please select your graduation year.";
        if (!data.section2.schoolCity.trim())
            newErrors.schoolCity = "Please enter your school city.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateSection3 = () => {
        const newErrors: Record<string, string> = {};
        if (!data.section3.parentName.trim())
            newErrors.parentName = "Please enter your parent/guardian's name.";
        if (!data.section3.parentEmail.trim())
            newErrors.parentEmail =
                "Please enter your parent/guardian's email address.";
        else if (!validateEmail(data.section3.parentEmail))
            newErrors.parentEmail = "Please enter a valid email address.";
        if (!data.section3.parentPhone.trim())
            newErrors.parentPhone =
                "Please enter your parent/guardian's phone number.";
        else if (!validatePhone(data.section3.parentPhone))
            newErrors.parentPhone = "Please enter a valid phone number.";
        if (!data.section3.emergencyContactName.trim())
            newErrors.emergencyContactName =
                "Please enter your emergency contact's name.";
        if (!data.section3.emergencyContactPhone.trim())
            newErrors.emergencyContactPhone =
                "Please enter your emergency contact's phone number.";
        else if (!validatePhone(data.section3.emergencyContactPhone))
            newErrors.emergencyContactPhone = "Please enter a valid phone number.";
        if (!data.section3.emergencyContactRelationship)
            newErrors.emergencyContactRelationship =
                "Please select the relationship.";
        if (
            data.section3.emergencyContactRelationship === "Other" &&
            !data.section3.emergencyContactRelationshipOther.trim()
        )
            newErrors.emergencyContactRelationshipOther =
                "Please specify the relationship.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateSection4 = () => {
        const newErrors: Record<string, string> = {};
        if (!data.section4.hackathonExperience)
            newErrors.hackathonExperience = "Please select an option.";
        if (!data.section4.heardAboutHTS)
            newErrors.heardAboutHTS = "Please select how you heard about us.";
        if (
            data.section4.heardAboutHTS === "Other" &&
            !data.section4.heardAboutHTSOther.trim()
        )
            newErrors.heardAboutHTSOther = "Please specify.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateSection5 = () => {
        const newErrors: Record<string, string> = {};
        data.section5.applicationQuestions.forEach((answer, index) => {
            const wordCount = answer.trim().split(/\s+/).filter((word) => word.length > 0).length;
            if (!answer.trim()) newErrors[`applicationQuestion${index}`] = "Please answer this question.";
            if (wordCount > 300) newErrors[`applicationQuestion${index}`] = "Your answer exceeds 300 words.";
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateSection6 = () => {
        const newErrors: Record<string, string> = {};
        if (!data.section6.eligibilityConfirm)
            newErrors.eligibilityConfirm = "Please confirm eligibility.";
        if (!data.section6.informationConfirm)
            newErrors.informationConfirm =
                "Please confirm information accuracy.";
        if (!data.section6.parentalConfirm)
            newErrors.parentalConfirm = "Please confirm understanding.";
        if (!data.section6.termsAgreed)
            newErrors.termsAgreed = "Please agree to the Terms of Service and Privacy Policy.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleContinue = () => {
        let isValid = false;
        switch (currentSection) {
            case 1:
                isValid = validateSection1();
                break;
            case 2:
                isValid = validateSection2();
                break;
            case 3:
                isValid = validateSection3();
                break;
            case 4:
                isValid = validateSection4();
                break;
            case 5:
                isValid = validateSection5();
                break;
            default:
                isValid = true;
        }

        if (isValid) {
            if (currentSection < 6) {
                setCurrentSection(currentSection + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        }
    };

    const handleRoleContinue = () => {
        if (!data.section1.role || data.section1.role === "Hacker") {
            setErrors({ role: "Please select your role." });
            return;
        }

        setErrors({});
        setCurrentSection(1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleBack = () => {
        if (currentSection === 1) {
            setCurrentSection(0);
        } else if (currentSection > 1) {
            setCurrentSection(currentSection - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleSaveContinueLater = () => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveApplicationDraft(data);
        setSaveStatus("saved");
    };

    const handleSubmit = async () => {
        if (validateSection6()) {
            setIsSubmitting(true);
            setSubmitError("");
            const res = await submitHackerApplication(data);
            if (res.success) {
                clearApplicationDraft();
                router.replace("/portal");
            } else {
                setIsSubmitting(false);
                setSubmitError(res.error || "Unable to submit your application. Please try again.");
            }
        }
    };

    const handleEditSection = (section: number) => {
        setCurrentSection(section);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const getProgress = () => {
        return Math.round((currentSection / 6) * 100);
    };

    const wordCount = data.section5.applicationQuestions.reduce(
        (total, answer) => total + answer.trim().split(/\s+/).filter((word) => word.length > 0).length,
        0,
    );

    if (currentSection === 0) {
        return (
            <RoleSelection
                role={data.section1.role}
                error={errors.role}
                onSelect={(role) =>
                    updateData({ section1: { ...data.section1, role } })
                }
                onContinue={handleRoleContinue}
            />
        );
    }

    if (data.section1.role === "Judge") {
        return <JudgeApplicationForm onBack={handleBack} />;
    }

    if (data.section1.role === "Mentor") {
        return <MentorApplicationForm onBack={handleBack} />;
    }

    return (
        <section className="relative min-h-screen bg-[#141123] px-6 py-12">
            <ParallaxLayer
                speed={0.4}
                className="
					pointer-events-none
					absolute
					top-[-150px]
					left-1/2
					w-[1000px]
					-translate-x-1/2
					opacity-30
					blur-[1px]
					cloud-drift
					select-none
				"
            >
                <img src="/Cloud1.webp" alt="" className="h-full w-full" />
            </ParallaxLayer>

            <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
                <div className="flex-1">
                    {currentSection === 1 && (
                        <Section1
                            data={data}
                            updateData={updateData}
                            errors={errors}
                        />
                    )}
                    {currentSection === 2 && (
                        <Section2
                            data={data}
                            updateData={updateData}
                            errors={errors}
                        />
                    )}
                    {currentSection === 3 && (
                        <Section3
                            data={data}
                            updateData={updateData}
                            errors={errors}
                        />
                    )}
                    {currentSection === 4 && (
                        <Section4
                            data={data}
                            updateData={updateData}
                            errors={errors}
                        />
                    )}
                    {currentSection === 5 && (
                        <Section5
                            data={data}
                            updateData={updateData}
                            errors={errors}
                            wordCount={wordCount}
                        />
                    )}
                    {currentSection === 6 && (
                        <Section6
                            data={data}
                            updateData={updateData}
                            errors={errors}
                            onEditSection={handleEditSection}
                        />
                    )}

                    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-between">
                        {currentSection > 0 && (
                            <button
                                onClick={handleBack}
                                className="
									rounded-full
									bg-button
									px-6 py-2
									font-outfit
									text-base text-white
									shadow-[0_0_20px_rgba(130,104,180,0.45)]
									transition-all duration-150
									hover:bg-[#8268B4]
									hover:scale-105
                                    cursor-pointer
								"
                            >
                                Back
                            </button>
                        )}

                        {currentSection < 6 ? (
                            <button
                                onClick={handleContinue}
                                className="
									rounded-full
									bg-button
									px-6 py-2
									font-outfit
									text-base text-white
									shadow-[0_0_20px_rgba(130,104,180,0.45)]
									transition-all duration-150
									hover:bg-[#8268B4]
									hover:scale-105
                                    cursor-pointer
									ml-auto
								"
                            >
                                Continue
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="
									rounded-full
									bg-button
									px-6 py-2
									font-outfit
									text-base text-white
									shadow-[0_0_20px_rgba(130,104,180,0.45)]
									transition-all duration-150
									hover:bg-[#8268B4]
									hover:scale-105
									ml-auto
                                    cursor-pointer
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
								"
                            >
                                {isSubmitting ? "Submitting..." : "Submit Application"}
                            </button>
                        )}
                    </div>

                    {submitError && (
                        <p role="alert" className="mt-4 text-center font-outfit text-sm text-red-400">
                            {submitError}
                        </p>
                    )}

                    {saveStatus && (
                        <div className="mt-4 text-center text-primary font-outfit text-sm">
                            {saveStatus === "saving" ? "Saving..." : "Saved"}
                        </div>
                    )}
                </div>

                <div className="hidden lg:flex flex-col items-center w-32">
                    <RocketProgressIndicator progress={getProgress()} />
                </div>
            </div>
        </section>
    );
}

function RocketProgressIndicator({ progress }: { progress: number }) {
    const rocketPosition = Math.min(Math.max((progress / 100) * 430, 0), 430);
    const completedSteps = Math.max(1, Math.round(progress / 100 * 6));

    return (
        <div className="fixed right-8 top-1/2 flex -translate-y-1/2 flex-col items-center">
            <div className="mb-4 font-outfit text-base font-semibold text-primary">
                {completedSteps} of 6 sections
            </div>
            <div className="relative h-[500px] w-16 rounded-full border border-primary/30 bg-[#221c38]/80 p-1 shadow-[0_0_25px_rgba(193,185,242,0.12)]">
                <div
                    className="absolute inset-x-1 bottom-1 rounded-full bg-gradient-to-t from-[#f8d472] via-[#f3b7e5] to-primary transition-all duration-500"
                    style={{ height: `calc(${progress}% - 8px)` }}
                />
                <div
                    className="absolute left-[calc(50%-4px)] z-10 -translate-x-1/2 transition-all duration-500"
                    style={{ bottom: `${rocketPosition}px` }}
                >
                    <div className="rocket-vibrate relative h-20 w-20">
                        <img
                            src="/rocket.png"
                            alt="Progress rocket"
                            width={80}
                            height={80}
                            className="absolute inset-0 h-20 w-20 rotate-180 drop-shadow-[0_0_14px_rgba(248,212,114,0.7)]"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function RoleSelection({
    role,
    error,
    onSelect,
    onContinue,
}: {
    role: ApplicationData["section1"]["role"];
    error?: string;
    onSelect: (role: "Hacker" | "Judge" | "Mentor") => void;
    onContinue: () => void;
}) {
    const roleOptions: { value: string; disabled: boolean; tag?: string }[] = [
        { value: "Hacker", disabled: true },
        { value: "Judge", disabled: false },
        { value: "Mentor", disabled: false },
    ];

    return (
        <section className="relative flex min-h-screen items-center justify-center bg-[#141123] px-6 py-12">
            <ParallaxLayer
                speed={0.4}
                className="pointer-events-none absolute left-1/2 top-[-150px] w-[1000px] -translate-x-1/2 opacity-30 blur-[1px] cloud-drift select-none"
            >
                <img src="/Cloud1.webp" alt="" className="h-full w-full" />
            </ParallaxLayer>
            <div className="relative z-10 w-full max-w-6xl px-0 py-6 sm:px-6 sm:py-10">
                <h1 className="mt-3 font-outfit text-4xl font-semibold text-primary sm:text-5xl">
                    Choose your role
                </h1>
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                    {roleOptions.map((option) => (
                        <label
                            key={option.value}
                            className={`rounded-2xl border p-5 transition ${option.disabled
                                ? "cursor-not-allowed border-primary/10 bg-[#221c38]/30 opacity-40 select-none"
                                : "cursor-pointer " +
                                (role === option.value
                                    ? "border-primary bg-primary/15 shadow-[0_0_22px_rgba(193,185,242,0.2)]"
                                    : "border-primary/25 bg-[#221c38]/60 hover:border-primary/60")
                                }`}
                        >
                            <input
                                type="radio"
                                name="application-role"
                                value={option.value}
                                disabled={option.disabled}
                                checked={!option.disabled && role === option.value}
                                onChange={() => {
                                    if (!option.disabled) {
                                        onSelect(option.value as "Hacker" | "Judge" | "Mentor");
                                    }
                                }}
                                className="sr-only"
                            />
                            <div className="flex items-center justify-between">
                                <span className="block font-outfit text-xl font-semibold text-primary">
                                    {option.value}
                                </span>
                                {option.tag && (
                                    <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary/60">
                                        {option.tag}
                                    </span>
                                )}
                            </div>
                        </label>
                    ))}
                </div>
                {error && <p className="mt-3 font-outfit text-sm text-red-400">{error}</p>}
                <button
                    type="button"
                    onClick={onContinue}
                    disabled={!role || role === "Hacker"}
                    className="cursor-pointer mt-8 ml-auto block rounded-full bg-button px-7 py-3 font-outfit font-semibold text-white shadow-[0_0_20px_rgba(130,104,180,0.45)] transition hover:scale-105 hover:bg-[#8268B4] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                    Continue
                </button>
            </div>
        </section>
    );
}

function RoleApplicationShell({
    title,
    role,
    children,
    onBack,
}: {
    title: string;
    role: "Judge" | "Mentor";
    children: React.ReactNode;
    onBack: () => void;
}) {
    const [state, formAction, isPending] = useActionState<RoleApplicationState, FormData>(
        submitRoleApplication,
        { success: false },
    );
    const [areasError, setAreasError] = useState("");
    const router = useRouter();

    useEffect(() => {
        if (!state.success) return;

        const redirectTimer = window.setTimeout(() => {
            router.replace("/jm-portal");
        }, 1600);

        return () => window.clearTimeout(redirectTimer);
    }, [router, state.success]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        const hasSelectedArea = event.currentTarget.querySelector(
            'input[name="areas"]:checked',
        );

        if (!hasSelectedArea) {
            event.preventDefault();
            setAreasError("Please select at least one area of expertise.");
            event.currentTarget
                .querySelector<HTMLElement>("[data-expertise-section]")
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }

        setAreasError("");
    };

    return (
        <section className="relative min-h-screen bg-[#141123] px-6 py-12">
            <ParallaxLayer
                speed={0.4}
                className="pointer-events-none absolute left-1/2 top-[-150px] w-[1000px] -translate-x-1/2 opacity-30 blur-[1px] cloud-drift select-none"
            >
                <img src="/Cloud1.webp" alt="" className="h-full w-full" />
            </ParallaxLayer>
            <div className="relative z-10 mx-auto max-w-6xl">
                <button
                    type="button"
                    onClick={onBack}
                    className="mb-8 rounded-full cursor-pointer bg-button px-6 py-2 font-outfit text-base text-white shadow-[0_0_20px_rgba(130,104,180,0.45)] transition hover:bg-[#8268B4]"
                >
                    Back to role selection
                </button>
                <h1 className="mt-3 font-outfit text-4xl font-semibold text-primary sm:text-5xl">{title}</h1>
                <form
                    action={formAction}
                    onSubmit={handleSubmit}
                    className="mt-10 max-w-4xl space-y-10"
                >
                    <input type="hidden" name="role" value={role} />
                    {children}
                    {areasError && <p role="alert" className="font-outfit text-sm text-red-400">{areasError}</p>}
                    {state.error && <p role="alert" className="font-outfit text-sm text-red-400">{state.error}</p>}
                    {state.success && <p role="status" className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-4 font-outfit text-sm text-emerald-200">Your application was submitted successfully. Redirecting you to the portal...</p>}
                    {isPending && <p className="font-outfit text-sm text-primary/60">Submitting your application...</p>}
                </form>
            </div>
        </section>
    );
}

function JudgeApplicationForm({ onBack }: { onBack: () => void }) {
    const expertise = ["Software / Technology", "AI / Machine Learning", "Data", "Aerospace / Aviation", "Business / Entrepreneurship", "Product Management", "Design / UX", "Finance", "Marketing", "Cybersecurity", "Engineering", "Other"];

    return (
        <RoleApplicationShell title="Judge application" role="Judge" onBack={onBack}>
            <div>
                <p className="font-outfit text-md text-primary/80 mb-6">
                    Become a Hack the Skies 2026 Judge
                    <br />
                    As a judge at Hack the Skies, you’ll evaluate projects built by high-school students and help recognize the teams that stand out. You’ll get to see creative ideas, emerging technology, and innovative solutions firsthand while providing valuable feedback to students.
                    <br />
                    We’re looking for industry professionals who can bring their expertise, perspective, and constructive feedback to the judging process. You don’t need prior hackathon judging experience, just an interest in supporting students and evaluating their work.
                    <br />
                    Judges only need to be available in-person for the afternoon of October 18th.
                </p>
                <p className="font-outfit text-md uppercase tracking-[0.2em] text-primary/80 mb-6">Answers do not save</p>
                <h2 className="mb-6 font-outfit text-2xl font-semibold text-primary">Basic Information</h2>
                <div className="grid gap-6 md:grid-cols-2">
                    <RoleInput name="name" label="Name" required />
                    <RoleInput name="companyOrganization" label="Company / Organization" required />
                    <RoleInput name="jobTitle" label="Job Title / Role" required />
                    <RoleInput name="linkedinUrl" label="LinkedIn (optional)" />
                    <RoleInput name="industryField" label="Industry / Field" required />
                </div>
            </div>
            <div>
                <h2 className="mb-6 font-outfit text-2xl font-semibold text-primary">Expertise</h2>
                <RoleCheckboxGroup name="areas" label="Which areas best describe your professional expertise?" options={expertise} />
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <RoleSelect name="yearsOfExperience" label="Years of professional experience" options={["", "0-2", "3-5", "6-10", "11-15", "16+"]} required />
                </div>
                <RoleTextArea name="strongProjectDescription" label="What makes a strong hackathon project?" required />
                <RoleTextArea name="professionalBackground" label="Briefly describe your professional background and expertise." required />
                <RoleTextArea name="judgingExperience" label="Have you judged a hackathon, competition, pitch competition, science fair, or similar event? If yes, briefly describe." required />
            </div>
            <div>
                <h2 className="mb-6 font-outfit text-2xl font-semibold text-primary">Availability</h2>
                <RoleSelect name="availableForFullJudgingPeriod" label="Are you available for the full judging period?" options={["", "Yes", "No"]} required />
                <RoleAgreements submitLabel="Submit Judge Application" />
            </div>
        </RoleApplicationShell>
    );
}

function MentorApplicationForm({ onBack }: { onBack: () => void }) {
    const areas = ["Programming / Software Development", "AI / Machine Learning", "Web Development", "App Development", "Data Science", "Cybersecurity", "UI/UX & Design", "Entrepreneurship / Business", "Pitching / Presentations", "Product Development", "Other"];

    return (
        <RoleApplicationShell title="Mentor application" role="Mentor" onBack={onBack}>
            <div>
                <p className="font-outfit text-md text-primary/80 mb-6">
                    Become a Hack the Skies 2026 Mentor!
                    <br />
                    As a mentor at Hack the Skies, you’ll support high-school students throughout our two-day in-person hackathon on October 17th and 18th, as well as an optional (online) opening ceremony on October 16th. You’ll help teams brainstorm ideas, troubleshoot technical challenges, explore new tools, and turn their ideas into working projects, no matter their experience level. You don’t need to have all the answers. We’re looking for university students who are approachable, enthusiastic, and excited to help the next generation of students learn, build, and have fun.
                </p>
                <p className="font-outfit text-md uppercase tracking-[0.2em] text-primary/80 mb-6">Answers do not save</p>
                <h2 className="mb-6 font-outfit text-2xl font-semibold text-primary">Basic Information</h2>
                <div className="grid gap-6 md:grid-cols-2">
                    <RoleInput name="name" label="Name" required />
                    <RoleInput name="universityCollege" label="University / College" required />
                    <RoleInput name="programAndYear" label="Program and year of study" required />
                    <RoleInput name="linkedinPortfolioGithub" label="LinkedIn / Portfolio / GitHub (optional)" />
                </div>
            </div>
            <div>
                <h2 className="mb-6 font-outfit text-2xl font-semibold text-primary">Experience & Skills</h2>
                <RoleCheckboxGroup name="areas" label="What areas are you most comfortable helping with?" options={areas} />
                <RoleTextArea name="technologiesAndTools" label="What technologies, programming languages, or tools are you most familiar with?" required />
                <RoleTextArea name="mentoringExperience" label="Have you mentored, taught, tutored, or worked with high-school students before? If yes, briefly describe." required />
                <RoleTextArea name="mentoringGoals" label="What are you hoping to get out of mentoring at Hack the Skies?" required />
            </div>
            <div>
                <h2 className="mb-6 font-outfit text-2xl font-semibold text-primary">Availability</h2>
                <div className="grid gap-6 md:grid-cols-2">
                    <RoleSelect name="availableForFullEvent" label="Are you available for the full Hack the Skies event?" options={["", "Yes", "No"]} required />
                    <RoleInput name="timesUnavailable" label="Times you will be unavailable (optional)" />
                </div>
                <RoleAgreements submitLabel="Submit Mentor Application" />
            </div>
        </RoleApplicationShell>
    );
}

function RoleCheckboxGroup({ name, label, options }: { name: string; label: string; options: string[] }) {
    return (
        <div data-expertise-section>
            <label className="mb-3 block font-outfit text-base text-primary">{label}</label>
            <div className="grid gap-2 md:grid-cols-2">
                {options.map((option) => (
                    <label key={option} className="cursor-pointer flex items-center gap-2 font-outfit text-primary/80">
                        <input type="checkbox" name={name} value={option} className="h-4 w-4 accent-primary cursor-pointer" />
                        {option}
                    </label>
                ))}
            </div>
        </div>
    );
}

function RoleTextArea({ name, label, placeholder, required }: { name: string; label: string; placeholder?: string; required?: boolean }) {
    const [value, setValue] = useState("");

    return (
        <div className="mt-6">
            <label className="mb-2 block font-outfit text-base text-primary">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            <textarea name={name} value={value} onChange={(event) => setValue(event.target.value)} required={required} placeholder={placeholder} className="min-h-[130px] w-full resize-none rounded-lg border border-primary bg-button p-4 font-outfit text-primary placeholder:text-primary/60 focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
    );
}

function RoleAgreements({ submitLabel }: { submitLabel: string }) {
    const [agreements, setAgreements] = useState({
        terms: false,
        eligibility: false,
        information: false,
        participation: false,
    });
    const toggle = (key: keyof typeof agreements) => {
        setAgreements((current) => ({ ...current, [key]: !current[key] }));
    };

    return (
        <div className="mt-8 space-y-3 rounded-lg border border-primary/30 bg-white/5 p-6">
            <label className="flex items-start gap-3 font-outfit text-base text-primary cursor-pointer">
                <input type="checkbox" name="termsAgreed" value="true" required checked={agreements.terms} onChange={() => toggle("terms")} className="cursor-pointer mt-1 h-5 w-5 shrink-0 accent-primary" />
                <span>
                    I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Terms of Service</a> and acknowledge the <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Privacy Policy</a>.
                </span>
            </label>
            <label className="flex items-start gap-3 font-outfit text-base text-primary cursor-pointer">
                <input type="checkbox" name="eligibilityConfirmed" value="true" required checked={agreements.eligibility} onChange={() => toggle("eligibility")} className="cursor-pointer mt-1 h-5 w-5 shrink-0 accent-primary" />
                <span>I confirm that the information I provided is accurate and complete.</span>
            </label>
            <label className="flex items-start gap-3 font-outfit text-base text-primary cursor-pointer">
                <input type="checkbox" name="informationConfirmed" value="true" required checked={agreements.information} onChange={() => toggle("information")} className="cursor-pointer mt-1 h-5 w-5 shrink-0 accent-primary" />
                <span>I consent to Hack the Skies using this information to review my application and coordinate the event.</span>
            </label>
            <label className="flex items-start gap-3 font-outfit text-base text-primary cursor-pointer">
                <input type="checkbox" name="participationConfirmed" value="true" required checked={agreements.participation} onChange={() => toggle("participation")} className="cursor-pointer mt-1 h-5 w-5 shrink-0 accent-primary" />
                <span>I understand that participation is subject to approval and event policies.</span>
            </label>
            <button type="submit" className="cursor-pointer mt-5 rounded-full bg-button px-7 py-3 font-outfit font-semibold text-white shadow-[0_0_20px_rgba(130,104,180,0.45)] transition hover:bg-[#8268B4]">
                {submitLabel}
            </button>
        </div>
    );
}

function Section1({
    data,
    updateData,
    errors,
}: {
    data: ApplicationData;
    updateData: (updates: Partial<ApplicationData>) => void;
    errors: Record<string, string>;
}) {
    const section1 = data.section1;

    const handleDietaryChange = (option: string) => {
        const newDietary = section1.dietaryRestrictions.includes(option)
            ? section1.dietaryRestrictions.filter((d) => d !== option)
            : [...section1.dietaryRestrictions, option];

        updateData({
            section1: { ...section1, dietaryRestrictions: newDietary },
        });
    };

    const handleAccessibilityChange = (option: string) => {
        const newAccess = section1.accessibilityAccommodations.includes(option)
            ? section1.accessibilityAccommodations.filter((a) => a !== option)
            : [...section1.accessibilityAccommodations, option];

        updateData({
            section1: { ...section1, accessibilityAccommodations: newAccess },
        });
    };

    return (
        <div className="space-y-6">
            <p className="font-outfit text-md uppercase tracking-[0.2em] text-primary/80 mb-6">Answers automatically save</p>
            <h2 className="text-4xl font-outfit font-semibold text-primary mb-8">
                Personal Information
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
                <FormInput
                    label="First name"
                    value={section1.firstName}
                    onChange={(e) =>
                        updateData({
                            section1: { ...section1, firstName: e.target.value },
                        })
                    }
                    error={errors.firstName}
                    required
                />
                <FormInput
                    label="Last name"
                    value={section1.lastName}
                    onChange={(e) =>
                        updateData({
                            section1: { ...section1, lastName: e.target.value },
                        })
                    }
                    error={errors.lastName}
                    required
                />
            </div>

            <FormInput
                label="Preferred name"
                value={section1.preferredName}
                onChange={(e) =>
                    updateData({
                        section1: { ...section1, preferredName: e.target.value },
                    })
                }
                helperText="What should we call you? Leave blank if the same as your first name."
            />

            <div className="grid md:grid-cols-2 gap-6">
                <FormInput
                    label="Phone number"
                    type="tel"
                    value={section1.phoneNumber}
                    onChange={(e) =>
                        updateData({
                            section1: { ...section1, phoneNumber: e.target.value },
                        })
                    }
                    error={errors.phoneNumber}
                    required
                />
                <FormSelect
                    label="T-shirt size"
                    value={section1.tShirtSize}
                    onChange={(e) =>
                        updateData({
                            section1: { ...section1, tShirtSize: e.target.value },
                        })
                    }
                    options={["", "XS", "S", "M", "L", "XL", "2XL"]}
                    error={errors.tShirtSize}
                    required
                />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <FormInput
                    label="City"
                    value={section1.city}
                    onChange={(e) =>
                        updateData({
                            section1: { ...section1, city: e.target.value },
                        })
                    }
                    error={errors.city}
                    required
                />
                <FormSelect
                    label="Province"
                    value={section1.province}
                    onChange={(e) =>
                        updateData({
                            section1: { ...section1, province: e.target.value },
                        })
                    }
                    options={["", ...CANADIAN_PROVINCES]}
                    error={errors.province}
                    required
                />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <FormInput
                    label="Date of birth"
                    type="date"
                    value={section1.dateOfBirth}
                    onChange={(e) =>
                        updateData({
                            section1: { ...section1, dateOfBirth: e.target.value },
                        })
                    }
                    error={errors.dateOfBirth}
                    required
                />
            </div>

            <div>
                <label className="block text-primary font-outfit text-base mb-3">
                    Dietary restrictions
                </label>
                <div className="space-y-2">
                    {[
                        "Vegetarian",
                        "Vegan",
                        "Halal",
                        "Kosher",
                        "Gluten-free",
                        "Nut allergy",
                        "Other",
                    ].map((option) => (
                        <label key={option} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={section1.dietaryRestrictions.includes(option)}
                                onChange={() => handleDietaryChange(option)}
                                className="w-4 h-4 cursor-pointer accent-primary"
                            />
                            <span className="text-primary font-outfit">{option}</span>
                        </label>
                    ))}
                </div>
                {section1.dietaryRestrictions.includes("Other") && (
                    <FormInput
                        label="Please specify"
                        value={section1.dietaryOther}
                        onChange={(e) =>
                            updateData({
                                section1: { ...section1, dietaryOther: e.target.value },
                            })
                        }
                        error={errors.dietaryOther}
                        className="mt-3"
                    />
                )}
                {errors.dietaryRestrictions && (
                    <p className="text-red-400 font-outfit text-sm mt-1">
                        {errors.dietaryRestrictions}
                    </p>
                )}
            </div>

            <div>
                <label className="block text-primary font-outfit text-base mb-3">
                    Accessibility accommodations
                </label>
                <div className="space-y-2">
                    {[
                        "Mobility accommodation",
                        "Visual accommodation",
                        "Hearing accommodation",
                        "Quiet / low-stimulation space",
                        "Other",
                    ].map((option) => (
                        <label key={option} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={section1.accessibilityAccommodations.includes(
                                    option
                                )}
                                onChange={() => handleAccessibilityChange(option)}
                                className="w-4 h-4 cursor-pointer accent-primary"
                            />
                            <span className="text-primary font-outfit">{option}</span>
                        </label>
                    ))}
                </div>
                {section1.accessibilityAccommodations.includes("Other") && (
                    <textarea
                        value={section1.accessibilityOther}
                        onChange={(e) =>
                            updateData({
                                section1: { ...section1, accessibilityOther: e.target.value },
                            })
                        }
                        placeholder="Please describe any accommodations you may need."
                        className="
							w-full
							mt-3
							p-3
							border border-primary
							rounded-lg
							bg-button
							text-primary
							font-outfit
							placeholder:text-primary/60
							focus:outline-none
							focus:ring-2
							focus:ring-primary
						"
                        rows={4}
                    />
                )}
                {errors.accessibilityAccommodations && (
                    <p className="text-red-400 font-outfit text-sm mt-1">
                        {errors.accessibilityAccommodations}
                    </p>
                )}
                {errors.accessibilityOther && (
                    <p className="text-red-400 font-outfit text-sm mt-1">
                        {errors.accessibilityOther}
                    </p>
                )}
            </div>
        </div>
    );
}

function Section2({
    data,
    updateData,
    errors,
}: {
    data: ApplicationData;
    updateData: (updates: Partial<ApplicationData>) => void;
    errors: Record<string, string>;
}) {
    const section2 = data.section2;
    const graduationYears = ["2026", "2027", "2028", "2029", "2030", "2031"];

    return (
        <div className="space-y-6">
            <h2 className="text-4xl font-outfit font-semibold text-primary mb-8">
                School Information
            </h2>

            <FormInput
                label="School name"
                value={section2.schoolName}
                onChange={(e) =>
                    updateData({
                        section2: { ...section2, schoolName: e.target.value },
                    })
                }
                error={errors.schoolName}
                required
            />

            <div className="grid md:grid-cols-2 gap-6">
                <FormSelect
                    label="Current grade"
                    value={section2.grade}
                    onChange={(e) =>
                        updateData({
                            section2: { ...section2, grade: e.target.value },
                        })
                    }
                    options={["", "Grade 9", "Grade 10", "Grade 11", "Grade 12"]}
                    error={errors.grade}
                    required
                />
                <FormSelect
                    label="Expected graduation year"
                    value={section2.graduationYear}
                    onChange={(e) =>
                        updateData({
                            section2: { ...section2, graduationYear: e.target.value },
                        })
                    }
                    options={["", ...graduationYears]}
                    error={errors.graduationYear}
                    required
                />
            </div>

            <FormInput
                label="School city"
                value={section2.schoolCity}
                onChange={(e) =>
                    updateData({
                        section2: { ...section2, schoolCity: e.target.value },
                    })
                }
                error={errors.schoolCity}
                required
            />
        </div>
    );
}

function Section3({
    data,
    updateData,
    errors,
}: {
    data: ApplicationData;
    updateData: (updates: Partial<ApplicationData>) => void;
    errors: Record<string, string>;
}) {
    const section3 = data.section3;

    return (
        <div className="space-y-6">
            <h2 className="text-4xl font-outfit font-semibold text-primary mb-8">
                Parent / Guardian Information
            </h2>

            <FormInput
                label="Parent / guardian name"
                value={section3.parentName}
                onChange={(e) =>
                    updateData({
                        section3: { ...section3, parentName: e.target.value },
                    })
                }
                error={errors.parentName}
                required
            />

            <div className="grid md:grid-cols-2 gap-6">
                <FormInput
                    label="Parent / guardian email"
                    type="email"
                    value={section3.parentEmail}
                    onChange={(e) =>
                        updateData({
                            section3: { ...section3, parentEmail: e.target.value },
                        })
                    }
                    error={errors.parentEmail}
                    required
                />
                <FormInput
                    label="Parent / guardian phone number"
                    type="tel"
                    value={section3.parentPhone}
                    onChange={(e) =>
                        updateData({
                            section3: { ...section3, parentPhone: e.target.value },
                        })
                    }
                    error={errors.parentPhone}
                    required
                />
            </div>

            <FormInput
                label="Emergency contact name"
                value={section3.emergencyContactName}
                onChange={(e) =>
                    updateData({
                        section3: { ...section3, emergencyContactName: e.target.value },
                    })
                }
                error={errors.emergencyContactName}
                required
            />

            <FormInput
                label="Emergency contact phone number"
                type="tel"
                value={section3.emergencyContactPhone}
                onChange={(e) =>
                    updateData({
                        section3: { ...section3, emergencyContactPhone: e.target.value },
                    })
                }
                error={errors.emergencyContactPhone}
                required
            />

            <div>
                <FormSelect
                    label="Relationship to participant"
                    value={section3.emergencyContactRelationship}
                    onChange={(e) =>
                        updateData({
                            section3: { ...section3, emergencyContactRelationship: e.target.value },
                        })
                    }
                    options={["", "Parent", "Guardian", "Sibling", "Relative", "Family friend", "Other"]}
                    error={errors.emergencyContactRelationship}
                    required
                />
                {section3.emergencyContactRelationship === "Other" && (
                    <FormInput
                        label="Please specify"
                        value={section3.emergencyContactRelationshipOther}
                        onChange={(e) =>
                            updateData({
                                section3: { ...section3, emergencyContactRelationshipOther: e.target.value },
                            })
                        }
                        error={errors.emergencyContactRelationshipOther}
                        className="mt-3"
                    />
                )}
            </div>
        </div>
    );
}

function Section4({
    data,
    updateData,
    errors,
}: {
    data: ApplicationData;
    updateData: (updates: Partial<ApplicationData>) => void;
    errors: Record<string, string>;
}) {
    const section4 = data.section4;

    return (
        <div className="space-y-6">
            <h2 className="text-4xl font-outfit font-semibold text-primary mb-8">
                Hackathon Information
            </h2>

            <div>
                <label className="block text-primary font-outfit text-base mb-3">
                    How many hackathons have you attended before?{" "}
                    <span className="text-red-400">*</span>
                </label>
                <select
                    value={section4.hackathonExperience}
                    onChange={(e) =>
                        updateData({
                            section4: { ...section4, hackathonExperience: e.target.value },
                        })
                    }
                    className="
						w-full
						p-3
						border border-primary
						rounded-lg
						bg-button
						text-primary
						font-outfit
						focus:outline-none
						focus:ring-2
						focus:ring-primary
						cursor-pointer
					"
                >
                    <option value="">Select an option</option>
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5+">5+</option>
                    <option value="unsure">I&apos;m not sure</option>
                </select>
                {errors.hackathonExperience && (
                    <p className="text-red-400 font-outfit text-sm mt-1">
                        {errors.hackathonExperience}
                    </p>
                )}
            </div>

            <div>
                <label className="block text-primary font-outfit text-base mb-3">
                    How did you hear about Hack the Skies?{" "}
                    <span className="text-red-400">*</span>
                </label>
                <div className="space-y-2">
                    {[
                        "School",
                        "Friend",
                        "Social media",
                        "Hackathon community",
                        "Teacher",
                        "Club / organization",
                        "Search engine",
                        "Other",
                    ].map((option) => (
                        <label key={option} className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="heardAboutHTS"
                                value={option}
                                checked={section4.heardAboutHTS === option}
                                onChange={(e) =>
                                    updateData({
                                        section4: { ...section4, heardAboutHTS: e.target.value },
                                    })
                                }
                                className="w-4 h-4 cursor-pointer accent-primary"
                            />
                            <span className="text-primary font-outfit">{option}</span>
                        </label>
                    ))}
                </div>
                {section4.heardAboutHTS === "Other" && (
                    <FormInput
                        label="Please specify"
                        value={section4.heardAboutHTSOther}
                        onChange={(e) =>
                            updateData({
                                section4: { ...section4, heardAboutHTSOther: e.target.value },
                            })
                        }
                        error={errors.heardAboutHTSOther}
                        className="mt-3"
                    />
                )}
                {errors.heardAboutHTS && (
                    <p className="text-red-400 font-outfit text-sm mt-1">
                        {errors.heardAboutHTS}
                    </p>
                )}
            </div>
        </div>
    );
}

function Section5({
    data,
    updateData,
    errors,
    wordCount,
}: {
    data: ApplicationData;
    updateData: (updates: Partial<ApplicationData>) => void;
    errors: Record<string, string>;
    wordCount: number;
}) {
    const section5 = data.section5;
    const questions = [
        "What are you hoping to learn or build at Hack the Skies?",
        "Describe a project or idea you are proud of.",
        "How do you approach solving a difficult problem?",
        "What role do you usually play on a team?",
        "What would you contribute to the Hack the Skies community?",
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-4xl font-outfit font-semibold text-primary mb-8">
                Application Questions
            </h2>

            {questions.map((question, index) => (
                <div key={question}>
                    <label className="mb-3 block font-outfit text-base text-primary">
                        {index + 1}. {question} <span className="text-red-400">*</span>
                    </label>
                    <textarea
                        value={section5.applicationQuestions[index]}
                        onChange={(event) => {
                            const answers = [...section5.applicationQuestions];
                            answers[index] = event.target.value;
                            updateData({ section5: { applicationQuestions: answers } });
                        }}
                        placeholder="Type your answer here"
                        className="min-h-[150px] w-full resize-none rounded-lg border border-primary bg-button p-4 font-outfit text-primary placeholder:text-primary/60 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="mt-2 flex items-center justify-between">
                        <p className="font-outfit text-sm text-primary">
                            {section5.applicationQuestions[index].trim().split(/\s+/).filter((word) => word.length > 0).length} / 300 words
                        </p>
                        {errors[`applicationQuestion${index}`] && (
                            <p className="font-outfit text-sm text-red-400">{errors[`applicationQuestion${index}`]}</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

function Section6({
    data,
    updateData,
    errors,
    onEditSection,
}: {
    data: ApplicationData;
    updateData: (updates: Partial<ApplicationData>) => void;
    errors: Record<string, string>;
    onEditSection: (section: number) => void;
}) {
    const section6 = data.section6;

    return (
        <div className="space-y-8">
            <h2 className="text-4xl font-outfit font-semibold text-primary mb-8">
                Review & Submit
            </h2>

            <ReviewSection
                title="Personal Information"
                onEdit={() => onEditSection(1)}
                content={[
                    { label: "First name", value: data.section1.firstName },
                    { label: "Last name", value: data.section1.lastName },
                    {
                        label: "Preferred name",
                        value: data.section1.preferredName || "(not provided)",
                    },
                    { label: "Phone number", value: data.section1.phoneNumber },
                    { label: "Date of birth", value: data.section1.dateOfBirth },
                    { label: "T-shirt size", value: data.section1.tShirtSize },
                    { label: "City", value: data.section1.city },
                    { label: "Province", value: data.section1.province },
                    {
                        label: "Dietary restrictions",
                        value:
                            data.section1.dietaryRestrictions.length > 0
                                ? data.section1.dietaryRestrictions.join(", ")
                                : "None",
                    },
                    ...(data.section1.dietaryRestrictions.includes("Other")
                        ? [{ label: "Dietary specifications", value: data.section1.dietaryOther }]
                        : []),
                    {
                        label: "Accessibility accommodations",
                        value:
                            data.section1.accessibilityAccommodations.length > 0
                                ? data.section1.accessibilityAccommodations.join(", ")
                                : "None",
                    },
                    ...(data.section1.accessibilityAccommodations.includes("Other")
                        ? [
                            {
                                label: "Accessibility specifications",
                                value: data.section1.accessibilityOther,
                            },
                        ]
                        : []),
                ]}
            />

            <ReviewSection
                title="School Information"
                onEdit={() => onEditSection(2)}
                content={[
                    { label: "School name", value: data.section2.schoolName },
                    { label: "Current grade", value: data.section2.grade },
                    { label: "Expected graduation year", value: data.section2.graduationYear },
                    { label: "School city", value: data.section2.schoolCity },
                ]}
            />

            <ReviewSection
                title="Parent / Guardian Information"
                onEdit={() => onEditSection(3)}
                content={[
                    { label: "Parent / guardian name", value: data.section3.parentName },
                    { label: "Parent / guardian email", value: data.section3.parentEmail },
                    { label: "Parent / guardian phone", value: data.section3.parentPhone },
                    {
                        label: "Emergency contact name",
                        value: data.section3.emergencyContactName,
                    },
                    {
                        label: "Emergency contact phone",
                        value: data.section3.emergencyContactPhone,
                    },
                    {
                        label: "Emergency contact relationship",
                        value:
                            data.section3.emergencyContactRelationship ===
                                "Other"
                                ? data.section3.emergencyContactRelationshipOther
                                : data.section3.emergencyContactRelationship,
                    },
                ]}
            />

            <ReviewSection
                title="Hackathon Information"
                onEdit={() => onEditSection(4)}
                content={[
                    {
                        label: "Hackathons attended",
                        value: data.section4.hackathonExperience,
                    },
                    {
                        label: "How you heard about us",
                        value:
                            data.section4.heardAboutHTS === "Other"
                                ? data.section4.heardAboutHTSOther
                                : data.section4.heardAboutHTS,
                    },
                ]}
            />

            <ReviewQuestions
                onEdit={() => onEditSection(5)}
                questions={[
                    "What are you hoping to learn or build at Hack the Skies?",
                    "Describe a project or idea you are proud of.",
                    "How do you approach solving a difficult problem?",
                    "What role do you usually play on a team?",
                    "What would you contribute to the Hack the Skies community?",
                ]}
                answers={data.section5.applicationQuestions}
            />

            <div className="space-y-3 bg-white/5 border border-primary/30 rounded-lg p-6">
                <label className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        checked={section6.termsAgreed}
                        onChange={(e) =>
                            updateData({
                                section6: {
                                    ...section6,
                                    termsAgreed: e.target.checked,
                                },
                            })
                        }
                        className="w-5 h-5 mt-1 cursor-pointer accent-primary flex-shrink-0"
                    />
                    <span className="text-primary font-outfit text-base">
                        I agree to the{" "}
                        <a
                            href="/terms"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-primary/80 transition-colors"
                        >
                            Terms of Service
                        </a>
                        {" "}and acknowledge the{" "}
                        <a
                            href="/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-primary/80 transition-colors"
                        >
                            Privacy Policy
                        </a>
                        .
                    </span>
                </label>
                {errors.termsAgreed && (
                    <p className="text-red-400 font-outfit text-sm">
                        {errors.termsAgreed}
                    </p>
                )}

                <label className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        checked={section6.eligibilityConfirm}
                        onChange={(e) =>
                            updateData({
                                section6: {
                                    ...section6,
                                    eligibilityConfirm: e.target.checked,
                                },
                            })
                        }
                        className="w-5 h-5 mt-1 cursor-pointer accent-primary flex-shrink-0"
                    />
                    <span className="text-primary font-outfit text-base">
                        I confirm that I am currently enrolled in high school and meet the
                        eligibility requirements for Hack the Skies.
                    </span>
                </label>
                {errors.eligibilityConfirm && (
                    <p className="text-red-400 font-outfit text-sm">
                        {errors.eligibilityConfirm}
                    </p>
                )}

                <label className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        checked={section6.informationConfirm}
                        onChange={(e) =>
                            updateData({
                                section6: {
                                    ...section6,
                                    informationConfirm: e.target.checked,
                                },
                            })
                        }
                        className="w-5 h-5 mt-1 cursor-pointer accent-primary flex-shrink-0"
                    />
                    <span className="text-primary font-outfit text-base">
                        I confirm that the information provided in this application is accurate.
                    </span>
                </label>
                {errors.informationConfirm && (
                    <p className="text-red-400 font-outfit text-sm">
                        {errors.informationConfirm}
                    </p>
                )}

                <label className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        checked={section6.parentalConfirm}
                        onChange={(e) =>
                            updateData({
                                section6: {
                                    ...section6,
                                    parentalConfirm: e.target.checked,
                                },
                            })
                        }
                        className="w-5 h-5 mt-1 cursor-pointer accent-primary flex-shrink-0"
                    />
                    <span className="text-primary font-outfit text-base">
                        I understand that parent/guardian consent may be required for
                        participation.
                    </span>
                </label>
                {errors.parentalConfirm && (
                    <p className="text-red-400 font-outfit text-sm">
                        {errors.parentalConfirm}
                    </p>
                )}
            </div>
        </div>
    );
}

function ReviewSection({
    title,
    onEdit,
    content,
}: {
    title: string;
    onEdit: () => void;
    content: Array<{ label: string; value: string }>;
}) {
    return (
        <div className="border border-primary/30 rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-outfit font-semibold text-primary">
                    {title}
                </h3>
                <button
                    onClick={onEdit}
                    className="
						text-primary
						font-outfit
						text-sm
						border border-primary
						px-4 py-2
						rounded-lg
						hover:bg-primary/10
						transition-colors
					"
                >
                    Edit
                </button>
            </div>
            <div className="space-y-3">
                {content.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:justify-between">
                        <span className="text-primary/70 font-outfit text-sm">
                            {item.label}
                        </span>
                        <span className="text-primary font-outfit font-medium">
                            {item.value || "(not provided)"}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ReviewQuestions({
    questions,
    answers,
    onEdit,
}: {
    questions: string[];
    answers: string[];
    onEdit: () => void;
}) {
    return (
        <div className="space-y-6 border border-primary/30 rounded-lg p-6">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-outfit font-semibold text-primary">
                    Application Questions
                </h3>
                <button
                    onClick={onEdit}
                    className="text-primary font-outfit text-sm border border-primary px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors"
                >
                    Edit
                </button>
            </div>
            <div className="space-y-8">
                {questions.map((question, index) => (
                    <div key={question} className="space-y-2">
                        <p className="font-outfit text-base font-semibold text-primary">
                            {index + 1}. {question}
                        </p>
                        <p className="whitespace-pre-wrap font-outfit text-base leading-relaxed text-primary">
                            {answers[index] || "(not provided)"}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function RoleInput({
    name,
    label,
    type,
    required,
}: {
    name: string;
    label: string;
    type?: string;
    required?: boolean;
}) {
    const [value, setValue] = useState("");

    return (
        <FormInput
            name={name}
            label={label}
            type={type}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            required={required}
        />
    );
}

function RoleSelect({
    name,
    label,
    options,
    required,
}: {
    name: string;
    label: string;
    options: string[];
    required?: boolean;
}) {
    const [value, setValue] = useState("");

    return (
        <FormSelect
            name={name}
            label={label}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            options={options}
            required={required}
        />
    );
}

function FormInput({
    name,
    label,
    type = "text",
    value,
    onChange,
    error,
    helperText,
    required = false,
    className = "",
}: {
    name?: string;
    label: string;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
    helperText?: string;
    required?: boolean;
    className?: string;
}) {
    return (
        <div className={className}>
            <label className="block text-primary font-outfit text-base mb-1">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            {helperText && (
                <p className="text-primary/60 font-outfit text-sm mb-2">
                    {helperText}
                </p>
            )}
            <input
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                className={`
					w-full
					p-3
					border
					${error ? "border-red-400" : "border-primary"}
					rounded-lg
					bg-button
					text-primary
					font-outfit
					focus:outline-none
					focus:ring-2
					${error ? "focus:ring-red-400" : "focus:ring-primary"}
				`}
            />
            {error && (
                <p className="text-red-400 font-outfit text-sm mt-1">{error}</p>
            )}
        </div>
    );
}

function FormSelect({
    name,
    label,
    value,
    onChange,
    options,
    error,
    required = false,
}: {
    name?: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: string[];
    error?: string;
    required?: boolean;
}) {
    return (
        <div>
            <label className="block text-primary font-outfit text-base mb-1">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            <select
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                className={`
					w-full
					p-3
					border
					${error ? "border-red-400" : "border-primary"}
					rounded-lg
					bg-button
					text-primary
					font-outfit
					focus:outline-none
					focus:ring-2
					${error ? "focus:ring-red-400" : "focus:ring-primary"}
					cursor-pointer
				`}
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option || "Select an option"}
                    </option>
                ))}
            </select>
            {error && (
                <p className="text-red-400 font-outfit text-sm mt-1">{error}</p>
            )}
        </div>
    );
}
