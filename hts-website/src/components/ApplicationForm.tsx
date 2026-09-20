"use client";

import { useState, useEffect, useRef, useCallback, useActionState } from "react";
import { useRouter } from "next/navigation";
import ParallaxLayer from "@/components/ParallaxLayer";
import { submitRoleApplication, type RoleApplicationState } from "@/actions/submitRoleApplication";
import { submitHackerApplication } from "@/actions/submitHackerApplication";
import { saveDraftHackerApplication } from "@/actions/saveDraftHackerApplication";
import { loadDraftHackerApplication } from "@/actions/loadDraftHackerApplication";
import { uploadHackerResume, removeHackerResume } from "@/actions/uploadHackerResume";

const STORAGE_KEY = "hts_application_draft";
const AUTO_SAVE_DELAY = 1500;

const TOTAL_SECTIONS = 5;
const MAX_RESUME_MB = 4;
const MAX_RESUME_BYTES = MAX_RESUME_MB * 1024 * 1024;

const HEARD_ABOUT_OPTIONS = [
    "Word of Mouth (from an organizer)",
    "Word of Mouth (from someone else)",
    "Instagram",
    "LinkedIn",
    "Your school",
    "Other",
];

const CODING_EXPERIENCE_OPTIONS = [
    { value: "Complete Beginner", label: "Complete Beginner – I’m just getting started!" },
    { value: "Novice", label: "Novice – I’ve done a few classes and followed some tutorials" },
    { value: "Intermediate", label: "Intermediate – I’ve made a few projects on my own" },
    {
        value: "Advanced",
        label: "Advanced – I’ve built larger/complex projects and am comfortable working independently",
    },
];

const GOAL_OPTIONS = [
    "Learn how to code",
    "Build my first project",
    "Improve my coding skills",
    "Learn about AI",
    "Meet other students interested in tech",
    "Find teammates",
    "Learn about careers in technology",
    "Work with mentors",
    "Win prizes",
    "Try something completely new",
    "Other",
];

// Earlier versions of the form asked five other questions ahead of these two.
const LEGACY_QUESTION_COUNT = 5;

const APPLICATION_QUESTIONS = [
    "If you could use technology to solve any problem in your school or community, what would it be and why? (We’re not judging feasibility, we’re looking for creativity, motivation, and what you care about!)",
    "Tell us about a time you had to learn something completely new by yourself. How did you approach it, and what did you take away from the experience?",
];

interface ApplicationData {
    section1: {
        role: "Hacker" | "Judge" | "Mentor" | "";
        firstName: string;
        lastName: string;
        preferredName: string;
        pronouns: string[];
        pronounsOther: string;
        grade: string;
        email: string;
        teammates: string[];
        dietaryRestrictions: string[];
        dietaryOther: string;
        accessibilityAccommodations: string[];
        accessibilityOther: string;
        heardAboutHTS: string;
        heardAboutHTSOther: string;
    };
    section2: {
        schoolName: string;
        codingExperience: string;
        goals: string[];
        goalsOther: string;
        wantToSee: string;
        favouriteSong: string;
    };
    section3: {
        applicationQuestions: string[];
    };
    section4: {
        resumePath: string;
        resumeName: string;
        linkedinPortfolio: string;
        githubDevpost: string;
        otherComments: string;
    };
    section5: {
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
        pronouns: [],
        pronounsOther: "",
        grade: "",
        email: "",
        teammates: [],
        dietaryRestrictions: [],
        dietaryOther: "",
        accessibilityAccommodations: [],
        accessibilityOther: "",
        heardAboutHTS: "",
        heardAboutHTSOther: "",
    },
    section2: {
        schoolName: "",
        codingExperience: "",
        goals: [],
        goalsOther: "",
        wantToSee: "",
        favouriteSong: "",
    },
    section3: {
        applicationQuestions: APPLICATION_QUESTIONS.map(() => ""),
    },
    section4: {
        resumePath: "",
        resumeName: "",
        linkedinPortfolio: "",
        githubDevpost: "",
        otherComments: "",
    },
    section5: {
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

// Drafts saved by earlier versions of the form kept the confirmations in section4
// or section6 and the application questions in section5, so those shapes are read here too.
type StoredDraft = {
    section1?: Partial<ApplicationData["section1"]>;
    section2?: Partial<ApplicationData["section2"]>;
    section3?: { applicationQuestions?: string[] };
    section4?: Partial<ApplicationData["section4"] & ApplicationData["section5"]>;
    section5?: Partial<ApplicationData["section5"]> & {
        applicationQuestions?: string[];
    };
    section6?: Partial<ApplicationData["section5"]>;
};

function loadApplicationDraft(): ApplicationData {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved) as StoredDraft;
            const currentAnswers = parsed.section3?.applicationQuestions;
            const previousAnswers = parsed.section5?.applicationQuestions;
            const storedAnswers = Array.isArray(currentAnswers)
                ? currentAnswers
                : Array.isArray(previousAnswers)
                    ? previousAnswers
                    : [];
            // Drafts from earlier versions hold the five removed questions first,
            // followed by the two that are kept, so only those two are carried over.
            const answers =
                storedAnswers.length > APPLICATION_QUESTIONS.length
                    ? storedAnswers.slice(LEGACY_QUESTION_COUNT)
                    : storedAnswers;
            const confirmationSources = [parsed.section5, parsed.section6, parsed.section4];
            const confirmed = (key: keyof ApplicationData["section5"]) =>
                confirmationSources.find((source) => typeof source?.[key] === "boolean")?.[key] ?? false;

            return {
                section1: { ...EMPTY_DATA.section1, ...parsed.section1 },
                section2: { ...EMPTY_DATA.section2, ...parsed.section2 },
                section3: {
                    applicationQuestions: APPLICATION_QUESTIONS.map(
                        (_, index) => answers[index] ?? "",
                    ),
                },
                section4: {
                    resumePath: parsed.section4?.resumePath ?? "",
                    resumeName: parsed.section4?.resumeName ?? "",
                    linkedinPortfolio: parsed.section4?.linkedinPortfolio ?? "",
                    githubDevpost: parsed.section4?.githubDevpost ?? "",
                    otherComments: parsed.section4?.otherComments ?? "",
                },
                section5: {
                    eligibilityConfirm: confirmed("eligibilityConfirm"),
                    informationConfirm: confirmed("informationConfirm"),
                    parentalConfirm: confirmed("parentalConfirm"),
                    termsAgreed: confirmed("termsAgreed"),
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
    const [isUploadingResume, setIsUploadingResume] = useState(false);
    const dataRef = useRef<ApplicationData>(EMPTY_DATA);
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

    useEffect(() => {
        dataRef.current = data;
    }, [data]);

    const applyResume = useCallback(
        (resumePath: string, resumeName: string) => {
            const current = dataRef.current;
            const newData = {
                ...current,
                section4: { ...current.section4, resumePath, resumeName },
            };
            setData(newData);
            debouncedSave(newData);
        },
        [debouncedSave]
    );

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validateSection1 = () => {
        const newErrors: Record<string, string> = {};
        if (!data.section1.firstName.trim())
            newErrors.firstName = "Please enter your first name.";
        if (!data.section1.lastName.trim())
            newErrors.lastName = "Please enter your last name.";
        if (
            data.section1.pronouns.includes("Other") &&
            !data.section1.pronounsOther.trim()
        )
            newErrors.pronounsOther = "Please specify your pronouns.";
        if (!data.section1.grade.length)
            newErrors.grade = "Please select your grade.";
        if (!data.section1.email.trim())
            newErrors.email = "Please enter your email address.";
        else if (!validateEmail(data.section1.email))
            newErrors.email = "Please enter a valid email address.";
        if (!data.section1.teammates.some((name) => name.trim()))
            newErrors.teammates =
                "Please list your teammates, or write \"None\" if you're applying on your own.";
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
        if (!data.section1.heardAboutHTS)
            newErrors.heardAboutHTS = "Please select how you heard about us.";
        if (
            data.section1.heardAboutHTS === "Other" &&
            !data.section1.heardAboutHTSOther.trim()
        )
            newErrors.heardAboutHTSOther = "Please specify.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateSection2 = () => {
        const newErrors: Record<string, string> = {};
        if (!data.section2.schoolName.trim())
            newErrors.schoolName = "Please enter your school name.";
        if (!data.section2.codingExperience)
            newErrors.codingExperience = "Please select your experience level.";
        if (!data.section2.goals.length)
            newErrors.goals = "Please select at least one option.";
        if (
            data.section2.goals.includes("Other") &&
            !data.section2.goalsOther.trim()
        )
            newErrors.goalsOther = "Please specify.";
        if (!data.section2.wantToSee.trim())
            newErrors.wantToSee = "Please tell us what you'd like to see.";
        if (!data.section2.favouriteSong.trim())
            newErrors.favouriteSong = "Please enter your favourite song.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateSection3 = () => {
        const newErrors: Record<string, string> = {};
        data.section3.applicationQuestions.forEach((answer, index) => {
            const wordCount = answer.trim().split(/\s+/).filter((word) => word.length > 0).length;
            if (!answer.trim()) newErrors[`applicationQuestion${index}`] = "Please answer this question.";
            if (wordCount > 300) newErrors[`applicationQuestion${index}`] = "Your answer exceeds 300 words.";
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateSection4 = () => {
        const newErrors: Record<string, string> = {};
        if (
            !data.section4.resumePath &&
            !data.section4.linkedinPortfolio.trim() &&
            !data.section4.githubDevpost.trim()
        )
            newErrors.wrapUp =
                "Please upload a resume or share a LinkedIn / portfolio or GitHub / Devpost link.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateSection5 = () => {
        const newErrors: Record<string, string> = {};
        if (!data.section5.eligibilityConfirm)
            newErrors.eligibilityConfirm = "Please confirm eligibility.";
        if (!data.section5.informationConfirm)
            newErrors.informationConfirm =
                "Please confirm information accuracy.";
        if (!data.section5.parentalConfirm)
            newErrors.parentalConfirm = "Please confirm understanding.";
        if (!data.section5.termsAgreed)
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
            default:
                isValid = true;
        }

        if (isValid) {
            if (currentSection < TOTAL_SECTIONS) {
                setCurrentSection(currentSection + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        }
    };

    const handleRoleContinue = () => {
        if (!data.section1.role) {
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
        if (validateSection5()) {
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
        return Math.round((currentSection / TOTAL_SECTIONS) * 100);
    };

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
                            isUploading={isUploadingResume}
                            onUploadingChange={setIsUploadingResume}
                            onResumeChange={applyResume}
                        />
                    )}
                    {currentSection === 5 && (
                        <Section5
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
                                Back to Role Selection
                            </button>
                        )}

                        {currentSection < TOTAL_SECTIONS ? (
                            <button
                                onClick={handleContinue}
                                disabled={isUploadingResume}
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
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
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
    const completedSteps = Math.max(1, Math.round(progress / 100 * TOTAL_SECTIONS));

    return (
        <div className="fixed right-8 top-1/2 flex -translate-y-1/2 flex-col items-center">
            <div className="mb-4 font-outfit text-base font-semibold text-primary">
                {completedSteps} of {TOTAL_SECTIONS} sections
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
        { value: "Hacker", disabled: false },
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
                    disabled={!role}
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
                    Become a Hack the Skies 2026 Judge!
                    <br />
                    <p> As a judge at Hack the Skies, you’ll evaluate projects built by high-school students and help recognize the teams that stand out. You’ll get to see creative ideas, emerging technology, and innovative solutions firsthand while providing valuable feedback to students. </p>
                    <br />
                    <p>We’re looking for industry professionals who can bring their expertise, perspective, and constructive feedback to the judging process. You don’t need prior hackathon judging experience, just an interest in supporting students and evaluating their work. </p>
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
                    <p> Become a Hack the Skies 2026 Mentor!</p> 
                    <br />
                    <p>As a mentor at Hack the Skies, you’ll support high-school students throughout our two-day in-person hackathon on October 17th and 18th, as well as an optional (online) opening ceremony on October 16th. You’ll help teams brainstorm ideas, troubleshoot technical challenges, explore new tools, and turn their ideas into working projects, no matter their experience level. You don’t need to have all the answers. We’re looking for university students who are approachable, enthusiastic, and excited to help the next generation of students learn, build, and have fun. </p>
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

    const handlePronounsChange = (option: string) => {
        const newPronouns = section1.pronouns.includes(option)
            ? section1.pronouns.filter((p) => p !== option)
            : [...section1.pronouns, option];

        updateData({
            section1: { ...section1, pronouns: newPronouns },
        });
    };

    const handleGradeChange = (option: string) => {
        const newGrade = section1.grade === option
            ? ""
            : option;

        updateData({
            section1: { ...section1, grade: newGrade },
        });
    };

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
                Basic Technical Information
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
             <div>
             <label className="block text-primary font-outfit text-base mb-3">
                    What are your pronouns?
                </label>
                <div className="space-y-2">
                    {[
                        "he/him",
                        "she/her",
                        "they/them",
                        "Other",
                    ].map((option) => (
                        <label key={option} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={section1.pronouns.includes(option)}
                                onChange={() => handlePronounsChange(option)}
                                className="w-4 h-4 cursor-pointer accent-primary"
                            />
                            <span className="text-primary font-outfit">{option}</span>
                        </label>
                    ))}
                </div>
                {section1.pronouns.includes("Other") && (
                    <FormInput
                        label="Please specify"
                        value={section1.pronounsOther}
                        onChange={(e) =>
                            updateData({
                                section1: { ...section1, pronounsOther: e.target.value },
                            })
                        }
                        error={errors.pronounsOther}
                        className="mt-3"
                    />
                )}
                {errors.pronouns && (
                    <p className="text-red-400 font-outfit text-sm mt-1">
                        {errors.pronouns}
                    </p>
                )}
            </div>
            
            <div>
             <label className="block text-primary font-outfit text-base mb-3">
                    Grade
                </label>
                <div className="space-y-2">
                    {[
                        "Grade 9",
                        "Grade 10",
                        "Grade 11",
                        "Grade 12",
                    ].map((option) => (
                        <label key={option} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={section1.grade.includes(option)}
                                onChange={() => handleGradeChange(option)}
                                className="w-4 h-4 cursor-pointer accent-primary"
                            />
                            <span className="text-primary font-outfit">{option}</span>
                        </label>
                    ))}
                </div>
                {errors.grade && (
                    <p className="text-red-400 font-outfit text-sm mt-1">
                        {errors.grade}
                    </p>
                )}
            </div>
            <FormInput
                label="Email (non-school)"
                value={section1.email}
                onChange={(e) =>
                    updateData({
                        section1: { ...section1, email: e.target.value },
                    })
                }
                error={errors.email}
                required
            />

            <FormInput
                label="Are you applying with a team?"
                value={section1.teammates.join(",")}
                onChange={(e) =>
                    updateData({
                        section1: { ...section1, teammates: e.target.value.split(",") },
                    })
                }
                helperText='If so, enter their full names, separated by commas. Otherwise, write "None".'
                error={errors.teammates}
                required
            />

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

            <div>
                <label className="block text-primary font-outfit text-base mb-3">
                    How did you hear about Hack the Skies?{" "}
                    <span className="text-red-400">*</span>
                </label>
                <div className="space-y-2">
                    {HEARD_ABOUT_OPTIONS.map((option) => (
                        <label key={option} className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="heardAboutHTS"
                                value={option}
                                checked={section1.heardAboutHTS === option}
                                onChange={(e) =>
                                    updateData({
                                        section1: { ...section1, heardAboutHTS: e.target.value },
                                    })
                                }
                                className="w-4 h-4 cursor-pointer accent-primary"
                            />
                            <span className="text-primary font-outfit">{option}</span>
                        </label>
                    ))}
                </div>
                {section1.heardAboutHTS === "Other" && (
                    <FormInput
                        label="Please specify"
                        value={section1.heardAboutHTSOther}
                        onChange={(e) =>
                            updateData({
                                section1: { ...section1, heardAboutHTSOther: e.target.value },
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

    const handleGoalChange = (option: string) => {
        const newGoals = section2.goals.includes(option)
            ? section2.goals.filter((g) => g !== option)
            : [...section2.goals, option];

        updateData({
            section2: { ...section2, goals: newGoals },
        });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-4xl font-outfit font-semibold text-primary mb-8">
                Getting to Know You
            </h2>

            <FormInput
                label="School name"
                value={section2.schoolName}
                onChange={(e) =>
                    updateData({
                        section2: { ...section2, schoolName: e.target.value },
                    })
                }
                helperText="Please provide the full name with no abbreviations."
                error={errors.schoolName}
                required
            />

            <p className="font-outfit text-sm text-primary/60">
                Your answers to the questions below will have zero impact on your application.
            </p>

            <div>
                <label className="block text-primary font-outfit text-base mb-3">
                    How would you describe your experience with coding and technology?{" "}
                    <span className="text-red-400">*</span>
                </label>
                <div className="space-y-2">
                    {CODING_EXPERIENCE_OPTIONS.map((option) => (
                        <label key={option.value} className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="codingExperience"
                                value={option.value}
                                checked={section2.codingExperience === option.value}
                                onChange={(e) =>
                                    updateData({
                                        section2: { ...section2, codingExperience: e.target.value },
                                    })
                                }
                                className="w-4 h-4 cursor-pointer accent-primary"
                            />
                            <span className="text-primary font-outfit">{option.label}</span>
                        </label>
                    ))}
                </div>
                {errors.codingExperience && (
                    <p className="text-red-400 font-outfit text-sm mt-1">
                        {errors.codingExperience}
                    </p>
                )}
            </div>

            <div>
                <label className="block text-primary font-outfit text-base mb-3">
                    What are you hoping to get out of Hack the Skies?{" "}
                    <span className="text-red-400">*</span>
                </label>
                <div className="space-y-2">
                    {GOAL_OPTIONS.map((option) => (
                        <label key={option} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={section2.goals.includes(option)}
                                onChange={() => handleGoalChange(option)}
                                className="w-4 h-4 cursor-pointer accent-primary"
                            />
                            <span className="text-primary font-outfit">{option}</span>
                        </label>
                    ))}
                </div>
                {section2.goals.includes("Other") && (
                    <FormInput
                        label="Please specify"
                        value={section2.goalsOther}
                        onChange={(e) =>
                            updateData({
                                section2: { ...section2, goalsOther: e.target.value },
                            })
                        }
                        error={errors.goalsOther}
                        className="mt-3"
                    />
                )}
                {errors.goals && (
                    <p className="text-red-400 font-outfit text-sm mt-1">
                        {errors.goals}
                    </p>
                )}
            </div>

            <FormTextArea
                label="Is there anything you want to see happen at Hack the Skies?"
                value={section2.wantToSee}
                onChange={(e) =>
                    updateData({
                        section2: { ...section2, wantToSee: e.target.value },
                    })
                }
                helperText="1–2 sentences."
                error={errors.wantToSee}
                required
            />

            <FormInput
                label="What is your favourite song?"
                value={section2.favouriteSong}
                onChange={(e) =>
                    updateData({
                        section2: { ...section2, favouriteSong: e.target.value },
                    })
                }
                error={errors.favouriteSong}
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
                Long(er) Answer
            </h2>

            {APPLICATION_QUESTIONS.map((question, index) => (
                <div key={question}>
                    <label className="mb-3 block font-outfit text-base text-primary">
                        {index + 1}. {question} <span className="text-red-400">*</span>
                    </label>
                    <textarea
                        value={section3.applicationQuestions[index]}
                        onChange={(event) => {
                            const answers = [...section3.applicationQuestions];
                            answers[index] = event.target.value;
                            updateData({ section3: { applicationQuestions: answers } });
                        }}
                        placeholder="Type your answer here"
                        className="min-h-[150px] w-full resize-none rounded-lg border border-primary bg-button p-4 font-outfit text-primary placeholder:text-primary/60 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="mt-2 flex items-center justify-between">
                        <p className="font-outfit text-sm text-primary">
                            {section3.applicationQuestions[index].trim().split(/\s+/).filter((word) => word.length > 0).length} / 300 words
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

function Section4({
    data,
    updateData,
    errors,
    isUploading,
    onUploadingChange,
    onResumeChange,
}: {
    data: ApplicationData;
    updateData: (updates: Partial<ApplicationData>) => void;
    errors: Record<string, string>;
    isUploading: boolean;
    onUploadingChange: (uploading: boolean) => void;
    onResumeChange: (path: string, name: string) => void;
}) {
    const section4 = data.section4;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadError, setUploadError] = useState("");

    const handleResumeSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;

        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
            setUploadError("Please upload a PDF file.");
            return;
        }
        if (file.size > MAX_RESUME_BYTES) {
            setUploadError(`Your resume must be ${MAX_RESUME_MB} MB or smaller.`);
            return;
        }

        setUploadError("");
        onUploadingChange(true);
        try {
            const formData = new FormData();
            formData.append("resume", file);
            const res = await uploadHackerResume(formData);
            if (res.success) {
                onResumeChange(res.path, res.name);
            } else {
                setUploadError(res.error);
            }
        } catch {
            setUploadError("Unable to upload your resume right now. Please try again.");
        } finally {
            onUploadingChange(false);
        }
    };

    const handleRemoveResume = async () => {
        setUploadError("");
        onUploadingChange(true);
        try {
            const res = await removeHackerResume();
            if (res.success) {
                onResumeChange("", "");
            } else {
                setUploadError(res.error);
            }
        } catch {
            setUploadError("Unable to remove your resume right now. Please try again.");
        } finally {
            onUploadingChange(false);
        }
    };

    const secondaryButton =
        "text-primary font-outfit text-sm border border-primary px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <div className="space-y-6">
            <h2 className="text-4xl font-outfit font-semibold text-primary mb-8">
                Wrapping Up!
            </h2>

            <div>
                <p className="font-outfit text-base text-primary">
                    You must do at least one of the following: upload a resume, or share a
                    LinkedIn / portfolio or GitHub / Devpost link.
                </p>
                {errors.wrapUp && (
                    <p className="text-red-400 font-outfit text-sm mt-2">{errors.wrapUp}</p>
                )}
            </div>

            <div>
                <label className="block text-primary font-outfit text-base mb-1">
                    Resume (PDF)
                </label>
                <p className="text-primary/60 font-outfit text-sm mb-3">
                    PDF only, up to {MAX_RESUME_MB} MB.
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleResumeSelected}
                    className="sr-only"
                />
                {section4.resumePath ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 border border-primary/30 rounded-lg p-4">
                        <span className="text-primary font-outfit text-base break-all">
                            {section4.resumeName || "Resume.pdf"}
                        </span>
                        <div className="flex gap-3 sm:ml-auto">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className={secondaryButton}
                            >
                                {isUploading ? "Working..." : "Replace"}
                            </button>
                            <button
                                type="button"
                                onClick={handleRemoveResume}
                                disabled={isUploading}
                                className={secondaryButton}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className={secondaryButton}
                    >
                        {isUploading ? "Uploading..." : "Upload PDF"}
                    </button>
                )}
                {uploadError && (
                    <p role="alert" className="text-red-400 font-outfit text-sm mt-2">
                        {uploadError}
                    </p>
                )}
            </div>

            <FormInput
                label="LinkedIn / Portfolio Site"
                value={section4.linkedinPortfolio}
                onChange={(e) =>
                    updateData({
                        section4: { ...section4, linkedinPortfolio: e.target.value },
                    })
                }
            />

            <FormInput
                label="GitHub / Devpost"
                value={section4.githubDevpost}
                onChange={(e) =>
                    updateData({
                        section4: { ...section4, githubDevpost: e.target.value },
                    })
                }
            />

            <FormTextArea
                label="Any other questions, comments, or concerns?"
                value={section4.otherComments}
                onChange={(e) =>
                    updateData({
                        section4: { ...section4, otherComments: e.target.value },
                    })
                }
                rows={4}
            />
        </div>
    );
}

function Section5({
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
    const section5 = data.section5;
    const teammates = data.section1.teammates
        .map((name) => name.trim())
        .filter(Boolean)
        .join(", ");

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
                    {
                        label: "Pronouns",
                        value:
                            data.section1.pronouns.length > 0
                                ? data.section1.pronouns.join(", ")
                                : "None",
                    },
                    {
                        label: "Grade",
                        value:
                            data.section1.grade || "None",
                    },
                    { label: "Email (non-school)", value: data.section1.email },
                    { label: "Team", value: teammates },
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
                    {
                        label: "How you heard about us",
                        value:
                            data.section1.heardAboutHTS === "Other"
                                ? data.section1.heardAboutHTSOther
                                : data.section1.heardAboutHTS,
                    },
                ]}
            />

            <ReviewSection
                title="School Information"
                onEdit={() => onEditSection(2)}
                content={[
                    { label: "School name", value: data.section2.schoolName },
                ]}
            />

            <ReviewSection
                title="Getting to Know You"
                onEdit={() => onEditSection(2)}
                content={[
                    {
                        label: "Experience with coding and technology",
                        value: data.section2.codingExperience,
                    },
                    {
                        label: "Hoping to get out of Hack the Skies",
                        value: data.section2.goals.join(", "),
                    },
                    ...(data.section2.goals.includes("Other")
                        ? [{ label: "Other goals", value: data.section2.goalsOther }]
                        : []),
                    {
                        label: "Want to see at Hack the Skies",
                        value: data.section2.wantToSee,
                    },
                    { label: "Favourite song", value: data.section2.favouriteSong },
                ]}
            />

            <ReviewQuestions
                onEdit={() => onEditSection(3)}
                questions={APPLICATION_QUESTIONS}
                answers={data.section3.applicationQuestions}
            />

            <ReviewSection
                title="Wrapping Up"
                onEdit={() => onEditSection(4)}
                content={[
                    {
                        label: "Resume",
                        value: data.section4.resumePath ? data.section4.resumeName || "Resume.pdf" : "",
                    },
                    { label: "LinkedIn / Portfolio", value: data.section4.linkedinPortfolio },
                    { label: "GitHub / Devpost", value: data.section4.githubDevpost },
                    {
                        label: "Other questions, comments, or concerns",
                        value: data.section4.otherComments,
                    },
                ]}
            />

            <div className="space-y-3 bg-white/5 border border-primary/30 rounded-lg p-6">
                <label className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        checked={section5.termsAgreed}
                        onChange={(e) =>
                            updateData({
                                section5: {
                                    ...section5,
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
                        checked={section5.eligibilityConfirm}
                        onChange={(e) =>
                            updateData({
                                section5: {
                                    ...section5,
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
                        checked={section5.informationConfirm}
                        onChange={(e) =>
                            updateData({
                                section5: {
                                    ...section5,
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
                        checked={section5.parentalConfirm}
                        onChange={(e) =>
                            updateData({
                                section5: {
                                    ...section5,
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

function FormTextArea({
    name,
    label,
    value,
    onChange,
    error,
    helperText,
    required = false,
    rows = 3,
    className = "",
}: {
    name?: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    error?: string;
    helperText?: string;
    required?: boolean;
    rows?: number;
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
            <textarea
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                rows={rows}
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